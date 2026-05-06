#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const ROOT = "E:/GITHUB-RES/Feishu";

const TABLES = {
  people_overview: "tblfQS3bHVLNavvZ",
  evaluation_runs: "tblcGy0h0fx4pIoG",
  dimension_results: "tblMUq8orwwRSi1c",
  metric_results: "tbldjPFXVZ4PD9RJ",
  review_items: "tblShT3KAkGRjj1T",
  evidence_index: "tblQenU1BAdECcY2",
};

const EVALUATION_ID = process.env.EVALUATION_ID || "EVAL-PJT-CASE-04-MTG-CASE-04-04";
const PERSON_ID = process.env.PERSON_ID || "MGR-CASE-04";
const DIMENSIONS = ["方向校准力", "推进闭环力", "风险治理力", "协同调度力", "组织行为健康度"];

function run(args) {
  const out = execFileSync(CLI, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 90_000,
  });
  return out.trim() ? JSON.parse(out) : {};
}

function writeJson(payload) {
  const dir = path.join(ROOT, ".tmp", "review-packet");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(payload), "utf8");
  return `@${path.relative(ROOT, file).replace(/\\/g, "/")}`;
}

function fieldList(tableId) {
  const res = run(["base", "+field-list", "--base-token", BASE_TOKEN, "--table-id", tableId, "--limit", "200"]);
  return res?.data?.fields || [];
}

function ensureLinkField(tableId, name, linkTableId) {
  const existing = fieldList(tableId).find((field) => field.name === name);
  if (existing) return existing;
  const body = writeJson({ name, type: "link", link_table: linkTableId });
  const res = run(["base", "+field-create", "--base-token", BASE_TOKEN, "--table-id", tableId, "--json", body]);
  return res?.data?.field || res?.data || res;
}

function records(tableId) {
  const res = run([
    "base",
    "+record-list",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--limit",
    "200",
    "--format",
    "json",
  ]);
  if (!Array.isArray(res?.data?.data) || !Array.isArray(res?.data?.fields)) return [];
  return res.data.data.map((values, index) => ({
    record_id: res.data.record_id_list[index],
    fields: Object.fromEntries(res.data.fields.map((field, fieldIndex) => [field, values[fieldIndex]])),
  }));
}

function selectText(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function linkedIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item?.id).filter(Boolean);
}

function updateRecord(tableId, recordId, patch) {
  const compactPatch = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    compactPatch[key] = value;
  }
  if (Object.keys(compactPatch).length === 0) return;
  run([
    "base",
    "+record-upsert",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--record-id",
    recordId,
    "--json",
    writeJson(compactPatch),
  ]);
}

function main() {
  ensureLinkField(TABLES.people_overview, "单人 Review Packet", TABLES.evaluation_runs);
  for (const dimension of DIMENSIONS) {
    ensureLinkField(TABLES.evaluation_runs, `${dimension}详情`, TABLES.dimension_results);
  }
  ensureLinkField(TABLES.evaluation_runs, "人工复核入口", TABLES.review_items);

  const people = records(TABLES.people_overview);
  const evaluations = records(TABLES.evaluation_runs);
  const dimensions = records(TABLES.dimension_results);
  const metrics = records(TABLES.metric_results);
  const reviews = records(TABLES.review_items);
  const evidence = records(TABLES.evidence_index);

  const personRecord = people.find((record) => record.fields.person_id === PERSON_ID);
  const evaluationRecord = evaluations.find((record) => record.fields.evaluation_id === EVALUATION_ID);
  if (!personRecord) throw new Error(`Cannot find people_overview record for ${PERSON_ID}`);
  if (!evaluationRecord) throw new Error(`Cannot find evaluation_runs record for ${EVALUATION_ID}`);

  const dimensionByName = new Map();
  for (const record of dimensions) {
    if (record.fields.evaluation_id !== EVALUATION_ID) continue;
    const name = selectText(record.fields["维度名称"]);
    if (name) dimensionByName.set(name, record);
  }

  const evaluationPatch = {
    "单人 Review Packet": undefined,
    "人工复核入口": reviews
      .filter((record) => record.fields.evaluation_id === EVALUATION_ID)
      .map((record) => record.record_id),
  };

  for (const dimension of DIMENSIONS) {
    const record = dimensionByName.get(dimension);
    if (!record) throw new Error(`Cannot find dimension_results record for ${dimension}`);
    evaluationPatch[`${dimension}详情`] = [record.record_id];
  }

  updateRecord(TABLES.people_overview, personRecord.record_id, {
    "单人 Review Packet": [evaluationRecord.record_id],
  });
  updateRecord(TABLES.evaluation_runs, evaluationRecord.record_id, evaluationPatch);

  const dimensionPatches = [];
  for (const dimension of DIMENSIONS) {
    const dimensionRecord = dimensionByName.get(dimension);
    const dimensionRecordId = dimensionRecord.record_id;
    const metricIds = metrics
      .filter((record) => record.fields.evaluation_id === EVALUATION_ID && selectText(record.fields["维度名称"]) === dimension)
      .map((record) => record.record_id);
    const evidenceIds = evidence
      .filter((record) => record.fields.evaluation_id === EVALUATION_ID && selectText(record.fields["关联维度"]) === dimension)
      .map((record) => record.record_id);
    const reviewIds = reviews
      .filter((record) => linkedIds(record.fields["关联维度结果"]).includes(dimensionRecordId))
      .map((record) => record.record_id);

    updateRecord(TABLES.dimension_results, dimensionRecordId, {
      "关联指标": metricIds,
      "关联证据": evidenceIds,
      "关联复核项": reviewIds,
    });
    dimensionPatches.push({ dimension, metric_count: metricIds.length, evidence_count: evidenceIds.length, review_count: reviewIds.length });
  }

  console.log(JSON.stringify({
    ok: true,
    person_id: PERSON_ID,
    evaluation_id: EVALUATION_ID,
    people_entry: "单人 Review Packet",
    evaluation_dimension_entries: DIMENSIONS.map((dimension) => `${dimension}详情`),
    review_entry: "人工复核入口",
    dimension_drilldown_counts: dimensionPatches,
  }, null, 2));
}

main();

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = "E:/GITHUB-RES/Feishu";
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const PERSON_ID = process.env.PERSON_ID || "MGR-CASE-04";
const EVALUATION_ID = process.env.EVALUATION_ID || "EVAL-PJT-CASE-04-MTG-CASE-04-04";
const MANAGER_NAME = process.env.MANAGER_NAME || "陈昊";

const TABLES = {
  people: "tblfQS3bHVLNavvZ",
  evaluation: "tblcGy0h0fx4pIoG",
  dimension: "tblMUq8orwwRSi1c",
  review: "tblShT3KAkGRjj1T",
};

const DIMENSIONS = ["方向校准力", "推进闭环力", "风险治理力", "协同调度力", "组织行为健康度"];

function run(args, allowFailure = false) {
  try {
    const out = execFileSync(CLI, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 90_000,
    });
    return out.trim() ? JSON.parse(out) : {};
  } catch (error) {
    if (allowFailure) {
      return {
        ok: false,
        error: String(error.stderr || error.stdout || error.message),
      };
    }
    throw error;
  }
}

function jsonArg(payload) {
  const dir = path.join(ROOT, ".tmp", "review-packet");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(payload), "utf8");
  return `@${path.relative(ROOT, file).replace(/\\/g, "/")}`;
}

function fields(tableId) {
  return run(["base", "+field-list", "--base-token", BASE_TOKEN, "--table-id", tableId, "--limit", "200"])?.data?.fields || [];
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
  return (res?.data?.data || []).map((values, index) => ({
    record_id: res.data.record_id_list[index],
    fields: Object.fromEntries(res.data.fields.map((field, fieldIndex) => [field, values[fieldIndex]])),
  }));
}

function ensureTextField(tableId, name) {
  const existing = fields(tableId).find((field) => field.name === name);
  if (existing) return existing;
  return run(["base", "+field-create", "--base-token", BASE_TOKEN, "--table-id", tableId, "--json", jsonArg({
    name,
    type: "text",
    style: { type: "plain" },
  })]);
}

function ensureSelectField(tableId, name, options) {
  const existing = fields(tableId).find((field) => field.name === name);
  if (existing) return existing;
  return run(["base", "+field-create", "--base-token", BASE_TOKEN, "--table-id", tableId, "--json", jsonArg({
    name,
    type: "select",
    options: options.map((option) => ({ name: option })),
  })]);
}

function ensureLinkField(tableId, name, linkTable) {
  const existing = fields(tableId).find((field) => field.name === name);
  if (existing) return existing;
  return run(["base", "+field-create", "--base-token", BASE_TOKEN, "--table-id", tableId, "--json", jsonArg({
    name,
    type: "link",
    link_table: linkTable,
  })]);
}

function updateRecord(tableId, recordId, patch) {
  const compact = Object.fromEntries(Object.entries(patch).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }));
  if (Object.keys(compact).length === 0) return;
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
    jsonArg(compact),
  ]);
}

function deleteFieldByName(tableId, name) {
  const field = fields(tableId).find((item) => item.name === name);
  if (!field) return { name, deleted: false, reason: "missing" };
  const res = run([
    "base",
    "+field-delete",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--field-id",
    field.id,
    "--yes",
  ], true);
  return { name, deleted: res.ok !== false, reason: res.ok === false ? res.error : "" };
}

function updateField(tableId, fieldIdOrName, payload) {
  const existing = fields(tableId).find((field) => field.id === fieldIdOrName || field.name === fieldIdOrName);
  const body = existing ? { ...existing, ...payload } : payload;
  delete body.id;
  return run([
    "base",
    "+field-update",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--field-id",
    fieldIdOrName,
    "--json",
    jsonArg(body),
  ], true);
}

function firstSelect(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function main() {
  ensureTextField(TABLES.people, "manager_id");
  ensureTextField(TABLES.people, "评估总览");
  ensureTextField(TABLES.people, "数据覆盖结论");
  ensureSelectField(TABLES.people, "人工复核要求", ["需要", "不需要"]);
  for (const dimension of DIMENSIONS) ensureLinkField(TABLES.people, `${dimension}详情`, TABLES.dimension);
  ensureLinkField(TABLES.people, "人工复核入口", TABLES.review);

  const people = records(TABLES.people);
  const evaluations = records(TABLES.evaluation);
  const dimensions = records(TABLES.dimension);
  const reviews = records(TABLES.review);

  const person = people.find((record) => record.fields.person_id === PERSON_ID || record.fields.manager_id === PERSON_ID || record.fields["中层姓名"] === MANAGER_NAME);
  const evaluation = evaluations.find((record) => record.fields.evaluation_id === EVALUATION_ID);
  if (!person) throw new Error(`Cannot find people record for ${PERSON_ID}`);
  if (!evaluation) throw new Error(`Cannot find evaluation record for ${EVALUATION_ID}`);

  const dimensionByName = new Map();
  for (const record of dimensions) {
    if (record.fields.evaluation_id !== EVALUATION_ID) continue;
    const name = firstSelect(record.fields["维度名称"]);
    if (name) dimensionByName.set(name, record.record_id);
  }

  const reviewIds = reviews
    .filter((record) => record.fields.evaluation_id === EVALUATION_ID)
    .map((record) => record.record_id);

  const patch = {
    person_id: MANAGER_NAME,
    manager_id: PERSON_ID,
    "最新报告状态": firstSelect(evaluation.fields["报告状态"]),
    "最新签字状态": firstSelect(evaluation.fields["签字状态"]),
    "最新整体置信度": evaluation.fields["整体置信度"],
    "数据覆盖等级": firstSelect(evaluation.fields["数据覆盖等级"]),
    "待复核数量": evaluation.fields["人审未完成数量"],
    "需补证数量": evaluation.fields["人审未完成数量"],
    "评估总览": evaluation.fields["评估总览"],
    "数据覆盖结论": evaluation.fields["数据覆盖结论"],
    "人工复核要求": firstSelect(evaluation.fields["人工复核要求"]),
    "人工复核入口": reviewIds,
  };
  for (const dimension of DIMENSIONS) {
    patch[`${dimension}详情`] = dimensionByName.has(dimension) ? [dimensionByName.get(dimension)] : [];
  }
  updateRecord(TABLES.people, person.record_id, patch);

  const deleteResults = [
    "中层人员",
    "高风险维度数",
    "团队规模",
    "业务域",
    "项目范围",
    "是否纳入本轮评估",
    "备注",
    "最新报告链接",
    "单人 Review Packet",
    "关联评估任务",
    "中层姓名",
  ].map((name) => deleteFieldByName(TABLES.people, name));

  const renameResult = updateField(TABLES.people, "person_id", { name: "中层姓名" });

  console.log(JSON.stringify({
    ok: true,
    record_id: person.record_id,
    primary_title: MANAGER_NAME,
    retained_front_fields: [
      "中层姓名",
      "manager_id",
      "所属部门",
      "管理范围",
      "主责角色",
      "最新报告状态",
      "最新签字状态",
      "最新整体置信度",
      "数据覆盖等级",
      "待复核数量",
      "需补证数量",
      "人工复核要求",
      "评估总览",
      "数据覆盖结论",
      ...DIMENSIONS.map((dimension) => `${dimension}详情`),
      "人工复核入口",
      "主关注维度",
    ],
    deleted_fields: deleteResults,
    primary_rename_limited: renameResult.ok === false,
  }, null, 2));
}

main();

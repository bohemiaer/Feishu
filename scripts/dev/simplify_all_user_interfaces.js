#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = "E:/GITHUB-RES/Feishu";
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const EVALUATION_ID = process.env.EVALUATION_ID || "EVAL-PJT-CASE-04-MTG-CASE-04-04";

const TABLES = {
  evaluation: "tblcGy0h0fx4pIoG",
  dimension: "tblMUq8orwwRSi1c",
  metric: "tbldjPFXVZ4PD9RJ",
  review: "tblShT3KAkGRjj1T",
  evidence: "tblQenU1BAdECcY2",
};

const DIMENSION_NAMES = ["方向校准力", "推进闭环力", "风险治理力", "协同调度力", "组织行为健康度"];

function run(args, allowFailure = false) {
  try {
    const out = execFileSync(CLI, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    return out.trim() ? JSON.parse(out) : {};
  } catch (error) {
    if (allowFailure) {
      return { ok: false, error: String(error.stderr || error.stdout || error.message) };
    }
    throw error;
  }
}

function jsonArg(payload) {
  const dir = path.join(ROOT, ".tmp", "ui-simplify");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(payload), "utf8");
  return `@${path.relative(ROOT, file).replace(/\\/g, "/")}`;
}

function listFields(tableId) {
  return run(["base", "+field-list", "--base-token", BASE_TOKEN, "--table-id", tableId, "--limit", "200"])?.data?.fields || [];
}

function listRecords(tableId) {
  const res = run([
    "base",
    "+record-list",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--limit",
    "500",
    "--format",
    "json",
  ]);
  return (res?.data?.data || []).map((values, index) => ({
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

function fieldByName(tableId, names) {
  const nameList = Array.isArray(names) ? names : [names];
  const fields = listFields(tableId);
  return fields.find((field) => nameList.includes(field.name));
}

function updateFieldName(tableId, oldNames, newName) {
  const field = fieldByName(tableId, oldNames);
  if (!field) return { newName, renamed: false, reason: "missing" };
  if (field.name === newName) return { newName, renamed: false, reason: "already_named" };
  const body = { ...field, name: newName };
  delete body.id;
  const res = run([
    "base",
    "+field-update",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--field-id",
    field.id,
    "--json",
    jsonArg(body),
  ], true);
  return { newName, renamed: res.ok !== false, reason: res.ok === false ? res.error : "" };
}

function deleteField(tableId, name) {
  const field = fieldByName(tableId, name);
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

function upsertRecord(tableId, recordId, patch) {
  const compact = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    compact[key] = value;
  }
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

function titleFromEvidence(fields) {
  const sourceType = selectText(fields["来源类型"]) || "证据";
  const dimension = selectText(fields["关联维度"]) || "未标注维度";
  const suffix = fields["是否存在冲突"] ? "冲突证据" : fields["是否关键证据"] ? "关键证据" : "证据";
  return `${sourceType}｜${dimension}｜${suffix}`;
}

function main() {
  const evaluationRecords = listRecords(TABLES.evaluation);
  const dimensionRecords = listRecords(TABLES.dimension);
  const metricRecords = listRecords(TABLES.metric);
  const reviewRecords = listRecords(TABLES.review);
  const evidenceRecords = listRecords(TABLES.evidence);

  const dimensionByRecordId = new Map();
  for (const record of dimensionRecords) {
    const dimensionName = selectText(record.fields["维度名称"]) || record.fields["维度页标题"] || record.fields.dimension_result_id || "维度详情";
    dimensionByRecordId.set(record.record_id, dimensionName);
  }

  const renameResults = [
    updateFieldName(TABLES.evaluation, "evaluation_id", "评估包标题"),
    updateFieldName(TABLES.dimension, "dimension_result_id", "维度页标题"),
    updateFieldName(TABLES.metric, "metric_result_id", "指标页标题"),
    updateFieldName(TABLES.review, "review_item_id", "复核事项"),
    updateFieldName(TABLES.evidence, "evidence_id", "证据标题"),
  ];

  for (const record of evaluationRecords) {
    if (record.fields.evaluation_id && record.fields.evaluation_id !== EVALUATION_ID) continue;
    upsertRecord(TABLES.evaluation, record.record_id, {
      "评估包标题": `${record.fields["评估对象名称"] || "单人"}｜评估包`,
    });
  }

  for (const record of dimensionRecords) {
    const dimensionName = selectText(record.fields["维度名称"]) || record.fields["维度页标题"] || "维度详情";
    upsertRecord(TABLES.dimension, record.record_id, {
      "维度页标题": dimensionName,
    });
  }

  for (const record of metricRecords) {
    const dimensionName = selectText(record.fields["维度名称"]) || "未标注维度";
    const metricName = selectText(record.fields["指标名称"]) || record.fields["指标页标题"] || "指标解释";
    upsertRecord(TABLES.metric, record.record_id, {
      "指标页标题": `${dimensionName}｜${metricName}`,
    });
  }

  for (const record of reviewRecords) {
    const reviewType = selectText(record.fields["复核类型"]) || "复核";
    const linkedDimension = linkedIds(record.fields["关联维度结果"]).map((id) => dimensionByRecordId.get(id)).filter(Boolean)[0] || "评审项";
    upsertRecord(TABLES.review, record.record_id, {
      "复核事项": `${reviewType}｜${linkedDimension}`,
    });
  }

  for (const record of evidenceRecords) {
    upsertRecord(TABLES.evidence, record.record_id, {
      "证据标题": titleFromEvidence(record.fields),
    });
  }

  const deletePlan = {
    evaluation: [
      "评审入口类型",
      "创建时间",
      "最后更新时间",
      "关联人员总览",
      "关联指标明细",
      "关联维度结论",
      "评估对象",
      "个人指标看板链接",
    ],
    dimension: [
      "evaluation_id",
      "关联评估任务",
      "权重",
      "是否主评分",
      "维度名称",
    ],
    metric: [
      "evaluation_id",
      "关联评估任务",
      "关联维度结果",
      "阈值版本",
      "指标值",
      "是否硬算",
      "是否纳入主评分",
      "指标类型",
      "指标状态",
      "数据源",
      "指标名称",
    ],
    review: [
      "evaluation_id",
      "关联评估任务",
      "关联报告",
    ],
    evidence: [
      "evaluation_id",
      "关联评估任务",
      "关联维度结果",
      "关联指标结果",
      "关联复核项",
      "关联对象",
      "可见范围",
      "证据时间",
    ],
  };

  const deleteResults = {};
  for (const [tableName, fieldNames] of Object.entries(deletePlan)) {
    deleteResults[tableName] = fieldNames.map((name) => deleteField(TABLES[tableName], name));
  }

  console.log(JSON.stringify({
    ok: true,
    renamed_primary_fields: renameResults,
    deleted_fields: deleteResults,
  }, null, 2));
}

main();

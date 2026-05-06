#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE_TOKEN = "Z6d9bO5UqajK01swK9CcoGU9nkf";
const BASE_URL = `https://jcneyh7qlo8i.feishu.cn/base/${BASE_TOKEN}`;
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";

const TABLES = {
  evaluation_runs: "tblcGy0h0fx4pIoG",
  dimension_results: "tblMUq8orwwRSi1c",
  metric_results: "tbldjPFXVZ4PD9RJ",
  review_items: "tblShT3KAkGRjj1T",
};

const EVALUATION_ID = "EVAL-PJT-CASE-04-MTG-CASE-04-04";

function run(args, options = {}) {
  const out = execFileSync(CLI, args, {
    cwd: "E:/GITHUB-RES/Feishu",
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.inheritStderr ? "inherit" : "pipe"],
  });
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

function writeJsonArg(payload) {
  const dir = path.join("E:/GITHUB-RES/Feishu", ".tmp", "feishu-output-layer");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(payload), "utf8");
  return path.relative("E:/GITHUB-RES/Feishu", file).replace(/\\/g, "/");
}

function baseArgs(command, tableId) {
  return ["base", command, "--base-token", BASE_TOKEN, "--table-id", tableId];
}

function listFields(tableId) {
  const res = run(baseArgs("+field-list", tableId));
  return res?.data?.fields || res?.data?.items || res?.items || [];
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
    "200",
    "--format",
    "json",
  ]);
  if (Array.isArray(res?.data?.data) && Array.isArray(res?.data?.fields)) {
    return res.data.data.map((values, index) => {
      const fields = Object.fromEntries(res.data.fields.map((field, fieldIndex) => [field, values[fieldIndex]]));
      return {
        record_id: res.data.record_id_list?.[index],
        fields,
      };
    });
  }
  return res?.data?.items || res?.items || [];
}

function updateField(tableId, fieldId, payload) {
  const existing = listFields(tableId).find((field) => field.id === fieldId || field.field_id === fieldId || field.name === fieldId);
  const mergedPayload = existing
    ? {
        ...existing,
        ...payload,
        id: undefined,
      }
    : payload;
  const jsonArg = writeJsonArg(payload);
  fs.writeFileSync(path.join("E:/GITHUB-RES/Feishu", jsonArg), JSON.stringify(mergedPayload), "utf8");
  try {
    return run([...baseArgs("+field-update", tableId), "--field-id", fieldId, "--json", `@${jsonArg}`]);
  } catch (error) {
    if (String(error.stderr || error.message).includes("no operation produced")) {
      return { ok: true, noop: true };
    }
    if (String(error.stderr || error.message).includes("OpenAPIUpdateField limited")) {
      return { ok: false, limited: true };
    }
    throw error;
  }
}

function createFieldIfMissing(tableId, name, payload) {
  const existing = listFields(tableId).find((field) => field.field_name === name || field.name === name);
  if (existing) return existing;

  const jsonArg = writeJsonArg(payload);
  const res = run([...baseArgs("+field-create", tableId), "--json", `@${jsonArg}`]);
  return res?.data?.field || res?.field || res?.data || res;
}

function deleteFieldIfExists(tableId, fieldIdOrName) {
  const fields = listFields(tableId);
  const field = fields.find(
    (item) =>
      item.field_id === fieldIdOrName ||
      item.id === fieldIdOrName ||
      item.field_name === fieldIdOrName ||
      item.name === fieldIdOrName,
  );
  if (!field) return false;

  run([
    "base",
    "+field-delete",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--field-id",
    field.field_id || field.id,
    "--yes",
  ]);
  return true;
}

function updateRecord(tableId, recordId, fields) {
  const jsonArg = writeJsonArg(fields);
  return run([
    "base",
    "+record-upsert",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--record-id",
    recordId,
    "--json",
    `@${jsonArg}`,
  ]);
}

function findEvaluationRecord() {
  const records = listRecords(TABLES.evaluation_runs);
  const record = records.find((item) => item.fields?.evaluation_id === EVALUATION_ID);
  if (!record) throw new Error(`Cannot find evaluation record ${EVALUATION_ID}`);
  return record;
}

function recordIds(tableId) {
  return listRecords(tableId).map((item) => item.record_id || item.id).filter(Boolean);
}

function ensureMetricView() {
  const res = run([
    "base",
    "+view-list",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    TABLES.metric_results,
  ]);
  const views = res?.data?.views || res?.data?.items || res?.items || [];
  const name = "单人指标看板-陈昊";
  const existing = views.find((view) => view.view_name === name || view.name === name);
  if (existing) return existing.view_id || existing.id;

  const jsonArg = writeJsonArg({ view_name: name, type: "grid" });
  const created = run([
    "base",
    "+view-create",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    TABLES.metric_results,
    "--json",
    `@${jsonArg}`,
  ]);
  return (
    created?.data?.view?.view_id ||
    created?.data?.view?.id ||
    created?.data?.view_id ||
    created?.view_id ||
    created?.id
  );
}

function setMetricViewFilter(viewId) {
  if (!viewId) return;
  const jsonArg = writeJsonArg({
    logic: "and",
    conditions: [["fldRBwWS5H", "==", EVALUATION_ID]],
  });
  run([
    "base",
    "+view-set-filter",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    TABLES.metric_results,
    "--view-id",
    viewId,
    "--json",
    `@${jsonArg}`,
  ]);
}

function main() {
  const evaluation = findEvaluationRecord();
  const evaluationRecordId = evaluation.record_id || evaluation.id;

  const deletedPriority = deleteFieldIfExists(TABLES.evaluation_runs, "系统展示优先级");

  const overviewRename = updateField(TABLES.evaluation_runs, "fldwC2lCQP", { name: "评估总览" });

  const dataCoverageField = createFieldIfMissing(TABLES.evaluation_runs, "数据覆盖结论", {
    name: "数据覆盖结论",
    type: "text",
    style: { type: "plain" },
  });

  const reviewRequirementField = createFieldIfMissing(TABLES.evaluation_runs, "人工复核要求", {
    name: "人工复核要求",
    type: "select",
    options: [{ name: "需要" }, { name: "不需要" }],
  });

  const dimensionDrillField = createFieldIfMissing(TABLES.evaluation_runs, "关联维度结论", {
    name: "关联维度结论",
    type: "link",
    link_table: TABLES.dimension_results,
  });

  const metricDrillField = createFieldIfMissing(TABLES.evaluation_runs, "关联指标明细", {
    name: "关联指标明细",
    type: "link",
    link_table: TABLES.metric_results,
  });

  const reviewDrillField = createFieldIfMissing(TABLES.evaluation_runs, "关联复核项", {
    name: "关联复核项",
    type: "link",
    link_table: TABLES.review_items,
  });

  const personalBiField = createFieldIfMissing(TABLES.evaluation_runs, "个人指标看板链接", {
    name: "个人指标看板链接",
    type: "text",
    style: { type: "url" },
  });

  const metricViewId = ensureMetricView();
  setMetricViewFilter(metricViewId);
  const metricViewUrl = metricViewId
    ? `${BASE_URL}?table=${TABLES.metric_results}&view=${metricViewId}`
    : `${BASE_URL}?table=${TABLES.metric_results}`;

  const dataCoverageConclusion =
    "本次数据覆盖等级为「中」。可用于评审的数据包括 Base 记录、Base 历史、云文档、聊天历史、会议/妙记、日历和通讯录；但当前会议缺少完整妙记转写，历史会议存在 summary_only 样本，聊天样本需要过滤行政/噪音消息，因此报告需人工复核后再生效。";

  updateRecord(TABLES.evaluation_runs, evaluationRecordId, {
    数据覆盖结论: dataCoverageConclusion,
    人工复核要求: "需要",
    关联维度结论: recordIds(TABLES.dimension_results),
    关联指标明细: recordIds(TABLES.metric_results),
    关联复核项: recordIds(TABLES.review_items),
    个人指标看板链接: metricViewUrl,
  });

  deleteFieldIfExists(TABLES.evaluation_runs, "是否需人工复核");
  deleteFieldIfExists(TABLES.evaluation_runs, "数据覆盖摘要");

  console.log(
    JSON.stringify(
      {
        ok: true,
        deleted_priority_field: deletedPriority,
        overview_rename_limited: Boolean(overviewRename.limited),
        evaluation_record_id: evaluationRecordId,
        metric_view_url: metricViewUrl,
        fields_added_or_confirmed: [
          dataCoverageField.field_name || dataCoverageField.name || "数据覆盖结论",
          reviewRequirementField.field_name || reviewRequirementField.name || "人工复核要求",
          dimensionDrillField.field_name || dimensionDrillField.name || "关联维度结论",
          metricDrillField.field_name || metricDrillField.name || "关联指标明细",
          reviewDrillField.field_name || reviewDrillField.name || "关联复核项",
          personalBiField.field_name || personalBiField.name || "个人指标看板链接",
        ],
      },
      null,
      2,
    ),
  );
}

main();

#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");

const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const ROOT = "E:/GITHUB-RES/Feishu";
const BASE_URL = `https://jcneyh7qlo8i.feishu.cn/base/${BASE_TOKEN}`;

const PERSON_NAME = process.env.REVIEW_PACKET_PERSON || "陈昊";
const DASHBOARD_NAME = process.env.REVIEW_PACKET_DASHBOARD_NAME || `单人 Review Packet｜${PERSON_NAME}｜个人五维图表`;

const TABLES = {
  evaluation: { id: "tblcGy0h0fx4pIoG", name: "单人评估包" },
  dimension: { id: "tblMUq8orwwRSi1c", name: "五维结论" },
  metric: { id: "tbldjPFXVZ4PD9RJ", name: "指标结果" },
  review: { id: "tblShT3KAkGRjj1T", name: "人工复核" },
  evidence: { id: "tblQenU1BAdECcY2", name: "证据索引" },
};

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
      return {
        ok: false,
        stderr: String(error.stderr || ""),
        stdout: String(error.stdout || ""),
        message: error.message,
      };
    }
    throw error;
  }
}

function listDashboards() {
  return run(["base", "+dashboard-list", "--base-token", BASE_TOKEN])?.data?.items || [];
}

function getOrCreateDashboard() {
  const existing = listDashboards().find((dashboard) => dashboard.name === DASHBOARD_NAME);
  if (existing) return existing.dashboard_id;

  const created = run([
    "base",
    "+dashboard-create",
    "--base-token",
    BASE_TOKEN,
    "--name",
    DASHBOARD_NAME,
  ]);
  return created?.data?.dashboard_id || created?.dashboard_id;
}

function listBlocks(dashboardId) {
  return run([
    "base",
    "+dashboard-block-list",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    dashboardId,
  ])?.data?.items || [];
}

function createBlock(dashboardId, type, name, dataConfig, extraArgs = [], allowFailure = false) {
  return run([
    "base",
    "+dashboard-block-create",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    dashboardId,
    "--type",
    type,
    "--name",
    name,
    "--data-config",
    JSON.stringify(dataConfig),
    ...extraArgs,
  ], allowFailure);
}

function fieldExists(tableId, fieldName) {
  const fields = run([
    "base",
    "+field-list",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
  ])?.data?.fields || [];
  return fields.some((field) => field.name === fieldName);
}

function ensureTextField(tableId, fieldName) {
  if (fieldExists(tableId, fieldName)) return false;
  run([
    "base",
    "+field-create",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--json",
    JSON.stringify({
      name: fieldName,
      type: "text",
      style: { type: "plain" },
    }),
  ]);
  return true;
}

function recordIds(tableId) {
  const result = run([
    "base",
    "+record-list",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--format",
    "json",
  ]);
  return result?.data?.record_id_list || [];
}

function patchRecords(tableId, ids, patch) {
  if (!ids.length) return null;
  return run([
    "base",
    "+record-batch-update",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--json",
    JSON.stringify({
      record_id_list: ids,
      patch,
    }),
  ]);
}

function ensureOwnerFields() {
  const changedTables = [];
  for (const table of [TABLES.dimension, TABLES.metric, TABLES.review, TABLES.evidence]) {
    const created = ensureTextField(table.id, "所属人员");
    const ids = recordIds(table.id);
    patchRecords(table.id, ids, { 所属人员: PERSON_NAME });
    changedTables.push({ table: table.name, field_created: created, updated_records: ids.length });
  }
  return changedTables;
}

function personFilter() {
  return {
    conjunction: "and",
    conditions: [{ field_name: "所属人员", operator: "is", value: PERSON_NAME }],
  };
}

function createDashboardBlocks(dashboardId) {
  const existing = listBlocks(dashboardId);
  if (existing.length > 0) {
    return { skipped: true, existing_blocks: existing.length };
  }

  const entryText = [
    `# ${PERSON_NAME}｜个人五维图表`,
    "",
    "这个模块放在单人 Review Packet 第一层，用来看整体形状：哪一维强、哪一维被阻断、哪些结论需要人工复核。",
    "",
    `- [回到单人评估包](${BASE_URL}?table=${TABLES.evaluation.id})`,
    `- [进入五维结论下钻](${BASE_URL}?table=${TABLES.dimension.id})`,
    `- [进入人工复核](${BASE_URL}?table=${TABLES.review.id})`,
    "",
    "建议阅读顺序：先看五维图表，再点单人评估包里的某个维度详情，继续下钻指标、证据和复核项。",
  ].join("\n");

  const blocks = [];
  blocks.push(createBlock(dashboardId, "text", "图表说明｜先看五维形状，再进维度详情", { text: entryText }));

  const scoreConfig = {
    table_name: TABLES.dimension.name,
    filter: personFilter(),
    group_by: [{ field_name: "维度页标题", mode: "integrated", sort: { type: "group", order: "asc" } }],
    series: [{ field_name: "维度分数", rollup: "AVERAGE" }],
  };
  const radar = createBlock(dashboardId, "radar", "个人五维能力雷达", scoreConfig, [], true);
  if (radar?.ok === false) {
    blocks.push(createBlock(dashboardId, "bar", "个人五维得分", scoreConfig));
  } else {
    blocks.push(radar);
  }

  blocks.push(createBlock(dashboardId, "ring", "维度等级分布", {
    table_name: TABLES.dimension.name,
    filter: personFilter(),
    count_all: true,
    group_by: [{ field_name: "维度等级", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock(dashboardId, "funnel", "人工复核状态", {
    table_name: TABLES.review.name,
    filter: personFilter(),
    count_all: true,
    group_by: [{ field_name: "复核状态", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock(dashboardId, "bar", "指标数据质量", {
    table_name: TABLES.metric.name,
    filter: personFilter(),
    count_all: true,
    group_by: [{ field_name: "数据源质量", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock(dashboardId, "ring", "证据权限状态", {
    table_name: TABLES.evidence.name,
    filter: personFilter(),
    count_all: true,
    group_by: [{ field_name: "权限状态", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));

  const arranged = run([
    "base",
    "+dashboard-arrange",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    dashboardId,
  ], true);

  return { skipped: false, created_blocks: blocks, arranged: arranged.ok !== false };
}

function repurposeReportLink(dashboardUrl) {
  run([
    "base",
    "+field-update",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    TABLES.evaluation.id,
    "--field-id",
    "报告链接",
    "--json",
    JSON.stringify({
      name: "个人五维图表",
      type: "text",
      style: { type: "url" },
    }),
  ]);
  const ids = recordIds(TABLES.evaluation.id);
  patchRecords(TABLES.evaluation.id, ids, { 个人五维图表: dashboardUrl });
  return { updated_records: ids.length };
}

function main() {
  const ownerFields = ensureOwnerFields();
  const dashboardId = getOrCreateDashboard();
  const dashboardUrl = `${BASE_URL}?dashboard=${dashboardId}`;
  const dashboardBlocks = createDashboardBlocks(dashboardId);
  const linkUpdate = repurposeReportLink(dashboardUrl);

  console.log(JSON.stringify({
    ok: true,
    person: PERSON_NAME,
    dashboard_name: DASHBOARD_NAME,
    dashboard_id: dashboardId,
    dashboard_url: dashboardUrl,
    owner_fields: ownerFields,
    dashboard_blocks: dashboardBlocks,
    review_packet_link_field: "个人五维图表",
    review_packet_link_update: linkUpdate,
  }, null, 2));
}

main();

#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");

const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const DASHBOARD_ID = process.env.REVIEW_PACKET_DASHBOARD_ID || "blkwsVk95GtFvTLA";
const PERSON_NAME = process.env.REVIEW_PACKET_PERSON || "陈昊";
const DASHBOARD_NAME = process.env.REVIEW_PACKET_DASHBOARD_NAME || `单人 Review Packet｜${PERSON_NAME}`;
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const ROOT = "E:/GITHUB-RES/Feishu";
const BASE_URL = `https://jcneyh7qlo8i.feishu.cn/base/${BASE_TOKEN}`;
const DASHBOARD_URL = `${BASE_URL}?dashboard=${DASHBOARD_ID}`;

const TABLES = {
  people: { id: "tblfQS3bHVLNavvZ", name: "人员评估总览" },
  evaluation: { id: "tblcGy0h0fx4pIoG", name: "单人评估包" },
  dimension: { id: "tblMUq8orwwRSi1c", name: "五维结论" },
  metric: { id: "tbldjPFXVZ4PD9RJ", name: "指标结果" },
  review: { id: "tblShT3KAkGRjj1T", name: "人工复核" },
  evidence: { id: "tblQenU1BAdECcY2", name: "证据索引" },
};

function run(args) {
  const out = execFileSync(CLI, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  });
  return out.trim() ? JSON.parse(out) : {};
}

function fields(tableId) {
  return run(["base", "+field-list", "--base-token", BASE_TOKEN, "--table-id", tableId])?.data?.fields || [];
}

function hasField(tableId, fieldName) {
  return fields(tableId).some((field) => field.name === fieldName);
}

function ensureUrlField(tableId, fieldName) {
  if (hasField(tableId, fieldName)) return false;
  run([
    "base",
    "+field-create",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--json",
    JSON.stringify({ name: fieldName, type: "text", style: { type: "url" } }),
  ]);
  return true;
}

function recordIds(tableId) {
  return run([
    "base",
    "+record-list",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--format",
    "json",
  ])?.data?.record_id_list || [];
}

function patchAll(tableId, patch) {
  const ids = recordIds(tableId);
  if (!ids.length) return 0;
  run([
    "base",
    "+record-batch-update",
    "--base-token",
    BASE_TOKEN,
    "--table-id",
    tableId,
    "--json",
    JSON.stringify({ record_id_list: ids, patch }),
  ]);
  return ids.length;
}

function blockIdByName(name) {
  const blocks = run([
    "base",
    "+dashboard-block-list",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
  ])?.data?.items || [];
  return blocks.find((block) => block.name === name)?.block_id;
}

function updateTextBlock() {
  const oldName = "图表说明｜先看五维形状，再进维度详情";
  const blockId = blockIdByName(oldName) || blockIdByName("评审包说明｜先看状态，再进维度详情");

  const text = [
    `# ${PERSON_NAME}｜单人 Review Packet`,
    "",
    "这页就是个人评审包首页：先看状态和五维形状，再决定是否进入维度、指标、证据或人工复核。",
    "",
    "## 当前状态",
    "- 报告状态：需补证",
    "- 签字状态：未签字",
    "- 整体置信度：0.68",
    "- 数据覆盖：中",
    "- 人工复核：需要，待处理 6 项",
    "",
    "## 评审路径",
    `- [五维结论下钻](${BASE_URL}?table=${TABLES.dimension.id})：点击某一维度，进入指标、证据、复核链路。`,
    `- [人工复核工作台](${BASE_URL}?table=${TABLES.review.id})：只在这里更新复核状态、备注和是否允许报告生效。`,
    `- [指标结果](${BASE_URL}?table=${TABLES.metric.id})：查看样本量、缺失率、数据源质量和降级原因。`,
    `- [证据索引](${BASE_URL}?table=${TABLES.evidence.id})：查看证据片段、权限状态、冲突说明和原始链接。`,
    "",
    "## 使用方式",
    "1. 先看下面的五维雷达和维度等级分布，判断整体形状。",
    "2. 如果某一维偏低或仅观察，回到五维结论下钻对应维度。",
    "3. 如果报告被阻断，进入人工复核工作台处理复核项。",
  ].join("\n");

  if (!blockId) {
    run([
      "base",
      "+dashboard-block-create",
      "--base-token",
      BASE_TOKEN,
      "--dashboard-id",
      DASHBOARD_ID,
      "--type",
      "text",
      "--name",
      "评审包说明｜先看状态，再进维度详情",
      "--data-config",
      JSON.stringify({ text }),
    ]);
    return true;
  }

  run([
    "base",
    "+dashboard-block-update",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
    "--block-id",
    blockId,
    "--name",
    "评审包说明｜先看状态，再进维度详情",
    "--data-config",
    JSON.stringify({ text }),
  ]);
  return true;
}

function renameDashboard() {
  run([
    "base",
    "+dashboard-update",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
    "--name",
    DASHBOARD_NAME,
  ]);
}

function updateEntryFields() {
  const createdPeopleField = ensureUrlField(TABLES.people.id, "单人 Review Packet");
  const updatedPeople = patchAll(TABLES.people.id, { "单人 Review Packet": DASHBOARD_URL });

  if (hasField(TABLES.evaluation.id, "个人五维图表")) {
    run([
      "base",
      "+field-update",
      "--base-token",
      BASE_TOKEN,
      "--table-id",
      TABLES.evaluation.id,
      "--field-id",
      "个人五维图表",
      "--json",
      JSON.stringify({ name: "单人 Review Packet", type: "text", style: { type: "url" } }),
    ]);
  } else {
    ensureUrlField(TABLES.evaluation.id, "单人 Review Packet");
  }
  const updatedEvaluation = patchAll(TABLES.evaluation.id, { "单人 Review Packet": DASHBOARD_URL });

  return { createdPeopleField, updatedPeople, updatedEvaluation };
}

function main() {
  renameDashboard();
  const textUpdated = updateTextBlock();
  const entries = updateEntryFields();

  console.log(JSON.stringify({
    ok: true,
    dashboard_id: DASHBOARD_ID,
    dashboard_name: DASHBOARD_NAME,
    dashboard_url: DASHBOARD_URL,
    text_block_updated: textUpdated,
    entry_fields: entries,
  }, null, 2));
}

main();

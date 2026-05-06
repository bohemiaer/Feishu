#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");

const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const DASHBOARD_ID = process.env.FEISHU_DASHBOARD_ID || "blkXqkeaWqeNWEV1";
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const ROOT = "E:/GITHUB-RES/Feishu";
const BASE_URL = `https://jcneyh7qlo8i.feishu.cn/base/${BASE_TOKEN}`;

const TABLES = {
  people: { id: "tblfQS3bHVLNavvZ", name: "人员评估总览" },
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
      return { ok: false, error: String(error.stderr || error.stdout || error.message) };
    }
    throw error;
  }
}

function listBlocks() {
  return run([
    "base",
    "+dashboard-block-list",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
  ])?.data?.items || [];
}

function deleteExistingBlocks() {
  const results = [];
  for (const block of listBlocks()) {
    const result = run([
      "base",
      "+dashboard-block-delete",
      "--base-token",
      BASE_TOKEN,
      "--dashboard-id",
      DASHBOARD_ID,
      "--block-id",
      block.block_id,
      "--yes",
    ]);
    if (!result?.ok) {
      throw new Error(`Failed to delete dashboard block ${block.block_id}: ${JSON.stringify(result)}`);
    }
    results.push({ block_id: block.block_id, name: block.name, deleted: true });
  }
  return results;
}

function createBlock(type, name, dataConfig, extraArgs = []) {
  return run([
    "base",
    "+dashboard-block-create",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
    "--type",
    type,
    "--name",
    name,
    "--data-config",
    JSON.stringify(dataConfig),
    ...extraArgs,
  ]);
}

function tableLink(table) {
  return `${BASE_URL}?table=${table.id}`;
}

function main() {
  const deleted = deleteExistingBlocks();

  const entryText = [
    "# 中层管理效能评估｜评审总览",
    "",
    "这个首页只回答三件事：谁需要看、哪里被阻断、下一步点哪里。",
    "",
    `- [人员评估总览](${tableLink(TABLES.people)})：评审人的默认入口，点击姓名打开单人 Review Packet。`,
    `- [人工复核](${tableLink(TABLES.review)})：处理低置信、补证、证据冲突、敏感判断。`,
    `- [五维结论](${tableLink(TABLES.dimension)})：查看维度二级页，继续下钻指标和证据。`,
    `- [指标结果](${tableLink(TABLES.metric)})：查看样本量、缺失率、数据源质量和降级说明。`,
    `- [证据索引](${tableLink(TABLES.evidence)})：查看证据片段、权限状态、冲突和原始链接。`,
  ].join("\n");

  const blocks = [];
  blocks.push(createBlock("text", "入口说明｜先看人，再看阻断，再下钻证据", { text: entryText }));

  blocks.push(createBlock("statistics", "本轮评估人数", {
    table_name: TABLES.people.name,
    count_all: true,
  }));
  blocks.push(createBlock("statistics", "需人工复核人数", {
    table_name: TABLES.people.name,
    count_all: true,
    filter: {
      conjunction: "and",
      conditions: [{ field_name: "人工复核要求", operator: "is", value: "需要" }],
    },
  }));
  blocks.push(createBlock("statistics", "待处理复核项", {
    table_name: TABLES.review.name,
    count_all: true,
    filter: {
      conjunction: "and",
      conditions: [{ field_name: "复核状态", operator: "is", value: "pending 待复核" }],
    },
  }));
  blocks.push(createBlock("statistics", "需补证人数", {
    table_name: TABLES.people.name,
    count_all: true,
    filter: {
      conjunction: "and",
      conditions: [{ field_name: "最新报告状态", operator: "is", value: "needs_evidence 需补证" }],
    },
  }));

  blocks.push(createBlock("ring", "报告状态分布", {
    table_name: TABLES.people.name,
    count_all: true,
    group_by: [{ field_name: "最新报告状态", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock("ring", "数据覆盖等级分布", {
    table_name: TABLES.people.name,
    count_all: true,
    group_by: [{ field_name: "数据覆盖等级", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock("bar", "五维得分概览", {
    table_name: TABLES.dimension.name,
    group_by: [{ field_name: "维度页标题", mode: "integrated", sort: { type: "group", order: "asc" } }],
    series: [{ field_name: "维度分数", rollup: "AVERAGE" }],
  }));
  blocks.push(createBlock("funnel", "人工复核状态流转", {
    table_name: TABLES.review.name,
    count_all: true,
    group_by: [{ field_name: "复核状态", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock("bar", "指标数据质量", {
    table_name: TABLES.metric.name,
    count_all: true,
    group_by: [{ field_name: "数据源质量", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock("ring", "证据权限状态", {
    table_name: TABLES.evidence.name,
    count_all: true,
    group_by: [{ field_name: "权限状态", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));
  blocks.push(createBlock("ring", "证据冲突占比", {
    table_name: TABLES.evidence.name,
    count_all: true,
    group_by: [{ field_name: "是否存在冲突", mode: "integrated", sort: { type: "group", order: "asc" } }],
  }));

  const arrange = run([
    "base",
    "+dashboard-arrange",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
  ], true);

  console.log(JSON.stringify({
    ok: true,
    dashboard_id: DASHBOARD_ID,
    deleted_blocks: deleted,
    created_blocks: blocks.map((item) => item?.data?.block || item?.data || item),
    arranged: arrange.ok !== false,
    url: `${BASE_URL}?dashboard=${DASHBOARD_ID}`,
  }, null, 2));
}

main();

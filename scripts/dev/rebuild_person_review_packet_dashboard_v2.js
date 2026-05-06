#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");

const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "Z6d9bO5UqajK01swK9CcoGU9nkf";
const DASHBOARD_ID = process.env.REVIEW_PACKET_DASHBOARD_ID || "blkwsVk95GtFvTLA";
const PERSON_NAME = process.env.REVIEW_PACKET_PERSON || "陈昊";
const CLI = process.env.LARK_CLI || "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const ROOT = "E:/GITHUB-RES/Feishu";
const BASE_URL = `https://jcneyh7qlo8i.feishu.cn/base/${BASE_TOKEN}`;
const DASHBOARD_URL = `${BASE_URL}?dashboard=${DASHBOARD_ID}`;
const INTRO_BLOCK_NAME = "评审包说明｜筛选与状态";

function run(args) {
  const out = execFileSync(CLI, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  });
  return out.trim() ? JSON.parse(out) : {};
}

function dashboardBlocks() {
  return run([
    "base",
    "+dashboard-block-list",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
  ]).data.items || [];
}

function updateDashboardName() {
  return run([
    "base",
    "+dashboard-update",
    "--base-token",
    BASE_TOKEN,
    "--dashboard-id",
    DASHBOARD_ID,
    "--name",
    `单人 Review Packet｜${PERSON_NAME}`,
  ]);
}

function main() {
  updateDashboardName();
  const introBlock = dashboardBlocks().find((block) => block.name === INTRO_BLOCK_NAME);
  console.log(JSON.stringify({
    ok: true,
    dashboard_url: DASHBOARD_URL,
    maintained_only: ["dashboard.name"],
    preserved_by_design: [
      "说明块内容",
      "说明块富文本格式",
      "说明块位置",
      "筛选器",
      "4 个指标卡",
      "3 个图表",
      "表格/画册/人工复核组件",
      "所有 Base 数据字段",
    ],
    intro_block_found: Boolean(introBlock),
    intro_block: introBlock || null,
    ui_expected_intro_text: [
      "陈昊｜单人 Review Packet",
      "",
      "这页是评审人第一层入口：先看筛选对象、综合评分、五维形状、置信度与阻断项，再进入维度/指标/证据/复核下钻。",
      "",
      "报告状态：needs_evidence 需补证",
      "签字状态：未签字",
      "数据覆盖等级：中",
      "人工复核：需要，待处理 6 项",
    ].join("\n"),
  }, null, 2));
}

main();

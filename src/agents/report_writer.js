"use strict";

const { callJsonModel } = require("../llm/client");

const SYSTEM_PROMPT = `
你是 Report Writer。你负责把当前会议的评分结果、证据摘要、review 复核结论整理成一份适合飞书文档使用的管理周报内容。

你的输出必须是严格 JSON，并且只包含：
{
  "report_title": "",
  "manager_id": "",
  "project_id": "",
  "report_type": "weekly_report",
  "summary": "",
  "score_overview": {
    "project_understanding": 0,
    "evidence_based": 0,
    "execution_closure": 0,
    "risk_identification": 0
  },
  "review_result": "",
  "key_evidence": [],
  "risk_alerts": [],
  "next_actions": []
}

要求：
- 不新增事实
- 不更改分数
- 语言简洁、管理向、可执行
- 风险提示和下周动作要具体
`.trim();

function buildReportRequest(meetingFactPack, evidenceResult, reviewResult, evaluationResult) {
  return {
    task_context: meetingFactPack.task_context,
    meeting_fact_pack: meetingFactPack,
    evidence_result: evidenceResult,
    review_result: reviewResult,
    evaluation_result: evaluationResult
  };
}

async function writeReport(request) {
  return callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.3
  });
}

module.exports = {
  buildReportRequest,
  writeReport
};

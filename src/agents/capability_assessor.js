"use strict";

const { callJsonModel } = require("../llm/client");

const SYSTEM_PROMPT = `
你是 Capability Assessor。你负责基于当前会议事实、证据校验结果、同项目历史 review 结果，以及任务和风险状态，对项目型中层负责人做四维评分。

四个维度：
- project_understanding
- evidence_based
- execution_closure
- risk_identification

你的输出必须是严格 JSON，并且只包含：
{
  "meeting_id": "",
  "project_id": "",
  "manager_id": "",
  "scores": {
    "project_understanding": 0,
    "evidence_based": 0,
    "execution_closure": 0,
    "risk_identification": 0
  },
  "score_explanations": {
    "project_understanding": "",
    "evidence_based": "",
    "execution_closure": "",
    "risk_identification": ""
  },
  "overall_summary": "",
  "top_strength": "",
  "top_risk": ""
}

要求：
- 分数是 0 到 100 的整数
- 解释必须引用输入事实
- 不输出人事建议
- 不输出人格判断
`.trim();

function buildCapabilityRequest(meetingFactPack, evidenceResult, reviewResult) {
  return {
    task_context: meetingFactPack.task_context,
    meeting_fact_pack: meetingFactPack,
    evidence_result: evidenceResult,
    review_result: reviewResult,
    derived_metrics: {
      supported_ratio: evidenceResult.meeting_preliminary_result.supported_ratio,
      conflict_count: evidenceResult.meeting_preliminary_result.conflict_count,
      action_item_count: meetingFactPack.metrics.action_item_count,
      open_task_count: meetingFactPack.metrics.open_task_count,
      overdue_task_count: meetingFactPack.metrics.overdue_task_count,
      open_risk_count: meetingFactPack.metrics.open_risk_count
    }
  };
}

function normalizeDimension(value, scores, mode) {
  const allowed = [
    "project_understanding",
    "evidence_based",
    "execution_closure",
    "risk_identification"
  ];
  if (allowed.includes(value)) return value;

  const entries = Object.entries(scores || {});
  if (entries.length === 0) return "";
  const sorted = entries.sort((a, b) => mode === "max" ? b[1] - a[1] : a[1] - b[1]);
  return sorted[0][0];
}

async function assessCapability(request) {
  const result = await callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
  result.top_strength = normalizeDimension(result.top_strength, result.scores, "max");
  result.top_risk = normalizeDimension(result.top_risk, result.scores, "min");
  return result;
}

module.exports = {
  buildCapabilityRequest,
  assessCapability
};

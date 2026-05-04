"use strict";

const { callJsonModel } = require("../llm/client");

const SYSTEM_PROMPT = `
你是 Review Engine。你负责基于当前会议初判结果和同项目最近 3 到 5 场历史会议信号，判断当前结论是否稳定、一致、可信。

你的输出必须是严格 JSON，并且只包含：
{
  "meeting_id": "",
  "project_id": "",
  "review_sample_count": 0,
  "review_result": "一致支持",
  "consistency_summary": "",
  "supporting_signals": [],
  "conflict_signals": [],
  "confidence": 0.0
}

判断口径：
- 一致支持
- 部分支持
- 存在冲突
- 证据不足

要求：
- 只能使用当前输入
- 只能复核同项目最近几次会议
- 不做跨项目外推
- confidence 范围 0 到 1
`.trim();

function buildReviewRequest(meetingFactPack, evidenceResult, historyBundle) {
  return {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    preliminary_result: evidenceResult.meeting_preliminary_result,
    statement_checks: evidenceResult.statement_checks || [],
    history_meetings: historyBundle.history_meetings || [],
    history_signals: {
      task_closure_notes: historyBundle.task_closure_notes || [],
      risk_notes: historyBundle.risk_notes || []
    }
  };
}

async function reviewMeeting(request) {
  return callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
}

module.exports = {
  buildReviewRequest,
  reviewMeeting
};

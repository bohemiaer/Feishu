"use strict";

const { callJsonModel } = require("../llm/client");

const SYSTEM_PROMPT = `
你是 Evidence Verifier。你只负责对项目型中层负责人在当前周会中的关键发言做证据校验。

输入中已经提供：
1. 当前会议的管理者关键发言
2. 当前项目的任务、风险、项目主文档、周报、复盘摘要

你的输出必须是严格 JSON，并且只包含这些字段：
{
  "meeting_id": "",
  "project_id": "",
  "statement_checks": [
    {
      "statement_id": "",
      "statement_summary": "",
      "judgement": "有依据",
      "confidence": 0.0,
      "supporting_evidence": [],
      "conflict_evidence": []
    }
  ],
  "meeting_preliminary_result": {
    "supported_ratio": 0.0,
    "conflict_count": 0,
    "high_risk_flag": false,
    "summary": ""
  }
}

判断口径：
- 有依据：发言核心内容能被任务、风险、文档直接支持
- 部分有依据：只有部分关键点被支持
- 无依据：当前材料无法支持该发言
- 与事实冲突：发言与现有任务、风险或文档形成明确冲突

要求：
- 只基于输入材料判断
- 不引用外部知识
- 不做跨会议判断
- judgement 只能是：有依据、部分有依据、无依据、与事实冲突
- confidence 范围 0 到 1
- supporting_evidence 和 conflict_evidence 只写简短证据摘录
`.trim();

function collectEvidenceTexts(request) {
  return {
    tasks: request.evidence_pool.tasks || [],
    risks: request.evidence_pool.risks || [],
    documents: request.evidence_pool.documents || {}
  };
}

function buildEvidenceRequest(meetingFactPack) {
  return {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    statements: (meetingFactPack.meeting_facts.manager_speech_summary || []).map((statement, index) => ({
      statement_id: `stmt-${index + 1}`,
      statement_summary: statement
    })),
    evidence_pool: {
      tasks: meetingFactPack.project_snapshot.open_tasks || [],
      risks: meetingFactPack.project_snapshot.open_risks || [],
      documents: meetingFactPack.document_snapshot
    },
    metrics: meetingFactPack.metrics
  };
}

async function verifyEvidence(request) {
  const promptPayload = {
    meeting_id: request.meeting_id,
    project_id: request.project_id,
    statements: request.statements,
    evidence_pool: collectEvidenceTexts(request),
    metrics: request.metrics
  };

  return callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(promptPayload, null, 2),
    temperature: 0.2
  });
}

module.exports = {
  buildEvidenceRequest,
  verifyEvidence
};

"use strict";

const { callJsonModel } = require("../llm/client");

const CASE04_SYSTEM_PROMPT = `
你是 Report Writer，负责把结构化评估结果转写为飞书文档、消息和 Base 回写载荷。

你的职责：
- 把 Capability Assessor 的五维能力结论转写为管理者可读报告
- 整理报告标题、摘要、五维表现概览、关键证据、风险提示、人审项和下周期动作
- 生成 Base 回写建议字段
- 保留降级、阻断、人审状态和证据链

输入边界：
- 只使用 capability_assessor_result、evaluation_plan、hard_metrics_result、meeting_fact_pack、human_review_items
- 不直接读取原始聊天、会议转写或云文档
- 如果 Capability Assessor 未完成或 blocked，不得生成正式报告内容

禁止事项：
- 不新增事实
- 不修改评分、置信度或人审状态
- 不输出人事处分、人格判断或攻击性语言
- 不把待复核内容写成已确认事实

输出必须是严格 JSON，并且只包含：
{
  "report_status": "ready|degraded|blocked",
  "report_title": "",
  "manager_id": "",
  "project_id": "",
  "report_type": "weekly_report",
  "summary": "",
  "score_overview": [],
  "key_evidence": [],
  "risk_alerts": [],
  "human_review_items": [],
  "next_actions": [],
  "base_writeback_payload": {},
  "missing_upstream_results": []
}

硬性证据要求：
- score_overview、key_evidence、risk_alerts、next_actions 中每一条都必须包含 evidence_refs
- evidence_refs 不得只写 ID；必须包含 source_type、source_file、source_id、timestamp、excerpt、evidence_note
- excerpt 必须是输入原文、专家 finding 原文或硬指标 calculation.expression，不得改写成无法追溯的总结
- 风险提示必须引用风险表、聊天原文、会议留痕或 hard_metrics 公式中的至少一种
`.trim();

function collectHumanReviewItems(items) {
  return items.flatMap((item) =>
    item && Array.isArray(item.human_review_items) ? item.human_review_items : []
  );
}

function normalizeEvidenceRefs(refs) {
  return (Array.isArray(refs) ? refs : []).map((ref) => {
    if (typeof ref === "string") {
      return {
        source_type: "unresolved_ref",
        source_file: "",
        source_id: ref,
        timestamp: "",
        excerpt: ref,
        evidence_note: "Model returned an unresolved evidence reference."
      };
    }
    return {
      source_type: ref.source_type || "",
      source_file: ref.source_file || "",
      source_id: ref.source_id || ref.id || "",
      timestamp: ref.timestamp || "",
      excerpt: ref.excerpt || ref.original_text || ref.quote || "",
      evidence_note: ref.evidence_note || ref.note || ""
    };
  });
}

function normalizeReportItem(item, fallbackPrefix) {
  if (typeof item === "string") {
    return {
      content: item,
      evidence_refs: []
    };
  }

  const content = item.content ||
    item.description ||
    item.evidence ||
    item.action ||
    item.summary ||
    [item.dimension, item.level, item.score].filter(Boolean).join(" ");

  return {
    ...item,
    content: content || fallbackPrefix,
    evidence_refs: normalizeEvidenceRefs(item.evidence_refs || [])
  };
}

function normalizeReportResult(result) {
  return {
    report_status: result.report_status || "degraded",
    report_title: result.report_title || "",
    manager_id: result.manager_id || "",
    project_id: result.project_id || "",
    report_type: result.report_type || "weekly_report",
    summary: result.summary || "",
    score_overview: (Array.isArray(result.score_overview) ? result.score_overview : [])
      .map((item) => normalizeReportItem(item, "score_overview")),
    key_evidence: (Array.isArray(result.key_evidence) ? result.key_evidence : [])
      .map((item) => normalizeReportItem(item, "key_evidence")),
    risk_alerts: (Array.isArray(result.risk_alerts) ? result.risk_alerts : [])
      .map((item) => normalizeReportItem(item, "risk_alert")),
    human_review_items: Array.isArray(result.human_review_items) ? result.human_review_items : [],
    next_actions: (Array.isArray(result.next_actions) ? result.next_actions : [])
      .map((item) => normalizeReportItem(item, "next_action")),
    base_writeback_payload: result.base_writeback_payload || {},
    missing_upstream_results: Array.isArray(result.missing_upstream_results) ? result.missing_upstream_results : []
  };
}

function buildCase04ReportRequest({
  meetingFactPack,
  hardMetricsResult,
  evaluationPlan,
  capabilityAssessorResult,
  managementReviewerResult,
  riskBehaviorAuditorResult,
  coordinationLensResult
}) {
  const missing = [];
  if (!capabilityAssessorResult) {
    missing.push("capability_assessor_result");
  } else if (capabilityAssessorResult.assessment_status === "blocked") {
    missing.push("capability_assessor_result_ready");
  }

  return {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    manager_name: meetingFactPack.meeting_info.manager_name,
    input_status: {
      readiness: missing.length > 0 ? "blocked" : "ready",
      missing_upstream_results: missing
    },
    capability_assessor_result: capabilityAssessorResult || null,
    expert_summaries: {
      management_review_summary: managementReviewerResult
        ? managementReviewerResult.management_review_summary || ""
        : "",
      risk_behavior_summary: riskBehaviorAuditorResult
        ? riskBehaviorAuditorResult.risk_behavior_summary || ""
        : "",
      coordination_summary: coordinationLensResult
        ? coordinationLensResult.coordination_summary || ""
        : ""
    },
    evaluation_plan: evaluationPlan,
    hard_metrics_result: hardMetricsResult,
    meeting_fact_pack: {
      meeting_info: meetingFactPack.meeting_info,
      task_context: meetingFactPack.task_context,
      provenance_refs: meetingFactPack.provenance_refs,
      missing_fields: meetingFactPack.missing_fields
    },
    human_review_items: collectHumanReviewItems([
      capabilityAssessorResult,
      managementReviewerResult,
      riskBehaviorAuditorResult,
      coordinationLensResult
    ])
  };
}

async function writeCase04Report(request) {
  if (request.input_status && request.input_status.readiness === "blocked") {
    return {
      report_status: "blocked",
      report_title: "",
      manager_id: request.manager_id,
      project_id: request.project_id,
      report_type: "weekly_report",
      summary: "Report generation is blocked because the capability assessment is not ready.",
      score_overview: [],
      key_evidence: [],
      risk_alerts: [],
      human_review_items: request.human_review_items || [],
      next_actions: [],
      base_writeback_payload: {},
      missing_upstream_results: request.input_status.missing_upstream_results
    };
  }

  const result = await callJsonModel({
    systemPrompt: CASE04_SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.3
  });
  return normalizeReportResult(result);
}

module.exports = {
  CASE04_SYSTEM_PROMPT,
  buildCase04ReportRequest,
  writeCase04Report
};

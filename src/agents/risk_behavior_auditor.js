"use strict";

const { callJsonModel } = require("../llm/client");
const { assertArtifactValid } = require("../shared/schema_validation");

const SYSTEM_PROMPT = `
你是 Risk & Behavior Auditor，负责风险治理力与组织行为健康度审计。

你的职责：
- 识别风险表述、预警动作、阻塞升级、缓释动作和复发线索
- 对照风险表、周报、复盘、聊天历史和历史会议，判断风险是否被提前识别并形成治理动作
- 审计组织行为健康度中的高风险语言、公开负向反馈、深夜高压催办、重复催办和会议空转
- 只输出风险治理力与组织行为健康度相关 findings

禁止事项：
- 不输出最终五维评分
- 不输出人事建议、绩效判断或处分建议
- 不把关键词命中直接等同于组织行为结论
- 不评估方向校准力、推进闭环力或协同调度力

输出必须是严格 JSON，并且只包含：
{
  "meeting_id": "",
  "project_id": "",
  "manager_id": "",
  "dimension_findings": [],
  "soft_indicators": [
    {
      "indicator_id": "",
      "dimension": "风险治理力",
      "label": "",
      "score": 0,
      "confidence": 0.0,
      "score_basis": "",
      "evidence_refs": [
        {
          "source_type": "",
          "source_file": "",
          "source_id": "",
          "timestamp": "",
          "excerpt": "",
          "evidence_note": ""
        }
      ],
      "limitations": []
    }
  ],
  "risk_flags": [
    {
      "flag_id": "",
      "flag_type": "risk_governance|behavior_observation",
      "severity": "medium",
      "summary": "",
      "evidence_refs": [
        {
          "source_type": "",
          "source_file": "",
          "source_id": "",
          "timestamp": "",
          "excerpt": "",
          "evidence_note": ""
        }
      ],
      "confidence": 0.0,
      "requires_human_review": true
    }
  ],
  "human_review_items": [],
  "risk_behavior_summary": ""
}

硬性证据要求：
- 你必须先为风险治理力、组织行为健康度计算 2-4 个 soft_indicators，再输出 findings 和 risk_flags
- 你必须输出 8 个 PRD 对齐的 soft_indicators，indicator_id 固定为：
  - high_risk_identification_coverage_rate
  - risk_escalation_timeliness_rate
  - similar_risk_recurrence_rate
  - high_risk_language_trigger_frequency
  - public_negative_feedback_ratio
  - late_night_high_pressure_urging_ratio
  - repeated_urging_rate
  - meeting_idle_churn_rate
- risk_mitigation_action_rate 由硬指标层直接提供，不要在 soft_indicators 里重复生成
- soft_indicators 是专家根据多条证据归纳出的 PRD 指标结果，不得复写 hard_metrics 中已有 metric_id
- 每个 soft_indicator 都要给出 value、unit、status、score
- value 要尽量贴近 PRD 原始口径，例如 ratio、count
- score 是为了后续总评估而做的 0-100 归一化分
- dimension_findings、risk_flags、human_review_items 中每一条都必须至少包含 1 条 evidence_refs
- evidence_refs 不得只写 ID；必须包含 source_type、source_file、source_id、timestamp、excerpt、evidence_note
- excerpt 必须引用输入原文或硬指标计算表达式，不得写成二次总结
- 如果引用 hard_metrics，evidence_note 必须写明 metric_id、formula、calculation.expression、value
- 组织行为健康度结论必须引用原始聊天文本 excerpt，并说明只是观察项还是需人审
`.trim();

function flattenMetrics(hardMetricsResult) {
  const grouped = hardMetricsResult && hardMetricsResult.hard_metrics_result
    ? hardMetricsResult.hard_metrics_result
    : {};
  return Object.values(grouped).flatMap((items) => Array.isArray(items) ? items : []);
}

function selectMetrics(hardMetricsResult) {
  const allowed = new Set([
    "high_risk_resolution_rate",
    "risk_mitigation_action_rate",
    "open_risk_rate",
    "repeated_risk_type_count",
    "late_night_manager_message_rate",
    "high_pressure_language_sample_rate"
  ]);
  return flattenMetrics(hardMetricsResult).filter((metric) => allowed.has(metric.metric_id));
}

function selectPlannerSlice(evaluationPlan) {
  const focus = evaluationPlan && evaluationPlan.evaluation_focus
    ? evaluationPlan.evaluation_focus.focus_dimensions || []
    : [];
  const assignedPlan = evaluationPlan && evaluationPlan.execution_plan
    ? (evaluationPlan.execution_plan.agent_plan || []).find((item) => item.agent_name === "Risk & Behavior Auditor")
    : null;
  const humanReviewRules = evaluationPlan && Array.isArray(evaluationPlan.human_review_rules)
    ? evaluationPlan.human_review_rules.filter((rule) =>
      (rule.target_nodes || []).includes("Risk & Behavior Auditor")
    )
    : [];

  return {
    focus_dimensions: focus.filter((item) => ["风险治理力", "组织行为健康度"].includes(item.dimension)),
    assigned_plan: assignedPlan,
    human_review_rules: humanReviewRules
  };
}

function buildRiskBehaviorAuditRequest({
  meetingFactPack,
  historyBundle,
  hardMetricsResult,
  rawPayload,
  evaluationPlan
}) {
  const raw = rawPayload && rawPayload.raw_payload ? rawPayload.raw_payload : {};

  return assertArtifactValid("risk_behavior_auditor_request", {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    manager_name: meetingFactPack.meeting_info.manager_name,
    planner_slice: selectPlannerSlice(evaluationPlan),
    current_meeting: {
      meeting_info: meetingFactPack.meeting_info,
      risks_mentioned: meetingFactPack.meeting_facts.risks_mentioned,
      decisions: meetingFactPack.meeting_facts.decisions,
      noise_signals: meetingFactPack.meeting_facts.noise_signals,
      missing_fields: meetingFactPack.missing_fields,
      provenance_refs: meetingFactPack.provenance_refs
    },
    risk_context: {
      open_risks: meetingFactPack.project_snapshot.open_risks,
      all_risks: meetingFactPack.project_snapshot.all_risks,
      risk_history: historyBundle.risk_history || [],
      risk_notes: historyBundle.risk_notes || [],
      review_highlights: meetingFactPack.document_snapshot.review_highlights
    },
    behavior_context: {
      chat_history: raw.chat_history || [],
      calendar_events: raw.calendar_events || [],
      org_contacts: raw.org_contacts || []
    },
    hard_metrics: selectMetrics(hardMetricsResult),
    metric_quality_report: hardMetricsResult.metric_quality_report,
    anomaly_samples: (hardMetricsResult.anomaly_samples || []).filter((item) =>
      [
        "open_risk_rate",
        "repeated_risk_type_count",
        "high_pressure_language_sample_rate",
        "late_night_manager_message_rate"
      ].includes(item.metric_id)
    )
  });
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

function normalizeRiskBehaviorDimension(value, fallbackDimension) {
  if (value === "风险治理力" || value === "组织行为健康度") {
    return value;
  }
  const text = String(value || "");
  if (/风险|治理|缓释|升级|收口/.test(text)) {
    return "风险治理力";
  }
  if (/行为|健康|语言|高压|深夜/.test(text)) {
    return "组织行为健康度";
  }
  return fallbackDimension;
}

function placeholderEvidenceRef(text) {
  return {
    source_type: "unresolved_ref",
    source_file: "",
    source_id: "manual_review_required",
    timestamp: "",
    excerpt: text || "manual_review_required",
    evidence_note: "No structured evidence ref was returned by the model; manual review required."
  };
}

function ensureEvidenceRefs(refs, fallbackText) {
  return Array.isArray(refs) && refs.length > 0
    ? refs
    : [placeholderEvidenceRef(fallbackText)];
}

function normalizeFinding(item, index, riskFlags) {
  if (typeof item === "string") {
    return {
      dimension: item.includes("组织行为") ? "组织行为健康度" : "风险治理力",
      finding_type: "observation",
      summary: item,
      evidence_refs: ensureEvidenceRefs(
        normalizeEvidenceRefs(riskFlags.flatMap((flag) => flag.evidence_refs || [])).slice(0, 3),
        item
      ),
      confidence: 0.6,
      risk_tags: [],
      suggested_actions: []
    };
  }

  return {
    dimension: normalizeRiskBehaviorDimension(
      item.dimension,
      index === 1 ? "组织行为健康度" : "风险治理力"
    ),
    finding_type: item.finding_type || item.type || "observation",
    summary: item.summary || item.finding || item.description || "",
    evidence_refs: ensureEvidenceRefs(
      normalizeEvidenceRefs(item.evidence_refs || []),
      item.summary || item.finding || item.description || ""
    ),
    confidence: typeof item.confidence === "number" ? item.confidence : 0.7,
    risk_tags: Array.isArray(item.risk_tags) ? item.risk_tags : [],
    suggested_actions: Array.isArray(item.suggested_actions) ? item.suggested_actions : []
  };
}

function normalizeSoftIndicator(item, fallbackDimension) {
  const score = typeof item.score === "number" ? Math.round(item.score) : 0;
  const resolvedValue = item.value === undefined || item.value === null ? score : item.value;
  return {
    indicator_id: item.indicator_id || item.id || "",
    dimension: normalizeRiskBehaviorDimension(item.dimension, fallbackDimension),
    label: item.label || item.name || "",
    value: resolvedValue,
    unit: item.unit || "score",
    status: item.status || "degraded",
    score,
    confidence: typeof item.confidence === "number" ? item.confidence : 0.7,
    score_basis: item.score_basis || item.summary || "",
    evidence_refs: ensureEvidenceRefs(
      normalizeEvidenceRefs(item.evidence_refs || []),
      item.score_basis || item.summary || item.label || ""
    ),
    limitations: Array.isArray(item.limitations) ? item.limitations : []
  };
}

function normalizeHumanReviewItem(item, flagsById) {
  const relatedFlagIds = item.related_flag_ids || item.related_flags || [];
  const evidenceRefs = normalizeEvidenceRefs(item.evidence_refs || []);
  const fallbackRefs = relatedFlagIds.flatMap((flagId) =>
    flagsById.get(flagId) ? flagsById.get(flagId).evidence_refs || [] : []
  );

  return {
    review_id: item.review_id || item.item_id || item.id || "",
    reason: item.reason || item.review_reason || "",
    severity: item.severity || "medium",
    related_dimension: normalizeRiskBehaviorDimension(
      item.related_dimension,
      relatedFlagIds.some((flagId) => /^BF/.test(flagId)) ? "组织行为健康度" : "风险治理力"
    ),
    evidence_refs: ensureEvidenceRefs(
      evidenceRefs.length > 0 ? evidenceRefs : normalizeEvidenceRefs(fallbackRefs).slice(0, 3),
      item.reason || item.review_reason || ""
    )
  };
}

function normalizeRiskBehaviorResult(result) {
  const riskFlags = (Array.isArray(result.risk_flags) ? result.risk_flags : []).map((flag) => ({
    flag_id: flag.flag_id || flag.id || "",
    flag_type: flag.flag_type || "risk_governance",
    severity: flag.severity || "medium",
    summary: flag.summary || flag.description || "",
    evidence_refs: ensureEvidenceRefs(
      normalizeEvidenceRefs(flag.evidence_refs || []),
      flag.summary || flag.description || ""
    ),
    confidence: typeof flag.confidence === "number" ? flag.confidence : 0.7,
    requires_human_review: flag.requires_human_review !== false
  }));
  const flagsById = new Map(riskFlags.map((flag) => [flag.flag_id, flag]));

  return {
    meeting_id: result.meeting_id || "",
    project_id: result.project_id || "",
    manager_id: result.manager_id || "",
    dimension_findings: (Array.isArray(result.dimension_findings) ? result.dimension_findings : [])
      .map((item, index) => normalizeFinding(item, index, riskFlags)),
    soft_indicators: (Array.isArray(result.soft_indicators) ? result.soft_indicators : [])
      .map((item) => normalizeSoftIndicator(item, item.dimension || "风险治理力")),
    risk_flags: riskFlags,
    human_review_items: (Array.isArray(result.human_review_items) ? result.human_review_items : [])
      .map((item) => normalizeHumanReviewItem(item, flagsById)),
    risk_behavior_summary: result.risk_behavior_summary || ""
  };
}

async function auditRiskBehavior(request) {
  const result = await callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
  return assertArtifactValid("risk_behavior_auditor_result", normalizeRiskBehaviorResult(result), {
    stage: "post_model"
  });
}

module.exports = {
  SYSTEM_PROMPT,
  auditRiskBehavior,
  buildRiskBehaviorAuditRequest
};

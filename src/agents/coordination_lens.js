"use strict";

const { callJsonModel } = require("../llm/client");
const { assertArtifactValid } = require("../shared/schema_validation");

const SYSTEM_PROMPT = `
你是 Coordination Lens，负责协同调度力专项判断。

你的职责：
- 判断跨角色响应是否为有效响应，而不是简单“收到/已读”
- 判断关键里程碑、范围变化、风险升级是否同步到必要干系人
- 判断依赖澄清是否明确责任方、配合方和下一步动作
- 判断协同阻塞是否解除，或是否形成被相关方确认的解决路径
- 只输出协同调度力相关 findings 和人工复核项

禁止事项：
- 不评价组织行为健康度
- 不把参会人数多直接等同于协同有效
- 不把单条“收到”当作有效响应

输出必须是严格 JSON，并且只包含：
{
  "meeting_id": "",
  "project_id": "",
  "manager_id": "",
  "dimension_findings": [
    {
      "dimension": "协同调度力",
      "finding_type": "strength|risk|observation|no_sample",
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
      "risk_tags": [],
      "suggested_actions": []
    }
  ],
  "soft_indicators": [
    {
      "indicator_id": "",
      "dimension": "协同调度力",
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
  "human_review_items": [
    {
      "review_id": "",
      "reason": "",
      "severity": "medium",
      "related_dimension": "协同调度力",
      "evidence_refs": [
        {
          "source_type": "",
          "source_file": "",
          "source_id": "",
          "timestamp": "",
          "excerpt": "",
          "evidence_note": ""
        }
      ]
    }
  ],
  "coordination_summary": ""
}

硬性证据要求：
- 你必须先为协同调度力计算 2-3 个 soft_indicators，再输出 findings
- 你必须输出 4 个 PRD 对齐的 soft_indicators，indicator_id 固定为：
  - cross_role_effective_response_time
  - key_milestone_sync_rate
  - dependency_clarification_time
  - blocker_resolution_success_rate
- soft_indicators 是专家根据多条证据归纳出的 PRD 指标结果，不得复写 hard_metrics 中已有 metric_id
- 每个 soft_indicator 都要给出 value、unit、status、score
- value 要尽量贴近 PRD 原始口径，例如 minutes、hours、days、ratio
- score 是为了后续总评估而做的 0-100 归一化分
- 每一条 dimension_findings 和 human_review_items 都必须至少包含 1 条 evidence_refs
- evidence_refs 不得只写 ID；必须包含 source_type、source_file、source_id、timestamp、excerpt、evidence_note
- excerpt 必须引用输入原文或硬指标计算表达式，不得写成二次总结
- 如果引用 hard_metrics，evidence_note 必须写明 metric_id、formula、calculation.expression、value
`.trim();

function flattenMetrics(hardMetricsResult) {
  const grouped = hardMetricsResult && hardMetricsResult.hard_metrics_result
    ? hardMetricsResult.hard_metrics_result
    : {};
  return Object.values(grouped).flatMap((items) => Array.isArray(items) ? items : []);
}

function selectMetrics(hardMetricsResult) {
  const allowed = new Set([
    "calendar_stakeholder_coverage_rate",
    "manager_chat_signal_count"
  ]);
  return flattenMetrics(hardMetricsResult).filter((metric) => allowed.has(metric.metric_id));
}

function selectPlannerSlice(evaluationPlan) {
  const focus = evaluationPlan && evaluationPlan.evaluation_focus
    ? evaluationPlan.evaluation_focus.focus_dimensions || []
    : [];
  const assignedPlan = evaluationPlan && evaluationPlan.execution_plan
    ? (evaluationPlan.execution_plan.agent_plan || []).find((item) => item.agent_name === "Coordination Lens")
    : null;
  const humanReviewRules = evaluationPlan && Array.isArray(evaluationPlan.human_review_rules)
    ? evaluationPlan.human_review_rules.filter((rule) =>
      (rule.target_nodes || []).includes("Coordination Lens")
    )
    : [];

  return {
    focus_dimensions: focus.filter((item) => item.dimension === "协同调度力"),
    assigned_plan: assignedPlan,
    human_review_rules: humanReviewRules
  };
}

function buildCoordinationLensRequest({
  meetingFactPack,
  hardMetricsResult,
  rawPayload,
  evaluationPlan
}) {
  const raw = rawPayload && rawPayload.raw_payload ? rawPayload.raw_payload : {};

  return assertArtifactValid("coordination_lens_request", {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    manager_name: meetingFactPack.meeting_info.manager_name,
    planner_slice: selectPlannerSlice(evaluationPlan),
    current_meeting: {
      meeting_info: meetingFactPack.meeting_info,
      decisions: meetingFactPack.meeting_facts.decisions,
      action_items: meetingFactPack.meeting_facts.action_items,
      risks_mentioned: meetingFactPack.meeting_facts.risks_mentioned,
      provenance_refs: meetingFactPack.provenance_refs
    },
    coordination_context: {
      tasks: meetingFactPack.project_snapshot.all_tasks || meetingFactPack.project_snapshot.open_tasks,
      risks: meetingFactPack.project_snapshot.all_risks || meetingFactPack.project_snapshot.open_risks,
      chat_history: raw.chat_history || [],
      calendar_events: raw.calendar_events || [],
      org_contacts: raw.org_contacts || []
    },
    hard_metrics: selectMetrics(hardMetricsResult),
    metric_quality_report: hardMetricsResult.metric_quality_report
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

function normalizeCoordinationDimension(value) {
  return value === "协同调度力" ? value : "协同调度力";
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

function normalizeFinding(item) {
  return {
    dimension: normalizeCoordinationDimension(item.dimension),
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

function normalizeSoftIndicator(item) {
  const score = typeof item.score === "number" ? Math.round(item.score) : 0;
  const resolvedValue = item.value === undefined || item.value === null ? score : item.value;
  return {
    indicator_id: item.indicator_id || item.id || "",
    dimension: normalizeCoordinationDimension(item.dimension),
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

function normalizeHumanReviewItem(item) {
  return {
    review_id: item.review_id || item.id || "",
    reason: item.reason || item.review_reason || "",
    severity: item.severity || "medium",
    related_dimension: normalizeCoordinationDimension(item.related_dimension),
    evidence_refs: ensureEvidenceRefs(
      normalizeEvidenceRefs(item.evidence_refs || []),
      item.reason || item.review_reason || ""
    )
  };
}

function normalizeCoordinationResult(result) {
  return {
    meeting_id: result.meeting_id || "",
    project_id: result.project_id || "",
    manager_id: result.manager_id || "",
    dimension_findings: (Array.isArray(result.dimension_findings) ? result.dimension_findings : []).map(normalizeFinding),
    soft_indicators: (Array.isArray(result.soft_indicators) ? result.soft_indicators : []).map(normalizeSoftIndicator),
    human_review_items: (Array.isArray(result.human_review_items) ? result.human_review_items : []).map(normalizeHumanReviewItem),
    coordination_summary: result.coordination_summary || ""
  };
}

async function reviewCoordination(request) {
  const result = await callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
  return assertArtifactValid("coordination_lens_result", normalizeCoordinationResult(result), {
    stage: "post_model"
  });
}

module.exports = {
  SYSTEM_PROMPT,
  buildCoordinationLensRequest,
  reviewCoordination
};

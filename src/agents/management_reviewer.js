"use strict";

const { callJsonModel } = require("../llm/client");
const { assertArtifactValid } = require("../shared/schema_validation");

const SYSTEM_PROMPT = `
你是 Management Reviewer，负责方向校准力与推进闭环力评审。

你的职责：
- 分析管理者是否围绕项目目标、范围、优先级和关键约束做出清晰判断
- 分析会议结论是否沉淀为 owner、DDL、动作和后续跟踪
- 结合历史会议检查方向是否反复、闭环是否断裂、行动项是否持续推进
- 只能输出方向校准力和推进闭环力相关 findings

禁止事项：
- 不评估风险治理力、协同调度力或组织行为健康度
- 不输出最终五维评分
- 不输出人事建议
- 不把硬指标异常直接写成最终管理结论

输出必须是严格 JSON，并且只包含：
{
  "meeting_id": "",
  "project_id": "",
  "manager_id": "",
  "dimension_findings": [
    {
      "dimension": "方向校准力",
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
      "dimension": "方向校准力",
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
      "related_dimension": "",
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
  "management_review_summary": ""
}

要求：
- 只使用输入中提供的事实、指标和证据引用
- 你必须先为本职责范围内的维度计算 2-4 个 soft_indicators，再输出 dimension_findings
- soft_indicators 是专家根据多条证据归纳出的软指标，不得复写 hard_metrics 中已有 metric_id
- soft_indicators 要服务于后续总评估，评分范围 0-100，且 score_basis 必须说明它如何结合事实和硬指标
- 每一条 finding 和 human_review_item 都必须至少包含 1 条 evidence_refs
- evidence_refs 不得只写 ID；必须包含 source_type、source_file、source_id、timestamp、excerpt、evidence_note
- excerpt 必须是输入中的原文片段或硬指标计算表达式，不得改写成自己的总结
- 如果引用 hard_metrics，evidence_note 必须写明 metric_id、formula、calculation.expression、value
- 当前会议缺完整妙记转写时，不得输出高确定性方向判断
- 行动项数量与任务表关联明显不一致时，必须生成 human_review_items
- confidence 范围 0 到 1
`.trim();

function flattenMetrics(hardMetricsResult) {
  const grouped = hardMetricsResult && hardMetricsResult.hard_metrics_result
    ? hardMetricsResult.hard_metrics_result
    : {};
  return Object.values(grouped).flatMap((items) => Array.isArray(items) ? items : []);
}

function selectMetrics(hardMetricsResult) {
  const allowed = new Set([
    "meeting_decision_coverage_rate",
    "task_definition_completeness_rate",
    "task_overdue_rate",
    "task_closure_rate",
    "closed_task_quality_rate",
    "current_meeting_action_task_rate",
    "meeting_action_item_coverage_rate"
  ]);
  return flattenMetrics(hardMetricsResult).filter((metric) => allowed.has(metric.metric_id));
}

function selectPlannerSlice(evaluationPlan) {
  const focus = evaluationPlan && evaluationPlan.evaluation_focus
    ? evaluationPlan.evaluation_focus.focus_dimensions || []
    : [];
  const assignedPlan = evaluationPlan && evaluationPlan.execution_plan
    ? (evaluationPlan.execution_plan.agent_plan || []).find((item) => item.agent_name === "Management Reviewer")
    : null;
  const humanReviewRules = evaluationPlan && Array.isArray(evaluationPlan.human_review_rules)
    ? evaluationPlan.human_review_rules.filter((rule) =>
      (rule.target_nodes || []).includes("Management Reviewer")
    )
    : [];

  return {
    focus_dimensions: focus.filter((item) => ["方向校准力", "推进闭环力"].includes(item.dimension)),
    assigned_plan: assignedPlan,
    human_review_rules: humanReviewRules
  };
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

function normalizeManagementDimension(value, fallbackDimension) {
  if (value === "方向校准力" || value === "推进闭环力") {
    return value;
  }
  const text = String(value || "");
  if (/方向|校准|优先级|范围/.test(text)) {
    return "方向校准力";
  }
  if (/闭环|任务|行动项|推进/.test(text)) {
    return "推进闭环力";
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

function normalizeSoftIndicator(item, fallbackDimension) {
  return {
    indicator_id: item.indicator_id || item.id || "",
    dimension: normalizeManagementDimension(item.dimension, fallbackDimension),
    label: item.label || item.name || "",
    score: typeof item.score === "number" ? Math.round(item.score) : 0,
    confidence: typeof item.confidence === "number" ? item.confidence : 0.7,
    score_basis: item.score_basis || item.summary || "",
    evidence_refs: ensureEvidenceRefs(
      normalizeEvidenceRefs(item.evidence_refs || []),
      item.score_basis || item.summary || item.label || ""
    ),
    limitations: Array.isArray(item.limitations) ? item.limitations : []
  };
}

function normalizeFinding(item, fallbackDimension) {
  return {
    dimension: normalizeManagementDimension(item.dimension, fallbackDimension),
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

function normalizeHumanReviewItem(item, fallbackDimension) {
  return {
    review_id: item.review_id || item.id || "",
    reason: item.reason || item.review_reason || "",
    severity: item.severity || "medium",
    related_dimension: normalizeManagementDimension(item.related_dimension, fallbackDimension),
    evidence_refs: ensureEvidenceRefs(
      normalizeEvidenceRefs(item.evidence_refs || []),
      item.reason || item.review_reason || ""
    )
  };
}

function normalizeManagementReviewResult(result) {
  return {
    meeting_id: result.meeting_id || "",
    project_id: result.project_id || "",
    manager_id: result.manager_id || "",
    dimension_findings: (Array.isArray(result.dimension_findings) ? result.dimension_findings : []).map((item) =>
      normalizeFinding(item, normalizeManagementDimension(item.dimension, "推进闭环力"))
    ),
    soft_indicators: (Array.isArray(result.soft_indicators) ? result.soft_indicators : []).map((item) =>
      normalizeSoftIndicator(item, normalizeManagementDimension(item.dimension, "推进闭环力"))
    ),
    human_review_items: (Array.isArray(result.human_review_items) ? result.human_review_items : []).map((item) =>
      normalizeHumanReviewItem(item, normalizeManagementDimension(item.related_dimension, "推进闭环力"))
    ),
    management_review_summary: result.management_review_summary || ""
  };
}

function buildManagementReviewRequest({
  meetingFactPack,
  historyBundle,
  hardMetricsResult,
  evaluationPlan
}) {
  return assertArtifactValid("management_reviewer_request", {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    manager_name: meetingFactPack.meeting_info.manager_name,
    planner_slice: selectPlannerSlice(evaluationPlan),
    current_meeting: {
      meeting_info: meetingFactPack.meeting_info,
      meeting_facts: meetingFactPack.meeting_facts,
      missing_fields: meetingFactPack.missing_fields,
      provenance_refs: meetingFactPack.provenance_refs
    },
    project_context: {
      project_snapshot: meetingFactPack.project_snapshot,
      document_snapshot: meetingFactPack.document_snapshot
    },
    history_context: {
      recent_meetings: historyBundle.recent_meetings || [],
      history_meetings: historyBundle.history_meetings || [],
      task_closure_notes: historyBundle.task_closure_notes || []
    },
    hard_metrics: selectMetrics(hardMetricsResult),
    metric_quality_report: hardMetricsResult.metric_quality_report,
    anomaly_samples: (hardMetricsResult.anomaly_samples || []).filter((item) =>
      [
        "task_overdue_rate",
        "current_meeting_action_task_rate",
        "meeting_action_item_coverage_rate"
      ].includes(item.metric_id)
    )
  });
}

async function reviewManagement(request) {
  const result = await callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
  return assertArtifactValid("management_reviewer_result", normalizeManagementReviewResult(result), {
    stage: "post_model"
  });
}

module.exports = {
  SYSTEM_PROMPT,
  buildManagementReviewRequest,
  reviewManagement
};

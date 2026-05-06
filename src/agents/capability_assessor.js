"use strict";

const { callJsonModel } = require("../llm/client");
const { assertArtifactValid } = require("../shared/schema_validation");

const CASE04_SYSTEM_PROMPT = `
你是 Capability Assessor，负责把专家 Agent 产出的结构化 findings 收敛为五维管理能力评估。

你的职责：
- 汇总 Management Reviewer、Risk & Behavior Auditor、Coordination Lens 的 findings
- 汇总三个专家先行计算出的 soft_indicators，并结合 Hard Metrics Engine 的确定性指标输出五个维度的能力分、置信度和解释
- 识别哪些维度因样本不足、证据冲突或人审未完成而需要降级
- 保留所有人工复核项，不替代 Human/Admin 做最终签字

五个维度：
- 方向校准力
- 推进闭环力
- 风险治理力
- 协同调度力
- 组织行为健康度

输入边界：
- 只使用上游传入的 expert_results、hard_metrics、quality_context、planner_slice
- 如果任一必需专家结果缺失，不得输出评分，只能返回 blocked 状态和 missing_upstream_results
- 不直接重新阅读原始聊天、文档或会议转写

禁止事项：
- 不新增事实
- 不把单个硬指标机械等同于最终分数
- 不输出人事建议、绩效处分建议或人格判断
- 不覆盖专家 Agent 已标记的人审项

输出必须是严格 JSON，并且只包含：
{
  "meeting_id": "",
  "project_id": "",
  "manager_id": "",
  "assessment_status": "ready|degraded|blocked",
  "dimension_scores": [
    {
      "dimension": "方向校准力",
      "score": 0,
      "confidence": 0.0,
      "score_basis": "",
      "supporting_finding_refs": [],
      "supporting_metric_refs": [],
      "supporting_soft_indicator_refs": [],
      "evidence_quotes": [
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
  "overall_assessment": {
    "overall_score": 0,
    "top_strengths": [],
    "top_risks": [],
    "confidence": 0.0,
    "summary": ""
  },
  "human_review_items": [],
  "missing_upstream_results": []
}

硬性证据要求：
- 每一个 dimension_score 都必须包含 evidence_quotes，且至少包含 1 条专家 finding、soft_indicator 或硬指标证据
- evidence_quotes 不得只写 ID；必须包含 source_type、source_file、source_id、timestamp、excerpt、evidence_note
- excerpt 必须引用输入原文、专家原始 finding 摘要或硬指标 calculation.expression，不得新增事实
- 你必须显式消费专家的 soft_indicators，不能只看 findings 和 hard_metrics
- supporting_metric_refs 引用硬指标时，score_basis 必须体现公式含义，而不是只写指标名
- supporting_soft_indicator_refs 引用软指标时，score_basis 必须说明软指标与硬指标如何共同支撑该维度评分
- assessment_status 为 degraded 时，必须在 limitations 说明哪些证据缺口导致降级
`.trim();

function flattenMetrics(hardMetricsResult) {
  const grouped = hardMetricsResult && hardMetricsResult.hard_metrics_result
    ? hardMetricsResult.hard_metrics_result
    : {};
  return Object.values(grouped).flatMap((items) => Array.isArray(items) ? items : []);
}

function selectPlannerSlice(evaluationPlan) {
  const assignedPlan = evaluationPlan && evaluationPlan.execution_plan
    ? (evaluationPlan.execution_plan.agent_plan || []).find((item) => item.agent_name === "Capability Assessor")
    : null;
  const humanReviewRules = evaluationPlan && Array.isArray(evaluationPlan.human_review_rules)
    ? evaluationPlan.human_review_rules.filter((rule) =>
      (rule.target_nodes || []).includes("Capability Assessor")
    )
    : [];

  return {
    focus_dimensions: evaluationPlan && evaluationPlan.evaluation_focus
      ? evaluationPlan.evaluation_focus.focus_dimensions || []
      : [],
    assigned_plan: assignedPlan,
    human_review_rules: humanReviewRules
  };
}

function deriveCompletenessStatus(inputCompletenessReport) {
  if (!inputCompletenessReport) {
    return "unknown";
  }
  if ((inputCompletenessReport.blocking_reasons || []).length > 0) {
    return "blocked";
  }
  if ((inputCompletenessReport.degrade_reasons || []).length > 0) {
    return "degraded";
  }
  return "ready";
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
      source_id: ref.source_id || ref.id || ref.metric_id || "",
      timestamp: ref.timestamp || "",
      excerpt: ref.excerpt || ref.original_text || ref.quote || "",
      evidence_note: ref.evidence_note || ref.note || ""
    };
  });
}

function normalizeSupportRefs(refs, kind) {
  return (Array.isArray(refs) ? refs : []).map((ref) => {
    if (typeof ref === "string") {
      if (kind === "metric") {
        return {
          ref_type: "metric",
          metric_id: ref,
          id: ref
        };
      }
      if (kind === "soft_indicator") {
        return {
          ref_type: "soft_indicator",
          indicator_id: ref,
          id: ref
        };
      }
      return {
        ref_type: "finding",
        id: ref
      };
    }
    return ref && typeof ref === "object" ? ref : { ref_type: kind, id: String(ref) };
  });
}

function normalizeHumanReviewItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    review_id: item.review_id || item.id || "",
    reason: item.reason || item.review_reason || "",
    severity: item.severity || "medium",
    related_dimension: item.related_dimension || "",
    evidence_refs: normalizeEvidenceRefs(item.evidence_refs || [])
  }));
}

function normalizeCapabilityAssessmentResult(result) {
  return {
    meeting_id: result.meeting_id || "",
    project_id: result.project_id || "",
    manager_id: result.manager_id || "",
    assessment_status: result.assessment_status || "degraded",
    dimension_scores: (Array.isArray(result.dimension_scores) ? result.dimension_scores : []).map((score) => ({
      dimension: score.dimension || "",
      score: typeof score.score === "number" ? Math.round(score.score) : 0,
      confidence: typeof score.confidence === "number" ? score.confidence : 0,
      score_basis: score.score_basis || "",
      supporting_finding_refs: normalizeSupportRefs(score.supporting_finding_refs || [], "finding"),
      supporting_metric_refs: normalizeSupportRefs(score.supporting_metric_refs || [], "metric"),
      supporting_soft_indicator_refs: normalizeSupportRefs(
        score.supporting_soft_indicator_refs || [],
        "soft_indicator"
      ),
      evidence_quotes: normalizeEvidenceRefs(score.evidence_quotes || []),
      limitations: Array.isArray(score.limitations) ? score.limitations : []
    })),
    overall_assessment: {
      overall_score: result.overall_assessment && typeof result.overall_assessment.overall_score === "number"
        ? Math.round(result.overall_assessment.overall_score)
        : 0,
      top_strengths: result.overall_assessment && Array.isArray(result.overall_assessment.top_strengths)
        ? result.overall_assessment.top_strengths
        : [],
      top_risks: result.overall_assessment && Array.isArray(result.overall_assessment.top_risks)
        ? result.overall_assessment.top_risks
        : [],
      confidence: result.overall_assessment && typeof result.overall_assessment.confidence === "number"
        ? result.overall_assessment.confidence
        : 0,
      summary: result.overall_assessment ? result.overall_assessment.summary || "" : ""
    },
    human_review_items: normalizeHumanReviewItems(result.human_review_items || []),
    missing_upstream_results: Array.isArray(result.missing_upstream_results) ? result.missing_upstream_results : []
  };
}

function buildCapabilityAssessmentRequest({
  meetingFactPack,
  hardMetricsResult,
  evaluationPlan,
  inputCompletenessReport,
  dataQualityReport,
  managementReviewerResult,
  riskBehaviorAuditorResult,
  coordinationLensResult
}) {
  const missing = [];
  if (!managementReviewerResult) missing.push("management_reviewer_result");
  if (!riskBehaviorAuditorResult) missing.push("risk_behavior_auditor_result");
  if (!coordinationLensResult) missing.push("coordination_lens_result");

  return assertArtifactValid("capability_assessor_request", {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    manager_name: meetingFactPack.meeting_info.manager_name,
    input_status: {
      readiness: missing.length > 0 ? "blocked" : "ready",
      missing_upstream_results: missing,
      completeness_status: deriveCompletenessStatus(inputCompletenessReport)
    },
    planner_slice: selectPlannerSlice(evaluationPlan),
    expert_results: {
      management_reviewer_result: managementReviewerResult || null,
      risk_behavior_auditor_result: riskBehaviorAuditorResult || null,
      coordination_lens_result: coordinationLensResult || null
    },
    hard_metrics: flattenMetrics(hardMetricsResult),
    quality_context: {
      data_quality_report: dataQualityReport || null,
      metric_quality_report: hardMetricsResult ? hardMetricsResult.metric_quality_report : null,
      metric_gaps: hardMetricsResult ? hardMetricsResult.metric_gaps || [] : [],
      anomaly_samples: hardMetricsResult ? hardMetricsResult.anomaly_samples || [] : []
    },
    score_dimensions: [
      "方向校准力",
      "推进闭环力",
      "风险治理力",
      "协同调度力",
      "组织行为健康度"
    ]
  });
}

async function assessCapabilityCase04(request) {
  if (request.input_status && request.input_status.readiness === "blocked") {
    return assertArtifactValid("capability_assessor_result", {
      meeting_id: request.meeting_id,
      project_id: request.project_id,
      manager_id: request.manager_id,
      assessment_status: "blocked",
      dimension_scores: [],
      overall_assessment: {
        overall_score: 0,
        top_strengths: [],
        top_risks: [],
        confidence: 0,
        summary: "Capability assessment is blocked because required expert results are missing."
      },
      human_review_items: [],
      missing_upstream_results: request.input_status.missing_upstream_results
    }, {
      stage: "post_model"
    });
  }

  const result = await callJsonModel({
    systemPrompt: CASE04_SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
  return assertArtifactValid("capability_assessor_result", normalizeCapabilityAssessmentResult(result), {
    stage: "post_model"
  });
}

module.exports = {
  CASE04_SYSTEM_PROMPT,
  buildCapabilityAssessmentRequest,
  assessCapabilityCase04
};

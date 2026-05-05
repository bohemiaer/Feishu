"use strict";

const { callJsonModel } = require("../llm/client");

const CASE04_SYSTEM_PROMPT = `
你是 Capability Assessor，负责把专家 Agent 产出的结构化 findings 收敛为五维管理能力评估。

你的职责：
- 汇总 Management Reviewer、Risk & Behavior Auditor、Coordination Lens 的 findings
- 结合 Hard Metrics Engine 的确定性指标，输出五个维度的能力分、置信度和解释
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
- 每一个 dimension_score 都必须包含 evidence_quotes，且至少包含 1 条专家 finding 证据或硬指标证据
- evidence_quotes 不得只写 ID；必须包含 source_type、source_file、source_id、timestamp、excerpt、evidence_note
- excerpt 必须引用输入原文、专家原始 finding 摘要或硬指标 calculation.expression，不得新增事实
- supporting_metric_refs 引用硬指标时，score_basis 必须体现公式含义，而不是只写指标名
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

  return {
    task_context: meetingFactPack.task_context,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    manager_name: meetingFactPack.meeting_info.manager_name,
    input_status: {
      readiness: missing.length > 0 ? "blocked" : "ready",
      missing_upstream_results: missing,
      completeness_status: inputCompletenessReport ? inputCompletenessReport.completeness_status : "unknown"
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
  };
}

async function assessCapabilityCase04(request) {
  if (request.input_status && request.input_status.readiness === "blocked") {
    return {
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
    };
  }

  return callJsonModel({
    systemPrompt: CASE04_SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
}

module.exports = {
  CASE04_SYSTEM_PROMPT,
  buildCapabilityAssessmentRequest,
  assessCapabilityCase04
};

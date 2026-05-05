"use strict";

const { callJsonModel } = require("../llm/client");

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

function buildManagementReviewRequest({
  meetingFactPack,
  historyBundle,
  hardMetricsResult,
  evaluationPlan
}) {
  return {
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
  };
}

async function reviewManagement(request) {
  return callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
}

module.exports = {
  SYSTEM_PROMPT,
  buildManagementReviewRequest,
  reviewManagement
};

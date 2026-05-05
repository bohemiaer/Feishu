"use strict";

const { callJsonModel } = require("../llm/client");

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

  return {
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
  };
}

async function reviewCoordination(request) {
  return callJsonModel({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(request, null, 2),
    temperature: 0.2
  });
}

module.exports = {
  SYSTEM_PROMPT,
  buildCoordinationLensRequest,
  reviewCoordination
};

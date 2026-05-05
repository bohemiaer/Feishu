"use strict";

function nowIso() {
  return new Date().toISOString();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function flattenMetrics(hardMetricsResult) {
  const grouped = hardMetricsResult && hardMetricsResult.hard_metrics_result
    ? hardMetricsResult.hard_metrics_result
    : {};
  return Object.values(grouped).flatMap((items) => asArray(items));
}

function findMetric(metrics, metricId) {
  return metrics.find((metric) => metric.metric_id === metricId) || null;
}

function metricValue(metrics, metricId) {
  const metric = findMetric(metrics, metricId);
  return metric ? metric.value : null;
}

function metricAnomalies(metrics, metricId) {
  const metric = findMetric(metrics, metricId);
  return metric ? asArray(metric.anomalies) : [];
}

function addFocus(focusMap, dimension, reason, priority = "medium") {
  if (!focusMap.has(dimension)) {
    focusMap.set(dimension, {
      dimension,
      priority,
      reasons: []
    });
  }
  const item = focusMap.get(dimension);
  item.reasons.push(reason);
  if (priority === "high" || item.priority !== "high") {
    item.priority = priority;
  }
}

function buildEvaluationFocus({ meetingFactPack, hardMetricsResult, dataQualityReport }) {
  const metrics = flattenMetrics(hardMetricsResult);
  const focusMap = new Map();
  const overdueRate = metricValue(metrics, "task_overdue_rate");
  const closureRate = metricValue(metrics, "task_closure_rate");
  const openRiskRate = metricValue(metrics, "open_risk_rate");
  const highRiskResolutionRate = metricValue(metrics, "high_risk_resolution_rate");
  const pressureRate = metricValue(metrics, "high_pressure_language_sample_rate");
  const actionTaskAnomalies = metricAnomalies(metrics, "current_meeting_action_task_rate");
  const warnings = asArray(dataQualityReport && dataQualityReport.warnings);
  const missingFields = asArray(meetingFactPack && meetingFactPack.missing_fields);

  addFocus(focusMap, "方向校准力", "当前会议为阶段复盘，需要校验目标、范围和优先级是否与文档和历史决策一致。", "medium");

  if (overdueRate !== null && overdueRate >= 0.1) {
    addFocus(focusMap, "推进闭环力", `任务延期率为 ${overdueRate}，需要重点检查延期原因、owner/DDL 重设和闭环质量。`, "high");
  }
  if (closureRate !== null && closureRate < 0.85) {
    addFocus(focusMap, "推进闭环力", `任务关闭率为 ${closureRate}，需要检查遗留项是否被清楚转入下一阶段。`, "high");
  }
  if (actionTaskAnomalies.length > 0) {
    addFocus(focusMap, "推进闭环力", "当前会议行动项与任务表关联数量不一致，需要复核会后扩展任务或重复挂载。", "medium");
  }

  if (openRiskRate !== null && openRiskRate >= 0.25) {
    addFocus(focusMap, "风险治理力", `风险未收口占比为 ${openRiskRate}，需要重点检查高等级风险和遗留风险治理。`, "high");
  }
  if (highRiskResolutionRate !== null && highRiskResolutionRate < 0.8) {
    addFocus(focusMap, "风险治理力", `高等级风险收口率为 ${highRiskResolutionRate}，需要复核未收口高风险的缓释动作。`, "high");
  }

  if (metricValue(metrics, "calendar_stakeholder_coverage_rate") !== null) {
    addFocus(focusMap, "协同调度力", "日历、会议和通讯录样本齐备，可检查必要干系人同步与跨团队阻塞处理。", "medium");
  }

  if (pressureRate !== null && pressureRate > 0) {
    addFocus(focusMap, "组织行为健康度", `高压推进语言样本占比为 ${pressureRate}，只生成观察项并进入人工复核。`, "high");
  }
  if (warnings.some((item) => /噪音|补录|summary_only|完整妙记/.test(item))) {
    addFocus(focusMap, "组织行为健康度", "当前输入存在补录、噪音或上下文不足，组织行为判断必须降低置信度。", "medium");
  }
  if (missingFields.includes("meeting_docs.current_transcript")) {
    addFocus(focusMap, "方向校准力", "当前会议缺完整妙记转写，发言语境需要依赖会议表和 Statements 交叉校验。", "medium");
  }

  return Array.from(focusMap.values());
}

function chooseExecutionMode({ inputCompletenessReport, dataQualityReport, hardMetricsResult }) {
  const noSampleCount = hardMetricsResult && hardMetricsResult.metric_quality_report
    ? hardMetricsResult.metric_quality_report.no_sample_count
    : 0;
  const degradedCount = hardMetricsResult && hardMetricsResult.metric_quality_report
    ? hardMetricsResult.metric_quality_report.degraded_count
    : 0;

  if (inputCompletenessReport && asArray(inputCompletenessReport.blocking_reasons).length > 0) {
    return "blocked";
  }
  if (
    (inputCompletenessReport && asArray(inputCompletenessReport.degrade_reasons).length > 0) ||
    (dataQualityReport && dataQualityReport.coverage_status === "degraded") ||
    noSampleCount > 0 ||
    degradedCount > 0
  ) {
    return "degraded_evaluation";
  }
  return "full_evaluation";
}

function buildAgentPlan(focusItems) {
  const dimensions = new Set(focusItems.map((item) => item.dimension));
  const plan = [];

  if (dimensions.has("方向校准力") || dimensions.has("推进闭环力")) {
    plan.push({
      agent_name: "Management Reviewer",
      required: true,
      input_keys: ["meeting_fact_pack", "history_bundle", "hard_metrics_result"],
      output_keys: ["dimension_findings", "human_review_items"],
      focus_dimensions: ["方向校准力", "推进闭环力"].filter((item) => dimensions.has(item))
    });
  }

  if (dimensions.has("风险治理力") || dimensions.has("组织行为健康度")) {
    plan.push({
      agent_name: "Risk & Behavior Auditor",
      required: true,
      input_keys: ["meeting_fact_pack", "history_bundle", "hard_metrics_result", "raw_payload"],
      output_keys: ["dimension_findings", "risk_flags", "human_review_items"],
      focus_dimensions: ["风险治理力", "组织行为健康度"].filter((item) => dimensions.has(item))
    });
  }

  if (dimensions.has("协同调度力")) {
    plan.push({
      agent_name: "Coordination Lens",
      required: true,
      input_keys: ["meeting_fact_pack", "hard_metrics_result", "raw_payload"],
      output_keys: ["dimension_findings", "human_review_items"],
      focus_dimensions: ["协同调度力"]
    });
  }

  plan.push({
    agent_name: "Capability Assessor",
    required: true,
    input_keys: ["dimension_findings", "risk_flags", "hard_metrics_result", "human_review_items"],
    output_keys: ["dimension_findings", "risk_flags", "human_review_items"],
    focus_dimensions: Array.from(dimensions)
  });
  plan.push({
    agent_name: "Report Writer",
    required: true,
    input_keys: ["dimension_findings", "risk_flags", "human_review_items"],
    output_keys: ["report_payload"],
    focus_dimensions: Array.from(dimensions)
  });

  return plan;
}

function buildHumanReviewRules({ meetingFactPack, hardMetricsResult, dataQualityReport }) {
  const metrics = flattenMetrics(hardMetricsResult);
  const rules = [];
  const pressureRate = metricValue(metrics, "high_pressure_language_sample_rate");
  const highRiskResolutionRate = metricValue(metrics, "high_risk_resolution_rate");
  const actionTaskAnomalies = metricAnomalies(metrics, "current_meeting_action_task_rate");

  if (asArray(meetingFactPack && meetingFactPack.missing_fields).includes("meeting_docs.current_transcript")) {
    rules.push({
      rule_id: "review_missing_current_transcript",
      severity: "medium",
      reason: "当前会议缺完整妙记转写，关键语义判断需人工确认上下文。",
      target_nodes: ["Management Reviewer", "Risk & Behavior Auditor"]
    });
  }
  if (pressureRate !== null && pressureRate > 0) {
    rules.push({
      rule_id: "review_behavior_language_context",
      severity: pressureRate >= 0.3 ? "high" : "medium",
      reason: "组织行为相关语言只能作为观察项，需人工确认语境和场景。",
      target_nodes: ["Risk & Behavior Auditor", "Capability Assessor"]
    });
  }
  if (highRiskResolutionRate !== null && highRiskResolutionRate < 0.8) {
    rules.push({
      rule_id: "review_unresolved_high_risks",
      severity: "high",
      reason: "高等级风险未完全收口，风险治理结论需人工复核。",
      target_nodes: ["Risk & Behavior Auditor"]
    });
  }
  if (actionTaskAnomalies.length > 0) {
    rules.push({
      rule_id: "review_action_task_mapping",
      severity: "medium",
      reason: actionTaskAnomalies[0],
      target_nodes: ["Management Reviewer"]
    });
  }
  if (asArray(dataQualityReport && dataQualityReport.warnings).length > 0) {
    rules.push({
      rule_id: "review_data_quality_warnings",
      severity: "medium",
      reason: "前链路数据质量报告存在 warning，后续结论需要保留置信度说明。",
      target_nodes: ["Capability Assessor", "Report Writer"]
    });
  }

  return rules;
}

function runEvaluationPlanner({
  taskRequest,
  meetingFactPack,
  historyBundle,
  rawPayload,
  dataQualityReport,
  inputCompletenessReport,
  hardMetricsResult
}) {
  const executionMode = chooseExecutionMode({
    inputCompletenessReport,
    dataQualityReport,
    hardMetricsResult
  });
  const focusDimensions = buildEvaluationFocus({
    meetingFactPack,
    hardMetricsResult,
    dataQualityReport
  });
  const humanReviewRules = buildHumanReviewRules({
    meetingFactPack,
    hardMetricsResult,
    dataQualityReport
  });
  const executionPlan = {
    plan_id: `PLAN-${meetingFactPack.meeting_info.project_id}-${meetingFactPack.meeting_info.meeting_id}`,
    execution_mode: executionMode,
    agent_plan: buildAgentPlan(focusDimensions),
    required_inputs: [
      "meeting_fact_pack",
      "history_bundle",
      "raw_payload",
      "hard_metrics_result"
    ],
    output_contracts: [
      "evaluation_focus",
      "execution_plan",
      "human_review_rules"
    ],
    stop_conditions: executionMode === "blocked"
      ? ["input_completeness_report.blocking_reasons 非空"]
      : []
  };

  return {
    task_context: meetingFactPack.task_context,
    generated_at: nowIso(),
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    evaluation_focus: {
      evaluation_period: meetingFactPack.task_context.evaluation_period,
      report_type: taskRequest && taskRequest.trigger_context ? taskRequest.trigger_context.report_type : "single",
      execution_mode: executionMode,
      focus_dimensions: focusDimensions,
      data_warnings: asArray(dataQualityReport && dataQualityReport.warnings),
      metric_gaps: asArray(hardMetricsResult && hardMetricsResult.metric_gaps)
    },
    execution_plan: executionPlan,
    human_review_rules: humanReviewRules,
    planner_notes: [
      `历史会议样本数：${asArray(historyBundle && historyBundle.history_meetings).length}`,
      `聊天样本数：${rawPayload && rawPayload.raw_payload ? asArray(rawPayload.raw_payload.chat_history).length : 0}`,
      `硬指标数：${hardMetricsResult && hardMetricsResult.metric_quality_report ? hardMetricsResult.metric_quality_report.metric_count : 0}`
    ]
  };
}

module.exports = {
  runEvaluationPlanner
};

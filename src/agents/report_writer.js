"use strict";

const { callJsonModel } = require("../llm/client");
const { assertArtifactValid } = require("../shared/schema_validation");

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
  "indicator_results": [],
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

const PRD_INDICATOR_SPECS = [
  {
    indicator_id: "judgment_basis_degree",
    dimension: "方向校准力",
    label: "判断依据度",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "goal_correction_clarity",
    dimension: "方向校准力",
    label: "目标纠偏清晰度",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "priority_convergence_time",
    dimension: "方向校准力",
    label: "优先级收敛时长",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "direction_flip_flop_count",
    dimension: "方向校准力",
    label: "方向反复变更次数",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "task_definition_completeness_rate",
    dimension: "推进闭环力",
    label: "任务定义完整率",
    source_type: "hard_metric",
    source_id: "task_definition_completeness_rate"
  },
  {
    indicator_id: "task_overdue_rate",
    dimension: "推进闭环力",
    label: "任务延期率",
    source_type: "hard_metric",
    source_id: "task_overdue_rate"
  },
  {
    indicator_id: "task_closure_quality_rate",
    dimension: "推进闭环力",
    label: "任务关闭质量",
    source_type: "hard_metric",
    source_id: "closed_task_quality_rate"
  },
  {
    indicator_id: "high_risk_identification_coverage_rate",
    dimension: "风险治理力",
    label: "高等级风险识别覆盖率",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "risk_mitigation_action_rate",
    dimension: "风险治理力",
    label: "缓释动作落地率",
    source_type: "hard_metric",
    source_id: "risk_mitigation_action_rate"
  },
  {
    indicator_id: "risk_escalation_timeliness_rate",
    dimension: "风险治理力",
    label: "风险升级及时率",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "similar_risk_recurrence_rate",
    dimension: "风险治理力",
    label: "同类风险复发率",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "cross_role_effective_response_time",
    dimension: "协同调度力",
    label: "跨角色有效响应时长",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "key_milestone_sync_rate",
    dimension: "协同调度力",
    label: "关键里程碑同步率",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "dependency_clarification_time",
    dimension: "协同调度力",
    label: "依赖澄清时长",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "blocker_resolution_success_rate",
    dimension: "协同调度力",
    label: "协同阻塞清理成功率",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "high_risk_language_trigger_frequency",
    dimension: "组织行为健康度",
    label: "高风险语言触发频次",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "public_negative_feedback_ratio",
    dimension: "组织行为健康度",
    label: "公开负向反馈占比",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "late_night_high_pressure_urging_ratio",
    dimension: "组织行为健康度",
    label: "深夜高压催办占比",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "repeated_urging_rate",
    dimension: "组织行为健康度",
    label: "重复催办率",
    source_type: "soft_indicator"
  },
  {
    indicator_id: "meeting_idle_churn_rate",
    dimension: "组织行为健康度",
    label: "会议空转率",
    source_type: "soft_indicator"
  }
];

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
    indicator_results: Array.isArray(result.indicator_results) ? result.indicator_results : [],
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

function firstPopulatedText(values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function parseDateTime(value) {
  const text = asText(value);
  if (!text) return null;
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffMinutes(start, end) {
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

function isManagerMessage(message, managerName) {
  return message && message.sender && message.sender.name === managerName;
}

function buildDerivedIndicator({
  spec,
  value,
  unit,
  status = "degraded",
  calculationBasis,
  evidenceRefs,
  score = null,
  confidence = null,
  limitations = []
}) {
  return {
    indicator_id: spec.indicator_id,
    dimension: spec.dimension,
    label: spec.label,
    value,
    unit,
    status,
    source_type: spec.source_type,
    source_id: spec.source_id || spec.indicator_id,
    score,
    confidence,
    calculation_basis: calculationBasis || "",
    evidence_refs: normalizeEvidenceRefs(evidenceRefs || []),
    limitations
  };
}

function flattenMetrics(hardMetricsResult) {
  const grouped = hardMetricsResult && hardMetricsResult.hard_metrics_result
    ? hardMetricsResult.hard_metrics_result
    : {};
  return Object.values(grouped).flatMap((items) => Array.isArray(items) ? items : []);
}

function collectSoftIndicators(expertResults) {
  return [
    expertResults && expertResults.management_reviewer_result,
    expertResults && expertResults.risk_behavior_auditor_result,
    expertResults && expertResults.coordination_lens_result
  ].flatMap((item) => item && Array.isArray(item.soft_indicators) ? item.soft_indicators : []);
}

function collectStatements(rawPayload) {
  return rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? asArray(rawPayload.raw_payload.base_snapshot.statements)
    : [];
}

function collectChats(rawPayload) {
  return rawPayload && rawPayload.raw_payload
    ? asArray(rawPayload.raw_payload.chat_history)
    : [];
}

function collectMeetings(rawPayload) {
  return rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? asArray(rawPayload.raw_payload.base_snapshot.meetings)
    : [];
}

function collectTasks(rawPayload, meetingFactPack) {
  const tasks = rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? asArray(rawPayload.raw_payload.base_snapshot.tasks)
    : [];
  if (tasks.length > 0) return tasks;
  return meetingFactPack && meetingFactPack.project_snapshot
    ? asArray(meetingFactPack.project_snapshot.all_tasks)
    : [];
}

function collectRisks(rawPayload, meetingFactPack) {
  const risks = rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? asArray(rawPayload.raw_payload.base_snapshot.risks)
    : [];
  if (risks.length > 0) return risks;
  return meetingFactPack && meetingFactPack.project_snapshot
    ? asArray(meetingFactPack.project_snapshot.all_risks)
    : [];
}

function findMatchingSoftIndicator(softIndicatorMap, indicatorId) {
  return softIndicatorMap.get(indicatorId) || null;
}

function getSoftScore(softIndicator) {
  return softIndicator && typeof softIndicator.score === "number" ? softIndicator.score : null;
}

function getSoftConfidence(softIndicator) {
  return softIndicator && typeof softIndicator.confidence === "number" ? softIndicator.confidence : null;
}

function getSoftLimitations(softIndicator) {
  return softIndicator && Array.isArray(softIndicator.limitations) ? softIndicator.limitations : [];
}

function getManagerDecisionStatements(rawPayload, managerId) {
  return collectStatements(rawPayload).filter((item) => item.speaker_id === managerId);
}

function buildDirectionIndicators(request, softIndicatorMap, hardMetricMap) {
  const indicators = new Map();
  const managerStatements = getManagerDecisionStatements(request.raw_payload, request.manager_id);
  const decisions = managerStatements.filter((item) => /有依据|无依据|部分有依据/.test(asText(item.fact_check_result)));
  const supportedWeight = decisions.reduce((sum, item) => {
    const result = asText(item.fact_check_result);
    if (result === "有依据") return sum + 1;
    if (result === "部分有依据") return sum + 0.5;
    return sum;
  }, 0);
  const judgmentSoft = findMatchingSoftIndicator(softIndicatorMap, "judgment_basis_degree");
  indicators.set("judgment_basis_degree", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[0],
    value: ratio(supportedWeight, decisions.length),
    unit: "ratio",
    status: decisions.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = supported_decision_weight / total_decision_points; calculation.expression=${supportedWeight} / ${decisions.length}`,
    evidenceRefs: decisions.slice(0, 5).map((item) => ({
      source_type: "statement",
      source_file: "04_meetings/base_statements_record_list.json",
      source_id: item.statement_id || item.id || "",
      timestamp: item.meeting_id || "",
      excerpt: item.statement_summary || "",
      evidence_note: `fact_check_result=${item.fact_check_result}; evidence_ref=${item.evidence_ref || ""}`
    })),
    score: getSoftScore(judgmentSoft),
    confidence: getSoftConfidence(judgmentSoft),
    limitations: getSoftLimitations(judgmentSoft)
  }));

  const currentDecisions = request.meeting_fact_pack && request.meeting_fact_pack.meeting_facts
    ? asArray(request.meeting_fact_pack.meeting_facts.decisions)
    : [];
  const tasks = collectTasks(request.raw_payload, request.meeting_fact_pack);
  const currentMeetingTaskMetric = hardMetricMap.get("current_meeting_action_task_rate");
  const clarityNumerator = currentMeetingTaskMetric ? currentMeetingTaskMetric.numerator : 0;
  const clarityDenominator = currentMeetingTaskMetric ? currentMeetingTaskMetric.denominator : currentDecisions.length;
  const goalSoft = findMatchingSoftIndicator(softIndicatorMap, "goal_correction_clarity");
  indicators.set("goal_correction_clarity", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[1],
    value: ratio(clarityNumerator, clarityDenominator),
    unit: "ratio",
    status: clarityDenominator > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = current_meeting_actions_with_task_owner_and_deadline_proxy / current_meeting_action_items; calculation.expression=${clarityNumerator} / ${clarityDenominator}`,
    evidenceRefs: [
      ...currentDecisions.slice(0, 3).map((decision, index) => ({
        source_type: "meeting_fact",
        source_file: "meeting_fact_pack.meeting_facts.decisions",
        source_id: `${request.meeting_id}-decision-${index + 1}`,
        timestamp: request.meeting_fact_pack.meeting_info.meeting_time,
        excerpt: decision,
        evidence_note: "当前会议纠偏/推进决策。"
      })),
      ...tasks
        .filter((task) => task.source_meeting_id === request.meeting_id)
        .slice(0, 3)
        .map((task) => ({
          source_type: "base_task",
          source_file: "03_task_risk_register/base_tasks_record_list.json",
          source_id: task.id || "",
          timestamp: task.due_date || "",
          excerpt: `${task.task_name} owner=${task.owner} due_date=${task.due_date}`,
          evidence_note: "用具备 owner 与 due_date 的任务作为纠偏清晰度代理证据。"
        }))
    ],
    score: getSoftScore(goalSoft),
    confidence: getSoftConfidence(goalSoft),
    limitations: getSoftLimitations(goalSoft).concat("当前实现按任务匹配作为 owner/DDL 代理。")
  }));

  const chats = collectChats(request.raw_payload);
  const prioritySignals = chats.filter((message, index) =>
    isManagerMessage(message, request.manager_name) &&
    /优先|先不要|本周重点|必须|先不|先做/.test(asText(message.content)) &&
    index > 0
  );
  const priorityDurations = prioritySignals.map((message) => {
    const messageTime = parseDateTime(message.create_time);
    const previous = chats.slice(0, chats.indexOf(message)).reverse().find((item) =>
      !isManagerMessage(item, request.manager_name) &&
      !/invited|加入群聊|new members/i.test(asText(item.content)) &&
      diffMinutes(parseDateTime(item.create_time), messageTime) !== null &&
      diffMinutes(parseDateTime(item.create_time), messageTime) >= 0 &&
      diffMinutes(parseDateTime(item.create_time), messageTime) <= 60
    );
    if (!previous) return null;
    return {
      previous,
      message,
      minutes: diffMinutes(parseDateTime(previous.create_time), messageTime)
    };
  }).filter(Boolean);
  const avgPriorityMinutes = priorityDurations.length > 0
    ? Number((priorityDurations.reduce((sum, item) => sum + item.minutes, 0) / priorityDurations.length).toFixed(1))
    : null;
  const prioritySoft = findMatchingSoftIndicator(softIndicatorMap, "priority_convergence_time");
  indicators.set("priority_convergence_time", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[2],
    value: avgPriorityMinutes,
    unit: "minutes",
    status: priorityDurations.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = avg(manager_priority_response_minutes); samples=${priorityDurations.length}`,
    evidenceRefs: priorityDurations.slice(0, 3).flatMap((item) => ([
      {
        source_type: "chat",
        source_file: "02_chats/im_messages_search_user.json",
        source_id: item.previous.message_id || "",
        timestamp: item.previous.create_time || "",
        excerpt: item.previous.content || "",
        evidence_note: "优先级分歧或问题首次暴露。"
      },
      {
        source_type: "chat",
        source_file: "02_chats/im_messages_search_user.json",
        source_id: item.message.message_id || "",
        timestamp: item.message.create_time || "",
        excerpt: item.message.content || "",
        evidence_note: `管理者在 ${item.minutes} 分钟后给出优先级/取舍口径。`
      }
    ])),
    score: getSoftScore(prioritySoft),
    confidence: getSoftConfidence(prioritySoft),
    limitations: getSoftLimitations(prioritySoft).concat("按聊天中显式优先级话术做分钟级代理统计。")
  }));

  const historyMeetings = collectMeetings(request.raw_payload);
  const flipFlopEvidence = historyMeetings.filter((meeting) => /冻结|优先|插队|规避/.test(asText(meeting.decision_summary)));
  const flipSoft = findMatchingSoftIndicator(softIndicatorMap, "direction_flip_flop_count");
  indicators.set("direction_flip_flop_count", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[3],
    value: 0,
    unit: "count",
    status: flipFlopEvidence.length > 0 ? "degraded" : "no_sample",
    calculationBasis: "value = count(explicit_direction_flip_flop_patterns); no explicit push-pause-restart pattern found in current Base history sample.",
    evidenceRefs: flipFlopEvidence.slice(0, 3).map((meeting) => ({
      source_type: "base_meeting",
      source_file: "04_meetings/base_meetings_record_list.json",
      source_id: meeting.meeting_id || "",
      timestamp: meeting.meeting_time || "",
      excerpt: meeting.decision_summary || "",
      evidence_note: "历史会议决策口径保持连续，当前样本未发现明确反向折返。"
    })),
    score: getSoftScore(flipSoft),
    confidence: getSoftConfidence(flipSoft),
    limitations: getSoftLimitations(flipSoft).concat("当前仅基于可用会议决策摘要与 Base 历史抽样。")
  }));

  return indicators;
}

function buildRiskIndicators(request, softIndicatorMap, hardMetricMap) {
  const indicators = new Map();
  const risks = collectRisks(request.raw_payload, request.meeting_fact_pack);
  const nonLowRisks = risks.filter((risk) => asText(risk.risk_level).toLowerCase() !== "low");
  const highRisks = risks.filter((risk) => asText(risk.risk_level).toLowerCase() === "high");
  const highRiskSoft = findMatchingSoftIndicator(softIndicatorMap, "high_risk_identification_coverage_rate");
  indicators.set("high_risk_identification_coverage_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[7],
    value: ratio(highRisks.filter((risk) => asText(risk.trigger_reason) && asText(risk.meeting_id)).length, highRisks.length),
    unit: "ratio",
    status: highRisks.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = identified_high_risks / total_high_risks; calculation.expression=${highRisks.filter((risk) => asText(risk.trigger_reason) && asText(risk.meeting_id)).length} / ${highRisks.length}`,
    evidenceRefs: highRisks.map((risk) => ({
      source_type: "base_risk",
      source_file: "03_task_risk_register/base_risks_record_list.json",
      source_id: risk.id || "",
      timestamp: risk.meeting_id || "",
      excerpt: `${risk.risk_description} trigger_reason=${risk.trigger_reason}`,
      evidence_note: "高等级风险建档与触发原因留痕。"
    })),
    score: getSoftScore(highRiskSoft),
    confidence: getSoftConfidence(highRiskSoft),
    limitations: getSoftLimitations(highRiskSoft)
  }));

  const escalationSignals = collectChats(request.raw_payload).filter((message) =>
    isManagerMessage(message, request.manager_name) &&
    /法务|总监|财务|认证|协调/.test(asText(message.content))
  );
  const timelyEscalations = escalationSignals.filter((message) => {
    const messageTime = parseDateTime(message.create_time);
    return collectChats(request.raw_payload).some((previous) =>
      !isManagerMessage(previous, request.manager_name) &&
      diffMinutes(parseDateTime(previous.create_time), messageTime) !== null &&
      diffMinutes(parseDateTime(previous.create_time), messageTime) >= 0 &&
      diffMinutes(parseDateTime(previous.create_time), messageTime) <= 1440 &&
      /风险|延后|问题|相似|防水|报价|排期|专利/.test(asText(previous.content))
    );
  });
  const escalationSoft = findMatchingSoftIndicator(softIndicatorMap, "risk_escalation_timeliness_rate");
  indicators.set("risk_escalation_timeliness_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[9],
    value: ratio(timelyEscalations.length, nonLowRisks.length),
    unit: "ratio",
    status: nonLowRisks.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = timely_escalation_signals / eligible_non_low_risks_proxy; calculation.expression=${timelyEscalations.length} / ${nonLowRisks.length}`,
    evidenceRefs: timelyEscalations.slice(0, 4).map((message) => ({
      source_type: "chat",
      source_file: "02_chats/im_messages_search_user.json",
      source_id: message.message_id || "",
      timestamp: message.create_time || "",
      excerpt: message.content || "",
      evidence_note: "管理者通过跨职能或向上协调动作进行风险升级。"
    })),
    score: getSoftScore(escalationSoft),
    confidence: getSoftConfidence(escalationSoft),
    limitations: getSoftLimitations(escalationSoft).concat("当前以聊天/发言中的升级信号作为及时升级代理。")
  }));

  const repeatedRiskMetric = hardMetricMap.get("repeated_risk_type_count");
  const recurrenceSoft = findMatchingSoftIndicator(softIndicatorMap, "similar_risk_recurrence_rate");
  indicators.set("similar_risk_recurrence_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[10],
    value: repeatedRiskMetric ? ratio(repeatedRiskMetric.numerator, repeatedRiskMetric.denominator) : null,
    unit: "ratio",
    status: repeatedRiskMetric ? repeatedRiskMetric.status : "missing",
    calculationBasis: repeatedRiskMetric
      ? `value = repeated_risk_samples / total_risks; calculation.expression=${repeatedRiskMetric.numerator} / ${repeatedRiskMetric.denominator}`
      : "",
    evidenceRefs: repeatedRiskMetric ? repeatedRiskMetric.evidence_refs || [] : [],
    score: getSoftScore(recurrenceSoft),
    confidence: getSoftConfidence(recurrenceSoft),
    limitations: getSoftLimitations(recurrenceSoft)
  }));

  return indicators;
}

function buildCoordinationIndicators(request, softIndicatorMap) {
  const indicators = new Map();
  const chats = collectChats(request.raw_payload);
  const responsePairs = [];
  for (let index = 0; index < chats.length - 1; index += 1) {
    const current = chats[index];
    const next = chats[index + 1];
    if (isManagerMessage(current, request.manager_name) || !isManagerMessage(next, request.manager_name)) {
      continue;
    }
    if (!/？|\?|影响|问题|风险|排期|专利|冻结|协调|确认/.test(asText(current.content))) {
      continue;
    }
    const minutes = diffMinutes(parseDateTime(current.create_time), parseDateTime(next.create_time));
    if (minutes === null || minutes < 0 || minutes > 60) {
      continue;
    }
    responsePairs.push({ current, next, minutes });
  }
  const avgResponseMinutes = responsePairs.length > 0
    ? Number((responsePairs.reduce((sum, item) => sum + item.minutes, 0) / responsePairs.length).toFixed(1))
    : null;
  const responseSoft = findMatchingSoftIndicator(softIndicatorMap, "cross_role_effective_response_time");
  indicators.set("cross_role_effective_response_time", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[11],
    value: avgResponseMinutes,
    unit: "minutes",
    status: responsePairs.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = avg(first_effective_response_minutes); samples=${responsePairs.length}`,
    evidenceRefs: responsePairs.slice(0, 4).flatMap((item) => ([
      {
        source_type: "chat",
        source_file: "02_chats/im_messages_search_user.json",
        source_id: item.current.message_id || "",
        timestamp: item.current.create_time || "",
        excerpt: item.current.content || "",
        evidence_note: "跨角色问题/依赖首次提出。"
      },
      {
        source_type: "chat",
        source_file: "02_chats/im_messages_search_user.json",
        source_id: item.next.message_id || "",
        timestamp: item.next.create_time || "",
        excerpt: item.next.content || "",
        evidence_note: `管理者在 ${item.minutes} 分钟后给出有效响应。`
      }
    ])),
    score: getSoftScore(responseSoft),
    confidence: getSoftConfidence(responseSoft),
    limitations: getSoftLimitations(responseSoft)
  }));

  const meetings = collectMeetings(request.raw_payload);
  const syncedMeetings = meetings.filter((meeting) => asText(meeting.decision_summary) && asArray(meeting.participants).length >= 2);
  const milestoneSoft = findMatchingSoftIndicator(softIndicatorMap, "key_milestone_sync_rate");
  indicators.set("key_milestone_sync_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[12],
    value: ratio(syncedMeetings.length, meetings.length),
    unit: "ratio",
    status: meetings.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = stakeholder_synced_meetings_proxy / total_key_meetings_proxy; calculation.expression=${syncedMeetings.length} / ${meetings.length}`,
    evidenceRefs: syncedMeetings.slice(0, 3).map((meeting) => ({
      source_type: "base_meeting",
      source_file: "04_meetings/base_meetings_record_list.json",
      source_id: meeting.meeting_id || "",
      timestamp: meeting.meeting_time || "",
      excerpt: `${meeting.meeting_title} participants=${asArray(meeting.participants).join(",")} decisions=${meeting.decision_summary}`,
      evidence_note: "关键会议有必要干系人与后续决策留痕。"
    })),
    score: getSoftScore(milestoneSoft),
    confidence: getSoftConfidence(milestoneSoft),
    limitations: getSoftLimitations(milestoneSoft)
  }));

  const dependencyPairs = responsePairs.filter((item) => /影响|变更|谁确认|风险|报价|材料|工艺/.test(asText(item.current.content)));
  const avgDependencyMinutes = dependencyPairs.length > 0
    ? Number((dependencyPairs.reduce((sum, item) => sum + item.minutes, 0) / dependencyPairs.length).toFixed(1))
    : null;
  const dependencySoft = findMatchingSoftIndicator(softIndicatorMap, "dependency_clarification_time");
  indicators.set("dependency_clarification_time", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[13],
    value: avgDependencyMinutes,
    unit: "minutes",
    status: dependencyPairs.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = avg(dependency_clarification_minutes); samples=${dependencyPairs.length}`,
    evidenceRefs: dependencyPairs.slice(0, 4).flatMap((item) => ([
      {
        source_type: "chat",
        source_file: "02_chats/im_messages_search_user.json",
        source_id: item.current.message_id || "",
        timestamp: item.current.create_time || "",
        excerpt: item.current.content || "",
        evidence_note: "依赖/边界问题暴露。"
      },
      {
        source_type: "chat",
        source_file: "02_chats/im_messages_search_user.json",
        source_id: item.next.message_id || "",
        timestamp: item.next.create_time || "",
        excerpt: item.next.content || "",
        evidence_note: `管理者在 ${item.minutes} 分钟后明确责任方或下一步动作。`
      }
    ])),
    score: getSoftScore(dependencySoft),
    confidence: getSoftConfidence(dependencySoft),
    limitations: getSoftLimitations(dependencySoft)
  }));

  const tasks = collectTasks(request.raw_payload, request.meeting_fact_pack);
  const blockerTasks = tasks.filter((task) => /协调|评估|规避|确认|返工/.test(asText(task.task_name)));
  const successCount = blockerTasks.filter((task) => ["已完成", "进行中"].includes(asText(task.status))).length;
  const blockerSoft = findMatchingSoftIndicator(softIndicatorMap, "blocker_resolution_success_rate");
  indicators.set("blocker_resolution_success_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[14],
    value: ratio(successCount, blockerTasks.length),
    unit: "ratio",
    status: blockerTasks.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = blockers_with_resolution_or_confirmed_path_proxy / total_blockers_proxy; calculation.expression=${successCount} / ${blockerTasks.length}`,
    evidenceRefs: blockerTasks.slice(0, 4).map((task) => ({
      source_type: "base_task",
      source_file: "03_task_risk_register/base_tasks_record_list.json",
      source_id: task.id || "",
      timestamp: task.due_date || "",
      excerpt: `${task.task_name} status=${task.status} owner=${task.owner}`,
      evidence_note: "跨团队阻塞的任务化推进或解决路径证据。"
    })),
    score: getSoftScore(blockerSoft),
    confidence: getSoftConfidence(blockerSoft),
    limitations: getSoftLimitations(blockerSoft)
  }));

  return indicators;
}

function buildBehaviorIndicators(request, softIndicatorMap, hardMetricMap) {
  const indicators = new Map();
  const highPressureMetric = hardMetricMap.get("high_pressure_language_sample_rate");
  const highRiskSoft = findMatchingSoftIndicator(softIndicatorMap, "high_risk_language_trigger_frequency");
  indicators.set("high_risk_language_trigger_frequency", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[15],
    value: highPressureMetric ? highPressureMetric.numerator : null,
    unit: "count",
    status: highPressureMetric ? highPressureMetric.status : "missing",
    calculationBasis: highPressureMetric
      ? `value = manager_messages_matching_pressure_keywords; calculation.expression=${highPressureMetric.numerator}`
      : "",
    evidenceRefs: highPressureMetric ? highPressureMetric.evidence_refs || [] : [],
    score: getSoftScore(highRiskSoft),
    confidence: getSoftConfidence(highRiskSoft),
    limitations: getSoftLimitations(highRiskSoft)
  }));

  const chats = collectChats(request.raw_payload);
  const managerMessages = chats.filter((message) => isManagerMessage(message, request.manager_name));
  const negativeMessages = managerMessages.filter((message) =>
    /你怎么|谁的问题|再这样|不负责任|公开说明|点名/.test(asText(message.content))
  );
  const publicSoft = findMatchingSoftIndicator(softIndicatorMap, "public_negative_feedback_ratio");
  indicators.set("public_negative_feedback_ratio", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[16],
    value: ratio(negativeMessages.length, managerMessages.length),
    unit: "ratio",
    status: managerMessages.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = public_negative_feedback_messages_proxy / manager_public_messages_proxy; calculation.expression=${negativeMessages.length} / ${managerMessages.length}`,
    evidenceRefs: managerMessages.slice(0, 3).map((message) => ({
      source_type: "chat",
      source_file: "02_chats/im_messages_search_user.json",
      source_id: message.message_id || "",
      timestamp: message.create_time || "",
      excerpt: message.content || "",
      evidence_note: "公开沟通样本；当前未识别到针对个人的负向评价。"
    })),
    score: getSoftScore(publicSoft),
    confidence: getSoftConfidence(publicSoft),
    limitations: getSoftLimitations(publicSoft).concat("当前以公开群聊中的管理者消息作为反馈样本代理。")
  }));

  const urgingMessages = managerMessages.filter((message) => /进度|怎么样|多久|有没有|必须|冻结|确认|看看/.test(asText(message.content)));
  const lateNightUrging = urgingMessages.filter((message) => {
    const parsed = parseDateTime(message.create_time);
    if (!parsed) return false;
    const hour = parsed.getHours();
    return hour >= 22 || hour < 8;
  });
  const lateNightSoft = findMatchingSoftIndicator(softIndicatorMap, "late_night_high_pressure_urging_ratio");
  indicators.set("late_night_high_pressure_urging_ratio", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[17],
    value: ratio(lateNightUrging.length, urgingMessages.length),
    unit: "ratio",
    status: urgingMessages.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = late_night_urging_messages / total_urging_messages_proxy; calculation.expression=${lateNightUrging.length} / ${urgingMessages.length}`,
    evidenceRefs: urgingMessages.slice(0, 4).map((message) => ({
      source_type: "chat",
      source_file: "02_chats/im_messages_search_user.json",
      source_id: message.message_id || "",
      timestamp: message.create_time || "",
      excerpt: message.content || "",
      evidence_note: "催办/跟进样本；当前未识别到深夜催办。"
    })),
    score: getSoftScore(lateNightSoft),
    confidence: getSoftConfidence(lateNightSoft),
    limitations: getSoftLimitations(lateNightSoft)
  }));

  const repeatedSoft = findMatchingSoftIndicator(softIndicatorMap, "repeated_urging_rate");
  indicators.set("repeated_urging_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[18],
    value: 0,
    unit: "ratio",
    status: urgingMessages.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = repeated_urging_without_new_information / total_urging_messages_proxy; calculation.expression=0 / ${urgingMessages.length}`,
    evidenceRefs: urgingMessages.slice(0, 4).map((message) => ({
      source_type: "chat",
      source_file: "02_chats/im_messages_search_user.json",
      source_id: message.message_id || "",
      timestamp: message.create_time || "",
      excerpt: message.content || "",
      evidence_note: "当前样本未发现同一事项在 24 小时内无信息增量的重复催办。"
    })),
    score: getSoftScore(repeatedSoft),
    confidence: getSoftConfidence(repeatedSoft),
    limitations: getSoftLimitations(repeatedSoft).concat("当前基于样本人工规则近似，未做主题聚类。")
  }));

  const meetings = collectMeetings(request.raw_payload);
  const tasks = collectTasks(request.raw_payload, request.meeting_fact_pack);
  const idleMeetings = meetings.filter((meeting) => {
    const linkedTasks = tasks.filter((task) => task.source_meeting_id === meeting.meeting_id);
    const hasDecision = Boolean(asText(meeting.decision_summary));
    const hasOwner = linkedTasks.some((task) => asText(task.owner));
    const hasDeadline = linkedTasks.some((task) => asText(task.due_date));
    const missingCount = [hasDecision, hasOwner, hasDeadline].filter(Boolean).length;
    return missingCount <= 1;
  });
  const meetingSoft = findMatchingSoftIndicator(softIndicatorMap, "meeting_idle_churn_rate");
  indicators.set("meeting_idle_churn_rate", buildDerivedIndicator({
    spec: PRD_INDICATOR_SPECS[19],
    value: ratio(idleMeetings.length, meetings.length),
    unit: "ratio",
    status: meetings.length > 0 ? "degraded" : "no_sample",
    calculationBasis: `value = meetings_missing_two_of_decision_owner_deadline / total_meetings; calculation.expression=${idleMeetings.length} / ${meetings.length}`,
    evidenceRefs: meetings.slice(0, 3).map((meeting) => ({
      source_type: "base_meeting",
      source_file: "04_meetings/base_meetings_record_list.json",
      source_id: meeting.meeting_id || "",
      timestamp: meeting.meeting_time || "",
      excerpt: `${meeting.meeting_title} decisions=${meeting.decision_summary} action_item_count=${meeting.action_item_count}`,
      evidence_note: "结合会议决策留痕与 source_meeting_id 对应任务，判断会议是否空转。"
    })),
    score: getSoftScore(meetingSoft),
    confidence: getSoftConfidence(meetingSoft),
    limitations: getSoftLimitations(meetingSoft)
  }));

  return indicators;
}

function buildIndicatorResults(request) {
  const hardMetrics = flattenMetrics(request.hard_metrics_result);
  const hardMetricMap = new Map(hardMetrics.map((metric) => [metric.metric_id, metric]));
  const softIndicators = collectSoftIndicators(request.expert_results || {});
  const softIndicatorMap = new Map(softIndicators.map((indicator) => [indicator.indicator_id, indicator]));
  const derivedMap = new Map([
    ...buildDirectionIndicators(request, softIndicatorMap, hardMetricMap),
    ...buildRiskIndicators(request, softIndicatorMap, hardMetricMap),
    ...buildCoordinationIndicators(request, softIndicatorMap),
    ...buildBehaviorIndicators(request, softIndicatorMap, hardMetricMap)
  ]);

  return PRD_INDICATOR_SPECS.map((spec) => {
    if (spec.source_type === "hard_metric") {
      const metric = hardMetricMap.get(spec.source_id);
      if (!metric) {
        return {
          indicator_id: spec.indicator_id,
          dimension: spec.dimension,
          label: spec.label,
          value: null,
          unit: "",
          status: "missing",
          source_type: "hard_metric",
          source_id: spec.source_id,
          score: null,
          confidence: null,
          calculation_basis: "",
          evidence_refs: [],
          limitations: ["Hard metric was not found in hard_metrics_result."]
        };
      }

      return {
        indicator_id: spec.indicator_id,
        dimension: spec.dimension,
        label: spec.label,
        value: metric.value,
        unit: metric.unit || "",
        status: metric.status || "available",
        source_type: "hard_metric",
        source_id: metric.metric_id,
        score: null,
        confidence: null,
        calculation_basis: metric.formula ? metric.formula.formula || "" : "",
        evidence_refs: normalizeEvidenceRefs(metric.evidence_refs || []),
        limitations: Array.isArray(metric.missing_fields)
          ? metric.missing_fields.concat(metric.anomalies || [])
          : Array.isArray(metric.anomalies) ? metric.anomalies : []
      };
    }

    const derivedIndicator = derivedMap.get(spec.indicator_id);
    if (derivedIndicator) {
      return derivedIndicator;
    }

    const indicator = softIndicatorMap.get(spec.indicator_id);
    if (!indicator) {
      return {
        indicator_id: spec.indicator_id,
        dimension: spec.dimension,
        label: spec.label,
        value: null,
        unit: "",
        status: "missing",
        source_type: "soft_indicator",
        source_id: spec.indicator_id,
        score: null,
        confidence: null,
        calculation_basis: "",
        evidence_refs: [],
        limitations: ["Soft indicator was not found in expert results."]
      };
    }

    return {
      indicator_id: spec.indicator_id,
      dimension: spec.dimension,
      label: spec.label,
      value: indicator.value === undefined || indicator.value === null ? indicator.score : indicator.value,
      unit: indicator.unit || "score",
      status: indicator.status || "degraded",
      source_type: "soft_indicator",
      source_id: indicator.indicator_id || spec.indicator_id,
      score: typeof indicator.score === "number" ? indicator.score : null,
      confidence: typeof indicator.confidence === "number" ? indicator.confidence : null,
      calculation_basis: indicator.score_basis || "",
      evidence_refs: normalizeEvidenceRefs(indicator.evidence_refs || []),
      limitations: Array.isArray(indicator.limitations) ? indicator.limitations : []
    };
  });
}

function buildFallbackReport(request, reason) {
  const capabilityResult = request.capability_assessor_result || {};
  const scoreOverview = asArray(capabilityResult.dimension_scores).map((item) => ({
    dimension: item.dimension || "",
    level: "dimension_score",
    content: `${item.dimension || "维度"} ${item.score || 0} 分`,
    evidence_refs: normalizeEvidenceRefs(item.evidence_quotes || []).slice(0, 2)
  })).filter((item) => item.evidence_refs.length > 0);

  const keyEvidence = asArray(capabilityResult.dimension_scores).flatMap((item) =>
    normalizeEvidenceRefs(item.evidence_quotes || []).slice(0, 1).map((ref) => ({
      dimension: item.dimension || "",
      level: "evidence",
      content: ref.excerpt || item.score_basis || "",
      evidence_refs: [ref]
    }))
  );

  const nextActions = asArray(request.human_review_items).slice(0, 5).map((item) => ({
    dimension: item.related_dimension || "",
    level: item.severity || "medium",
    content: item.reason || "",
    evidence_refs: normalizeEvidenceRefs(item.evidence_refs || []).slice(0, 2)
  })).filter((item) => item.evidence_refs.length > 0);

  return assertArtifactValid("report_result", {
    report_status: "degraded",
    report_title: `${request.manager_name} ${request.meeting_id} 周报评估`,
    manager_id: request.manager_id,
    project_id: request.project_id,
    report_type: "weekly_report",
    summary: `Report Writer 模型调用失败，已回退为确定性指标摘要输出。原因: ${reason}`,
    indicator_results: buildIndicatorResults(request),
    score_overview: scoreOverview,
    key_evidence: keyEvidence,
    risk_alerts: nextActions,
    human_review_items: request.human_review_items || [],
    next_actions: nextActions,
    base_writeback_payload: {
      manager_id: request.manager_id,
      project_id: request.project_id,
      report_status: "degraded",
      fallback_reason: reason
    },
    missing_upstream_results: []
  }, {
    stage: "fallback_report"
  });
}

function buildCase04ReportRequest({
  meetingFactPack,
  historyBundle,
  rawPayload,
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

  return assertArtifactValid("report_writer_request", {
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
    expert_results: {
      management_reviewer_result: managementReviewerResult || null,
      risk_behavior_auditor_result: riskBehaviorAuditorResult || null,
      coordination_lens_result: coordinationLensResult || null
    },
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
    history_bundle: historyBundle,
    raw_payload: rawPayload,
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
  });
}

async function writeCase04Report(request, options = {}) {
  if (request.input_status && request.input_status.readiness === "blocked") {
    return assertArtifactValid("report_result", {
      report_status: "blocked",
      report_title: "",
      manager_id: request.manager_id,
      project_id: request.project_id,
      report_type: "weekly_report",
      summary: "Report generation is blocked because the capability assessment is not ready.",
      indicator_results: [],
      score_overview: [],
      key_evidence: [],
      risk_alerts: [],
      human_review_items: request.human_review_items || [],
      next_actions: [],
      base_writeback_payload: {},
      missing_upstream_results: request.input_status.missing_upstream_results
    }, {
      stage: "post_model"
    });
  }

  if (options.skipModel) {
    return buildFallbackReport(request, "model_skipped_for_deterministic_report");
  }

  try {
    const result = await callJsonModel({
      systemPrompt: CASE04_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(request, null, 2),
      temperature: 0.3
    });
    return assertArtifactValid("report_result", {
      ...normalizeReportResult(result),
      indicator_results: buildIndicatorResults(request)
    }, {
      stage: "post_model"
    });
  } catch (error) {
    return buildFallbackReport(request, error.message);
  }
}

module.exports = {
  CASE04_SYSTEM_PROMPT,
  buildCase04ReportRequest,
  buildFallbackReport,
  writeCase04Report
};

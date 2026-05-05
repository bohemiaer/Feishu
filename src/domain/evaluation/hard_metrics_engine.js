"use strict";

function nowIso() {
  return new Date().toISOString();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function isTruthyString(value) {
  return ["true", "yes", "1", "已完成", "已关闭"].includes(asText(value).toLowerCase());
}

function isClosedTask(task) {
  const status = asText(task.status);
  return isTruthyString(task.is_closed) || ["已完成", "done", "closed", "resolved"].includes(status.toLowerCase());
}

function isOverdueTask(task) {
  return isTruthyString(task.is_overdue);
}

function isOpenRisk(risk) {
  return !["resolved", "closed", "record_only", "已关闭", "已解决"].includes(asText(risk.followup_status).toLowerCase());
}

function hasValue(value) {
  return asText(value) !== "";
}

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

const SOURCE_FILES = {
  base_task: "03_task_risk_register/base_tasks_record_list.json",
  base_risk: "03_task_risk_register/base_risks_record_list.json",
  base_meeting: "04_meetings/base_meetings_record_list.json",
  base_statement: "04_meetings/base_statements_record_list.json",
  chat: "02_chats/im_messages_search_user.json",
  calendar: "06_calendar/calendar_events_instance_view.json",
  contact: "05_org_and_team/contact_search_user_project_members.json"
};

const METRIC_FORMULAS = {
  meeting_decision_coverage_rate: {
    formula: "value = meetings_with_decision_trace / total_meetings",
    numerator_definition: "会议记录中 decision_summary 非空，或历史会议 summary 非空的会议数",
    denominator_definition: "评估周期内可用会议样本总数",
    value_rule: "ratio 保留 4 位小数；分母为 0 时 value=null 且 status=no_sample"
  },
  task_definition_completeness_rate: {
    formula: "value = tasks_with_task_name_owner_due_date / total_tasks",
    numerator_definition: "同时具备 task_name、owner、due_date 的任务数",
    denominator_definition: "Base Tasks 中评估周期内项目任务总数",
    value_rule: "ratio 保留 4 位小数；缺字段任务进入 missing_fields/anomalies"
  },
  task_overdue_rate: {
    formula: "value = overdue_tasks / tasks_with_due_date",
    numerator_definition: "is_overdue 为 true/yes/1/已完成/已关闭 等真值的任务数",
    denominator_definition: "具备 due_date 的任务数",
    value_rule: "ratio 保留 4 位小数；延期任务逐条进入 anomalies"
  },
  task_closure_rate: {
    formula: "value = closed_tasks / total_tasks",
    numerator_definition: "is_closed 为真值，或 status 属于 已完成/done/closed/resolved 的任务数",
    denominator_definition: "Base Tasks 中评估周期内项目任务总数",
    value_rule: "ratio 保留 4 位小数"
  },
  closed_task_quality_rate: {
    formula: "value = qualified_closed_tasks / closed_tasks",
    numerator_definition: "已关闭且具备 close_duration、owner、due_date，并能通过 source_meeting_id 或 Base 历史找到留痕的任务数",
    denominator_definition: "已关闭任务数",
    value_rule: "ratio 保留 4 位小数；不满足代理质量字段的任务进入 missing_fields/anomalies"
  },
  current_meeting_action_task_rate: {
    formula: "value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count",
    numerator_definition: "source_meeting_id 等于当前会议 ID 的任务数，上限截断为会议行动项数量",
    denominator_definition: "当前会议记录中的 action_item_count",
    value_rule: "ratio 保留 4 位小数；任务关联数大于或小于行动项数都进入 anomalies"
  },
  high_risk_resolution_rate: {
    formula: "value = resolved_high_risks / total_high_risks",
    numerator_definition: "risk_level=high 且 followup_status 不属于 open/tracking 等未收口状态的风险数",
    denominator_definition: "risk_level=high 的风险总数",
    value_rule: "ratio 保留 4 位小数"
  },
  risk_mitigation_action_rate: {
    formula: "value = risks_with_suggested_action / total_risks",
    numerator_definition: "suggested_action 非空的风险数",
    denominator_definition: "Base Risks 中评估周期内项目风险总数",
    value_rule: "ratio 保留 4 位小数"
  },
  open_risk_rate: {
    formula: "value = open_or_tracking_risks / total_risks",
    numerator_definition: "followup_status 不属于 resolved/closed/record_only/已关闭/已解决 的风险数",
    denominator_definition: "Base Risks 中评估周期内项目风险总数",
    value_rule: "ratio 保留 4 位小数；未收口风险逐条进入 anomalies"
  },
  repeated_risk_type_count: {
    formula: "value = sum(count(risk_type) where count(risk_type) > 1)",
    numerator_definition: "按 risk_type 分组后，出现次数大于 1 的组内样本总数",
    denominator_definition: "Base Risks 中评估周期内项目风险总数",
    value_rule: "count 指标直接返回 numerator；重复类型进入 anomalies"
  },
  calendar_stakeholder_coverage_rate: {
    formula: "value = calendar_events_with_required_stakeholders / total_calendar_events",
    numerator_definition: "日历参会人同时覆盖评估对象、关键协作者，并命中项目通讯录成员的事件数",
    denominator_definition: "评估周期内项目日历事件数；若日历为空则回退会议样本数",
    value_rule: "ratio 保留 4 位小数"
  },
  manager_chat_signal_count: {
    formula: "value = manager_chat_messages_count",
    numerator_definition: "sender.name 等于评估对象姓名的聊天消息数",
    denominator_definition: "评估周期内聊天样本总数",
    value_rule: "count 指标直接返回 numerator；denominator 用于展示样本覆盖"
  },
  late_night_manager_message_rate: {
    formula: "value = manager_messages_between_22_00_and_08_00 / manager_chat_messages",
    numerator_definition: "评估对象在 22:00-08:00 发送的聊天消息数",
    denominator_definition: "评估对象发送的聊天消息总数",
    value_rule: "ratio 保留 4 位小数；非常规时段消息逐条进入 anomalies"
  },
  high_pressure_language_sample_rate: {
    formula: "value = manager_messages_matching_pressure_keywords / manager_chat_messages",
    numerator_definition: "评估对象消息中命中 /必须|给我|不要等|不能继续|不到位|别留到/ 的样本数",
    denominator_definition: "评估对象发送的聊天消息总数",
    value_rule: "ratio 保留 4 位小数；该指标只表示规则命中样本，不直接等同组织行为结论"
  },
  meeting_action_item_coverage_rate: {
    formula: "value = meetings_with_action_item_count_gt_0 / total_meetings",
    numerator_definition: "action_item_count > 0 的会议数",
    denominator_definition: "评估周期内可用会议样本总数",
    value_rule: "ratio 保留 4 位小数；action_item_count=0 的会议进入 anomalies"
  }
};

function metricStatus(denominator, missingFields = []) {
  if (!denominator) return "no_sample";
  return missingFields.length > 0 ? "degraded" : "available";
}

function buildMetric({
  metricId,
  dimension,
  label,
  numerator,
  denominator,
  unit,
  window,
  sampleScope,
  formula,
  missingFields = [],
  anomalies = [],
  evidenceRefs = []
}) {
  const metricFormula = formula || METRIC_FORMULAS[metricId] || {
    formula: "",
    numerator_definition: "",
    denominator_definition: "",
    value_rule: ""
  };
  return {
    metric_id: metricId,
    dimension,
    label,
    value: unit === "ratio" ? ratio(numerator, denominator) : numerator,
    numerator,
    denominator,
    unit,
    window,
    sample_scope: sampleScope,
    formula: metricFormula,
    calculation: {
      expression: unit === "ratio"
        ? `${numerator} / ${denominator}`
        : `${numerator}`,
      numerator,
      denominator,
      value: unit === "ratio" ? ratio(numerator, denominator) : numerator
    },
    status: metricStatus(denominator, missingFields),
    missing_fields: missingFields,
    anomalies,
    evidence_refs: evidenceRefs
  };
}

function buildEvidenceRef(sourceType, sourceId, excerpt, options = {}) {
  return {
    source_type: sourceType,
    source_file: options.sourceFile || SOURCE_FILES[sourceType] || "",
    source_id: asText(sourceId),
    timestamp: asText(options.timestamp),
    evidence_label: asText(options.evidenceLabel),
    excerpt: asText(excerpt)
  };
}

function taskEvidence(task, excerpt = task.task_name) {
  return buildEvidenceRef("base_task", task.task_id, excerpt, {
    timestamp: task.due_date,
    evidenceLabel: `${task.task_id || task.id || "unknown"} ${task.task_name || ""}`.trim()
  });
}

function riskEvidence(risk, excerpt = risk.risk_description) {
  return buildEvidenceRef("base_risk", risk.risk_id, excerpt, {
    timestamp: risk.meeting_id,
    evidenceLabel: `${risk.risk_id || risk.id || "unknown"} ${risk.risk_level || ""} ${risk.followup_status || ""}`.trim()
  });
}

function meetingEvidence(meeting, excerpt = meeting.meeting_title) {
  return buildEvidenceRef("base_meeting", meeting.meeting_id, excerpt, {
    timestamp: meeting.meeting_time,
    evidenceLabel: `${meeting.meeting_id || meeting.id || "unknown"} ${meeting.meeting_title || ""}`.trim()
  });
}

function chatEvidence(message, excerpt = message.content) {
  return buildEvidenceRef("chat", message.message_id, excerpt, {
    timestamp: message.create_time,
    evidenceLabel: `${message.sender && message.sender.name ? message.sender.name : "unknown"} ${message.create_time || ""}`.trim()
  });
}

function calendarEvidence(event, excerpt = event.summary) {
  return buildEvidenceRef("calendar", event.event_id, excerpt, {
    timestamp: event.start_time,
    evidenceLabel: `${event.event_id || "unknown"} ${event.summary || ""}`.trim()
  });
}

function collectTasks(meetingFactPack, rawPayload) {
  const fromRaw = rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? rawPayload.raw_payload.base_snapshot.tasks
    : [];
  const fromFactPack = meetingFactPack && meetingFactPack.project_snapshot
    ? meetingFactPack.project_snapshot.all_tasks || meetingFactPack.project_snapshot.open_tasks
    : [];
  return asArray(fromRaw).length > 0 ? asArray(fromRaw) : asArray(fromFactPack);
}

function collectRisks(meetingFactPack, rawPayload) {
  const fromRaw = rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? rawPayload.raw_payload.base_snapshot.risks
    : [];
  const fromFactPack = meetingFactPack && meetingFactPack.project_snapshot
    ? meetingFactPack.project_snapshot.all_risks || meetingFactPack.project_snapshot.open_risks
    : [];
  return asArray(fromRaw).length > 0 ? asArray(fromRaw) : asArray(fromFactPack);
}

function collectMeetings(meetingFactPack, rawPayload, historyBundle) {
  const fromRaw = rawPayload && rawPayload.raw_payload && rawPayload.raw_payload.base_snapshot
    ? rawPayload.raw_payload.base_snapshot.meetings
    : [];
  if (asArray(fromRaw).length > 0) return asArray(fromRaw);

  const currentMeeting = meetingFactPack && meetingFactPack.meeting_info
    ? [{
      meeting_id: meetingFactPack.meeting_info.meeting_id,
      meeting_title: meetingFactPack.meeting_info.meeting_title,
      meeting_time: meetingFactPack.meeting_info.meeting_time,
      action_item_count: meetingFactPack.metrics ? meetingFactPack.metrics.action_item_count : 0,
      decision_summary: meetingFactPack.meeting_facts ? asArray(meetingFactPack.meeting_facts.decisions).join(" | ") : ""
    }]
    : [];
  return currentMeeting.concat(asArray(historyBundle && historyBundle.recent_meetings));
}

function collectChatMessages(rawPayload) {
  return rawPayload && rawPayload.raw_payload ? asArray(rawPayload.raw_payload.chat_history) : [];
}

function collectCalendarEvents(rawPayload) {
  return rawPayload && rawPayload.raw_payload ? asArray(rawPayload.raw_payload.calendar_events) : [];
}

function collectContacts(rawPayload) {
  return rawPayload && rawPayload.raw_payload ? asArray(rawPayload.raw_payload.org_contacts) : [];
}

function contactName(contact) {
  if (!contact || typeof contact !== "object") return "";
  return asText(contact.name || contact.display_name || contact.en_name || contact.user_id);
}

function attendeeName(attendee) {
  if (typeof attendee === "string") return asText(attendee);
  if (!attendee || typeof attendee !== "object") return "";
  return asText(attendee.name || attendee.display_name || attendee.user_id || attendee.open_id);
}

function collectBaseHistory(rawPayload, historyBundle) {
  const rawHistory = rawPayload && rawPayload.raw_payload ? rawPayload.raw_payload.base_history : [];
  const bundledHistory = historyBundle ? historyBundle.risk_history : [];
  return asArray(rawHistory).length > 0 ? asArray(rawHistory) : asArray(bundledHistory);
}

function getWindow(meetingFactPack) {
  return meetingFactPack && meetingFactPack.task_context
    ? meetingFactPack.task_context.evaluation_period
    : "unknown";
}

function taskDefinitionCompleteness(tasks, window) {
  const missing = [];
  const numerator = tasks.filter((task) => {
    const missed = [];
    if (!hasValue(task.task_name)) missed.push("task_name");
    if (!hasValue(task.owner)) missed.push("owner");
    if (!hasValue(task.due_date)) missed.push("due_date");
    if (missed.length > 0) {
      missing.push(`${task.task_id || task.id || "unknown"}:${missed.join(",")}`);
    }
    return missed.length === 0;
  }).length;

  return buildMetric({
    metricId: "task_definition_completeness_rate",
    dimension: "推进闭环力",
    label: "任务定义完整率",
    numerator,
    denominator: tasks.length,
    unit: "ratio",
    window,
    sampleScope: "Base Tasks: owner + DDL + task_name",
    missingFields: missing,
    anomalies: missing,
    evidenceRefs: tasks.slice(0, 5).map((task) => taskEvidence(task))
  });
}

function taskOverdueRate(tasks, window) {
  const dueTasks = tasks.filter((task) => hasValue(task.due_date));
  const overdueTasks = dueTasks.filter(isOverdueTask);

  return buildMetric({
    metricId: "task_overdue_rate",
    dimension: "推进闭环力",
    label: "任务延期率",
    numerator: overdueTasks.length,
    denominator: dueTasks.length,
    unit: "ratio",
    window,
    sampleScope: "Base Tasks with due_date",
    anomalies: overdueTasks.map((task) => `${task.task_id} ${task.task_name} DDL=${task.due_date}`),
    evidenceRefs: overdueTasks.slice(0, 5).map((task) => taskEvidence(task, `${task.task_name} DDL=${task.due_date} is_overdue=${task.is_overdue}`))
  });
}

function taskClosureRate(tasks, window) {
  const closedTasks = tasks.filter(isClosedTask);

  return buildMetric({
    metricId: "task_closure_rate",
    dimension: "推进闭环力",
    label: "任务关闭率",
    numerator: closedTasks.length,
    denominator: tasks.length,
    unit: "ratio",
    window,
    sampleScope: "Base Tasks closed flag/status",
    evidenceRefs: closedTasks.slice(0, 5).map((task) => taskEvidence(task, `${task.task_name} status=${task.status} is_closed=${task.is_closed}`))
  });
}

function closedTaskQualityRate(tasks, baseHistory, window) {
  const closedTasks = tasks.filter(isClosedTask);
  const historyIds = new Set(baseHistory.map((item) => item.task_id).filter(Boolean));
  const qualified = closedTasks.filter((task) =>
    hasValue(task.close_duration) &&
    hasValue(task.owner) &&
    hasValue(task.due_date) &&
    (historyIds.has(task.task_id) || hasValue(task.source_meeting_id))
  );
  const missing = closedTasks
    .filter((task) => !qualified.includes(task))
    .map((task) => task.task_id || task.id || "unknown");

  return buildMetric({
    metricId: "closed_task_quality_rate",
    dimension: "推进闭环力",
    label: "任务关闭质量代理指标",
    numerator: qualified.length,
    denominator: closedTasks.length,
    unit: "ratio",
    window,
    sampleScope: "Closed tasks with close_duration + owner + DDL + source/history trace",
    missingFields: missing,
    anomalies: missing.map((taskId) => `${taskId} 缺少关闭质量代理字段`),
    evidenceRefs: qualified.slice(0, 5).map((task) => taskEvidence(task, `${task.task_name} close_duration=${task.close_duration} source_meeting_id=${task.source_meeting_id}`))
  });
}

function currentMeetingActionTaskRate(meetingFactPack, tasks, window) {
  const meetingId = meetingFactPack.meeting_info ? meetingFactPack.meeting_info.meeting_id : "";
  const expected = meetingFactPack.metrics ? meetingFactPack.metrics.action_item_count || 0 : 0;
  const currentTasks = tasks.filter((task) => task.source_meeting_id === meetingId);
  const matchedCount = expected > 0 ? Math.min(currentTasks.length, expected) : currentTasks.length;
  const anomalies = [];

  if (currentTasks.length < expected) {
    anomalies.push(`会议行动项 ${expected} 条，任务表命中 ${currentTasks.length} 条`);
  }
  if (expected > 0 && currentTasks.length > expected) {
    anomalies.push(`会议行动项 ${expected} 条，任务表关联 ${currentTasks.length} 条，存在会后扩展任务或重复挂载`);
  }

  return buildMetric({
    metricId: "current_meeting_action_task_rate",
    dimension: "推进闭环力",
    label: "当前会议行动项入表率",
    numerator: matchedCount,
    denominator: expected,
    unit: "ratio",
    window,
    sampleScope: "Current meeting action_item_count vs Base Tasks source_meeting_id",
    anomalies,
    evidenceRefs: currentTasks.map((task) => taskEvidence(task, `${task.task_name} source_meeting_id=${task.source_meeting_id}`))
  });
}

function highRiskResolutionRate(risks, window) {
  const highRisks = risks.filter((risk) => asText(risk.risk_level).toLowerCase() === "high");
  const resolved = highRisks.filter((risk) => !isOpenRisk(risk));

  return buildMetric({
    metricId: "high_risk_resolution_rate",
    dimension: "风险治理力",
    label: "高等级风险收口率",
    numerator: resolved.length,
    denominator: highRisks.length,
    unit: "ratio",
    window,
    sampleScope: "Base Risks level=high",
    evidenceRefs: highRisks.map((risk) => riskEvidence(risk, `${risk.risk_description} followup_status=${risk.followup_status}`))
  });
}

function riskMitigationActionRate(risks, window) {
  const withAction = risks.filter((risk) => hasValue(risk.suggested_action));

  return buildMetric({
    metricId: "risk_mitigation_action_rate",
    dimension: "风险治理力",
    label: "风险缓释动作覆盖率",
    numerator: withAction.length,
    denominator: risks.length,
    unit: "ratio",
    window,
    sampleScope: "Base Risks suggested_action completeness",
    evidenceRefs: withAction.slice(0, 5).map((risk) => riskEvidence(risk, risk.suggested_action))
  });
}

function riskOpenRate(risks, window) {
  const openRisks = risks.filter(isOpenRisk);

  return buildMetric({
    metricId: "open_risk_rate",
    dimension: "风险治理力",
    label: "风险未收口占比",
    numerator: openRisks.length,
    denominator: risks.length,
    unit: "ratio",
    window,
    sampleScope: "Base Risks followup_status",
    anomalies: openRisks.map((risk) => `${risk.risk_id} ${risk.followup_status}`),
    evidenceRefs: openRisks.slice(0, 5).map((risk) => riskEvidence(risk, `${risk.risk_description} followup_status=${risk.followup_status}`))
  });
}

function repeatedRiskTypeCount(risks, window) {
  const counts = new Map();
  risks.forEach((risk) => {
    const type = asText(risk.risk_type) || "unknown";
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  const repeated = Array.from(counts.entries()).filter(([, count]) => count > 1);

  return buildMetric({
    metricId: "repeated_risk_type_count",
    dimension: "风险治理力",
    label: "同类风险复发样本数",
    numerator: repeated.reduce((sum, [, count]) => sum + count, 0),
    denominator: risks.length,
    unit: "count",
    window,
    sampleScope: "Base Risks grouped by risk_type",
    anomalies: repeated.map(([type, count]) => `${type}:${count}`),
    evidenceRefs: risks.slice(0, 5).map((risk) => riskEvidence(risk, `${risk.risk_type}: ${risk.risk_description}`))
  });
}

function decisionCoverageRate(meetings, window) {
  const withDecision = meetings.filter((meeting) => hasValue(meeting.decision_summary) || asArray(meeting.summary).length > 0);

  return buildMetric({
    metricId: "meeting_decision_coverage_rate",
    dimension: "方向校准力",
    label: "会议决策留痕覆盖率",
    numerator: withDecision.length,
    denominator: meetings.length,
    unit: "ratio",
    window,
    sampleScope: "Base Meetings decision_summary or history summary",
    evidenceRefs: withDecision.slice(0, 5).map((meeting) => meetingEvidence(meeting, meeting.decision_summary || asArray(meeting.summary).join(" | ") || meeting.meeting_title))
  });
}

function meetingActionCompletenessRate(meetings, window) {
  const actionable = meetings.filter((meeting) => Number(meeting.action_item_count || 0) > 0);

  return buildMetric({
    metricId: "meeting_action_item_coverage_rate",
    dimension: "推进闭环力",
    label: "会议行动项留痕覆盖率",
    numerator: actionable.length,
    denominator: meetings.length,
    unit: "ratio",
    window,
    sampleScope: "Base Meetings action_item_count",
    anomalies: meetings
      .filter((meeting) => Number(meeting.action_item_count || 0) === 0)
      .map((meeting) => `${meeting.meeting_id} action_item_count=0`),
    evidenceRefs: actionable.slice(0, 5).map((meeting) => meetingEvidence(meeting, `${meeting.meeting_title} action_item_count=${meeting.action_item_count}`))
  });
}

function calendarStakeholderCoverageRate(meetings, calendarEvents, contacts, window) {
  const projectMemberNames = new Set(contacts.map(contactName).filter(Boolean));
  const managerNames = new Set();

  meetings.forEach((meeting) => {
    if (Array.isArray(meeting.participants)) {
      meeting.participants
        .map(attendeeName)
        .filter(Boolean)
        .forEach((name) => managerNames.add(name));
    }
  });

  const eventsWithCoverage = calendarEvents.filter((event) => {
    const attendees = new Set(asArray(event.attendees).map(attendeeName).filter(Boolean));
    if (!attendees.size || !projectMemberNames.size) return false;
    const includesKnownProjectMember = Array.from(attendees).some((name) => projectMemberNames.has(name));
    const includesMeetingParticipant = managerNames.size === 0
      ? includesKnownProjectMember
      : Array.from(attendees).some((name) => managerNames.has(name));
    const crossFunctionalCoverage = Array.from(attendees).filter((name) => projectMemberNames.has(name)).length >= 2;
    return includesKnownProjectMember && includesMeetingParticipant && crossFunctionalCoverage;
  });

  return buildMetric({
    metricId: "calendar_stakeholder_coverage_rate",
    dimension: "协同调度力",
    label: "日历必要干系人覆盖率",
    numerator: eventsWithCoverage.length,
    denominator: calendarEvents.length || meetings.length,
    unit: "ratio",
    window,
    sampleScope: "Calendar attendees against project contacts",
    evidenceRefs: eventsWithCoverage.map((event) => calendarEvidence(event, `${event.summary} attendees=${asArray(event.attendees).join(",")}`))
  });
}

function managerChatSignalCount(chatMessages, managerName, window) {
  const managerMessages = chatMessages.filter((message) => message.sender && message.sender.name === managerName);

  return buildMetric({
    metricId: "manager_chat_signal_count",
    dimension: "协同调度力",
    label: "管理者聊天同步样本数",
    numerator: managerMessages.length,
    denominator: chatMessages.length,
    unit: "count",
    window,
    sampleScope: "Chat messages where sender is evaluation target",
    evidenceRefs: managerMessages.slice(0, 5).map((message) => chatEvidence(message))
  });
}

function lateNightPressureRate(chatMessages, managerName, window) {
  const managerMessages = chatMessages.filter((message) => message.sender && message.sender.name === managerName);
  const lateNightMessages = managerMessages.filter((message) => {
    const match = asText(message.create_time).match(/\s(\d{2}):(\d{2})/);
    if (!match) return false;
    const hour = Number(match[1]);
    return hour >= 22 || hour < 8;
  });

  return buildMetric({
    metricId: "late_night_manager_message_rate",
    dimension: "组织行为健康度",
    label: "管理者非常规时段消息占比",
    numerator: lateNightMessages.length,
    denominator: managerMessages.length,
    unit: "ratio",
    window,
    sampleScope: "Manager chat messages between 22:00 and 08:00",
    anomalies: lateNightMessages.map((message) => `${message.create_time} ${message.content}`),
    evidenceRefs: lateNightMessages.map((message) => chatEvidence(message))
  });
}

function highPressureLanguageRate(chatMessages, managerName, window) {
  const managerMessages = chatMessages.filter((message) => message.sender && message.sender.name === managerName);
  const pressurePattern = /必须|给我|不要等|不能继续|不到位|别留到/;
  const matched = managerMessages.filter((message) => pressurePattern.test(asText(message.content)));

  return buildMetric({
    metricId: "high_pressure_language_sample_rate",
    dimension: "组织行为健康度",
    label: "高压推进语言样本占比",
    numerator: matched.length,
    denominator: managerMessages.length,
    unit: "ratio",
    window,
    sampleScope: "Rule-based keyword scan on manager chat messages",
    anomalies: matched.map((message) => `${message.create_time} ${message.content}`),
    evidenceRefs: matched.map((message) => chatEvidence(message))
  });
}

function collectMetricQuality(metrics) {
  const gaps = [];
  const anomalies = [];

  metrics.forEach((metric) => {
    if (metric.status === "no_sample") {
      gaps.push(`${metric.metric_id}: 暂无样本`);
    }
    metric.missing_fields.forEach((field) => gaps.push(`${metric.metric_id}: ${field}`));
    metric.anomalies.forEach((item) => anomalies.push({
      metric_id: metric.metric_id,
      detail: item
    }));
  });

  return {
    metric_count: metrics.length,
    available_count: metrics.filter((metric) => metric.status === "available").length,
    degraded_count: metrics.filter((metric) => metric.status === "degraded").length,
    no_sample_count: metrics.filter((metric) => metric.status === "no_sample").length,
    metric_gaps: gaps,
    anomaly_samples: anomalies
  };
}

function groupMetrics(metrics) {
  return metrics.reduce((acc, metric) => {
    if (!acc[metric.dimension]) acc[metric.dimension] = [];
    acc[metric.dimension].push(metric);
    return acc;
  }, {});
}

function runHardMetricsEngine({ meetingFactPack, historyBundle, rawPayload }) {
  const tasks = collectTasks(meetingFactPack, rawPayload);
  const risks = collectRisks(meetingFactPack, rawPayload);
  const meetings = collectMeetings(meetingFactPack, rawPayload, historyBundle);
  const chatMessages = collectChatMessages(rawPayload);
  const calendarEvents = collectCalendarEvents(rawPayload);
  const contacts = collectContacts(rawPayload);
  const baseHistory = collectBaseHistory(rawPayload, historyBundle);
  const window = getWindow(meetingFactPack);
  const managerName = meetingFactPack && meetingFactPack.meeting_info ? meetingFactPack.meeting_info.manager_name : "";

  const metrics = [
    decisionCoverageRate(meetings, window),
    taskDefinitionCompleteness(tasks, window),
    taskOverdueRate(tasks, window),
    taskClosureRate(tasks, window),
    closedTaskQualityRate(tasks, baseHistory, window),
    currentMeetingActionTaskRate(meetingFactPack, tasks, window),
    highRiskResolutionRate(risks, window),
    riskMitigationActionRate(risks, window),
    riskOpenRate(risks, window),
    repeatedRiskTypeCount(risks, window),
    calendarStakeholderCoverageRate(meetings, calendarEvents, contacts, window),
    managerChatSignalCount(chatMessages, managerName, window),
    lateNightPressureRate(chatMessages, managerName, window),
    highPressureLanguageRate(chatMessages, managerName, window),
    meetingActionCompletenessRate(meetings, window)
  ];
  const quality = collectMetricQuality(metrics);

  return {
    task_context: meetingFactPack.task_context,
    generated_at: nowIso(),
    project_id: meetingFactPack.meeting_info.project_id,
    manager_id: meetingFactPack.meeting_info.manager_id,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    evaluation_period: window,
    hard_metrics_result: groupMetrics(metrics),
    metric_quality_report: {
      sample_counts: {
        task_count: tasks.length,
        risk_count: risks.length,
        meeting_count: meetings.length,
        chat_message_count: chatMessages.length,
        calendar_event_count: calendarEvents.length,
        contact_count: contacts.length,
        base_history_count: baseHistory.length
      },
      metric_count: quality.metric_count,
      available_count: quality.available_count,
      degraded_count: quality.degraded_count,
      no_sample_count: quality.no_sample_count
    },
    metric_gaps: quality.metric_gaps,
    anomaly_samples: quality.anomaly_samples
  };
}

module.exports = {
  runHardMetricsEngine
};

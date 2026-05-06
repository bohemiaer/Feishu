"use strict";

const path = require("path");
const { createTaskContext, TASK_STATUS } = require("../domain/task/task_context");
const { CASE04_SOURCE_FILES, SOURCE_GROUPS, loadCase04SampleBundle, splitPiped } = require("../integrations/sample_case04_adapter");
const { assertArtifactValid } = require("../shared/schema_validation");

const FRONT_PIPELINE_VERSION = "front-pipeline-case04-v1";

function buildTaskId(projectId, meetingId) {
  return `FRONT-${projectId}-${meetingId || "unknown"}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeMeetingDateRange(projectRecord, currentMeeting) {
  const start = projectRecord && projectRecord.start_date ? projectRecord.start_date : "2026-04-13";
  const end =
    currentMeeting && currentMeeting.meeting_time
      ? String(currentMeeting.meeting_time).slice(0, 10)
      : "2026-04-24";
  return `${start} ~ ${end}`;
}

function createTaskRequest(sampleBundle, options = {}) {
  const project = sampleBundle.project_record || {};
  const currentMeeting = sampleBundle.current_meeting || {};
  const evaluationPeriod = options.evaluationPeriod || normalizeMeetingDateRange(project, currentMeeting);

  return assertArtifactValid("task_request", {
    task_id: buildTaskId(project.project_id || sampleBundle.manifest.project_id, currentMeeting.meeting_id),
    evaluation_target: {
      manager_id: project.manager_id || sampleBundle.manifest.manager_id,
      manager_name: project.manager_name || sampleBundle.manifest.manager_name,
      project_id: project.project_id || sampleBundle.manifest.project_id,
      evaluation_period: evaluationPeriod,
      current_meeting_id: currentMeeting.meeting_id || ""
    },
    trigger_context: {
      trigger_type: options.triggerType || "manual",
      report_type: options.reportType || "single",
      audience: Array.isArray(options.audience) ? options.audience : ["pmo", "manager"]
    },
    source_config: {
      source_mode: "case04_sample_bundle",
      bundle_path: sampleBundle.bundle_root
    }
  });
}

function createRecommendedActions(blockingReasons, degradeReasons) {
  const actions = [];

  blockingReasons.forEach((reason) => {
    actions.push(`补齐阻断输入：${reason}`);
  });

  degradeReasons.forEach((reason) => {
    actions.push(`补充辅助样本：${reason}`);
  });

  return actions;
}

function buildSourceCheck(sourceName, required, sampleCount, files, status, notes) {
  return {
    source_name: sourceName,
    required,
    status,
    sample_count: sampleCount,
    files,
    notes
  };
}

function runInputCompletenessCheck(taskRequest, sampleBundle) {
  const blockingReasons = [];
  const degradeReasons = [];
  const availableSources = [];
  const missingSources = [];
  const sourceChecks = [];
  const sampleChecks = [];

  const taskFields = [
    ["evaluation_target.manager_id", taskRequest.evaluation_target.manager_id],
    ["evaluation_target.manager_name", taskRequest.evaluation_target.manager_name],
    ["evaluation_target.project_id", taskRequest.evaluation_target.project_id],
    ["evaluation_target.evaluation_period", taskRequest.evaluation_target.evaluation_period]
  ];

  taskFields.forEach(([fieldName, value]) => {
    sampleChecks.push({
      check_name: fieldName,
      status: value ? "pass" : "fail",
      detail: value ? "present" : "missing"
    });
    if (!value) {
      blockingReasons.push(`${fieldName} 缺失`);
    }
  });

  const sourceFileMap = new Map(sampleBundle.source_catalog.map((item) => [item.source_name, item.files]));
  const counts = {
    "Base 记录": sampleBundle.meetings.length + sampleBundle.tasks.length + sampleBundle.risks.length + sampleBundle.statements.length + (sampleBundle.project_record ? 1 : 0),
    "Base 历史": sampleBundle.base_history.length,
    "云文档": sampleBundle.project_docs.main_doc.content_text ? 1 : 0,
    "聊天历史": sampleBundle.chat_messages.length,
    "会议/妙记": sampleBundle.minute_items.length + sampleBundle.vc_items.length + (sampleBundle.current_transcript ? 1 : 0) + sampleBundle.meetings.length,
    "日历": sampleBundle.calendar_events.length,
    "通讯录": sampleBundle.contacts.length
  };
  const notesBySource = {
    "Base 记录": [],
    "Base 历史": [],
    "云文档": [],
    "聊天历史": [],
    "会议/妙记": [],
    "日历": [],
    "通讯录": []
  };

  if (!sampleBundle.project_record) {
    notesBySource["Base 记录"].push("项目主记录缺失");
  }
  if (!sampleBundle.current_meeting) {
    notesBySource["会议/妙记"].push("当前会议主记录缺失");
  }
  if (!sampleBundle.project_docs.main_doc.content_text) {
    notesBySource["云文档"].push("主文档内容为空");
  }
  if (!sampleBundle.current_transcript) {
    notesBySource["会议/妙记"].push("当前会议没有完整妙记转写，只能依赖会议表和其他留痕");
  }
  if (!sampleBundle.current_minute_item) {
    notesBySource["会议/妙记"].push("当前会议没有 minutes 搜索命中");
  }

  SOURCE_GROUPS.forEach((source) => {
    const files = sourceFileMap.get(source.name) || [];
    let sourceStatus = counts[source.name] > 0 ? "available" : "missing";

    if (source.name === "Base 记录" && !sampleBundle.project_record && counts[source.name] > 0) {
      sourceStatus = "insufficient";
    }
    if (source.name === "会议/妙记" && !sampleBundle.current_meeting && counts[source.name] > 0) {
      sourceStatus = "insufficient";
    }

    sourceChecks.push(
      buildSourceCheck(
        source.name,
        source.required,
        counts[source.name],
        files.map((file) => file.relative_path),
        sourceStatus,
        notesBySource[source.name]
      )
    );

    if (sourceStatus === "available") {
      availableSources.push(source.name);
    } else {
      missingSources.push(source.name);
      if (source.required) {
        blockingReasons.push(`${source.name} 缺失`);
      } else {
        degradeReasons.push(`${source.name} 缺失`);
      }
    }
  });

  if (sampleBundle.meetings.length < 1) {
    blockingReasons.push("会议主记录样本不足");
  }
  if (sampleBundle.project_record == null) {
    blockingReasons.push("项目主快照样本不足");
  }
  if (sampleBundle.minute_items.length < 1 && !sampleBundle.current_transcript) {
    blockingReasons.push("会议/妙记留痕样本不足");
  }

  if (sampleBundle.base_history.length < 1 && !missingSources.includes("Base 历史")) {
    degradeReasons.push("Base 历史样本为空");
  }
  if (sampleBundle.chat_messages.length < 1 && !missingSources.includes("聊天历史")) {
    degradeReasons.push("聊天历史样本为空");
  }
  if (sampleBundle.calendar_events.length < 1 && !missingSources.includes("日历")) {
    degradeReasons.push("日历样本为空");
  }
  if (sampleBundle.contacts.length < 1 && !missingSources.includes("通讯录")) {
    degradeReasons.push("通讯录样本为空");
  }

  sampleChecks.push({
    check_name: "project_snapshot_count",
    status: sampleBundle.project_record ? "pass" : "fail",
    detail: sampleBundle.project_record ? "1" : "0"
  });
  sampleChecks.push({
    check_name: "meeting_record_count",
    status: sampleBundle.meetings.length > 0 ? "pass" : "fail",
    detail: String(sampleBundle.meetings.length)
  });
  sampleChecks.push({
    check_name: "current_meeting_id",
    status: sampleBundle.current_meeting_id ? "pass" : "fail",
    detail: sampleBundle.current_meeting_id || "missing"
  });

  return assertArtifactValid("input_completeness_report", {
    task_id: taskRequest.task_id,
    checked_at: nowIso(),
    required_sources: SOURCE_GROUPS.filter((item) => item.required).map((item) => item.name),
    optional_sources: SOURCE_GROUPS.filter((item) => !item.required).map((item) => item.name),
    available_sources: Array.from(new Set(availableSources)),
    missing_sources: Array.from(new Set(missingSources)),
    degrade_reasons: Array.from(new Set(degradeReasons)),
    blocking_reasons: Array.from(new Set(blockingReasons)),
    source_checks: sourceChecks,
    sample_checks: sampleChecks,
    recommended_actions: createRecommendedActions(blockingReasons, degradeReasons)
  });
}

function buildOrchestrationState(taskRequest, inputReport, stage) {
  const completenessStatus =
    inputReport.blocking_reasons.length > 0
      ? "blocked"
      : inputReport.degrade_reasons.length > 0
        ? "degraded"
        : "ready";

  return assertArtifactValid("orchestration_state", {
    task_id: taskRequest.task_id,
    pipeline_version: FRONT_PIPELINE_VERSION,
    status: completenessStatus === "blocked" ? "blocked" : stage === "collected" ? "collected" : "input_checked",
    completeness_status: completenessStatus,
    current_stage: stage === "collected" ? "data_collector" : "orchestrator",
    next_step:
      completenessStatus === "blocked"
        ? "wait_for_input_completion"
        : stage === "collected"
          ? "handoff_to_hard_metrics_engine"
          : "data_collection",
    trigger_type: taskRequest.trigger_context.trigger_type,
    source_mode: taskRequest.source_config.source_mode,
    evaluation_target: taskRequest.evaluation_target,
    degrade_reasons: inputReport.degrade_reasons,
    blocking_reasons: inputReport.blocking_reasons,
    warnings: inputReport.source_checks.flatMap((item) => item.notes || []),
    updated_at: nowIso()
  });
}

function dedupeStrings(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function isClosedTask(task) {
  return String(task.is_closed || "").toLowerCase() === "true" || String(task.status || "") === "已完成";
}

function isOverdueTask(task) {
  return String(task.is_overdue || "").toLowerCase() === "true";
}

function isResolvedRisk(risk) {
  return ["resolved", "closed", "record_only"].includes(String(risk.followup_status || "").toLowerCase());
}

function addProvenance(target, entry) {
  if (!entry || !entry.source_type || !entry.source_file || !entry.source_id) {
    return;
  }
  target.push({
    source_type: entry.source_type,
    source_file: entry.source_file,
    source_id: entry.source_id,
    timestamp: entry.timestamp || "",
    excerpt: entry.excerpt || ""
  });
}

function buildCurrentMeetingTasks(tasks, meetingId, countHint) {
  const currentTasks = tasks.filter((task) => task.source_meeting_id === meetingId);
  if (countHint > 0 && currentTasks.length > countHint) {
    return currentTasks.slice(0, countHint);
  }
  return currentTasks;
}

function buildHistoryBundle(sampleBundle, currentMeetingId) {
  const historyMeetings = sampleBundle.meetings
    .filter((meeting) => meeting.meeting_id !== currentMeetingId)
    .sort(compareMeetingByTimeDesc)
    .slice(0, 3);

  const riskHistory = sampleBundle.base_history
    .filter((item) => item.risk_id || item.record_id)
    .map((item) => ({
      record_id: item.record_id || "",
      task_id: item.task_id || "",
      risk_id: item.risk_id || "",
      field_changes: item.field_changes || []
    }));

  const taskClosureNotes = sampleBundle.tasks
    .filter((task) => isClosedTask(task) || isOverdueTask(task))
    .slice(0, 6)
    .map((task) => `${task.task_id} ${task.task_name} 状态=${task.status} owner=${task.owner} DDL=${task.due_date}`);

  const riskNotes = sampleBundle.risks
    .slice(0, 6)
    .map((risk) => `${risk.risk_id} ${risk.risk_description} 跟进状态=${risk.followup_status}`);

  return assertArtifactValid("history_bundle", {
    recent_meetings: historyMeetings.map((meeting) => ({
      meeting_id: meeting.meeting_id,
      meeting_title: meeting.meeting_title,
      meeting_time: meeting.meeting_time,
      review_status: meeting.review_status,
      summary: dedupeStrings(
        splitPiped(meeting.manager_speech_summary).concat(splitPiped(meeting.decision_summary))
      ).slice(0, 4)
    })),
    past_evaluations: [],
    risk_history: riskHistory,
    history_meetings: historyMeetings.map((meeting) => ({
      meeting_id: meeting.meeting_id,
      summary: `${meeting.meeting_title}：${dedupeStrings(splitPiped(meeting.manager_speech_summary)).slice(0, 2).join("；")}`
    })),
    task_closure_notes: taskClosureNotes,
    risk_notes: riskNotes
  });
}

function compareMeetingByTimeDesc(left, right) {
  const a = String(left.meeting_time || "");
  const b = String(right.meeting_time || "");
  return a < b ? 1 : a > b ? -1 : 0;
}

function buildProjectGoal(projectDocs) {
  const highlights = projectDocs.main_doc.highlights || [];
  return highlights.slice(0, 4).join("；") || "本轮优先降低高频异常和跨团队协同成本";
}

function buildDocumentSnapshot(projectDocs) {
  return {
    project_goal: buildProjectGoal(projectDocs),
    weekly_highlights: dedupeStrings(projectDocs.weekly_report.highlights).slice(0, 8),
    review_highlights: dedupeStrings(projectDocs.review_doc.highlights).slice(0, 8),
    main_doc_excerpt: projectDocs.main_doc.content_text.slice(0, 600),
    review_doc_excerpt: projectDocs.review_doc.content_text.slice(0, 400)
  };
}

function buildRawPayload(taskRequest, sampleBundle) {
  const sourceFiles = sampleBundle.source_files || CASE04_SOURCE_FILES;
  const projectDocs = sampleBundle.project_docs;
  const currentMeetingTasks = buildCurrentMeetingTasks(
    sampleBundle.tasks,
    taskRequest.evaluation_target.current_meeting_id,
    sampleBundle.current_meeting ? sampleBundle.current_meeting.action_item_count : 0
  );
  const currentStatements = sampleBundle.statements.filter(
    (statement) => statement.meeting_id === taskRequest.evaluation_target.current_meeting_id
  );
  const meetingDocs = [
    {
      doc_type: "meeting_record",
      meeting_id: sampleBundle.current_meeting_id,
      title: sampleBundle.current_meeting ? sampleBundle.current_meeting.meeting_title : "",
      content_text: [
        `会议时间：${sampleBundle.current_meeting ? sampleBundle.current_meeting.meeting_time : ""}`,
        `管理者发言：${splitPiped(sampleBundle.current_meeting ? sampleBundle.current_meeting.manager_speech_summary : "").join("；")}`,
        `会议决策：${splitPiped(sampleBundle.current_meeting ? sampleBundle.current_meeting.decision_summary : "").join("；")}`,
        `会议风险：${splitPiped(sampleBundle.current_meeting ? sampleBundle.current_meeting.risk_summary : "").join("；")}`
      ].join("\n"),
      source_file: sourceFiles.baseMeetings
    },
    {
      doc_type: "minutes_transcript",
      meeting_id: sampleBundle.current_transcript ? sampleBundle.current_transcript.meeting_id : "",
      title: sampleBundle.current_transcript ? sampleBundle.current_transcript.title : "",
      content_text: sampleBundle.current_transcript
        ? (sampleBundle.current_transcript.segments || [])
          .map((segment) => `${segment.start} ${segment.speaker}: ${segment.text}`)
          .join("\n")
        : "",
      source_file: sourceFiles.minutesTranscript
    },
    {
      doc_type: "statement_records",
      meeting_id: sampleBundle.current_meeting_id,
      title: "Statements 证据",
      content_text: currentStatements.map((item) => item.statement_summary).join("\n"),
      source_file: sourceFiles.baseStatements
    }
  ];

  return assertArtifactValid("raw_payload", {
    evaluation_target: {
      manager_id: taskRequest.evaluation_target.manager_id,
      manager_name: taskRequest.evaluation_target.manager_name,
      project_id: taskRequest.evaluation_target.project_id,
      evaluation_period: taskRequest.evaluation_target.evaluation_period
    },
    raw_payload: {
      base_snapshot: {
        project: sampleBundle.project_record,
        tasks: sampleBundle.tasks,
        risks: sampleBundle.risks,
        meetings: sampleBundle.meetings,
        statements: sampleBundle.statements
      },
      base_history: sampleBundle.base_history,
      meeting_docs: meetingDocs,
      project_docs: [projectDocs.main_doc, projectDocs.weekly_report, projectDocs.review_doc],
      chat_history: sampleBundle.chat_messages,
      calendar_events: sampleBundle.calendar_events,
      org_contacts: sampleBundle.contacts,
      source_catalog: sampleBundle.source_catalog,
      current_meeting_tasks: currentMeetingTasks
    }
  });
}

function buildMissingFields(sampleBundle, currentMeeting) {
  const missing = [];
  if (!sampleBundle.project_record) missing.push("base_snapshot.project");
  if (!currentMeeting) missing.push("base_snapshot.current_meeting");
  if (!sampleBundle.project_docs.main_doc.content_text) missing.push("project_docs.main_doc");
  if (!sampleBundle.current_transcript) missing.push("meeting_docs.current_transcript");
  return missing;
}

function buildDataQualityReport(taskRequest, sampleBundle, inputReport, historyBundle) {
  const warnings = [];
  const issues = [];

  if (!sampleBundle.current_transcript) {
    warnings.push("当前会议没有完整妙记转写，当前会议事实将更多依赖会议表和 Statements。");
  }

  if (sampleBundle.meetings.some((meeting) => meeting.initial_status === "summary_only")) {
    warnings.push("历史会议中存在 summary_only 样本，历史复核时需降低留痕置信度。");
  }

  if (sampleBundle.chat_messages.some((message) => /下午茶|值班安排|点餐/.test(String(message.content || "")))) {
    warnings.push("聊天样本中混入行政或噪音消息，后续使用时需按线程和关键词过滤。");
  }

  if (sampleBundle.tasks.some((task) => !task.owner || !task.due_date)) {
    issues.push("任务表存在 owner 或 DDL 缺失项。");
  }

  if (sampleBundle.tasks.some((task) => /下一阶段/.test(String(task.due_date || "")))) {
    issues.push("部分任务 DDL 不是精确时间，后续硬指标计算需做降级处理。");
  }

  return assertArtifactValid("data_quality_report", {
    task_id: taskRequest.task_id,
    checked_at: nowIso(),
    current_meeting_id: sampleBundle.current_meeting_id,
    coverage_status:
      inputReport.blocking_reasons.length > 0
        ? "blocked"
        : inputReport.degrade_reasons.length > 0
          ? "degraded"
          : "ready",
    source_coverage: inputReport.source_checks,
    sample_counts: {
      meeting_count: sampleBundle.meetings.length,
      history_meeting_count: historyBundle.history_meetings.length,
      task_count: sampleBundle.tasks.length,
      risk_count: sampleBundle.risks.length,
      statement_count: sampleBundle.statements.length,
      chat_message_count: sampleBundle.chat_messages.length,
      calendar_event_count: sampleBundle.calendar_events.length,
      contact_count: sampleBundle.contacts.length
    },
    warnings,
    issues,
    recommended_actions: dedupeStrings(inputReport.recommended_actions.concat([
      "后续接入 Hard Metrics Engine 时，对模糊 DDL 和补录摘要样本单独做降级口径。"
    ]))
  });
}

function buildMeetingFactPack(taskRequest, sampleBundle, rawPayload, historyBundle) {
  const sourceFiles = sampleBundle.source_files || CASE04_SOURCE_FILES;
  const currentMeeting = sampleBundle.current_meeting || {};
  const project = sampleBundle.project_record || {};
  const currentTasks = rawPayload.raw_payload.current_meeting_tasks || [];
  const openTasks = sampleBundle.tasks.filter((task) => !isClosedTask(task));
  const overdueTasks = sampleBundle.tasks.filter(isOverdueTask);
  const openRisks = sampleBundle.risks.filter((risk) => !isResolvedRisk(risk));
  const currentStatements = sampleBundle.statements.filter(
    (statement) => statement.meeting_id === sampleBundle.current_meeting_id
  );
  const provenanceRefs = [];

  addProvenance(provenanceRefs, {
    source_type: "base_record",
    source_file: sourceFiles.baseProjects,
    source_id: project.project_id,
    timestamp: project.start_date,
    excerpt: project.project_name
  });
  addProvenance(provenanceRefs, {
    source_type: "base_record",
    source_file: sourceFiles.baseMeetings,
    source_id: currentMeeting.meeting_id,
    timestamp: currentMeeting.meeting_time,
    excerpt: currentMeeting.meeting_title
  });
  addProvenance(provenanceRefs, {
    source_type: "cloud_doc",
    source_file: sourceFiles.cloudDoc,
    source_id: sampleBundle.project_docs.main_doc.doc_id,
    timestamp: String(sampleBundle.project_docs.main_doc.revision_id || ""),
    excerpt: buildProjectGoal(sampleBundle.project_docs)
  });

  if (sampleBundle.current_transcript) {
    addProvenance(provenanceRefs, {
      source_type: "minutes",
      source_file: sourceFiles.minutesTranscript,
      source_id: sampleBundle.current_transcript.minute_token,
      timestamp: sampleBundle.current_transcript.meeting_id,
      excerpt: (sampleBundle.current_transcript.summary || []).slice(0, 2).join("；")
    });
  }

  currentStatements.slice(0, 4).forEach((statement) => {
    addProvenance(provenanceRefs, {
      source_type: "statement",
      source_file: sourceFiles.baseStatements,
      source_id: statement.statement_id,
      timestamp: statement.meeting_id,
      excerpt: statement.statement_summary
    });
  });

  sampleBundle.chat_messages
    .filter((message) => message.sender && message.sender.name === taskRequest.evaluation_target.manager_name)
    .slice(0, 4)
    .forEach((message) => {
      addProvenance(provenanceRefs, {
        source_type: "chat",
        source_file: sourceFiles.chatMessages,
        source_id: message.message_id,
        timestamp: message.create_time,
        excerpt: message.content
      });
    });

  if (sampleBundle.current_calendar_event) {
    addProvenance(provenanceRefs, {
      source_type: "calendar",
      source_file: sourceFiles.calendar,
      source_id: sampleBundle.current_calendar_event.event_id,
      timestamp: sampleBundle.current_calendar_event.start_time,
      excerpt: sampleBundle.current_calendar_event.summary
    });
  }

  return assertArtifactValid("meeting_fact_pack", {
    task_context: createTaskContext({
      task_id: taskRequest.task_id,
      project_id: taskRequest.evaluation_target.project_id,
      manager_id: taskRequest.evaluation_target.manager_id,
      meeting_id: sampleBundle.current_meeting_id,
      evaluation_period: taskRequest.evaluation_target.evaluation_period,
      status: TASK_STATUS.COLLECTED
    }),
    meeting_info: {
      meeting_id: sampleBundle.current_meeting_id,
      project_id: taskRequest.evaluation_target.project_id,
      manager_id: taskRequest.evaluation_target.manager_id,
      manager_name: taskRequest.evaluation_target.manager_name,
      meeting_title: currentMeeting.meeting_title || "",
      meeting_time: currentMeeting.meeting_time || "",
      participants:
        currentMeeting.participants && currentMeeting.participants.length > 0
          ? currentMeeting.participants
          : sampleBundle.current_calendar_event
            ? sampleBundle.current_calendar_event.attendees || []
            : [],
      calendar_event_id: sampleBundle.current_calendar_event ? sampleBundle.current_calendar_event.event_id : "",
      review_status: currentMeeting.review_status || ""
    },
    meeting_facts: {
      manager_speech_summary: splitPiped(currentMeeting.manager_speech_summary),
      decisions: splitPiped(currentMeeting.decision_summary),
      risks_mentioned: splitPiped(currentMeeting.risk_summary),
      action_items: currentTasks.map((task) => task.task_name),
      transcript_segments: sampleBundle.current_transcript ? sampleBundle.current_transcript.segments || [] : [],
      statement_evidence: currentStatements,
      noise_signals: sampleBundle.current_transcript ? sampleBundle.current_transcript.noise || [] : []
    },
    project_snapshot: {
      project_name: project.project_name || "",
      project_stage: project.project_stage || "",
      project_health: project.health_status || "",
      open_tasks: openTasks,
      overdue_tasks: overdueTasks,
      open_risks: openRisks,
      all_tasks: sampleBundle.tasks,
      all_risks: sampleBundle.risks
    },
    document_snapshot: buildDocumentSnapshot(sampleBundle.project_docs),
    metrics: {
      action_item_count: currentMeeting.action_item_count || currentTasks.length,
      open_task_count: openTasks.length,
      overdue_task_count: overdueTasks.length,
      open_risk_count: openRisks.length,
      total_task_count: sampleBundle.tasks.length,
      total_risk_count: sampleBundle.risks.length,
      historical_meeting_count: historyBundle.history_meetings.length
    },
    missing_fields: buildMissingFields(sampleBundle, currentMeeting),
    provenance_refs: provenanceRefs
  });
}

function collectFrontData(taskRequest, sampleBundle, inputReport) {
  const rawPayload = buildRawPayload(taskRequest, sampleBundle);
  const historyBundle = buildHistoryBundle(sampleBundle, sampleBundle.current_meeting_id);
  const meetingFactPack = buildMeetingFactPack(taskRequest, sampleBundle, rawPayload, historyBundle);
  const dataQualityReport = buildDataQualityReport(taskRequest, sampleBundle, inputReport, historyBundle);

  return {
    raw_payload: rawPayload,
    history_bundle: historyBundle,
    meeting_fact_pack: meetingFactPack,
    data_quality_report: dataQualityReport
  };
}

function runFrontPipeline(options = {}) {
  const bundleRoot = path.resolve(options.bundlePath || "data/fixtures/feishu_cli_case_04_simulated_5d");
  const sampleBundle = loadCase04SampleBundle(bundleRoot, {
    meetingId: options.meetingId
  });
  const taskRequest = createTaskRequest(sampleBundle, options);
  const inputCompletenessReport = runInputCompletenessCheck(taskRequest, sampleBundle);
  const initialState = buildOrchestrationState(taskRequest, inputCompletenessReport, "input_checked");

  if (initialState.completeness_status === "blocked") {
    return {
      task_request: taskRequest,
      orchestration_state: initialState,
      input_completeness_report: inputCompletenessReport
    };
  }

  const collected = collectFrontData(taskRequest, sampleBundle, inputCompletenessReport);
  return {
    task_request: taskRequest,
    orchestration_state: buildOrchestrationState(taskRequest, inputCompletenessReport, "collected"),
    input_completeness_report: inputCompletenessReport,
    raw_payload: collected.raw_payload,
    history_bundle: collected.history_bundle,
    meeting_fact_pack: collected.meeting_fact_pack,
    data_quality_report: collected.data_quality_report
  };
}

module.exports = {
  FRONT_PIPELINE_VERSION,
  createTaskRequest,
  runFrontPipeline
};

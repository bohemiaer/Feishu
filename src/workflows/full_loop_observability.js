"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeText } = require("../shared/fs_utils");
const { writeArtifactJson } = require("../shared/schema_validation");
const { buildArtifactFileIndex } = require("./artifact_files");
const { collectObservabilityIssues, flattenMetrics } = require("./observability_issues");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

function table(headers, rows) {
  return [
    `| ${headers.map(esc).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(esc).join(" | ")} |`)
  ].join("\n");
}

function statusIcon(value) {
  if (["ready", "collected", "completed", "available"].includes(value)) return "正常";
  if (["degraded", "warning"].includes(value)) return "降级";
  if (["blocked", "failed", "missing"].includes(value)) return "阻塞";
  return value || "";
}

function formatNumber(value) {
  if (typeof value !== "number") return value;
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 10000) / 10000);
}

function flattenMetricsWithDimension(hardMetricsResult) {
  return flattenMetrics(hardMetricsResult)
    .map((metric) => ({ dimension: metric.dimension || "", ...metric }));
}

function defaultObject(value, fallback) {
  return value && typeof value === "object" ? value : fallback;
}

function inferCompletenessStatus(completeness, orchestration, dataQuality) {
  if (completeness && completeness.completeness_status) {
    return completeness.completeness_status;
  }
  if (orchestration && orchestration.completeness_status) {
    return orchestration.completeness_status;
  }
  if (dataQuality && dataQuality.coverage_status) {
    return dataQuality.coverage_status;
  }
  return "missing";
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function localizeTitle(title) {
  const normalized = String(title || "").trim();
  if (!normalized) return "";
  return normalized.replace(/Full Loop Observability/gi, "全链路可观测报告");
}

function localizeNodeName(name) {
  const mapping = {
    "Run Total": "总运行",
    "Front Pipeline": "前置流水线",
    "Hard Metrics": "硬指标引擎",
    "Evaluation Planner": "评估规划器",
    "Management Reviewer": "管理评审专家",
    "Risk & Behavior Auditor": "风险与行为审计专家",
    "Coordination Lens": "协同视角专家",
    "Capability Assessor": "能力评估专家",
    "Report Writer": "报告生成器"
  };
  return mapping[name] || name;
}

function localizeStatusText(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.includes("/")) {
    return text.split("/").map((item) => localizeStatusText(item)).join("/");
  }
  const mapping = {
    completed: "已完成",
    degraded: "降级",
    blocked: "阻塞",
    failed: "失败",
    missing: "缺失",
    ready: "就绪",
    collected: "已采集",
    available: "可用",
    warning: "告警",
    degraded_evaluation: "降级评估",
    skipped_model_disabled: "已跳过（未调用模型）",
    missing_result: "缺少结果",
    request_only: "仅生成请求",
    not_run: "未运行"
  };
  if (mapping[text]) return mapping[text];
  const icon = statusIcon(text);
  return icon !== text ? icon : text;
}

function localizeValueText(value) {
  const text = String(value || "").trim();
  const mapping = {
    observation: "观察项",
    strength: "优势",
    risk: "风险",
    opportunity: "机会",
    high: "高",
    medium: "中",
    low: "低",
    true: "是",
    false: "否"
  };
  return mapping[text] || text;
}

function localizeReportSection(value) {
  const mapping = {
    score_overview: "评分概览",
    key_evidence: "关键证据",
    risk_alerts: "风险提醒",
    next_actions: "下一步动作"
  };
  return mapping[value] || value;
}

function inferCaseLabel(inputDir, taskRequest, hardMetrics) {
  const candidates = [
    inputDir,
    taskRequest && taskRequest.task_id,
    hardMetrics && hardMetrics.project_id,
    hardMetrics && hardMetrics.meeting_id
  ].filter(Boolean);

  for (const candidate of candidates) {
    const match = String(candidate).match(/case[-_ ]?0?(\d+)/i);
    if (match) {
      return `Case ${match[1].padStart(2, "0")}`;
    }
  }

  return "全链路";
}

function buildEvidenceIndex(raw, meetingFactPack, hardMetrics, expertResults = {}) {
  const index = new Map();

  function add(sourceType, sourceFile, sourceId, timestamp, excerpt, evidenceLabel) {
    if (!sourceId) return;
    const item = {
      source_type: sourceType,
      source_file: sourceFile,
      source_id: sourceId,
      timestamp: timestamp || "",
      excerpt: excerpt || "",
      evidence_label: evidenceLabel || sourceId
    };
    index.set(sourceId, item);
    index.set(`${sourceType}:${sourceId}`, item);
  }

  const base = raw.base_snapshot || {};
  (base.tasks || []).forEach((task) => add(
    "base_task",
    "03_task_risk_register/base_tasks_record_list.json",
    task.task_id || task.id,
    task.due_date,
    `${task.task_name || ""} owner=${task.owner || ""} status=${task.status || ""} DDL=${task.due_date || ""}`,
    task.task_name
  ));
  (base.risks || []).forEach((risk) => add(
    "base_risk",
    "03_task_risk_register/base_risks_record_list.json",
    risk.risk_id || risk.id,
    risk.meeting_id,
    `${risk.risk_description || ""} level=${risk.risk_level || ""} followup_status=${risk.followup_status || ""} suggested_action=${risk.suggested_action || ""}`,
    risk.risk_description
  ));
  (base.meetings || []).forEach((meeting) => add(
    "base_meeting",
    "04_meetings/base_meetings_record_list.json",
    meeting.meeting_id || meeting.id,
    meeting.meeting_time,
    `${meeting.meeting_title || ""}: ${meeting.decision_summary || meeting.manager_speech_summary || ""}`,
    meeting.meeting_title
  ));
  (base.statements || []).forEach((statement) => {
    add(
      "base_statement",
      "04_meetings/base_statements_record_list.json",
      statement.statement_id || statement.id,
      statement.meeting_id,
      `${statement.statement_summary || ""} | ${statement.evidence_ref || ""}`,
      statement.statement_summary
    );
    add(
      "base_statement",
      "04_meetings/base_statements_record_list.json",
      statement.id,
      statement.meeting_id,
      `${statement.statement_summary || ""} | ${statement.evidence_ref || ""}`,
      statement.statement_summary
    );
  });
  (raw.chat_history || []).forEach((message) => add(
    "chat",
    "02_chats/im_messages_search_user.json",
    message.message_id,
    message.create_time,
    message.content,
    `${message.sender && message.sender.name ? message.sender.name : "unknown"} ${message.create_time || ""}`
  ));
  (raw.calendar_events || []).forEach((event) => add(
    "calendar",
    "06_calendar/calendar_events_instance_view.json",
    event.event_id,
    event.start_time,
    `${event.summary || ""} attendees=${(event.attendees || []).join(",")}`,
    event.summary
  ));
  (meetingFactPack && meetingFactPack.provenance_refs || []).forEach((ref) => add(
    ref.source_type,
    ref.source_file,
    ref.source_id,
    ref.timestamp,
    ref.excerpt,
    ref.source_id
  ));
  flattenMetricsWithDimension(hardMetrics).forEach((metric) => add(
    "hard_metric",
    "hard_metrics_result.json",
    metric.metric_id,
    hardMetrics.generated_at,
    `${metric.label}: ${metric.calculation ? metric.calculation.expression : ""} = ${formatNumber(metric.value)}; ${metric.formula ? metric.formula.formula : ""}`,
    metric.label
  ));

  [
    {
      result: expertResults.managementResult,
      result_file: "management_reviewer_result.json",
      key: "management_reviewer_result",
      label: "Management Reviewer"
    },
    {
      result: expertResults.riskResult,
      result_file: "risk_behavior_auditor_result.json",
      key: "risk_behavior_auditor_result",
      label: "Risk & Behavior Auditor"
    },
    {
      result: expertResults.coordinationResult,
      result_file: "coordination_lens_result.json",
      key: "coordination_lens_result",
      label: "Coordination Lens"
    }
  ].forEach((entry) => {
    (entry.result && Array.isArray(entry.result.dimension_findings) ? entry.result.dimension_findings : []).forEach((item, indexNumber) => {
      const summary = typeof item === "string"
        ? item
        : item.summary || item.description || "";
      add(
        "expert_finding",
        entry.result_file,
        `${entry.key}.dimension_findings[${indexNumber}]`,
        entry.result && entry.result.meeting_id ? entry.result.meeting_id : "",
        summary,
        `${entry.label} #${indexNumber + 1}`
      );
    });
  });

  return index;
}

function normalizeRefs(refs) {
  if (!Array.isArray(refs)) return [];
  return refs.flatMap((ref) => {
    if (!ref) return [];
    if (typeof ref === "string") {
      const ids = ref.match(/[A-Za-z]+[.\-_][A-Za-z0-9.\-_]+|[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*/g) || [];
      return ids.length > 0 ? ids : [ref];
    }
    if (typeof ref === "object") {
      return [ref.source_id || ref.id || ref.metric_id || JSON.stringify(ref)];
    }
    return [String(ref)];
  });
}

function resolveEvidence(refs, evidenceIndex, unresolvedRefs = [], contextLabel = "") {
  return normalizeRefs(refs).map((ref) => {
    const found = evidenceIndex.get(ref) || evidenceIndex.get(`hard_metric:${ref}`);
    if (found) {
      return `${found.source_type}:${found.source_id} (${found.timestamp || "无时间"}) 原文: ${found.excerpt}`;
    }
    unresolvedRefs.push({
      context: contextLabel,
      ref: String(ref)
    });
    return `[UNRESOLVED_REF] ${String(ref)}`;
  }).slice(0, 6).join("<br>");
}

function findingRows(result, sourceName, evidenceIndex, unresolvedRefs) {
  return (result && Array.isArray(result.dimension_findings) ? result.dimension_findings : []).map((item, index) => {
    if (typeof item === "string") {
      return [
        sourceName,
        index + 1,
        "",
        "观察项",
        "",
        item,
        ""
      ];
    }
    return [
      sourceName,
      index + 1,
      item.dimension || "",
      localizeValueText(item.finding_type || item.type || ""),
      item.confidence ?? "",
      item.summary || item.description || "",
      resolveEvidence(item.evidence_refs || item.evidence_quotes || [], evidenceIndex, unresolvedRefs, `${sourceName} finding #${index + 1}`)
    ];
  });
}

function collectRuntimeRows(observabilitySummary) {
  if (!observabilitySummary) return [];

  const rows = [
    [
      "Run Total",
      localizeStatusText(observabilitySummary.run_status || ""),
      observabilitySummary.total_duration_ms || 0,
      observabilitySummary.call_model,
      observabilitySummary.error_message || ""
    ],
    [
      "Front Pipeline",
      `${localizeStatusText(observabilitySummary.front_pipeline && observabilitySummary.front_pipeline.status || "")}/${localizeStatusText(observabilitySummary.front_pipeline && observabilitySummary.front_pipeline.completeness_status || "")}`,
      observabilitySummary.front_pipeline && observabilitySummary.front_pipeline.duration_ms || 0,
      false,
      ""
    ],
    [
      "Hard Metrics",
      localizeStatusText(observabilitySummary.hard_metrics && observabilitySummary.hard_metrics.metric_quality_report ? "ready" : "missing"),
      observabilitySummary.hard_metrics && observabilitySummary.hard_metrics.duration_ms || 0,
      false,
      ""
    ],
    [
      "Evaluation Planner",
      localizeStatusText(observabilitySummary.evaluation_plan && observabilitySummary.evaluation_plan.execution_mode || ""),
      observabilitySummary.evaluation_plan && observabilitySummary.evaluation_plan.duration_ms || 0,
      false,
      ""
    ]
  ];

  return rows.concat((observabilitySummary.agent_runs || []).map((item) => [
    localizeNodeName(item.display_name),
    statusIcon(item.status),
    item.duration_ms || 0,
    item.model_invoked,
    item.error_message || ""
  ]));
}

function buildFullLoopObservabilityArtifacts(options) {
  const inputDir = path.resolve(options.inputDir);
  const taskRequest = readOptionalJson(path.join(inputDir, "task_request.json"));
  const orchestrationArtifact = readOptionalJson(path.join(inputDir, "orchestration_state.json"));
  const completenessArtifact = readOptionalJson(path.join(inputDir, "input_completeness_report.json"));
  const rawPayloadArtifact = readOptionalJson(path.join(inputDir, "raw_payload.json"));
  const historyBundleArtifact = readOptionalJson(path.join(inputDir, "history_bundle.json"));
  const meetingFactPackArtifact = readOptionalJson(path.join(inputDir, "meeting_fact_pack.json"));
  const dataQualityArtifact = readOptionalJson(path.join(inputDir, "data_quality_report.json"));
  const hardMetricsArtifact = readOptionalJson(path.join(inputDir, "hard_metrics_result.json"));
  const evaluationPlanArtifact = readOptionalJson(path.join(inputDir, "evaluation_plan.json"));
  const managementRequestArtifact = readOptionalJson(path.join(inputDir, "management_reviewer_request.json"));
  const riskRequestArtifact = readOptionalJson(path.join(inputDir, "risk_behavior_auditor_request.json"));
  const coordinationRequestArtifact = readOptionalJson(path.join(inputDir, "coordination_lens_request.json"));
  const managementResultArtifact = readOptionalJson(path.join(inputDir, "management_reviewer_result.json"));
  const riskResultArtifact = readOptionalJson(path.join(inputDir, "risk_behavior_auditor_result.json"));
  const coordinationResultArtifact = readOptionalJson(path.join(inputDir, "coordination_lens_result.json"));
  const capabilityRequestArtifact = readOptionalJson(path.join(inputDir, "capability_assessor_request.json"));
  const capabilityResultArtifact = readOptionalJson(path.join(inputDir, "capability_assessor_result.json"));
  const reportRequestArtifact = readOptionalJson(path.join(inputDir, "report_writer_request.json"));
  const reportResultArtifact = readOptionalJson(path.join(inputDir, "report_result.json"));
  const observabilitySummary = readOptionalJson(path.join(inputDir, "observability_summary.json"));

  const orchestration = defaultObject(orchestrationArtifact, {
    status: "missing",
    completeness_status: "missing",
    blocking_reasons: [],
    degrade_reasons: []
  });
  const completeness = defaultObject(completenessArtifact, {
    completeness_status: "missing",
    available_sources: [],
    missing_sources: [],
    blocking_reasons: [],
    degrade_reasons: []
  });
  const rawPayload = defaultObject(rawPayloadArtifact, { raw_payload: {} });
  const historyBundle = defaultObject(historyBundleArtifact, {
    recent_meetings: [],
    risk_history: []
  });
  const meetingFactPack = defaultObject(meetingFactPackArtifact, {
    provenance_refs: [],
    meeting_facts: {
      action_items: [],
      decisions: [],
      risks_mentioned: []
    }
  });
  const dataQuality = defaultObject(dataQualityArtifact, {
    coverage_status: "missing",
    source_coverage: [],
    warnings: [],
    issues: []
  });
  const hardMetrics = defaultObject(hardMetricsArtifact, {
    project_id: "",
    manager_id: "",
    meeting_id: "",
    evaluation_period: "",
    generated_at: "",
    hard_metrics_result: {},
    metric_quality_report: {}
  });
  const evaluationPlan = defaultObject(evaluationPlanArtifact, {
    evaluation_focus: { focus_dimensions: [] },
    execution_plan: { execution_mode: "missing", agent_plan: [] },
    human_review_rules: []
  });
  const managementRequest = defaultObject(managementRequestArtifact, { hard_metrics: [] });
  const riskRequest = defaultObject(riskRequestArtifact, { hard_metrics: [] });
  const coordinationRequest = defaultObject(coordinationRequestArtifact, { hard_metrics: [] });
  const managementResult = managementResultArtifact;
  const riskResult = riskResultArtifact;
  const coordinationResult = coordinationResultArtifact;
  const capabilityRequest = defaultObject(capabilityRequestArtifact, { hard_metrics: [] });
  const capabilityResult = defaultObject(capabilityResultArtifact, {
    assessment_status: "missing",
    dimension_scores: [],
    overall_assessment: null,
    human_review_items: [],
    missing_upstream_results: []
  });
  const reportRequest = defaultObject(reportRequestArtifact, {});
  const reportResult = defaultObject(reportResultArtifact, {
    report_status: "missing",
    report_title: "",
    report_type: "",
    score_overview: [],
    key_evidence: [],
    risk_alerts: [],
    human_review_items: [],
    next_actions: [],
    base_writeback_payload: {},
    missing_upstream_results: []
  });

  const raw = rawPayload.raw_payload || {};
  const quality = hardMetrics.metric_quality_report || {};
  const missingArtifacts = [
    ["hard_metrics_result.json", hardMetricsArtifact],
    ["evaluation_plan.json", evaluationPlanArtifact],
    ["management_reviewer_result.json", managementResultArtifact],
    ["risk_behavior_auditor_result.json", riskResultArtifact],
    ["coordination_lens_result.json", coordinationResultArtifact],
    ["capability_assessor_result.json", capabilityResultArtifact],
    ["report_result.json", reportResultArtifact]
  ].filter(([, artifact]) => !artifact).map(([label]) => label);
  const unresolvedRefs = [];
  const evidenceIndex = buildEvidenceIndex(raw, meetingFactPack, hardMetrics, {
    managementResult,
    riskResult,
    coordinationResult
  });
  const inferredCompletenessStatus = inferCompletenessStatus(completenessArtifact, orchestration, dataQualityArtifact);
  const caseLabel = localizeTitle(options.title) || `${inferCaseLabel(inputDir, taskRequest, hardMetrics)}可观测报告`;
  const doc = [];

  doc.push(`# ${caseLabel}`);
  doc.push("");
  doc.push(`文档生成时间：${new Date().toISOString()}`);
  if (observabilitySummary && observabilitySummary.run_finished_at) {
    doc.push(`运行结束时间：${observabilitySummary.run_finished_at}`);
  }
  doc.push("");
  doc.push("## 运行概览");
  doc.push("");
  doc.push("说明：本节用于快速查看本次运行的业务上下文、整体状态，以及上下游结果是否完整。");
  doc.push("");
  doc.push(table(
    ["字段", "值"],
    [
      ["项目 ID", hardMetrics.project_id],
      ["管理者 ID", hardMetrics.manager_id],
      ["会议 ID", hardMetrics.meeting_id],
      ["评估周期", hardMetrics.evaluation_period],
      ["编排状态", statusIcon(orchestration.status)],
      ["完整性状态", statusIcon(inferredCompletenessStatus)],
      ["能力评估状态", statusIcon(capabilityResult.assessment_status)],
      ["报告状态", statusIcon(reportResult.report_status)],
      ["能力评估缺失上游", (capabilityResult.missing_upstream_results || []).join(", ") || "无"],
      ["报告缺失上游", (reportResult.missing_upstream_results || []).join(", ") || "无"]
    ]
  ));

  if (missingArtifacts.length > 0) {
    doc.push("");
    doc.push("## 缺失产物");
    doc.push("");
    doc.push("说明：本节列出当前目录中缺失的关键产物，便于判断是流程未执行到，还是执行失败或被跳过。");
    doc.push("");
    doc.push(missingArtifacts.map((item) => `- ${item}`).join("\n"));
  }

  if (observabilitySummary) {
    doc.push("");
    doc.push("## 运行时观测");
    doc.push("");
    doc.push("说明：本节关注整轮运行和主要节点的耗时、状态、是否调用模型以及错误信息。");
    doc.push("");
    doc.push(table(
      ["节点", "状态", "耗时（毫秒）", "是否调用模型", "错误信息"],
      collectRuntimeRows(observabilitySummary)
    ));
  }

  doc.push("");
  doc.push("## 节点观测");
  doc.push("");
  doc.push("说明：本节逐个节点说明主要产物和关键计数，便于判断每个模块到底产出了什么、规模有多大。");
  doc.push("");
  doc.push(table(
    ["节点", "状态", "主要产物", "关键计数"],
    [
      ["主编排器", localizeStatusText(orchestration.status), "orchestration_state.json", `阻塞原因=${count(orchestration.blocking_reasons)}, 降级原因=${count(orchestration.degrade_reasons)}`],
      ["输入完整性检查", localizeStatusText(inferredCompletenessStatus), "input_completeness_report.json", `可用来源=${count(completeness.available_sources)}, 缺失来源=${count(completeness.missing_sources)}, 阻塞原因=${count(completeness.blocking_reasons)}`],
      ["数据采集器", localizeStatusText(dataQuality.coverage_status), "raw_payload/history_bundle/meeting_fact_pack/data_quality_report", `数据源=${count(raw.source_catalog)}, 告警=${count(dataQuality.warnings)}, 问题=${count(dataQuality.issues)}`],
      ["硬指标引擎", localizeStatusText(hardMetricsArtifact ? "ready" : "missing"), "hard_metrics_result.json", `指标=${quality.metric_count || 0}, 正常=${quality.available_count || 0}, 降级=${quality.degraded_count || 0}, 无样本=${quality.no_sample_count || 0}`],
      ["评估规划器", localizeStatusText(evaluationPlan.execution_plan.execution_mode), "evaluation_plan.json", `聚焦维度=${count(evaluationPlan.evaluation_focus.focus_dimensions)}, 专家=${count(evaluationPlan.execution_plan.agent_plan)}, 人工复核规则=${count(evaluationPlan.human_review_rules)}`],
      ["管理评审专家", localizeStatusText(managementResult ? "ready" : "missing"), "management_reviewer_result.json", `请求指标=${count(managementRequest.hard_metrics)}, 结论=${count(managementResult && managementResult.dimension_findings)}, 人工复核=${count(managementResult && managementResult.human_review_items)}`],
      ["风险与行为审计专家", localizeStatusText(riskResult ? "ready" : "missing"), "risk_behavior_auditor_result.json", `请求指标=${count(riskRequest.hard_metrics)}, 结论=${count(riskResult && riskResult.dimension_findings)}, 风险标记=${count(riskResult && riskResult.risk_flags)}, 人工复核=${count(riskResult && riskResult.human_review_items)}`],
      ["协同视角专家", localizeStatusText(coordinationResult ? "ready" : "missing"), "coordination_lens_result.json", `请求指标=${count(coordinationRequest.hard_metrics)}, 结论=${count(coordinationResult && coordinationResult.dimension_findings)}, 人工复核=${count(coordinationResult && coordinationResult.human_review_items)}`],
      ["能力评估专家", localizeStatusText(capabilityResult.assessment_status), "capability_assessor_result.json", `请求指标=${count(capabilityRequest.hard_metrics)}, 评分=${count(capabilityResult.dimension_scores)}, 人工复核=${count(capabilityResult.human_review_items)}`],
      ["报告生成器", localizeStatusText(reportResult.report_status), "report_result.json", `人工复核=${count(reportResult.human_review_items)}, 关键证据=${count(reportResult.key_evidence)}, 风险提醒=${count(reportResult.risk_alerts)}, 下一步动作=${count(reportResult.next_actions)}`]
    ]
  ));

  doc.push("");
  doc.push("## 数据源覆盖");
  doc.push("");
  doc.push("说明：本节展示本次评估依赖了哪些数据源、是否必需、是否拿到以及样本量多少。");
  doc.push("");
  doc.push(table(
    ["数据源", "是否必需", "状态", "样本数", "文件", "备注"],
    (dataQuality.source_coverage || []).map((source) => [
      source.source_name,
      source.required,
      statusIcon(source.status),
      source.sample_count,
      (source.files || []).join("<br>"),
      (source.notes || []).join("<br>")
    ])
  ));

  doc.push("");
  doc.push("## 数据样本计数");
  doc.push("");
  doc.push("说明：本节用于快速查看不同对象层面的样本规模，便于判断分析结论是否建立在足够的数据量之上。");
  doc.push("");
  doc.push(table(
    ["对象", "数量"],
    [
      ["Base history records", count(raw.base_history)],
      ["Meeting docs", count(raw.meeting_docs)],
      ["Project docs", count(raw.project_docs)],
      ["Chat messages", count(raw.chat_history)],
      ["Calendar events", count(raw.calendar_events)],
      ["Org contacts", count(raw.org_contacts)],
      ["Source catalog", count(raw.source_catalog)],
      ["Current meeting tasks", count(raw.current_meeting_tasks)],
      ["History recent meetings", count(historyBundle.recent_meetings)],
      ["History risk records", count(historyBundle.risk_history)],
      ["Meeting action items", count(meetingFactPack.meeting_facts && meetingFactPack.meeting_facts.action_items)],
      ["Meeting decisions", count(meetingFactPack.meeting_facts && meetingFactPack.meeting_facts.decisions)],
      ["Meeting risks mentioned", count(meetingFactPack.meeting_facts && meetingFactPack.meeting_facts.risks_mentioned)],
      ["Provenance refs", count(meetingFactPack.provenance_refs)]
    ]
  ));

  doc.push("");
  doc.push("## 数据质量告警");
  doc.push("");
  doc.push("说明：本节列出上游数据本身的质量风险，例如样本缺失、留痕不足或只有摘要没有原文。");
  doc.push("");
  if ((dataQuality.warnings || []).length === 0) {
    doc.push("没有数据质量告警。");
  } else {
    doc.push((dataQuality.warnings || []).map((item) => `- ${item}`).join("\n"));
  }

  doc.push("");
  doc.push("## 硬指标结果");
  doc.push("");
  doc.push("说明：本节展示可计算指标的结果、公式、状态和异常样本，是后续专家判断的重要量化输入。");
  doc.push("");
  doc.push(table(
    ["维度", "指标 ID", "指标名称", "公式", "计算过程", "值", "单位", "状态", "异常样本"],
    flattenMetricsWithDimension(hardMetrics).map((metric) => [
      metric.dimension,
      metric.metric_id,
      metric.label,
      metric.formula ? metric.formula.formula : "",
      metric.calculation ? metric.calculation.expression : `${metric.numerator}/${metric.denominator}`,
      formatNumber(metric.value),
      metric.unit,
      statusIcon(metric.status),
      (metric.anomalies || []).join("<br>")
    ])
  ));

  doc.push("");
  doc.push("## 指标公式明细");
  doc.push("");
  doc.push("说明：本节补充每个指标的分子、分母、取值规则和样本口径，方便复核计算逻辑。");
  doc.push("");
  doc.push(table(
    ["指标 ID", "分子定义", "分母定义", "取值规则", "样本口径"],
    flattenMetricsWithDimension(hardMetrics).map((metric) => [
      metric.metric_id,
      metric.formula ? metric.formula.numerator_definition : "",
      metric.formula ? metric.formula.denominator_definition : "",
      metric.formula ? metric.formula.value_rule : "",
      metric.sample_scope
    ])
  ));

  doc.push("");
  doc.push("## 指标证据与原文摘录");
  doc.push("");
  doc.push("说明：本节把硬指标追溯回原始证据，便于确认指标是否真的由对应样本支撑。");
  doc.push("");
  doc.push(table(
    ["指标 ID", "来源类型", "来源文件", "来源 ID", "时间", "可读证据", "原文摘录"],
    flattenMetricsWithDimension(hardMetrics).flatMap((metric) =>
      (metric.evidence_refs || []).map((ref) => [
        metric.metric_id,
        ref.source_type,
        ref.source_file,
        ref.source_id,
        ref.timestamp,
        ref.evidence_label,
        ref.excerpt
      ])
    )
  ));

  doc.push("");
  doc.push("## 指标质量概览");
  doc.push("");
  doc.push("说明：本节汇总硬指标层面的质量统计，例如总指标数、可用数、降级数和无样本数。");
  doc.push("");
  doc.push(table(
    ["指标项", "值"],
    Object.entries(quality).map(([key, value]) => [
      key,
      typeof value === "object" ? JSON.stringify(value) : value
    ])
  ));

  doc.push("");
  doc.push("## 规划聚焦与人工复核规则");
  doc.push("");
  doc.push("说明：本节说明规划器为什么聚焦这些维度、安排了哪些专家，以及哪些情况必须交给人工复核。");
  doc.push("");
  doc.push(table(
    ["维度", "优先级", "原因", "分配专家"],
    (evaluationPlan.evaluation_focus.focus_dimensions || []).map((item) => [
      item.dimension,
      item.priority,
      item.reason,
      (item.assigned_agents || []).join(", ")
    ])
  ));
  doc.push("");
  doc.push(table(
    ["规则 ID", "严重性", "原因", "目标节点"],
    (evaluationPlan.human_review_rules || []).map((rule) => [
      rule.rule_id,
      rule.severity,
      rule.reason,
      (rule.target_nodes || []).join(", ")
    ])
  ));

  doc.push("");
  doc.push("## 专家结论");
  doc.push("");
  doc.push("说明：本节汇总各专家节点给出的主要判断，并附带原始证据或引用链路。");
  doc.push("");
  doc.push(table(
    ["专家", "序号", "维度", "类型", "置信度", "结论摘要", "证据/原文摘录"],
    [
      ...findingRows(managementResult, "管理评审专家", evidenceIndex, unresolvedRefs),
      ...findingRows(riskResult, "风险与行为审计专家", evidenceIndex, unresolvedRefs),
      ...findingRows(coordinationResult, "协同视角专家", evidenceIndex, unresolvedRefs)
    ]
  ));

  doc.push("");
  doc.push("## 风险标记");
  doc.push("");
  doc.push("说明：本节专门列出被显式标记的风险事项，便于快速识别需要优先跟进的问题。");
  doc.push("");
  doc.push(table(
    ["标记 ID", "类型", "严重性", "置信度", "需人工复核", "摘要", "证据/原文摘录"],
    (riskResult && riskResult.risk_flags || []).map((flag) => [
      flag.flag_id,
      localizeValueText(flag.flag_type),
      localizeValueText(flag.severity),
      flag.confidence,
      localizeValueText(flag.requires_human_review),
      flag.summary,
      resolveEvidence(flag.evidence_refs || [], evidenceIndex, unresolvedRefs, `risk_flag:${flag.flag_id || ""}`)
    ])
  ));

  doc.push("");
  doc.push("## 能力评分");
  doc.push("");
  doc.push("说明：本节把硬指标和专家判断收敛为维度分数，并解释分数依据、证据和局限性。");
  doc.push("");
  doc.push(table(
    ["维度", "分数", "置信度", "评分依据", "指标证据", "专家结论证据", "局限性"],
    (capabilityResult.dimension_scores || []).map((score) => [
      score.dimension,
      score.score,
      score.confidence,
      score.score_basis,
      resolveEvidence(score.supporting_metric_refs || [], evidenceIndex, unresolvedRefs, `capability_score:${score.dimension}:metric`),
      resolveEvidence(score.supporting_finding_refs || [], evidenceIndex, unresolvedRefs, `capability_score:${score.dimension}:finding`),
      (score.limitations || []).join("<br>")
    ])
  ));
  doc.push("");
  doc.push(table(
    ["总分", "置信度", "主要优势", "主要风险", "总结"],
    [[
      capabilityResult.overall_assessment && capabilityResult.overall_assessment.overall_score,
      capabilityResult.overall_assessment && capabilityResult.overall_assessment.confidence,
      capabilityResult.overall_assessment ? (capabilityResult.overall_assessment.top_strengths || []).join("<br>") : "",
      capabilityResult.overall_assessment ? (capabilityResult.overall_assessment.top_risks || []).join("<br>") : "",
      capabilityResult.overall_assessment ? capabilityResult.overall_assessment.summary : ""
    ]]
  ));

  doc.push("");
  doc.push("## 报告观测");
  doc.push("");
  doc.push("说明：本节展示最终报告模块本身的产出状态和内容规模，帮助判断报告是否完整。");
  doc.push("");
  doc.push(table(
    ["字段", "值"],
    [
      ["标题", reportResult.report_title],
      ["类型", reportResult.report_type],
      ["状态", localizeStatusText(reportResult.report_status)],
      ["人工复核项数", count(reportResult.human_review_items)],
      ["关键证据数", count(reportResult.key_evidence)],
      ["风险提醒数", count(reportResult.risk_alerts)],
      ["下一步动作数", count(reportResult.next_actions)],
      ["回写字段键", Object.keys(reportResult.base_writeback_payload || {}).join(", ")]
    ]
  ));

  doc.push("");
  doc.push("## 报告内容与证据");
  doc.push("");
  doc.push("说明：本节把最终报告中的各个组成部分逐条展开，并展示每条内容背后的证据引用。");
  doc.push("");
  doc.push(table(
    ["报告部分", "序号", "内容", "证据/原文摘录"],
    [
      ...(reportResult.score_overview || []).map((item, index) => [
        localizeReportSection("score_overview"),
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex, unresolvedRefs, `report_score_overview:${index + 1}`)
      ]),
      ...(reportResult.key_evidence || []).map((item, index) => [
        localizeReportSection("key_evidence"),
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex, unresolvedRefs, `report_key_evidence:${index + 1}`)
      ]),
      ...(reportResult.risk_alerts || []).map((item, index) => [
        localizeReportSection("risk_alerts"),
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex, unresolvedRefs, `report_risk_alert:${index + 1}`)
      ]),
      ...(reportResult.next_actions || []).map((item, index) => [
        localizeReportSection("next_actions"),
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex, unresolvedRefs, `report_next_action:${index + 1}`)
      ])
    ]
  ));

  const observabilityIssues = collectObservabilityIssues({
    missingArtifacts,
    hardMetricsResult: hardMetrics,
    unresolvedRefs
  });

  doc.push("");
  doc.push("## 观测体系告警");
  doc.push("");
  doc.push("说明：本节只记录观测体系自身的问题，例如缺失产物、无法解引用、证据字段异常等。");
  doc.push("");
  if (observabilityIssues.length === 0) {
    doc.push("没有观测体系告警。");
  } else {
    doc.push(table(
      ["严重性", "类别", "说明", "相关 ID"],
      observabilityIssues.map((item) => [
        item.severity,
        item.category,
        item.message,
        item.related_ids.join(", ")
      ])
    ));
  }

  const markdown = `${doc.join("\n")}\n`;
  const metadata = {
    generated_at: new Date().toISOString(),
    run_finished_at: observabilitySummary ? observabilitySummary.run_finished_at || null : null,
    input_dir: inputDir,
    title: caseLabel,
    output_markdown: options.output ? path.resolve(options.output) : "",
    markdown_sha256: sha256(markdown),
    run_summary: {
      project_id: hardMetrics.project_id,
      manager_id: hardMetrics.manager_id,
      meeting_id: hardMetrics.meeting_id,
      evaluation_period: hardMetrics.evaluation_period,
      orchestration_status: orchestration.status,
      completeness_status: inferredCompletenessStatus,
      assessment_status: capabilityResult.assessment_status,
      report_status: reportResult.report_status
    },
    missing_artifacts: missingArtifacts,
    observability_issues: observabilityIssues,
    section_counts: {
      runtime_row_count: collectRuntimeRows(observabilitySummary).length,
      source_coverage_count: count(dataQuality.source_coverage),
      hard_metric_count: flattenMetricsWithDimension(hardMetrics).length,
      expert_finding_count: count(managementResult && managementResult.dimension_findings) +
        count(riskResult && riskResult.dimension_findings) +
        count(coordinationResult && coordinationResult.dimension_findings),
      risk_flag_count: count(riskResult && riskResult.risk_flags),
      capability_score_count: count(capabilityResult.dimension_scores),
      report_item_count: count(reportResult.score_overview) +
        count(reportResult.key_evidence) +
        count(reportResult.risk_alerts) +
        count(reportResult.next_actions)
    },
    files: buildArtifactFileIndex(inputDir, options.extraFiles || {})
  };

  return {
    markdown,
    metadata
  };
}

function buildFullLoopObservabilityMarkdown(options) {
  return buildFullLoopObservabilityArtifacts(options).markdown;
}

function writeFullLoopObservabilityMarkdown(options) {
  const outputPath = path.resolve(options.output);
  const metadataOutputPath = options.metadataOutput
    ? path.resolve(options.metadataOutput)
    : null;
  const { markdown, metadata } = buildFullLoopObservabilityArtifacts(options);
  writeText(outputPath, markdown);
  if (metadataOutputPath) {
    writeArtifactJson(metadataOutputPath, {
      ...metadata,
      output_markdown: outputPath
    }, "full_loop_observability");
  }
  return {
    output: outputPath,
    metadata_output: metadataOutputPath
  };
}

module.exports = {
  buildFullLoopObservabilityArtifacts,
  buildFullLoopObservabilityMarkdown,
  writeFullLoopObservabilityMarkdown
};

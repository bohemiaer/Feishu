"use strict";

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
}

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
  if (["ready", "collected", "completed", "available"].includes(value)) return "OK";
  if (["degraded", "warning"].includes(value)) return "DEGRADED";
  if (["blocked", "failed", "missing"].includes(value)) return "BLOCKED";
  return value || "";
}

function formatNumber(value) {
  if (typeof value !== "number") return value;
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 10000) / 10000);
}

function flattenMetrics(hardMetricsResult) {
  return Object.entries(hardMetricsResult.hard_metrics_result || {})
    .flatMap(([dimension, metrics]) => (metrics || []).map((metric) => ({ dimension, ...metric })));
}

function buildEvidenceIndex(raw, meetingFactPack, hardMetrics) {
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
  (meetingFactPack.provenance_refs || []).forEach((ref) => add(
    ref.source_type,
    ref.source_file,
    ref.source_id,
    ref.timestamp,
    ref.excerpt,
    ref.source_id
  ));
  flattenMetrics(hardMetrics).forEach((metric) => add(
    "hard_metric",
    "data/outputs/demo/case04/current/hard_metrics_result.json",
    metric.metric_id,
    hardMetrics.generated_at,
    `${metric.label}: ${metric.calculation ? metric.calculation.expression : ""} = ${formatNumber(metric.value)}; ${metric.formula ? metric.formula.formula : ""}`,
    metric.label
  ));

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

function resolveEvidence(refs, evidenceIndex) {
  return normalizeRefs(refs).map((ref) => {
    const found = evidenceIndex.get(ref) || evidenceIndex.get(`hard_metric:${ref}`);
    if (found) {
      return `${found.source_type}:${found.source_id} (${found.timestamp || "no time"}) 原文: ${found.excerpt}`;
    }
    return String(ref);
  }).slice(0, 6).join("<br>");
}

function findingRows(result, sourceName, evidenceIndex) {
  return (result && Array.isArray(result.dimension_findings) ? result.dimension_findings : []).map((item, index) => {
    if (typeof item === "string") {
      return [
        sourceName,
        index + 1,
        "",
        "observation",
        "",
        item,
        ""
      ];
    }
    return [
    sourceName,
    index + 1,
    item.dimension || "",
    item.finding_type || item.type || "",
    item.confidence ?? "",
    item.summary || item.description || "",
    resolveEvidence(item.evidence_refs || item.evidence_quotes || [], evidenceIndex)
    ];
  });
}

function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const output = path.resolve(args.output || "docs/observability/case04_full_loop_observability.md");

  const orchestration = readJson(path.join(inputDir, "orchestration_state.json"));
  const completeness = readJson(path.join(inputDir, "input_completeness_report.json"));
  const rawPayload = readJson(path.join(inputDir, "raw_payload.json"));
  const historyBundle = readJson(path.join(inputDir, "history_bundle.json"));
  const meetingFactPack = readJson(path.join(inputDir, "meeting_fact_pack.json"));
  const dataQuality = readJson(path.join(inputDir, "data_quality_report.json"));
  const hardMetrics = readJson(path.join(inputDir, "hard_metrics_result.json"));
  const evaluationPlan = readJson(path.join(inputDir, "evaluation_plan.json"));
  const managementRequest = readJson(path.join(inputDir, "management_reviewer_request.json"));
  const riskRequest = readJson(path.join(inputDir, "risk_behavior_auditor_request.json"));
  const coordinationRequest = readJson(path.join(inputDir, "coordination_lens_request.json"));
  const managementResult = readOptionalJson(path.join(inputDir, "management_reviewer_result.json"));
  const riskResult = readOptionalJson(path.join(inputDir, "risk_behavior_auditor_result.json"));
  const coordinationResult = readOptionalJson(path.join(inputDir, "coordination_lens_result.json"));
  const capabilityRequest = readJson(path.join(inputDir, "capability_assessor_request.json"));
  const capabilityResult = readJson(path.join(inputDir, "capability_assessor_result.json"));
  const reportRequest = readJson(path.join(inputDir, "report_writer_request.json"));
  const reportResult = readJson(path.join(inputDir, "report_result.json"));

  const raw = rawPayload.raw_payload || {};
  const quality = hardMetrics.metric_quality_report || {};
  const evidenceIndex = buildEvidenceIndex(raw, meetingFactPack, hardMetrics);
  const doc = [];

  doc.push("# Case 04 Full Loop Observability");
  doc.push("");
  doc.push(`Generated at: ${new Date().toISOString()}`);
  doc.push("");
  doc.push("## Run Summary");
  doc.push("");
  doc.push(table(
    ["Field", "Value"],
    [
      ["Project", hardMetrics.project_id],
      ["Manager", hardMetrics.manager_id],
      ["Meeting", hardMetrics.meeting_id],
      ["Evaluation Period", hardMetrics.evaluation_period],
      ["Orchestration Status", statusIcon(orchestration.status)],
      ["Completeness Status", statusIcon(completeness.completeness_status || dataQuality.coverage_status)],
      ["Assessment Status", statusIcon(capabilityResult.assessment_status)],
      ["Report Status", statusIcon(reportResult.report_status)],
      ["Missing Upstream Results", (capabilityResult.missing_upstream_results || []).join(", ") || "none"],
      ["Report Missing Upstream", (reportResult.missing_upstream_results || []).join(", ") || "none"]
    ]
  ));

  doc.push("");
  doc.push("## Node Observability");
  doc.push("");
  doc.push(table(
    ["Node", "Status", "Primary Output", "Observable Counts"],
    [
      ["Master Orchestrator", orchestration.status, "orchestration_state.json", `blocking=${count(orchestration.blocking_reasons)}, degrade=${count(orchestration.degrade_reasons)}`],
      ["Input Completeness Check", completeness.completeness_status || dataQuality.coverage_status, "input_completeness_report.json", `available=${count(completeness.available_sources)}, missing=${count(completeness.missing_sources)}, blocking=${count(completeness.blocking_reasons)}`],
      ["Data Collector", dataQuality.coverage_status, "raw_payload/history_bundle/meeting_fact_pack/data_quality_report", `sources=${count(raw.source_catalog)}, warnings=${count(dataQuality.warnings)}, issues=${count(dataQuality.issues)}`],
      ["Hard Metrics Engine", "ready", "hard_metrics_result.json", `metrics=${quality.metric_count}, available=${quality.available_count}, degraded=${quality.degraded_count}, no_sample=${quality.no_sample_count}`],
      ["Evaluation Planner", evaluationPlan.execution_plan.execution_mode, "evaluation_plan.json", `focus=${count(evaluationPlan.evaluation_focus.focus_dimensions)}, agents=${count(evaluationPlan.execution_plan.agent_plan)}, review_rules=${count(evaluationPlan.human_review_rules)}`],
      ["Management Reviewer", managementResult ? "ready" : "missing", "management_reviewer_result.json", `request_metrics=${count(managementRequest.hard_metrics)}, findings=${count(managementResult && managementResult.dimension_findings)}, human_review=${count(managementResult && managementResult.human_review_items)}`],
      ["Risk & Behavior Auditor", riskResult ? "ready" : "missing", "risk_behavior_auditor_result.json", `request_metrics=${count(riskRequest.hard_metrics)}, findings=${count(riskResult && riskResult.dimension_findings)}, flags=${count(riskResult && riskResult.risk_flags)}, human_review=${count(riskResult && riskResult.human_review_items)}`],
      ["Coordination Lens", coordinationResult ? "ready" : "missing", "coordination_lens_result.json", `request_metrics=${count(coordinationRequest.hard_metrics)}, findings=${count(coordinationResult && coordinationResult.dimension_findings)}, human_review=${count(coordinationResult && coordinationResult.human_review_items)}`],
      ["Capability Assessor", capabilityResult.assessment_status, "capability_assessor_result.json", `request_metrics=${count(capabilityRequest.hard_metrics)}, scores=${count(capabilityResult.dimension_scores)}, human_review=${count(capabilityResult.human_review_items)}`],
      ["Report Writer", reportResult.report_status, "report_result.json", `human_review=${count(reportResult.human_review_items)}, evidence=${count(reportResult.key_evidence)}, risk_alerts=${count(reportResult.risk_alerts)}, next_actions=${count(reportResult.next_actions)}`]
    ]
  ));

  doc.push("");
  doc.push("## Source Coverage");
  doc.push("");
  doc.push(table(
    ["Source", "Required", "Status", "Sample Count", "Files", "Notes"],
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
  doc.push("## Data Sample Counts");
  doc.push("");
  doc.push(table(
    ["Object", "Count"],
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
  doc.push("## Data Quality Warnings");
  doc.push("");
  if ((dataQuality.warnings || []).length === 0) {
    doc.push("No data quality warnings.");
  } else {
    doc.push((dataQuality.warnings || []).map((item) => `- ${item}`).join("\n"));
  }

  doc.push("");
  doc.push("## Hard Metrics");
  doc.push("");
  doc.push(table(
    ["Dimension", "Metric ID", "Label", "Formula", "Calculation", "Value", "Unit", "Status", "Anomalies"],
    flattenMetrics(hardMetrics).map((metric) => [
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
  doc.push("## Metric Formula Details");
  doc.push("");
  doc.push(table(
    ["Metric ID", "Numerator", "Denominator", "Value Rule", "Sample Scope"],
    flattenMetrics(hardMetrics).map((metric) => [
      metric.metric_id,
      metric.formula ? metric.formula.numerator_definition : "",
      metric.formula ? metric.formula.denominator_definition : "",
      metric.formula ? metric.formula.value_rule : "",
      metric.sample_scope
    ])
  ));

  doc.push("");
  doc.push("## Metric Evidence With Original Excerpts");
  doc.push("");
  doc.push(table(
    ["Metric ID", "Source", "Source File", "Source ID", "Timestamp", "Readable Evidence", "Original Excerpt"],
    flattenMetrics(hardMetrics).flatMap((metric) =>
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
  doc.push("## Metric Quality");
  doc.push("");
  doc.push(table(
    ["Metric", "Value"],
    Object.entries(quality).map(([key, value]) => [
      key,
      typeof value === "object" ? JSON.stringify(value) : value
    ])
  ));

  doc.push("");
  doc.push("## Planner Focus And Human Review Rules");
  doc.push("");
  doc.push(table(
    ["Dimension", "Priority", "Reason", "Assigned Agents"],
    (evaluationPlan.evaluation_focus.focus_dimensions || []).map((item) => [
      item.dimension,
      item.priority,
      item.reason,
      (item.assigned_agents || []).join(", ")
    ])
  ));
  doc.push("");
  doc.push(table(
    ["Rule ID", "Severity", "Reason", "Target Nodes"],
    (evaluationPlan.human_review_rules || []).map((rule) => [
      rule.rule_id,
      rule.severity,
      rule.reason,
      (rule.target_nodes || []).join(", ")
    ])
  ));

  doc.push("");
  doc.push("## Expert Findings");
  doc.push("");
  doc.push(table(
    ["Agent", "#", "Dimension", "Type", "Confidence", "Summary", "Evidence / Original Excerpts"],
    [
      ...findingRows(managementResult, "Management Reviewer", evidenceIndex),
      ...findingRows(riskResult, "Risk & Behavior Auditor", evidenceIndex),
      ...findingRows(coordinationResult, "Coordination Lens", evidenceIndex)
    ]
  ));

  doc.push("");
  doc.push("## Risk Flags");
  doc.push("");
  doc.push(table(
    ["Flag ID", "Type", "Severity", "Confidence", "Human Review", "Summary", "Evidence / Original Excerpts"],
    (riskResult && riskResult.risk_flags || []).map((flag) => [
      flag.flag_id,
      flag.flag_type,
      flag.severity,
      flag.confidence,
      flag.requires_human_review,
      flag.summary,
      resolveEvidence(flag.evidence_refs || [], evidenceIndex)
    ])
  ));

  doc.push("");
  doc.push("## Capability Scores");
  doc.push("");
  doc.push(table(
    ["Dimension", "Score", "Confidence", "Basis", "Metric Evidence", "Finding Evidence", "Limitations"],
    (capabilityResult.dimension_scores || []).map((score) => [
      score.dimension,
      score.score,
      score.confidence,
      score.score_basis,
      resolveEvidence(score.supporting_metric_refs || [], evidenceIndex),
      resolveEvidence(score.supporting_finding_refs || [], evidenceIndex),
      (score.limitations || []).join("<br>")
    ])
  ));
  doc.push("");
  doc.push(table(
    ["Overall Score", "Confidence", "Top Strengths", "Top Risks", "Summary"],
    [[
      capabilityResult.overall_assessment && capabilityResult.overall_assessment.overall_score,
      capabilityResult.overall_assessment && capabilityResult.overall_assessment.confidence,
      capabilityResult.overall_assessment ? (capabilityResult.overall_assessment.top_strengths || []).join("<br>") : "",
      capabilityResult.overall_assessment ? (capabilityResult.overall_assessment.top_risks || []).join("<br>") : "",
      capabilityResult.overall_assessment ? capabilityResult.overall_assessment.summary : ""
    ]]
  ));

  doc.push("");
  doc.push("## Report Observability");
  doc.push("");
  doc.push(table(
    ["Field", "Value"],
    [
      ["Title", reportResult.report_title],
      ["Type", reportResult.report_type],
      ["Status", reportResult.report_status],
      ["Human Review Items", count(reportResult.human_review_items)],
      ["Key Evidence", count(reportResult.key_evidence)],
      ["Risk Alerts", count(reportResult.risk_alerts)],
      ["Next Actions", count(reportResult.next_actions)],
      ["Base Writeback Keys", Object.keys(reportResult.base_writeback_payload || {}).join(", ")]
    ]
  ));

  doc.push("");
  doc.push("## Report Items With Evidence");
  doc.push("");
  doc.push(table(
    ["Section", "#", "Content", "Evidence / Original Excerpts"],
    [
      ...(reportResult.score_overview || []).map((item, index) => [
        "score_overview",
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex)
      ]),
      ...(reportResult.key_evidence || []).map((item, index) => [
        "key_evidence",
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex)
      ]),
      ...(reportResult.risk_alerts || []).map((item, index) => [
        "risk_alerts",
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex)
      ]),
      ...(reportResult.next_actions || []).map((item, index) => [
        "next_actions",
        index + 1,
        typeof item === "object" ? JSON.stringify(item) : item,
        resolveEvidence(item && item.evidence_refs || [], evidenceIndex)
      ])
    ]
  ));

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${doc.join("\n")}\n`, "utf8");
  process.stdout.write(JSON.stringify({ output, hard_metric_count: flattenMetrics(hardMetrics).length }, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

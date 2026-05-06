"use strict";

const fs = require("fs");
const path = require("path");
const { writeText } = require("../shared/fs_utils");
const { writeArtifactJson } = require("../shared/schema_validation");
const { buildArtifactFileIndex } = require("./artifact_files");
const { collectObservabilityIssues, flattenMetrics } = require("./observability_issues");

const AGENT_SPECS = [
  {
    key: "management_reviewer",
    display_name: "Management Reviewer",
    request_file: "management_reviewer_request.json",
    result_file: "management_reviewer_result.json"
  },
  {
    key: "risk_behavior_auditor",
    display_name: "Risk & Behavior Auditor",
    request_file: "risk_behavior_auditor_request.json",
    result_file: "risk_behavior_auditor_result.json"
  },
  {
    key: "coordination_lens",
    display_name: "Coordination Lens",
    request_file: "coordination_lens_request.json",
    result_file: "coordination_lens_result.json"
  },
  {
    key: "capability_assessor",
    display_name: "Capability Assessor",
    request_file: "capability_assessor_request.json",
    result_file: "capability_assessor_result.json"
  },
  {
    key: "report_writer",
    display_name: "Report Writer",
    request_file: "report_writer_request.json",
    result_file: "report_result.json"
  }
];

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function bytesOf(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function table(headers, rows) {
  return [
    `| ${headers.map(esc).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(esc).join(" | ")} |`)
  ].join("\n");
}

function inferAgentStatus(spec, runtimeNode, requestData, resultData) {
  if (spec.key === "capability_assessor" && resultData && resultData.assessment_status) {
    return resultData.assessment_status;
  }
  if (spec.key === "report_writer" && resultData && resultData.report_status) {
    return resultData.report_status;
  }
  if (runtimeNode && runtimeNode.status) {
    return runtimeNode.status;
  }
  if (!requestData && !resultData) {
    return "not_run";
  }
  if (resultData) {
    return "completed";
  }
  return "request_only";
}

function buildCounts(rawPayload, historyBundle, meetingFactPack, dataQualityReport, hardMetricsResult, evaluationPlan) {
  const raw = rawPayload && rawPayload.raw_payload ? rawPayload.raw_payload : {};
  const metricQuality = hardMetricsResult && hardMetricsResult.metric_quality_report
    ? hardMetricsResult.metric_quality_report
    : {};
  const meetingFacts = meetingFactPack && meetingFactPack.meeting_facts ? meetingFactPack.meeting_facts : {};

  return {
    source_catalog_count: count(raw.source_catalog),
    chat_message_count: count(raw.chat_history),
    calendar_event_count: count(raw.calendar_events),
    org_contact_count: count(raw.org_contacts),
    project_doc_count: count(raw.project_docs),
    meeting_doc_count: count(raw.meeting_docs),
    base_history_count: count(raw.base_history),
    recent_meeting_count: count(historyBundle && historyBundle.recent_meetings),
    risk_history_count: count(historyBundle && historyBundle.risk_history),
    action_item_count: count(meetingFacts.action_items),
    decision_count: count(meetingFacts.decisions),
    meeting_risk_count: count(meetingFacts.risks_mentioned),
    provenance_ref_count: count(meetingFactPack && meetingFactPack.provenance_refs),
    hard_metric_count: flattenMetrics(hardMetricsResult).length,
    hard_metric_available_count: metricQuality.available_count || 0,
    hard_metric_degraded_count: metricQuality.degraded_count || 0,
    hard_metric_no_sample_count: metricQuality.no_sample_count || 0,
    anomaly_sample_count: count(hardMetricsResult && hardMetricsResult.anomaly_samples),
    metric_gap_count: count(hardMetricsResult && hardMetricsResult.metric_gaps),
    planner_focus_count: count(evaluationPlan && evaluationPlan.evaluation_focus && evaluationPlan.evaluation_focus.focus_dimensions),
    planner_agent_count: count(evaluationPlan && evaluationPlan.execution_plan && evaluationPlan.execution_plan.agent_plan),
    human_review_rule_count: count(evaluationPlan && evaluationPlan.human_review_rules),
    data_quality_warning_count: count(dataQualityReport && dataQualityReport.warnings),
    data_quality_issue_count: count(dataQualityReport && dataQualityReport.issues)
  };
}

function buildAgentSummary(outputDir, runtimeMeta) {
  return AGENT_SPECS.map((spec) => {
    const requestPath = path.join(outputDir, spec.request_file);
    const resultPath = path.join(outputDir, spec.result_file);
    const requestData = readOptionalJson(requestPath);
    const resultData = readOptionalJson(resultPath);
    const runtimeNode = runtimeMeta && runtimeMeta.nodes ? runtimeMeta.nodes[spec.key] : null;

    return {
      agent_key: spec.key,
      display_name: spec.display_name,
      status: inferAgentStatus(spec, runtimeNode, requestData, resultData),
      started_at: runtimeNode ? runtimeNode.started_at || null : null,
      finished_at: runtimeNode ? runtimeNode.finished_at || null : null,
      duration_ms: runtimeNode ? runtimeNode.duration_ms || 0 : 0,
      model_invoked: runtimeNode ? Boolean(runtimeNode.model_invoked) : false,
      request_file: fs.existsSync(requestPath) ? requestPath : null,
      result_file: fs.existsSync(resultPath) ? resultPath : null,
      request_size_bytes: bytesOf(requestData),
      result_size_bytes: bytesOf(resultData),
      request_metric_count: count(requestData && requestData.hard_metrics),
      request_human_review_rule_count: count(requestData && requestData.planner_slice && requestData.planner_slice.human_review_rules),
      request_provenance_ref_count: count(requestData && requestData.current_meeting && requestData.current_meeting.provenance_refs),
      finding_count: count(resultData && resultData.dimension_findings),
      risk_flag_count: count(resultData && resultData.risk_flags),
      score_count: count(resultData && resultData.dimension_scores),
      human_review_count: count(resultData && resultData.human_review_items),
      key_evidence_count: count(resultData && resultData.key_evidence),
      risk_alert_count: count(resultData && resultData.risk_alerts),
      next_action_count: count(resultData && resultData.next_actions),
      missing_upstream_result_count: count(resultData && resultData.missing_upstream_results),
      error_message: runtimeNode ? runtimeNode.error_message || null : null
    };
  });
}

function inferRunStatus(automationSummary, runtimeMeta) {
  if (runtimeMeta && runtimeMeta.error_message) {
    return "failed";
  }
  if (automationSummary && automationSummary.completeness_status === "blocked") {
    return "blocked";
  }
  if (automationSummary && automationSummary.report_status === "blocked" && automationSummary.capability_status === "blocked") {
    return "degraded";
  }
  return "completed";
}

function inferCompletenessStatus(inputCompletenessReport, automationSummary, orchestrationState) {
  if (inputCompletenessReport && inputCompletenessReport.completeness_status) {
    return inputCompletenessReport.completeness_status;
  }
  if (automationSummary && automationSummary.completeness_status) {
    return automationSummary.completeness_status;
  }
  if (orchestrationState && orchestrationState.completeness_status) {
    return orchestrationState.completeness_status;
  }
  return "missing";
}

function buildObservabilitySummary(options) {
  const outputDir = path.resolve(options.outputDir);
  const runtimeMeta = options.runtimeMeta || {};

  const orchestrationState = readOptionalJson(path.join(outputDir, "orchestration_state.json"));
  const inputCompletenessReport = readOptionalJson(path.join(outputDir, "input_completeness_report.json"));
  const rawPayload = readOptionalJson(path.join(outputDir, "raw_payload.json"));
  const historyBundle = readOptionalJson(path.join(outputDir, "history_bundle.json"));
  const meetingFactPack = readOptionalJson(path.join(outputDir, "meeting_fact_pack.json"));
  const dataQualityReport = readOptionalJson(path.join(outputDir, "data_quality_report.json"));
  const hardMetricsResult = readOptionalJson(path.join(outputDir, "hard_metrics_result.json"));
  const evaluationPlan = readOptionalJson(path.join(outputDir, "evaluation_plan.json"));
  const automationSummary = readOptionalJson(path.join(outputDir, "automation_summary.json"));
  const agentRuns = buildAgentSummary(outputDir, runtimeMeta);
  const counts = buildCounts(
    rawPayload,
    historyBundle,
    meetingFactPack,
    dataQualityReport,
    hardMetricsResult,
    evaluationPlan
  );
  const missingArtifacts = [
    ["orchestration_state.json", orchestrationState],
    ["input_completeness_report.json", inputCompletenessReport],
    ["hard_metrics_result.json", hardMetricsResult],
    ["evaluation_plan.json", evaluationPlan]
  ].filter(([, artifact]) => !artifact).map(([label]) => label);
  const observabilityIssues = collectObservabilityIssues({
    missingArtifacts,
    hardMetricsResult
  });

  return {
    generated_at: new Date().toISOString(),
    bundle_path: options.bundlePath ? path.resolve(options.bundlePath) : null,
    output_dir: outputDir,
    selected_meeting_id: options.selectedMeetingId || (automationSummary ? automationSummary.selected_meeting_id : null),
    trigger_type: options.triggerType || null,
    call_model: Boolean(options.callModel),
    run_status: inferRunStatus(automationSummary, runtimeMeta),
    run_started_at: runtimeMeta.run_started_at || null,
    run_finished_at: runtimeMeta.run_finished_at || null,
    total_duration_ms: runtimeMeta.total_duration_ms || 0,
    error_message: runtimeMeta.error_message || null,
    front_pipeline: {
      status: orchestrationState ? orchestrationState.status : "missing",
      completeness_status: inferCompletenessStatus(inputCompletenessReport, automationSummary, orchestrationState),
      blocking_reason_count: count(inputCompletenessReport && inputCompletenessReport.blocking_reasons),
      degrade_reason_count: count(inputCompletenessReport && inputCompletenessReport.degrade_reasons),
      selection_attempt_count: count(options.selectionAttempts),
      fallback_used: Boolean(options.fallbackUsed),
      duration_ms: runtimeMeta.nodes && runtimeMeta.nodes.front_pipeline
        ? runtimeMeta.nodes.front_pipeline.duration_ms || 0
        : 0
    },
    hard_metrics: {
      metric_quality_report: hardMetricsResult ? hardMetricsResult.metric_quality_report || null : null,
      duration_ms: runtimeMeta.nodes && runtimeMeta.nodes.hard_metrics
        ? runtimeMeta.nodes.hard_metrics.duration_ms || 0
        : 0
    },
    evaluation_plan: {
      execution_mode: evaluationPlan && evaluationPlan.execution_plan
        ? evaluationPlan.execution_plan.execution_mode || null
        : null,
      duration_ms: runtimeMeta.nodes && runtimeMeta.nodes.evaluation_planner
        ? runtimeMeta.nodes.evaluation_planner.duration_ms || 0
        : 0
    },
    data_counts: counts,
    observability_issue_count: observabilityIssues.length,
    observability_issues: observabilityIssues,
    meeting_selection_attempts: safeArray(options.selectionAttempts),
    agent_runs: agentRuns,
    files: buildArtifactFileIndex(outputDir, options.extraFiles || {})
  };
}

function renderObservabilityMarkdown(summary) {
  const doc = [];
  doc.push("# Run Observability");
  doc.push("");
  doc.push(`Generated at: ${summary.generated_at}`);
  doc.push("");
  doc.push("## Run Summary");
  doc.push("");
  doc.push(table(
    ["Field", "Value"],
    [
      ["Run Status", summary.run_status],
      ["Call Model", summary.call_model],
      ["Trigger Type", summary.trigger_type || ""],
      ["Selected Meeting", summary.selected_meeting_id || ""],
      ["Total Duration (ms)", summary.total_duration_ms],
      ["Front Status", summary.front_pipeline.status],
      ["Completeness Status", summary.front_pipeline.completeness_status],
      ["Fallback Used", summary.front_pipeline.fallback_used],
      ["Selection Attempts", summary.front_pipeline.selection_attempt_count],
      ["Error", summary.error_message || ""]
    ]
  ));

  doc.push("");
  doc.push("## Pipeline Nodes");
  doc.push("");
  doc.push(table(
    ["Node", "Status", "Duration (ms)", "Observable Counts"],
    [
      [
        "Front Pipeline",
        `${summary.front_pipeline.status}/${summary.front_pipeline.completeness_status}`,
        summary.front_pipeline.duration_ms,
        `blocking=${summary.front_pipeline.blocking_reason_count}, degrade=${summary.front_pipeline.degrade_reason_count}`
      ],
      [
        "Hard Metrics",
        summary.hard_metrics.metric_quality_report ? "ready" : "missing",
        summary.hard_metrics.duration_ms,
        `metrics=${summary.data_counts.hard_metric_count}, available=${summary.data_counts.hard_metric_available_count}, degraded=${summary.data_counts.hard_metric_degraded_count}`
      ],
      [
        "Evaluation Planner",
        summary.evaluation_plan.execution_mode || "missing",
        summary.evaluation_plan.duration_ms,
        `focus=${summary.data_counts.planner_focus_count}, agents=${summary.data_counts.planner_agent_count}, review_rules=${summary.data_counts.human_review_rule_count}`
      ]
    ]
  ));

  doc.push("");
  doc.push("## Agent Runs");
  doc.push("");
  doc.push(table(
    ["Agent", "Status", "Model", "Duration (ms)", "Req Bytes", "Resp Bytes", "Findings", "Human Review", "Other Counts"],
    summary.agent_runs.map((item) => [
      item.display_name,
      item.status,
      item.model_invoked,
      item.duration_ms,
      item.request_size_bytes,
      item.result_size_bytes,
      item.finding_count,
      item.human_review_count,
      `metrics=${item.request_metric_count}, risk_flags=${item.risk_flag_count}, scores=${item.score_count}, key_evidence=${item.key_evidence_count}, next_actions=${item.next_action_count}`
    ])
  ));

  doc.push("");
  doc.push("## Data Counts");
  doc.push("");
  doc.push(table(
    ["Metric", "Count"],
    Object.entries(summary.data_counts).map(([key, value]) => [key, value])
  ));

  doc.push("");
  doc.push("## Observability Warnings");
  doc.push("");
  if (summary.observability_issues.length === 0) {
    doc.push("No observability warnings.");
  } else {
    doc.push(table(
      ["Severity", "Category", "Message", "Related IDs"],
      summary.observability_issues.map((item) => [
        item.severity,
        item.category,
        item.message,
        item.related_ids.join(", ")
      ])
    ));
  }

  if (summary.meeting_selection_attempts.length > 0) {
    doc.push("");
    doc.push("## Meeting Selection Attempts");
    doc.push("");
    doc.push(table(
      ["Meeting ID", "Status", "Completeness", "Blocking Reasons"],
      summary.meeting_selection_attempts.map((item) => [
        item.meeting_id || "",
        item.status || "",
        item.completeness_status || "",
        count(item.blocking_reasons)
      ])
    ));
  }

  return `${doc.join("\n")}\n`;
}

function writeObservabilityArtifacts(options) {
  const summary = buildObservabilitySummary(options);
  const markdown = renderObservabilityMarkdown(summary);
  const summaryPath = path.join(path.resolve(options.outputDir), "observability_summary.json");
  const markdownPath = path.join(path.resolve(options.outputDir), "observability.md");

  writeArtifactJson(summaryPath, summary);
  writeText(markdownPath, markdown);

  return {
    summary,
    summaryPath,
    markdownPath
  };
}

module.exports = {
  buildObservabilitySummary,
  renderObservabilityMarkdown,
  writeObservabilityArtifacts
};

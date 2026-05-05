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

function readOptionalJson(filePath, fallback) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

function asJson(value) {
  if (value === undefined || value === null) return "";
  return JSON.stringify(value);
}

function csvEscape(value) {
  if (value === undefined || value === null) return "";
  const text = typeof value === "string" ? value : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (rows.length === 0) {
    fs.writeFileSync(filePath, "", "utf8");
    return;
  }
  const headers = Object.keys(rows[0]);
  const content = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
  fs.writeFileSync(filePath, `${content}\n`, "utf8");
}

function flattenMetrics(hardMetricsResult) {
  return Object.entries(hardMetricsResult.hard_metrics_result || {})
    .flatMap(([dimension, metrics]) => (metrics || []).map((metric) => ({ dimension, ...metric })));
}

function collectReportItems(reportResult) {
  const sections = [
    ["score_overview", reportResult.score_overview || []],
    ["key_evidence", reportResult.key_evidence || []],
    ["risk_alerts", reportResult.risk_alerts || []],
    ["next_actions", reportResult.next_actions || []]
  ];
  return sections.flatMap(([section, items]) =>
    items.map((item, index) => ({
      section,
      item_index: index + 1,
      item
    }))
  );
}

function extractContent(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.content || item.description || item.action || item.summary || item.evidence || "";
}

function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const outputDir = path.resolve(args["output-dir"] || "data/outputs/demo/case04/feishu_base_csv");

  const taskRequest = readJson(path.join(inputDir, "task_request.json"));
  const meetingFactPack = readJson(path.join(inputDir, "meeting_fact_pack.json"));
  const hardMetricsResult = readJson(path.join(inputDir, "hard_metrics_result.json"));
  const evaluationPlan = readJson(path.join(inputDir, "evaluation_plan.json"));
  const capabilityResult = readJson(path.join(inputDir, "capability_assessor_result.json"));
  const reportResult = readJson(path.join(inputDir, "report_result.json"));
  const managementResult = readOptionalJson(path.join(inputDir, "management_reviewer_result.json"), {});
  const riskBehaviorResult = readOptionalJson(path.join(inputDir, "risk_behavior_auditor_result.json"), {});
  const coordinationResult = readOptionalJson(path.join(inputDir, "coordination_lens_result.json"), {});

  const payload = reportResult.base_writeback_payload || {};
  const generatedAt = new Date().toISOString();
  const evaluationId = `EVAL-${taskRequest.evaluation_target.project_id}-${taskRequest.evaluation_target.current_meeting_id}`;
  const reportId = `RPT-${taskRequest.evaluation_target.project_id}-${taskRequest.evaluation_target.current_meeting_id}`;

  const evaluationRows = [{
    evaluation_id: evaluationId,
    project_id: taskRequest.evaluation_target.project_id,
    manager_id: taskRequest.evaluation_target.manager_id,
    manager_name: taskRequest.evaluation_target.manager_name,
    meeting_id: taskRequest.evaluation_target.current_meeting_id,
    evaluation_period: taskRequest.evaluation_target.evaluation_period,
    assessment_status: capabilityResult.assessment_status,
    report_status: reportResult.report_status,
    overall_score: payload.overall_score ?? capabilityResult.overall_assessment?.overall_score ?? "",
    overall_confidence: payload.overall_confidence ?? capabilityResult.overall_assessment?.confidence ?? "",
    human_review_required: payload.human_review_required ?? ((capabilityResult.human_review_items || []).length > 0),
    next_review_focus: payload.next_review_focus || "",
    top_strengths: (payload.top_strengths || capabilityResult.overall_assessment?.top_strengths || []).join("\n"),
    top_improvement_areas: (payload.top_improvement_areas || capabilityResult.overall_assessment?.top_risks || []).join("\n"),
    summary: capabilityResult.overall_assessment?.summary || reportResult.summary || "",
    source_task_id: taskRequest.task_id,
    generated_at: generatedAt
  }];

  const dimensionRows = (capabilityResult.dimension_scores || []).map((score) => ({
    evaluation_id: evaluationId,
    project_id: taskRequest.evaluation_target.project_id,
    manager_id: taskRequest.evaluation_target.manager_id,
    meeting_id: taskRequest.evaluation_target.current_meeting_id,
    dimension: score.dimension,
    score: score.score,
    confidence: score.confidence,
    score_basis: score.score_basis,
    supporting_metric_refs: (score.supporting_metric_refs || []).join("\n"),
    supporting_finding_refs: (score.supporting_finding_refs || []).join("\n"),
    limitations: (score.limitations || []).join("\n"),
    evidence_refs_json: asJson(score.evidence_quotes || []),
    generated_at: generatedAt
  }));

  const reportRows = [{
    report_id: reportId,
    evaluation_id: evaluationId,
    project_id: reportResult.project_id,
    manager_id: reportResult.manager_id,
    meeting_id: taskRequest.evaluation_target.current_meeting_id,
    report_type: reportResult.report_type,
    report_status: reportResult.report_status,
    report_title: reportResult.report_title,
    summary: reportResult.summary,
    human_review_item_count: (reportResult.human_review_items || []).length,
    key_evidence_count: (reportResult.key_evidence || []).length,
    risk_alert_count: (reportResult.risk_alerts || []).length,
    next_action_count: (reportResult.next_actions || []).length,
    base_writeback_payload_json: asJson(reportResult.base_writeback_payload || {}),
    generated_at: generatedAt
  }];

  const reportItemRows = collectReportItems(reportResult).map(({ section, item_index: itemIndex, item }) => ({
    report_item_id: `${reportId}-${section}-${String(itemIndex).padStart(2, "0")}`,
    report_id: reportId,
    evaluation_id: evaluationId,
    section,
    item_index: itemIndex,
    dimension: item.dimension || item.related_dimension || "",
    level: item.level || item.risk_level || item.evidence_type || "",
    content: extractContent(item),
    evidence_refs_json: asJson(item.evidence_refs || []),
    generated_at: generatedAt
  }));

  const humanReviewRows = (reportResult.human_review_items || capabilityResult.human_review_items || []).map((item, index) => ({
    review_id: item.review_id || item.item_id || `HR-${String(index + 1).padStart(3, "0")}`,
    evaluation_id: evaluationId,
    report_id: reportId,
    project_id: taskRequest.evaluation_target.project_id,
    manager_id: taskRequest.evaluation_target.manager_id,
    meeting_id: taskRequest.evaluation_target.current_meeting_id,
    severity: item.severity || "",
    related_dimension: item.related_dimension || "",
    reason: item.reason || item.review_reason || "",
    review_status: "pending",
    evidence_refs_json: asJson(item.evidence_refs || []),
    generated_at: generatedAt
  }));

  const metricRows = flattenMetrics(hardMetricsResult).map((metric) => ({
    metric_record_id: `${evaluationId}-${metric.metric_id}`,
    evaluation_id: evaluationId,
    project_id: hardMetricsResult.project_id,
    manager_id: hardMetricsResult.manager_id,
    meeting_id: hardMetricsResult.meeting_id,
    dimension: metric.dimension,
    metric_id: metric.metric_id,
    metric_label: metric.label,
    value: metric.value,
    numerator: metric.numerator,
    denominator: metric.denominator,
    unit: metric.unit,
    status: metric.status,
    formula: metric.formula?.formula || "",
    calculation_expression: metric.calculation?.expression || "",
    sample_scope: metric.sample_scope,
    anomalies: (metric.anomalies || []).join("\n"),
    evidence_refs_json: asJson(metric.evidence_refs || []),
    generated_at: generatedAt
  }));

  const riskFlagRows = (riskBehaviorResult.risk_flags || []).map((flag) => ({
    flag_id: flag.flag_id,
    evaluation_id: evaluationId,
    project_id: taskRequest.evaluation_target.project_id,
    manager_id: taskRequest.evaluation_target.manager_id,
    meeting_id: taskRequest.evaluation_target.current_meeting_id,
    flag_type: flag.flag_type,
    severity: flag.severity,
    summary: flag.summary,
    confidence: flag.confidence,
    requires_human_review: flag.requires_human_review,
    evidence_refs_json: asJson(flag.evidence_refs || []),
    generated_at: generatedAt
  }));

  const expertFindingRows = [
    ["management_reviewer", managementResult.dimension_findings || []],
    ["risk_behavior_auditor", riskBehaviorResult.dimension_findings || []],
    ["coordination_lens", coordinationResult.dimension_findings || []]
  ].flatMap(([agentName, findings]) => findings.map((finding, index) => ({
    finding_id: `${evaluationId}-${agentName}-${String(index + 1).padStart(2, "0")}`,
    evaluation_id: evaluationId,
    agent_name: agentName,
    dimension: finding.dimension || "",
    finding_type: finding.finding_type || "",
    confidence: finding.confidence ?? "",
    summary: finding.summary || finding.finding || finding.description || "",
    risk_tags: (finding.risk_tags || []).join("\n"),
    suggested_actions: (finding.suggested_actions || []).join("\n"),
    evidence_refs_json: asJson(finding.evidence_refs || []),
    generated_at: generatedAt
  })));

  const files = [
    ["evaluations.csv", evaluationRows],
    ["evaluation_dimension_scores.csv", dimensionRows],
    ["reports.csv", reportRows],
    ["report_items.csv", reportItemRows],
    ["human_review_items.csv", humanReviewRows],
    ["metric_results.csv", metricRows],
    ["risk_flags.csv", riskFlagRows],
    ["expert_findings.csv", expertFindingRows]
  ];

  files.forEach(([filename, rows]) => writeCsv(path.join(outputDir, filename), rows));

  process.stdout.write(JSON.stringify({
    output_dir: outputDir,
    files: files.map(([filename, rows]) => ({ filename, rows: rows.length }))
  }, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

"use strict";

const path = require("path");

function buildArtifactFileIndex(outputDir, extraFiles = {}) {
  const resolvedOutputDir = path.resolve(outputDir);

  return {
    task_request: path.join(resolvedOutputDir, "task_request.json"),
    orchestration_state: path.join(resolvedOutputDir, "orchestration_state.json"),
    input_completeness_report: path.join(resolvedOutputDir, "input_completeness_report.json"),
    raw_payload: path.join(resolvedOutputDir, "raw_payload.json"),
    history_bundle: path.join(resolvedOutputDir, "history_bundle.json"),
    meeting_fact_pack: path.join(resolvedOutputDir, "meeting_fact_pack.json"),
    data_quality_report: path.join(resolvedOutputDir, "data_quality_report.json"),
    hard_metrics_result: path.join(resolvedOutputDir, "hard_metrics_result.json"),
    evaluation_plan: path.join(resolvedOutputDir, "evaluation_plan.json"),
    management_reviewer_request: path.join(resolvedOutputDir, "management_reviewer_request.json"),
    management_reviewer_result: path.join(resolvedOutputDir, "management_reviewer_result.json"),
    risk_behavior_auditor_request: path.join(resolvedOutputDir, "risk_behavior_auditor_request.json"),
    risk_behavior_auditor_result: path.join(resolvedOutputDir, "risk_behavior_auditor_result.json"),
    coordination_lens_request: path.join(resolvedOutputDir, "coordination_lens_request.json"),
    coordination_lens_result: path.join(resolvedOutputDir, "coordination_lens_result.json"),
    capability_assessor_request: path.join(resolvedOutputDir, "capability_assessor_request.json"),
    capability_assessor_result: path.join(resolvedOutputDir, "capability_assessor_result.json"),
    report_writer_request: path.join(resolvedOutputDir, "report_writer_request.json"),
    report_result: path.join(resolvedOutputDir, "report_result.json"),
    automation_summary: path.join(resolvedOutputDir, "automation_summary.json"),
    observability_summary: path.join(resolvedOutputDir, "observability_summary.json"),
    full_loop_observability: path.join(resolvedOutputDir, "full_loop_observability.json"),
    observability_markdown: path.join(resolvedOutputDir, "observability.md"),
    full_loop_observability_markdown: path.join(resolvedOutputDir, "full_loop_observability.md"),
    ...extraFiles
  };
}

module.exports = {
  buildArtifactFileIndex
};

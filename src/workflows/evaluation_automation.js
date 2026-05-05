"use strict";

const path = require("path");
const { buildCapabilityAssessmentRequest, assessCapabilityCase04 } = require("../agents/capability_assessor");
const { buildCoordinationLensRequest, reviewCoordination } = require("../agents/coordination_lens");
const { buildManagementReviewRequest, reviewManagement } = require("../agents/management_reviewer");
const { buildCase04ReportRequest, writeCase04Report } = require("../agents/report_writer");
const { buildRiskBehaviorAuditRequest, auditRiskBehavior } = require("../agents/risk_behavior_auditor");
const { runEvaluationPlanner } = require("../domain/evaluation/evaluation_planner");
const { runHardMetricsEngine } = require("../domain/evaluation/hard_metrics_engine");
const { loadCase04SampleBundle } = require("../integrations/sample_case04_adapter");
const { ensureDir, writeJson } = require("../shared/fs_utils");
const { runFrontPipeline } = require("./front_pipeline");

function nowIso() {
  return new Date().toISOString();
}

function timestampForPath() {
  return nowIso().replace(/[:.]/g, "-");
}

function sortMeetingIdsDesc(meetings) {
  return (Array.isArray(meetings) ? meetings : [])
    .slice()
    .sort((left, right) => {
      const a = String(left.meeting_time || "");
      const b = String(right.meeting_time || "");
      return a < b ? 1 : a > b ? -1 : 0;
    })
    .map((item) => item.meeting_id)
    .filter(Boolean);
}

function defaultOutputDir(bundlePath) {
  const bundleName = path.basename(path.resolve(bundlePath || "bundle"));
  return path.resolve("data/outputs/automation", bundleName, timestampForPath());
}

function writeFrontOutputs(outputDir, frontResult) {
  writeJson(path.join(outputDir, "task_request.json"), frontResult.task_request);
  writeJson(path.join(outputDir, "orchestration_state.json"), frontResult.orchestration_state);
  writeJson(path.join(outputDir, "input_completeness_report.json"), frontResult.input_completeness_report);

  if (frontResult.raw_payload) {
    writeJson(path.join(outputDir, "raw_payload.json"), frontResult.raw_payload);
  }
  if (frontResult.history_bundle) {
    writeJson(path.join(outputDir, "history_bundle.json"), frontResult.history_bundle);
  }
  if (frontResult.meeting_fact_pack) {
    writeJson(path.join(outputDir, "meeting_fact_pack.json"), frontResult.meeting_fact_pack);
  }
  if (frontResult.data_quality_report) {
    writeJson(path.join(outputDir, "data_quality_report.json"), frontResult.data_quality_report);
  }
}

function buildSelectionCandidates(bundlePath, explicitMeetingId, strictMeetingSelection) {
  if (explicitMeetingId) {
    return [explicitMeetingId];
  }

  const bundle = loadCase04SampleBundle(path.resolve(bundlePath));
  const meetingIds = sortMeetingIdsDesc(bundle.meetings);

  if (strictMeetingSelection || meetingIds.length <= 1) {
    return meetingIds.slice(0, 1);
  }

  return meetingIds;
}

function runFrontPipelineWithSelection(options) {
  const bundlePath = path.resolve(options.bundlePath);
  const candidates = buildSelectionCandidates(
    bundlePath,
    options.meetingId,
    options.strictMeetingSelection
  );
  const attempts = [];
  const fallbackEnabled = !options.meetingId && !options.strictMeetingSelection;

  if (candidates.length === 0) {
    const frontResult = runFrontPipeline({
      bundlePath,
      evaluationPeriod: options.evaluationPeriod,
      triggerType: options.triggerType
    });
    return {
      selectedMeetingId: frontResult.task_request.evaluation_target.current_meeting_id,
      attempts: [{
        meeting_id: frontResult.task_request.evaluation_target.current_meeting_id,
        status: frontResult.orchestration_state.status,
        completeness_status: frontResult.orchestration_state.completeness_status,
        blocking_reasons: frontResult.input_completeness_report.blocking_reasons
      }],
      fallback_used: false,
      front_result: frontResult
    };
  }

  let lastResult = null;

  for (const meetingId of candidates) {
    const frontResult = runFrontPipeline({
      bundlePath,
      meetingId,
      evaluationPeriod: options.evaluationPeriod,
      triggerType: options.triggerType
    });
    attempts.push({
      meeting_id: meetingId,
      status: frontResult.orchestration_state.status,
      completeness_status: frontResult.orchestration_state.completeness_status,
      blocking_reasons: frontResult.input_completeness_report.blocking_reasons
    });
    lastResult = frontResult;

    if (frontResult.orchestration_state.completeness_status !== "blocked" || !fallbackEnabled) {
      return {
        selectedMeetingId: meetingId,
        attempts,
        fallback_used: fallbackEnabled && attempts.length > 1,
        front_result: frontResult
      };
    }
  }

  return {
    selectedMeetingId: candidates[0],
    attempts,
    fallback_used: false,
    front_result: lastResult
  };
}

function buildAutomationSummary(context) {
  const reportStatus = context.reportResult ? context.reportResult.report_status : "blocked";
  const capabilityStatus = context.capabilityResult
    ? context.capabilityResult.assessment_status
    : "blocked";

  return {
    generated_at: nowIso(),
    bundle_path: context.bundlePath,
    output_dir: context.outputDir,
    selected_meeting_id: context.selectedMeetingId,
    front_status: context.frontResult.orchestration_state.status,
    completeness_status: context.frontResult.orchestration_state.completeness_status,
    degrade_reasons: context.frontResult.input_completeness_report.degrade_reasons,
    blocking_reasons: context.frontResult.input_completeness_report.blocking_reasons,
    meeting_selection_attempts: context.selectionAttempts,
    fallback_used: context.fallbackUsed,
    hard_metrics_status: context.hardMetricsResult
      ? context.hardMetricsResult.metric_quality_report
      : null,
    capability_status: capabilityStatus,
    report_status: reportStatus,
    human_review_item_count: context.reportResult && Array.isArray(context.reportResult.human_review_items)
      ? context.reportResult.human_review_items.length
      : 0,
    files: {
      task_request: path.join(context.outputDir, "task_request.json"),
      orchestration_state: path.join(context.outputDir, "orchestration_state.json"),
      input_completeness_report: path.join(context.outputDir, "input_completeness_report.json"),
      raw_payload: path.join(context.outputDir, "raw_payload.json"),
      history_bundle: path.join(context.outputDir, "history_bundle.json"),
      meeting_fact_pack: path.join(context.outputDir, "meeting_fact_pack.json"),
      data_quality_report: path.join(context.outputDir, "data_quality_report.json"),
      hard_metrics_result: path.join(context.outputDir, "hard_metrics_result.json"),
      evaluation_plan: path.join(context.outputDir, "evaluation_plan.json"),
      management_reviewer_result: path.join(context.outputDir, "management_reviewer_result.json"),
      risk_behavior_auditor_result: path.join(context.outputDir, "risk_behavior_auditor_result.json"),
      coordination_lens_result: path.join(context.outputDir, "coordination_lens_result.json"),
      capability_assessor_result: path.join(context.outputDir, "capability_assessor_result.json"),
      report_result: path.join(context.outputDir, "report_result.json")
    }
  };
}

async function runEvaluationAutomation(options = {}) {
  const bundlePath = path.resolve(options.bundlePath || "data/fixtures/feishu_cli_case_04_simulated_5d");
  const outputDir = path.resolve(options.outputDir || defaultOutputDir(bundlePath));
  ensureDir(outputDir);

  const selection = runFrontPipelineWithSelection({
    bundlePath,
    meetingId: options.meetingId,
    evaluationPeriod: options.evaluationPeriod,
    triggerType: options.triggerType || "feishu_bot",
    strictMeetingSelection: Boolean(options.strictMeetingSelection)
  });
  const frontResult = selection.front_result;

  writeFrontOutputs(outputDir, frontResult);

  if (frontResult.orchestration_state.completeness_status === "blocked") {
    const summary = buildAutomationSummary({
      bundlePath,
      outputDir,
      selectedMeetingId: selection.selectedMeetingId,
      selectionAttempts: selection.attempts,
      fallbackUsed: selection.fallback_used,
      frontResult,
      hardMetricsResult: null,
      capabilityResult: null,
      reportResult: null
    });
    writeJson(path.join(outputDir, "automation_summary.json"), summary);
    return summary;
  }

  const hardMetricsResult = runHardMetricsEngine({
    meetingFactPack: frontResult.meeting_fact_pack,
    historyBundle: frontResult.history_bundle,
    rawPayload: frontResult.raw_payload
  });
  writeJson(path.join(outputDir, "hard_metrics_result.json"), hardMetricsResult);

  const evaluationPlan = runEvaluationPlanner({
    taskRequest: frontResult.task_request,
    meetingFactPack: frontResult.meeting_fact_pack,
    historyBundle: frontResult.history_bundle,
    rawPayload: frontResult.raw_payload,
    dataQualityReport: frontResult.data_quality_report,
    inputCompletenessReport: frontResult.input_completeness_report,
    hardMetricsResult
  });
  writeJson(path.join(outputDir, "evaluation_plan.json"), evaluationPlan);

  const managementRequest = buildManagementReviewRequest({
    meetingFactPack: frontResult.meeting_fact_pack,
    historyBundle: frontResult.history_bundle,
    hardMetricsResult,
    evaluationPlan
  });
  const riskBehaviorRequest = buildRiskBehaviorAuditRequest({
    meetingFactPack: frontResult.meeting_fact_pack,
    historyBundle: frontResult.history_bundle,
    hardMetricsResult,
    rawPayload: frontResult.raw_payload,
    evaluationPlan
  });
  const coordinationRequest = buildCoordinationLensRequest({
    meetingFactPack: frontResult.meeting_fact_pack,
    hardMetricsResult,
    rawPayload: frontResult.raw_payload,
    evaluationPlan
  });

  writeJson(path.join(outputDir, "management_reviewer_request.json"), managementRequest);
  writeJson(path.join(outputDir, "risk_behavior_auditor_request.json"), riskBehaviorRequest);
  writeJson(path.join(outputDir, "coordination_lens_request.json"), coordinationRequest);

  const reviewerCalls = options.callModel === false
    ? [Promise.resolve(null), Promise.resolve(null), Promise.resolve(null)]
    : [
      reviewManagement(managementRequest),
      auditRiskBehavior(riskBehaviorRequest),
      reviewCoordination(coordinationRequest)
    ];
  const [managementReviewerResult, riskBehaviorAuditorResult, coordinationLensResult] = await Promise.all(reviewerCalls);

  if (managementReviewerResult) {
    writeJson(path.join(outputDir, "management_reviewer_result.json"), managementReviewerResult);
  }
  if (riskBehaviorAuditorResult) {
    writeJson(path.join(outputDir, "risk_behavior_auditor_result.json"), riskBehaviorAuditorResult);
  }
  if (coordinationLensResult) {
    writeJson(path.join(outputDir, "coordination_lens_result.json"), coordinationLensResult);
  }

  const capabilityRequest = buildCapabilityAssessmentRequest({
    meetingFactPack: frontResult.meeting_fact_pack,
    hardMetricsResult,
    evaluationPlan,
    inputCompletenessReport: frontResult.input_completeness_report,
    dataQualityReport: frontResult.data_quality_report,
    managementReviewerResult,
    riskBehaviorAuditorResult,
    coordinationLensResult
  });
  writeJson(path.join(outputDir, "capability_assessor_request.json"), capabilityRequest);

  const capabilityResult = (options.callModel === false && capabilityRequest.input_status.readiness !== "blocked")
    ? null
    : await assessCapabilityCase04(capabilityRequest);
  if (capabilityResult) {
    writeJson(path.join(outputDir, "capability_assessor_result.json"), capabilityResult);
  }

  const reportRequest = buildCase04ReportRequest({
    meetingFactPack: frontResult.meeting_fact_pack,
    hardMetricsResult,
    evaluationPlan,
    capabilityAssessorResult: capabilityResult,
    managementReviewerResult,
    riskBehaviorAuditorResult,
    coordinationLensResult
  });
  writeJson(path.join(outputDir, "report_writer_request.json"), reportRequest);

  const reportResult = (options.callModel === false && reportRequest.input_status.readiness !== "blocked")
    ? null
    : await writeCase04Report(reportRequest);
  if (reportResult) {
    writeJson(path.join(outputDir, "report_result.json"), reportResult);
  }

  const summary = buildAutomationSummary({
    bundlePath,
    outputDir,
    selectedMeetingId: selection.selectedMeetingId,
    selectionAttempts: selection.attempts,
    fallbackUsed: selection.fallback_used,
    frontResult,
    hardMetricsResult,
    capabilityResult,
    reportResult
  });
  writeJson(path.join(outputDir, "automation_summary.json"), summary);
  return summary;
}

module.exports = {
  runEvaluationAutomation
};

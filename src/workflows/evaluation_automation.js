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
const { ensureDir, fileExists, writeJson } = require("../shared/fs_utils");
const { writeArtifactJson } = require("../shared/schema_validation");
const { buildArtifactFileIndex } = require("./artifact_files");
const { writeFullLoopObservabilityMarkdown } = require("./full_loop_observability");
const { writeObservabilityArtifacts } = require("./observability");
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

function inferCaseNumber(value) {
  const match = String(value || "").match(/case[-_ ]?0?(\d+)/i);
  return match ? match[1].padStart(2, "0") : null;
}

function defaultFullLoopDocPaths(bundlePath, outputDir) {
  const caseNumber = inferCaseNumber(bundlePath) || inferCaseNumber(outputDir);

  return {
    outputDirDoc: path.join(outputDir, "full_loop_observability.md"),
    docsDoc: caseNumber
      ? path.resolve("docs/observability", `case${caseNumber}_full_loop_observability.md`)
      : null,
    title: caseNumber
      ? `Case ${caseNumber} Full Loop Observability`
      : "Full Loop Observability"
  };
}

function canWriteFullLoopObservability(outputDir) {
  const requiredFiles = [
    "orchestration_state.json",
    "input_completeness_report.json"
  ];

  return requiredFiles.every((name) => fileExists(path.join(outputDir, name)));
}

function startRuntimeNode(nodeName, extra = {}) {
  const startedAt = nowIso();
  const startedMs = Date.now();

  return {
    finish(patch = {}) {
      return {
        node_name: nodeName,
        started_at: startedAt,
        finished_at: nowIso(),
        duration_ms: Date.now() - startedMs,
        ...extra,
        ...patch
      };
    }
  };
}

async function runAgentNode({
  nodeKey,
  agentName,
  request,
  run,
  shouldRun,
  modelInvoked
}) {
  const tracker = startRuntimeNode(nodeKey, {
    agent_name: agentName,
    model_invoked: Boolean(modelInvoked)
  });

  if (!shouldRun) {
    return {
      result: null,
      runtime: tracker.finish({
        status: "skipped_model_disabled"
      })
    };
  }

  try {
    const result = await run(request);
    return {
      result,
      runtime: tracker.finish({
        status: result ? "completed" : "missing_result"
      })
    };
  } catch (error) {
    return {
      result: null,
      error,
      runtime: tracker.finish({
        status: "failed",
        error_message: error.message
      })
    };
  }
}

function writeFrontOutputs(outputDir, frontResult) {
  writeArtifactJson(path.join(outputDir, "task_request.json"), frontResult.task_request);
  writeArtifactJson(path.join(outputDir, "orchestration_state.json"), frontResult.orchestration_state);
  writeArtifactJson(path.join(outputDir, "input_completeness_report.json"), frontResult.input_completeness_report);

  if (frontResult.raw_payload) {
    writeArtifactJson(path.join(outputDir, "raw_payload.json"), frontResult.raw_payload);
  }
  if (frontResult.history_bundle) {
    writeArtifactJson(path.join(outputDir, "history_bundle.json"), frontResult.history_bundle);
  }
  if (frontResult.meeting_fact_pack) {
    writeArtifactJson(path.join(outputDir, "meeting_fact_pack.json"), frontResult.meeting_fact_pack);
  }
  if (frontResult.data_quality_report) {
    writeArtifactJson(path.join(outputDir, "data_quality_report.json"), frontResult.data_quality_report);
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
    files: buildArtifactFileIndex(context.outputDir, context.extraFiles || {})
  };
}

async function runEvaluationAutomation(options = {}) {
  const bundlePath = path.resolve(options.bundlePath || "data/fixtures/feishu_cli_case_04_simulated_5d");
  const outputDir = path.resolve(options.outputDir || defaultOutputDir(bundlePath));
  const fullLoopDocPaths = defaultFullLoopDocPaths(bundlePath, outputDir);
  const summaryExtraFiles = fullLoopDocPaths.docsDoc
    ? { full_loop_observability_docs_markdown: fullLoopDocPaths.docsDoc }
    : {};
  ensureDir(outputDir);
  const runtimeMeta = {
    run_started_at: nowIso(),
    run_finished_at: null,
    total_duration_ms: 0,
    error_message: null,
    nodes: {}
  };
  const totalStartedMs = Date.now();
  let selection = null;
  let frontResult = null;
  let hardMetricsResult = null;
  let evaluationPlan = null;
  let capabilityResult = null;
  let reportResult = null;
  let summary = null;

  try {
    const frontTracker = startRuntimeNode("front_pipeline");
    selection = runFrontPipelineWithSelection({
      bundlePath,
      meetingId: options.meetingId,
      evaluationPeriod: options.evaluationPeriod,
      triggerType: options.triggerType || "feishu_bot",
      strictMeetingSelection: Boolean(options.strictMeetingSelection)
    });
    frontResult = selection.front_result;
    runtimeMeta.nodes.front_pipeline = frontTracker.finish({
      status: frontResult.orchestration_state.status,
      completeness_status: frontResult.orchestration_state.completeness_status
    });

    writeFrontOutputs(outputDir, frontResult);

    if (frontResult.orchestration_state.completeness_status === "blocked") {
      summary = buildAutomationSummary({
        bundlePath,
        outputDir,
        selectedMeetingId: selection.selectedMeetingId,
        selectionAttempts: selection.attempts,
      fallbackUsed: selection.fallback_used,
      frontResult,
      hardMetricsResult: null,
      capabilityResult: null,
      reportResult: null,
      extraFiles: summaryExtraFiles
      });
      writeArtifactJson(path.join(outputDir, "automation_summary.json"), summary);
      return summary;
    }

    const hardMetricsTracker = startRuntimeNode("hard_metrics");
    hardMetricsResult = runHardMetricsEngine({
      meetingFactPack: frontResult.meeting_fact_pack,
      historyBundle: frontResult.history_bundle,
      rawPayload: frontResult.raw_payload
    });
    runtimeMeta.nodes.hard_metrics = hardMetricsTracker.finish({
      status: "completed"
    });
    writeArtifactJson(path.join(outputDir, "hard_metrics_result.json"), hardMetricsResult);

    const plannerTracker = startRuntimeNode("evaluation_planner");
    evaluationPlan = runEvaluationPlanner({
      taskRequest: frontResult.task_request,
      meetingFactPack: frontResult.meeting_fact_pack,
      historyBundle: frontResult.history_bundle,
      rawPayload: frontResult.raw_payload,
      dataQualityReport: frontResult.data_quality_report,
      inputCompletenessReport: frontResult.input_completeness_report,
      hardMetricsResult
    });
    runtimeMeta.nodes.evaluation_planner = plannerTracker.finish({
      status: evaluationPlan && evaluationPlan.execution_plan
        ? evaluationPlan.execution_plan.execution_mode || "completed"
        : "completed"
    });
    writeArtifactJson(path.join(outputDir, "evaluation_plan.json"), evaluationPlan);

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

    writeArtifactJson(path.join(outputDir, "management_reviewer_request.json"), managementRequest);
    writeArtifactJson(path.join(outputDir, "risk_behavior_auditor_request.json"), riskBehaviorRequest);
    writeArtifactJson(path.join(outputDir, "coordination_lens_request.json"), coordinationRequest);

    const [managementRun, riskRun, coordinationRun] = await Promise.all([
      runAgentNode({
        nodeKey: "management_reviewer",
        agentName: "Management Reviewer",
        request: managementRequest,
        run: reviewManagement,
        shouldRun: options.callModel !== false,
        modelInvoked: options.callModel !== false
      }),
      runAgentNode({
        nodeKey: "risk_behavior_auditor",
        agentName: "Risk & Behavior Auditor",
        request: riskBehaviorRequest,
        run: auditRiskBehavior,
        shouldRun: options.callModel !== false,
        modelInvoked: options.callModel !== false
      }),
      runAgentNode({
        nodeKey: "coordination_lens",
        agentName: "Coordination Lens",
        request: coordinationRequest,
        run: reviewCoordination,
        shouldRun: options.callModel !== false,
        modelInvoked: options.callModel !== false
      })
    ]);

    runtimeMeta.nodes.management_reviewer = managementRun.runtime;
    runtimeMeta.nodes.risk_behavior_auditor = riskRun.runtime;
    runtimeMeta.nodes.coordination_lens = coordinationRun.runtime;

    if (managementRun.result) {
      writeArtifactJson(path.join(outputDir, "management_reviewer_result.json"), managementRun.result);
    }
    if (riskRun.result) {
      writeArtifactJson(path.join(outputDir, "risk_behavior_auditor_result.json"), riskRun.result);
    }
    if (coordinationRun.result) {
      writeArtifactJson(path.join(outputDir, "coordination_lens_result.json"), coordinationRun.result);
    }

    const reviewerError = [managementRun, riskRun, coordinationRun].find((item) => item.error);
    if (reviewerError) {
      throw reviewerError.error;
    }

    const managementReviewerResult = managementRun.result;
    const riskBehaviorAuditorResult = riskRun.result;
    const coordinationLensResult = coordinationRun.result;

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
    writeArtifactJson(path.join(outputDir, "capability_assessor_request.json"), capabilityRequest);

    const capabilityRun = await runAgentNode({
      nodeKey: "capability_assessor",
      agentName: "Capability Assessor",
      request: capabilityRequest,
      run: assessCapabilityCase04,
      shouldRun: options.callModel !== false || capabilityRequest.input_status.readiness === "blocked",
      modelInvoked: options.callModel !== false
    });
    runtimeMeta.nodes.capability_assessor = capabilityRun.runtime;
    capabilityResult = capabilityRun.result;

    if (capabilityResult) {
      writeArtifactJson(path.join(outputDir, "capability_assessor_result.json"), capabilityResult);
    }
    if (capabilityRun.error) {
      throw capabilityRun.error;
    }

    const reportRequest = buildCase04ReportRequest({
      meetingFactPack: frontResult.meeting_fact_pack,
      historyBundle: frontResult.history_bundle,
      rawPayload: frontResult.raw_payload,
      hardMetricsResult,
      evaluationPlan,
      capabilityAssessorResult: capabilityResult,
      managementReviewerResult,
      riskBehaviorAuditorResult,
      coordinationLensResult
    });
    writeArtifactJson(path.join(outputDir, "report_writer_request.json"), reportRequest);

    const reportRun = await runAgentNode({
      nodeKey: "report_writer",
      agentName: "Report Writer",
      request: reportRequest,
      run: writeCase04Report,
      shouldRun: options.callModel !== false || reportRequest.input_status.readiness === "blocked",
      modelInvoked: options.callModel !== false
    });
    runtimeMeta.nodes.report_writer = reportRun.runtime;
    reportResult = reportRun.result;

    if (reportResult) {
      writeArtifactJson(path.join(outputDir, "report_result.json"), reportResult);
    }
    if (reportRun.error) {
      throw reportRun.error;
    }

    summary = buildAutomationSummary({
      bundlePath,
      outputDir,
      selectedMeetingId: selection.selectedMeetingId,
      selectionAttempts: selection.attempts,
      fallbackUsed: selection.fallback_used,
      frontResult,
      hardMetricsResult,
      capabilityResult,
      reportResult,
      extraFiles: summaryExtraFiles
    });
    writeArtifactJson(path.join(outputDir, "automation_summary.json"), summary);
    return summary;
  } catch (error) {
    runtimeMeta.error_message = error.message;
    throw error;
  } finally {
    runtimeMeta.run_finished_at = nowIso();
    runtimeMeta.total_duration_ms = Date.now() - totalStartedMs;

    writeObservabilityArtifacts({
      bundlePath,
      outputDir,
      selectedMeetingId: selection ? selection.selectedMeetingId : null,
      selectionAttempts: selection ? selection.attempts : [],
      fallbackUsed: selection ? selection.fallback_used : false,
      callModel: options.callModel !== false,
      triggerType: options.triggerType || "manual",
      runtimeMeta,
      extraFiles: {
        ...summaryExtraFiles,
        full_loop_observability_markdown: fullLoopDocPaths.outputDirDoc
      }
    });

    if (canWriteFullLoopObservability(outputDir)) {
      const outputDirDocResult = writeFullLoopObservabilityMarkdown({
        inputDir: outputDir,
        output: fullLoopDocPaths.outputDirDoc,
        metadataOutput: path.join(outputDir, "full_loop_observability.json"),
        title: fullLoopDocPaths.title
      });

      if (fullLoopDocPaths.docsDoc) {
        writeFullLoopObservabilityMarkdown({
          inputDir: outputDir,
          output: fullLoopDocPaths.docsDoc,
          metadataOutput: null,
          title: fullLoopDocPaths.title
        });
      }

      if (summary && summary.files) {
        summary.files.full_loop_observability_markdown = outputDirDocResult.output;
        if (fullLoopDocPaths.docsDoc) {
          summary.files.full_loop_observability_docs_markdown = fullLoopDocPaths.docsDoc;
        }
        writeArtifactJson(path.join(outputDir, "automation_summary.json"), summary);
      }
    }
  }
}

module.exports = {
  runEvaluationAutomation
};

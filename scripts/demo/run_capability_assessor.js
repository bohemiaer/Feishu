"use strict";

const fs = require("fs");
const path = require("path");
const { readArtifactJson, writeArtifactJson } = require("../../src/shared/schema_validation");
const {
  assessCapabilityCase04,
  buildCapabilityAssessmentRequest
} = require("../../src/agents/capability_assessor");

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

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readArtifactJson(filePath) : null;
}

async function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const requestOutput = path.resolve(args["request-output"] || path.join(inputDir, "capability_assessor_request.json"));
  const resultOutput = path.resolve(args.output || path.join(inputDir, "capability_assessor_result.json"));
  const request = buildCapabilityAssessmentRequest({
    meetingFactPack: readArtifactJson(path.join(inputDir, "meeting_fact_pack.json")),
    hardMetricsResult: readArtifactJson(path.join(inputDir, "hard_metrics_result.json")),
    evaluationPlan: readArtifactJson(path.join(inputDir, "evaluation_plan.json")),
    inputCompletenessReport: readArtifactJson(path.join(inputDir, "input_completeness_report.json")),
    dataQualityReport: readArtifactJson(path.join(inputDir, "data_quality_report.json")),
    managementReviewerResult: readOptionalJson(path.join(inputDir, "management_reviewer_result.json")),
    riskBehaviorAuditorResult: readOptionalJson(path.join(inputDir, "risk_behavior_auditor_result.json")),
    coordinationLensResult: readOptionalJson(path.join(inputDir, "coordination_lens_result.json"))
  });

  writeArtifactJson(requestOutput, request);

  if (args["call-model"] || request.input_status.readiness === "blocked") {
    writeArtifactJson(resultOutput, await assessCapabilityCase04(request));
  }

  process.stdout.write(JSON.stringify({
    request_output: requestOutput,
    result_output: request.input_status.readiness === "blocked" || args["call-model"] ? resultOutput : null,
    call_model: Boolean(args["call-model"]),
    readiness: request.input_status.readiness,
    missing_upstream_results: request.input_status.missing_upstream_results,
    hard_metric_count: request.hard_metrics.length,
    review_rule_count: request.planner_slice.human_review_rules.length
  }, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

"use strict";

const path = require("path");
const { readArtifactJson, writeArtifactJson } = require("../../src/shared/schema_validation");
const { buildManagementReviewRequest, reviewManagement } = require("../../src/agents/management_reviewer");

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

async function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const requestOutput = path.resolve(args["request-output"] || path.join(inputDir, "management_reviewer_request.json"));
  const resultOutput = args.output ? path.resolve(args.output) : "";
  const request = buildManagementReviewRequest({
    meetingFactPack: readArtifactJson(path.join(inputDir, "meeting_fact_pack.json")),
    historyBundle: readArtifactJson(path.join(inputDir, "history_bundle.json")),
    hardMetricsResult: readArtifactJson(path.join(inputDir, "hard_metrics_result.json")),
    evaluationPlan: readArtifactJson(path.join(inputDir, "evaluation_plan.json"))
  });

  writeArtifactJson(requestOutput, request);

  if (args["call-model"]) {
    const result = await reviewManagement(request);
    writeArtifactJson(resultOutput || path.join(inputDir, "management_reviewer_result.json"), result);
  }

  process.stdout.write(JSON.stringify({
    request_output: requestOutput,
    call_model: Boolean(args["call-model"]),
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

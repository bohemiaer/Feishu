"use strict";

const fs = require("fs");
const path = require("path");
const { readArtifactJson, writeArtifactJson } = require("../../src/shared/schema_validation");
const { buildCase04ReportRequest, writeCase04Report } = require("../../src/agents/report_writer");

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
  const requestOutput = path.resolve(args["request-output"] || path.join(inputDir, "report_writer_request.json"));
  const output = path.resolve(args.output || path.join(inputDir, "report_result.json"));
  const request = buildCase04ReportRequest({
    meetingFactPack: readArtifactJson(path.join(inputDir, "meeting_fact_pack.json")),
    historyBundle: readArtifactJson(path.join(inputDir, "history_bundle.json")),
    rawPayload: readArtifactJson(path.join(inputDir, "raw_payload.json")),
    hardMetricsResult: readArtifactJson(path.join(inputDir, "hard_metrics_result.json")),
    evaluationPlan: readArtifactJson(path.join(inputDir, "evaluation_plan.json")),
    capabilityAssessorResult: readOptionalJson(path.join(inputDir, "capability_assessor_result.json")),
    managementReviewerResult: readOptionalJson(path.join(inputDir, "management_reviewer_result.json")),
    riskBehaviorAuditorResult: readOptionalJson(path.join(inputDir, "risk_behavior_auditor_result.json")),
    coordinationLensResult: readOptionalJson(path.join(inputDir, "coordination_lens_result.json"))
  });

  writeArtifactJson(requestOutput, request);

  if (args["call-model"] || request.input_status.readiness === "blocked") {
    writeArtifactJson(output, await writeCase04Report(request));
  } else if (args.output || args["write-deterministic"]) {
    writeArtifactJson(output, await writeCase04Report(request, { skipModel: true }));
  }

  process.stdout.write(JSON.stringify({
    request_output: requestOutput,
    output: request.input_status.readiness === "blocked" || args["call-model"] || args.output || args["write-deterministic"] ? output : null,
    call_model: Boolean(args["call-model"]),
    readiness: request.input_status.readiness,
    missing_upstream_results: request.input_status.missing_upstream_results,
    human_review_item_count: request.human_review_items.length
  }, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

"use strict";

const path = require("path");
const { readJson, writeJson } = require("../../src/shared/fs_utils");
const { auditRiskBehavior, buildRiskBehaviorAuditRequest } = require("../../src/agents/risk_behavior_auditor");

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
  const requestOutput = path.resolve(args["request-output"] || path.join(inputDir, "risk_behavior_auditor_request.json"));
  const request = buildRiskBehaviorAuditRequest({
    meetingFactPack: readJson(path.join(inputDir, "meeting_fact_pack.json")),
    historyBundle: readJson(path.join(inputDir, "history_bundle.json")),
    hardMetricsResult: readJson(path.join(inputDir, "hard_metrics_result.json")),
    rawPayload: readJson(path.join(inputDir, "raw_payload.json")),
    evaluationPlan: readJson(path.join(inputDir, "evaluation_plan.json"))
  });

  writeJson(requestOutput, request);

  if (args["call-model"]) {
    const output = path.resolve(args.output || path.join(inputDir, "risk_behavior_auditor_result.json"));
    writeJson(output, await auditRiskBehavior(request));
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

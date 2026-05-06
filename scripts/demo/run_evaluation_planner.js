"use strict";

const path = require("path");
const { readArtifactJson, writeArtifactJson } = require("../../src/shared/schema_validation");
const { runEvaluationPlanner } = require("../../src/domain/evaluation/evaluation_planner");

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

function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const outputPath = path.resolve(args.output || path.join(inputDir, "evaluation_plan.json"));
  const result = runEvaluationPlanner({
    taskRequest: readArtifactJson(path.join(inputDir, "task_request.json")),
    meetingFactPack: readArtifactJson(path.join(inputDir, "meeting_fact_pack.json")),
    historyBundle: readArtifactJson(path.join(inputDir, "history_bundle.json")),
    rawPayload: readArtifactJson(path.join(inputDir, "raw_payload.json")),
    dataQualityReport: readArtifactJson(path.join(inputDir, "data_quality_report.json")),
    inputCompletenessReport: readArtifactJson(path.join(inputDir, "input_completeness_report.json")),
    hardMetricsResult: readArtifactJson(path.join(inputDir, "hard_metrics_result.json"))
  });

  writeArtifactJson(outputPath, result);
  process.stdout.write(JSON.stringify({
    output: outputPath,
    execution_mode: result.evaluation_focus.execution_mode,
    focus_dimension_count: result.evaluation_focus.focus_dimensions.length,
    agent_count: result.execution_plan.agent_plan.length,
    review_rule_count: result.human_review_rules.length
  }, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

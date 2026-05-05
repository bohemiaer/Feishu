"use strict";

const path = require("path");
const { runFrontPipeline } = require("../../src/workflows/front_pipeline");
const { ensureDir, writeJson } = require("../../src/shared/fs_utils");

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
  const outputDir = path.resolve(args["output-dir"] || "data/outputs/demo/case04/current");
  const result = runFrontPipeline({
    bundlePath: args["input-dir"] || "data/fixtures/feishu_cli_case_04_simulated_5d",
    meetingId: args["meeting-id"],
    evaluationPeriod: args["evaluation-period"],
    triggerType: args["trigger-type"] || "manual"
  });

  ensureDir(outputDir);
  writeJson(path.join(outputDir, "task_request.json"), result.task_request);
  writeJson(path.join(outputDir, "orchestration_state.json"), result.orchestration_state);
  writeJson(path.join(outputDir, "input_completeness_report.json"), result.input_completeness_report);

  if (result.raw_payload) {
    writeJson(path.join(outputDir, "raw_payload.json"), result.raw_payload);
  }
  if (result.history_bundle) {
    writeJson(path.join(outputDir, "history_bundle.json"), result.history_bundle);
  }
  if (result.meeting_fact_pack) {
    writeJson(path.join(outputDir, "meeting_fact_pack.json"), result.meeting_fact_pack);
  }
  if (result.data_quality_report) {
    writeJson(path.join(outputDir, "data_quality_report.json"), result.data_quality_report);
  }

  process.stdout.write(JSON.stringify({
    output_dir: outputDir,
    status: result.orchestration_state.status,
    completeness_status: result.orchestration_state.completeness_status,
    current_meeting_id: result.task_request.evaluation_target.current_meeting_id
  }, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

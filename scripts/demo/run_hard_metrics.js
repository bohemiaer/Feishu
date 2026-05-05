"use strict";

const path = require("path");
const { readJson, writeJson } = require("../../src/shared/fs_utils");
const { runHardMetricsEngine } = require("../../src/domain/evaluation/hard_metrics_engine");

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
  const outputPath = path.resolve(args.output || path.join(inputDir, "hard_metrics_result.json"));
  const meetingFactPack = readJson(path.join(inputDir, "meeting_fact_pack.json"));
  const historyBundle = readJson(path.join(inputDir, "history_bundle.json"));
  const rawPayload = readJson(path.join(inputDir, "raw_payload.json"));
  const result = runHardMetricsEngine({
    meetingFactPack,
    historyBundle,
    rawPayload
  });

  writeJson(outputPath, result);
  process.stdout.write(JSON.stringify({
    output: outputPath,
    metric_count: result.metric_quality_report.metric_count,
    available_count: result.metric_quality_report.available_count,
    degraded_count: result.metric_quality_report.degraded_count,
    no_sample_count: result.metric_quality_report.no_sample_count
  }, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

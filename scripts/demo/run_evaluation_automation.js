"use strict";

const path = require("path");
const { runEvaluationAutomation } = require("../../src/workflows/evaluation_automation");

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
    args[key] = value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const summary = await runEvaluationAutomation({
    bundlePath: args["input-dir"] || args["bundle-path"] || "data/fixtures/feishu_cli_case_04_simulated_5d",
    meetingId: args["meeting-id"],
    outputDir: args["output-dir"] ? path.resolve(args["output-dir"]) : undefined,
    evaluationPeriod: args["evaluation-period"],
    triggerType: args["trigger-type"] || "manual",
    callModel: args["no-model"] ? false : true,
    strictMeetingSelection: Boolean(args["strict-latest"])
  });

  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

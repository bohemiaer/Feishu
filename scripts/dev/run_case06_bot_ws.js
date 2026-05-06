"use strict";

const {
  buildDoneText,
  buildLaunchCard,
  buildMockDoneCard,
  runCase06Writeback,
  startCase06BotWs
} = require("../../src/integrations/feishu/case06_bot_ws");

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
  const options = {
    inputDir: args["input-dir"] || "data/outputs/demo/case06/auto",
    baseToken: args["base-token"],
    cliPath: args.cli,
    dryRun: Boolean(args["dry-run"]),
    noClear: Boolean(args["no-clear"]),
    skipPublish: Boolean(args["skip-publish"])
  };

  if (args["dry-run"]) {
    const result = await runCase06Writeback({
      ...options,
      skipPublish: Boolean(args["skip-publish"]),
      dryRun: true
    });
    process.stdout.write(JSON.stringify({
      card: buildLaunchCard(),
      mock_done_card: buildMockDoneCard(),
      done_text: buildDoneText(result.summary),
      publish: result.publish
    }, null, 2) + "\n");
    return;
  }

  startCase06BotWs(options);
  process.stderr.write("Case06 Feishu bot WebSocket started. Send `发起中层管理效能评估` or `发起评估 case06` to the bot.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

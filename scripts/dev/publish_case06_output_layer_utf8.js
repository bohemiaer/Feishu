"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildCase06Summary,
  buildCleanOutputLayerInput,
  publishOutputLayerInput
} = require("../../src/integrations/feishu/case06_output_layer");

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

function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case06/auto");
  const inputPath = path.join(inputDir, "output_layer_input.json");
  const input = args["no-build"]
    ? JSON.parse(fs.readFileSync(inputPath, "utf8"))
    : buildCleanOutputLayerInput(inputDir, { baseToken: args["base-token"] });
  const publishResult = publishOutputLayerInput(input, {
    baseToken: args["base-token"],
    cliPath: args.cli,
    dryRun: Boolean(args["dry-run"]),
    noClear: Boolean(args["no-clear"])
  });

  process.stdout.write(JSON.stringify({
    input: inputPath,
    summary: buildCase06Summary(input),
    publish: publishResult
  }, null, 2) + "\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

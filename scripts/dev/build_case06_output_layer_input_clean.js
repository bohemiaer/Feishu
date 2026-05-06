"use strict";

const path = require("path");
const { buildCase06Summary, buildCleanOutputLayerInput } = require("../../src/integrations/feishu/case06_output_layer");

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
  const input = buildCleanOutputLayerInput(inputDir, {
    baseToken: args["base-token"]
  });
  process.stdout.write(JSON.stringify({
    output: path.join(inputDir, "output_layer_input.json"),
    summary: buildCase06Summary(input),
    rows: {
      workspace_home: input.workspace_home.length,
      people_overview: input.people_overview.length,
      evaluation_runs: 1,
      dimension_results: input.dimension_results.length,
      metric_results: input.metric_results.length,
      review_items: input.review_items.length,
      evidence_index: input.evidence_index.length
    }
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

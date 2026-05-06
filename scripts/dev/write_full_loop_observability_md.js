"use strict";

const path = require("path");
const { writeFullLoopObservabilityMarkdown } = require("../../src/workflows/full_loop_observability");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    args[key] = value;
  }
  return args;
}

function inferCaseNumber(value) {
  const match = String(value || "").match(/case[-_ ]?0?(\d+)/i);
  return match ? match[1].padStart(2, "0") : null;
}

function inferDefaults(inputDir) {
  const caseNumber = inferCaseNumber(inputDir);
  if (!caseNumber) {
    return {
      title: "Full Loop Observability",
      output: path.resolve("docs/observability/full_loop_observability.md")
    };
  }

  return {
    title: `Case ${caseNumber} Full Loop Observability`,
    output: path.resolve("docs/observability", `case${caseNumber}_full_loop_observability.md`)
  };
}

function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const defaults = inferDefaults(inputDir);
  const result = writeFullLoopObservabilityMarkdown({
    inputDir,
    output: path.resolve(args.output || defaults.output),
    metadataOutput: path.resolve(args["metadata-output"] || path.join(inputDir, "full_loop_observability.json")),
    title: args.title || defaults.title
  });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

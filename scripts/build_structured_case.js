"use strict";

const fs = require("fs");
const path = require("path");
const { buildStructuredCase } = require("../src/preprocess/unstructured_case_builder");

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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    console.error("Usage: node scripts/build_structured_case.js --input <case_dir> [--output-dir <dir>]");
    process.exit(1);
  }

  const caseDir = path.resolve(args.input);
  const built = buildStructuredCase(caseDir);
  const outputDir = path.resolve(args["output-dir"] || path.join(caseDir, "_generated"));
  ensureDir(outputDir);
  writeJson(path.join(outputDir, "raw_payload.json"), built.raw_payload);
  writeJson(path.join(outputDir, "history_bundle.json"), built.history_bundle);
  process.stdout.write(
    JSON.stringify(
      {
        case_id: built.case_id,
        output_dir: outputDir
      },
      null,
      2
    ) + "\n"
  );
}

if (require.main === module) {
  main();
}

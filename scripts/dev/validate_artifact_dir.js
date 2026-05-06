"use strict";

const fs = require("fs");
const path = require("path");
const {
  getSchemaBundleVersion,
  listArtifactContracts,
  readArtifactJson
} = require("../../src/shared/schema_validation");

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
  const contracts = listArtifactContracts();
  const checked = [];
  const missing = [];

  Object.keys(contracts).sort().forEach((artifactName) => {
    const filePath = path.join(inputDir, `${artifactName}.json`);
    if (!fs.existsSync(filePath)) {
      missing.push(artifactName);
      return;
    }
    readArtifactJson(filePath, artifactName);
    checked.push(artifactName);
  });

  process.stdout.write(JSON.stringify({
    input_dir: inputDir,
    schema_bundle_version: getSchemaBundleVersion(),
    checked_count: checked.length,
    checked,
    missing_count: missing.length,
    missing
  }, null, 2) + "\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

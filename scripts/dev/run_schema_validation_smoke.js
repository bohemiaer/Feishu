"use strict";

const path = require("path");
const { runEvaluationAutomation } = require("../../src/workflows/evaluation_automation");
const {
  getSchemaBundleVersion,
  listArtifactContracts,
  readArtifactJson
} = require("../../src/shared/schema_validation");

async function main() {
  const outputDir = path.resolve("data/outputs/demo/case05/schema_validation_smoke");
  const inputDir = path.resolve("data/fixtures/feishu_cli_case_05_desktop_robot");
  const summary = await runEvaluationAutomation({
    bundlePath: inputDir,
    outputDir,
    callModel: false
  });

  const checked = [];
  const missing = [];
  Object.keys(listArtifactContracts()).sort().forEach((artifactName) => {
    const filePath = path.join(outputDir, `${artifactName}.json`);
    try {
      readArtifactJson(filePath, artifactName);
      checked.push(artifactName);
    } catch (error) {
      if (/ENOENT/i.test(error.message)) {
        missing.push(artifactName);
        return;
      }
      throw error;
    }
  });

  process.stdout.write(JSON.stringify({
    schema_bundle_version: getSchemaBundleVersion(),
    input_dir: inputDir,
    output_dir: outputDir,
    completeness_status: summary.completeness_status,
    checked_count: checked.length,
    checked,
    missing_count: missing.length,
    missing
  }, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

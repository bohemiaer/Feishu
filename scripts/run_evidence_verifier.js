"use strict";

const fs = require("fs");
const path = require("path");
const { buildEvidenceRequest, verifyEvidence } = require("../src/agents/evidence_verifier");

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeOutput(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    console.error("Usage: node scripts/run_evidence_verifier.js --input <meeting_fact_pack.json> [--request-output <request.json>] [--output <evidence_result.json>]");
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  const meetingFactPack = readJson(inputPath);
  const request = buildEvidenceRequest(meetingFactPack);
  const result = await verifyEvidence(request);

  if (args["request-output"]) {
    writeOutput(path.resolve(args["request-output"]), request);
  }

  if (args.output) {
    writeOutput(path.resolve(args.output), result);
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

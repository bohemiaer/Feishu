"use strict";

// Legacy end-to-end demo pipeline for the old case_sources/evaluation_inputs flow.

const fs = require("fs");
const path = require("path");
const { buildStructuredCase } = require("../src/preprocess/unstructured_case_builder");
const { normalizePayload } = require("./normalize_meeting_payload");
const { buildEvidenceRequest, verifyEvidence } = require("../src/agents/evidence_verifier");
const { buildReviewRequest, reviewMeeting } = require("../src/agents/review_engine");
const { buildCapabilityRequest, assessCapability } = require("../src/agents/capability_assessor");
const { buildReportRequest, writeReport } = require("../src/agents/report_writer");

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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function runCase(caseDir, outputDir) {
  const builtCase = buildStructuredCase(caseDir);
  const raw = builtCase.raw_payload;
  const meetingFactPack = normalizePayload(raw);
  const evidenceRequest = buildEvidenceRequest(meetingFactPack);
  const evidenceResult = await verifyEvidence(evidenceRequest);
  const historyBundle = builtCase.history_bundle || {
    history_meetings: [],
    task_closure_notes: [],
    risk_notes: []
  };
  const reviewRequest = buildReviewRequest(meetingFactPack, evidenceResult, historyBundle);
  const reviewResult = await reviewMeeting(reviewRequest);
  const capabilityRequest = buildCapabilityRequest(meetingFactPack, evidenceResult, reviewResult);
  const evaluationResult = await assessCapability(capabilityRequest);
  const reportRequest = buildReportRequest(
    meetingFactPack,
    evidenceResult,
    reviewResult,
    evaluationResult
  );
  const reportResult = await writeReport(reportRequest);

  ensureDir(outputDir);
  writeJson(path.join(outputDir, "raw_payload.json"), raw);
  writeJson(path.join(outputDir, "history_bundle.json"), historyBundle);
  writeJson(path.join(outputDir, "meeting_fact_pack.json"), meetingFactPack);
  writeJson(path.join(outputDir, "evidence_request.json"), evidenceRequest);
  writeJson(path.join(outputDir, "evidence_result.json"), evidenceResult);
  writeJson(path.join(outputDir, "review_request.json"), reviewRequest);
  writeJson(path.join(outputDir, "review_result.json"), reviewResult);
  writeJson(path.join(outputDir, "capability_request.json"), capabilityRequest);
  writeJson(path.join(outputDir, "evaluation_result.json"), evaluationResult);
  writeJson(path.join(outputDir, "report_request.json"), reportRequest);
  writeJson(path.join(outputDir, "report_result.json"), reportResult);

  return {
    case_id: builtCase.case_id,
    project_id: meetingFactPack.meeting_info.project_id,
    meeting_id: meetingFactPack.meeting_info.meeting_id,
    meeting_title: meetingFactPack.meeting_info.meeting_title,
    supported_ratio: evidenceResult.meeting_preliminary_result.supported_ratio,
    review_result: reviewResult.review_result,
    top_risk: evaluationResult.top_risk,
    report_title: reportResult.report_title
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "case_sources");
  const outputRoot = path.resolve(args["output-dir"] || "demo_outputs");
  const cases = ["case_01"];

  const summary = [];
  for (const fileName of cases) {
    // Keep sequential calls so one model request failure is easy to trace.
    summary.push(await runCase(path.join(inputDir, fileName), path.join(outputRoot, fileName)));
  }

  writeJson(path.join(outputRoot, "demo_summary.json"), summary);
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

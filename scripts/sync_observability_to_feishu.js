"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const BASE_TOKEN = "R7bebfixvam0AqsPowucJcuHn2e";
const CLI_PATH = "C:\\Users\\HCI_lab\\AppData\\Roaming\\npm\\lark-cli.cmd";
const OBS_TABLE = "数据表";

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function runCli(args, cwd) {
  return execFileSync("cmd.exe", ["/c", CLI_PATH, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function listRecordIds(tmpDir) {
  const raw = runCli(
    [
      "base",
      "+record-list",
      "--base-token",
      BASE_TOKEN,
      "--table-id",
      OBS_TABLE,
      "--as",
      "user"
    ],
    tmpDir
  );
  const parsed = JSON.parse(raw);
  return parsed.data.record_id_list || [];
}

function clearObservabilityTable(tmpDir) {
  listRecordIds(tmpDir).forEach((recordId) => {
    runCli(
      [
        "base",
        "+record-delete",
        "--base-token",
        BASE_TOKEN,
        "--table-id",
        OBS_TABLE,
        "--record-id",
        recordId,
        "--yes",
        "--as",
        "user"
      ],
      tmpDir
    );
  });
}

function createRecord(textValue, tmpDir) {
  const payloadPath = path.join(tmpDir, "obs_record.json");
  fs.writeFileSync(payloadPath, JSON.stringify({ 文本: textValue }), "utf8");
  runCli(
    [
      "base",
      "+record-upsert",
      "--base-token",
      BASE_TOKEN,
      "--table-id",
      OBS_TABLE,
      "--json",
      "@./obs_record.json",
      "--as",
      "user"
    ],
    tmpDir
  );
}

function buildArtifactText(artifact) {
  return [
    `artifact_type: ${artifact.artifact_type}`,
    `stage: ${artifact.stage}`,
    `case_id: ${artifact.case_id}`,
    `source_path: ${artifact.source_path}`,
    "",
    artifact.content
  ].join("\n");
}

function collectArtifacts(projectRoot) {
  const bundleRoot = path.join(projectRoot, "evaluation_inputs", "case_01");
  const outputRoot = path.join(projectRoot, "demo_outputs", "case_01");
  const summaryRoot = path.join(projectRoot, "demo_outputs");

  const textArtifacts = [
    {
      artifact_type: "input_manifest",
      stage: "input",
      case_id: "case_01",
      source_path: path.join(bundleRoot, "manifest.json"),
      content: JSON.stringify(readJson(path.join(bundleRoot, "manifest.json")), null, 2)
    },
    {
      artifact_type: "input_current_meeting_minutes",
      stage: "input",
      case_id: "case_01",
      source_path: path.join(bundleRoot, "current_meeting", "meeting_minutes.md"),
      content: readText(path.join(bundleRoot, "current_meeting", "meeting_minutes.md"))
    },
    {
      artifact_type: "input_project_main_doc",
      stage: "input",
      case_id: "case_01",
      source_path: path.join(bundleRoot, "project_documents", "project_main_doc.md"),
      content: readText(path.join(bundleRoot, "project_documents", "project_main_doc.md"))
    },
    {
      artifact_type: "input_weekly_report",
      stage: "input",
      case_id: "case_01",
      source_path: path.join(bundleRoot, "project_documents", "weekly_report.md"),
      content: readText(path.join(bundleRoot, "project_documents", "weekly_report.md"))
    },
    {
      artifact_type: "input_stage_review",
      stage: "input",
      case_id: "case_01",
      source_path: path.join(bundleRoot, "project_documents", "stage_review.md"),
      content: readText(path.join(bundleRoot, "project_documents", "stage_review.md"))
    },
    {
      artifact_type: "input_history_context",
      stage: "input",
      case_id: "case_01",
      source_path: path.join(bundleRoot, "review_context", "history_context.md"),
      content: readText(path.join(bundleRoot, "review_context", "history_context.md"))
    }
  ];

  const reviewMeetingDir = path.join(bundleRoot, "review_meetings");
  fs.readdirSync(reviewMeetingDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .forEach((name) => {
      textArtifacts.push({
        artifact_type: `input_${path.basename(name, ".md")}`,
        stage: "review_input",
        case_id: "case_01",
        source_path: path.join(reviewMeetingDir, name),
        content: readText(path.join(reviewMeetingDir, name))
      });
    });

  const jsonArtifacts = [
    "raw_payload.json",
    "history_bundle.json",
    "meeting_fact_pack.json",
    "evidence_request.json",
    "evidence_result.json",
    "review_request.json",
    "review_result.json",
    "capability_request.json",
    "evaluation_result.json",
    "report_request.json",
    "report_result.json"
  ].map((name) => ({
    artifact_type: path.basename(name, ".json"),
    stage: name.includes("request") ? "agent_request" : name.includes("result") ? "agent_result" : "structured",
    case_id: "case_01",
    source_path: path.join(outputRoot, name),
    content: JSON.stringify(readJson(path.join(outputRoot, name)), null, 2)
  }));

  const summaryArtifacts = [
    {
      artifact_type: "demo_summary",
      stage: "summary",
      case_id: "case_01",
      source_path: path.join(summaryRoot, "demo_summary.json"),
      content: JSON.stringify(readJson(path.join(summaryRoot, "demo_summary.json")), null, 2)
    },
    {
      artifact_type: "feishu_sync_summary",
      stage: "summary",
      case_id: "case_01",
      source_path: path.join(summaryRoot, "feishu_sync_summary.json"),
      content: JSON.stringify(readJson(path.join(summaryRoot, "feishu_sync_summary.json")), null, 2)
    }
  ];

  return [...textArtifacts, ...jsonArtifacts, ...summaryArtifacts];
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manager-insight-observability-"));
  const artifacts = collectArtifacts(projectRoot);

  clearObservabilityTable(tmpDir);
  artifacts.forEach((artifact) => {
    createRecord(buildArtifactText(artifact), tmpDir);
  });

  const summary = {
    synced_table: OBS_TABLE,
    artifact_count: artifacts.length,
    sample_artifacts: artifacts.slice(0, 5).map((item) => item.artifact_type)
  };

  writeJson(path.join(projectRoot, "demo_outputs", "observability_sync_summary.json"), summary);
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

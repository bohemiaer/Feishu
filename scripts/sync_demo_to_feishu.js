"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const { buildStructuredCase } = require("../src/preprocess/unstructured_case_builder");

const BASE_TOKEN = "R7bebfixvam0AqsPowucJcuHn2e";
const CLI_PATH = "C:\\Users\\HCI_lab\\AppData\\Roaming\\npm\\lark-cli.cmd";
const TABLES = ["Projects", "Meetings", "Statements", "Tasks", "Risks", "Evaluations", "Reports"];
const OBSOLETE_DOC_URLS = [
  "https://jcneyh7qlo8i.feishu.cn/docx/JQiDdqYkmossJDxviQKcxktBnmf",
  "https://jcneyh7qlo8i.feishu.cn/docx/GMNPdIBAto0ziqx4YHncCKcCnLh",
  "https://jcneyh7qlo8i.feishu.cn/docx/EDk8dPF6joTPnGxFOI8ck56znSe",
  "https://jcneyh7qlo8i.feishu.cn/docx/BccDdYl0RoL5a5xMmEec6xConDg",
  "https://jcneyh7qlo8i.feishu.cn/docx/KaF0d4nwAo6yxmx3yiVchYFAnPh",
  "https://jcneyh7qlo8i.feishu.cn/docx/VpAEdrdAHoVf9qxBbQfcIYSGn7f",
  "https://jcneyh7qlo8i.feishu.cn/docx/Mg3ndFRN3o0Dk3x77l6cropJnI9",
  "https://jcneyh7qlo8i.feishu.cn/docx/PgS9dUPVyoGAVxxDYJ2cREXtnBb",
  "https://jcneyh7qlo8i.feishu.cn/docx/YZ8pdxTyLonywYxopB6c4Nvcn6f",
  "https://jcneyh7qlo8i.feishu.cn/docx/FgQ9dTduBoASggxtrXQc4hQwnhf",
  "https://jcneyh7qlo8i.feishu.cn/docx/AM9hdBtM4oOO15xTx9zckjLtnO0",
  "https://jcneyh7qlo8i.feishu.cn/docx/HoqHdWd9KoPhIRxaOX0cPFgBnyg",
  "https://jcneyh7qlo8i.feishu.cn/docx/WuRedlVmio2AxExbgPFctYBdnNd",
  "https://jcneyh7qlo8i.feishu.cn/docx/FFWadXfHooKphExOODQcaAa8n6b",
  "https://jcneyh7qlo8i.feishu.cn/docx/EqEOdprCqo39GSxALXkccC8KnLf",
  "https://jcneyh7qlo8i.feishu.cn/docx/KLredqQM2oaO5rxDpVRcMy97n7v",
  "https://jcneyh7qlo8i.feishu.cn/docx/W0FWdIfkUomv2hxQ3pocWYn1nQd",
  "https://jcneyh7qlo8i.feishu.cn/docx/SLWMdYwtHoZTHHxew87ccTYhnab",
  "https://jcneyh7qlo8i.feishu.cn/docx/OluUdQEgronjy5xAj0McD1BinUd",
  "https://jcneyh7qlo8i.feishu.cn/docx/GAGCd1khqorV82xPYcYcVW67nhc",
  "https://jcneyh7qlo8i.feishu.cn/docx/W1gGdDa1yoMZyMxjnutcrHdRnmS",
  "https://jcneyh7qlo8i.feishu.cn/docx/Fc7JdmDjAoyzprxBzZocfdQhnag",
  "https://jcneyh7qlo8i.feishu.cn/docx/OGGOdR6Hmo0q7jxzGwlc5Kkznob",
  "https://jcneyh7qlo8i.feishu.cn/docx/R4F2dPkI5oItYGxgAoTcygo3nsg"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function runCli(args, cwd) {
  const output = execFileSync("cmd.exe", ["/c", CLI_PATH, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return output;
}

function writeUtf8NoBom(filePath, content) {
  fs.writeFileSync(filePath, content, { encoding: "utf8" });
}

function extractDocToken(url) {
  const match = String(url || "").match(/\/docx\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

function deleteDocByUrl(url, tmpDir) {
  const token = extractDocToken(url);
  if (!token) return false;

  try {
    runCli(
      [
        "drive",
        "+delete",
        "--file-token",
        token,
        "--type",
        "docx",
        "--yes",
        "--as",
        "user"
      ],
      tmpDir
    );
    return true;
  } catch (error) {
    return false;
  }
}

function cleanupObsoleteDocs(tmpDir) {
  const uniqueUrls = Array.from(new Set(OBSOLETE_DOC_URLS));
  return uniqueUrls.map((url) => ({
    url,
    deleted: deleteDocByUrl(url, tmpDir)
  }));
}

function createDoc(tmpDir, title, markdown) {
  const contentFile = path.join(tmpDir, "doc.md");
  writeUtf8NoBom(contentFile, markdown);
  const raw = runCli(
    [
      "docs",
      "+create",
      "--api-version",
      "v2",
      "--title",
      title,
      "--content",
      "@./doc.md",
      "--doc-format",
      "markdown",
      "--parent-position",
      "my_library",
      "--as",
      "user"
    ],
    tmpDir
  );
  return JSON.parse(raw).data.document.url;
}

function listRecordIds(tableName, tmpDir) {
  const raw = runCli(
    [
      "base",
      "+record-list",
      "--base-token",
      BASE_TOKEN,
      "--table-id",
      tableName,
      "--as",
      "user"
    ],
    tmpDir
  );
  const parsed = JSON.parse(raw);
  return parsed.data.record_id_list || [];
}

function clearTable(tableName, tmpDir) {
  const ids = listRecordIds(tableName, tmpDir);
  ids.forEach((recordId) => {
    runCli(
      [
        "base",
        "+record-delete",
        "--base-token",
        BASE_TOKEN,
        "--table-id",
        tableName,
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

function upsertRecord(tableName, record, tmpDir) {
  const recordFile = path.join(tmpDir, "record.json");
  writeUtf8NoBom(recordFile, JSON.stringify(record));
  runCli(
    [
      "base",
      "+record-upsert",
      "--base-token",
      BASE_TOKEN,
      "--table-id",
      tableName,
      "--json",
      "@./record.json",
      "--as",
      "user"
    ],
    tmpDir
  );
}

function buildProjectDocMarkdown(rawCase) {
  return rawCase.documents.main_doc;
}

function buildWeeklyDocMarkdown(rawCase) {
  return rawCase.documents.weekly_report;
}

function buildReviewDocMarkdown(rawCase) {
  return rawCase.documents.review_doc;
}

function buildReportMarkdown(rawCase, reviewResult, evaluationResult, reportResult) {
  return [
    `# ${rawCase.project.project_name} 管理效能周报`,
    "",
    `- 项目编号：${rawCase.project.project_id}`,
    `- 会议编号：${rawCase.meeting.meeting_id}`,
    `- 管理者：${rawCase.project.manager_name}`,
    `- 评估周期：${rawCase.evaluation_period}`,
    "",
    "## 总体结论",
    reportResult.summary,
    "",
    "## 四维评分",
    `- 项目理解力：${evaluationResult.scores.project_understanding}`,
    `- 事实依据力：${evaluationResult.scores.evidence_based}`,
    `- 推进闭环力：${evaluationResult.scores.execution_closure}`,
    `- 风险识别力：${evaluationResult.scores.risk_identification}`,
    "",
    "## Review 结论",
    `- 复核结果：${reviewResult.review_result}`,
    `- 复核摘要：${reviewResult.consistency_summary}`,
    "",
    "## 关键证据",
    ...reportResult.key_evidence.map((item) => `- ${item}`),
    "",
    "## 风险提示",
    ...reportResult.risk_alerts.map((item) => `- ${item}`),
    "",
    "## 下周建议动作",
    ...reportResult.next_actions.map((item) => `- ${item}`)
  ].join("\n");
}

function buildStatementRecords(rawCase, evidenceResult) {
  return evidenceResult.statement_checks.map((item, index) => ({
    statement_id: `${rawCase.meeting.meeting_id}-STM-${index + 1}`,
    meeting_id: rawCase.meeting.meeting_id,
    project_id: rawCase.project.project_id,
    speaker_id: rawCase.meeting.manager_id,
    speaker_name: rawCase.project.manager_name,
    statement_summary: item.statement_summary,
    evidence_source_type: "task+risk+doc",
    evidence_ref: item.supporting_evidence.join(" | "),
    evidence_confidence: String(item.confidence),
    fact_check_result: item.judgement,
    review_meeting_count: "3"
  }));
}

function extractManagerSpeech(rawCase) {
  if (Array.isArray(rawCase.meeting.manager_speech_summary)) {
    return rawCase.meeting.manager_speech_summary;
  }
  const managerName = rawCase.project.manager_name || rawCase.meeting.manager_name;
  return (rawCase.meeting.discussion_segments || [])
    .filter((segment) => segment.speaker === managerName)
    .map((segment) => segment.summary)
    .filter(Boolean);
}

function joinText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(" | ");
  }
  return String(value || "");
}

function syncCase(caseName, rawCase, demoOutputRoot, tmpDir) {
  const caseDir = path.join(demoOutputRoot, caseName);
  const evidenceResult = readJson(path.join(caseDir, "evidence_result.json"));
  const reviewResult = readJson(path.join(caseDir, "review_result.json"));
  const evaluationResult = readJson(path.join(caseDir, "evaluation_result.json"));
  const reportResult = readJson(path.join(caseDir, "report_result.json"));

  const mainDocUrl = createDoc(
    tmpDir,
    `${rawCase.project.project_name}-项目主文档`,
    buildProjectDocMarkdown(rawCase)
  );
  const weeklyDocUrl = createDoc(
    tmpDir,
    `${rawCase.project.project_name}-周报`,
    buildWeeklyDocMarkdown(rawCase)
  );
  const reviewDocUrl = createDoc(
    tmpDir,
    `${rawCase.project.project_name}-阶段复盘`,
    buildReviewDocMarkdown(rawCase)
  );
  const reportDocUrl = createDoc(
    tmpDir,
    `${rawCase.project.project_name}-管理效能周报`,
    buildReportMarkdown(rawCase, reviewResult, evaluationResult, reportResult)
  );

  upsertRecord(
    "Projects",
    {
      project_id: rawCase.project.project_id,
      project_name: rawCase.project.project_name,
      business_line: rawCase.project.business_line || "unknown",
      project_stage: rawCase.project.project_stage,
      manager_id: rawCase.project.manager_id,
      manager_name: rawCase.project.manager_name,
      start_date: rawCase.project.start_date || "unknown",
      due_date: rawCase.project.target_release_date || "unknown",
      health_status: rawCase.project.health_status || "unknown",
      main_doc_url: mainDocUrl,
      latest_weekly_report_url: weeklyDocUrl,
      latest_review_doc_url: reviewDocUrl
    },
    tmpDir
  );

  upsertRecord(
    "Meetings",
    {
      meeting_id: rawCase.meeting.meeting_id,
      project_id: rawCase.project.project_id,
      meeting_title: rawCase.meeting.meeting_title,
      meeting_time: rawCase.meeting.meeting_time,
      participants: joinText(rawCase.meeting.participants),
      manager_speech_summary: joinText(extractManagerSpeech(rawCase)),
      decision_summary: joinText(rawCase.meeting.decision_summary),
      risk_summary: joinText(rawCase.meeting.risk_summary),
      action_item_count: String(rawCase.meeting.action_items.length),
      initial_status: "verified",
      review_status: reviewResult.review_result
    },
    tmpDir
  );

  rawCase.tasks.forEach((task) => {
    upsertRecord(
      "Tasks",
      {
        task_id: task.task_id,
        project_id: rawCase.project.project_id,
        source_meeting_id: rawCase.meeting.meeting_id,
        task_name: task.task_name,
        owner: task.owner,
        due_date: task.due_date,
        status: task.status,
        is_overdue: task.is_overdue,
        is_closed: task.status === "已完成" ? "true" : "false",
        close_duration: task.status === "已完成" ? "已完成" : ""
      },
      tmpDir
    );
  });

  rawCase.risks.forEach((risk) => {
    upsertRecord(
      "Risks",
      {
        risk_id: risk.risk_id,
        project_id: rawCase.project.project_id,
        meeting_id: rawCase.meeting.meeting_id,
        risk_type: risk.risk_type,
        risk_level: risk.risk_level,
        risk_description: risk.risk_description,
        trigger_reason: risk.risk_description,
        suggested_action: rawCase.meeting.action_items[0] || "待补充",
        followup_status: risk.followup_status
      },
      tmpDir
    );
  });

  buildStatementRecords(rawCase, evidenceResult).forEach((statement) => {
    upsertRecord("Statements", statement, tmpDir);
  });

  upsertRecord(
    "Evaluations",
    {
      evaluation_id: `EVL-${rawCase.project.project_id}`,
      project_id: rawCase.project.project_id,
      manager_id: rawCase.project.manager_id,
      current_meeting_id: rawCase.meeting.meeting_id,
      evaluation_period: rawCase.evaluation_period,
      project_understanding_score: String(evaluationResult.scores.project_understanding),
      evidence_based_score: String(evaluationResult.scores.evidence_based),
      execution_closure_score: String(evaluationResult.scores.execution_closure),
      risk_identification_score: String(evaluationResult.scores.risk_identification),
      review_result: reviewResult.review_result,
      overall_summary: evaluationResult.overall_summary
    },
    tmpDir
  );

  upsertRecord(
    "Reports",
    {
      report_id: `RPT-${rawCase.project.project_id}`,
      project_id: rawCase.project.project_id,
      manager_id: rawCase.project.manager_id,
      evaluation_id: `EVL-${rawCase.project.project_id}`,
      report_type: "weekly_report",
      key_insights: reportResult.summary,
      improvement_suggestions: reportResult.next_actions.join(" | "),
      send_status: "generated",
      doc_url: reportDocUrl
    },
    tmpDir
  );

  return {
    project_id: rawCase.project.project_id,
    meeting_id: rawCase.meeting.meeting_id,
    main_doc_url: mainDocUrl,
    weekly_doc_url: weeklyDocUrl,
    review_doc_url: reviewDocUrl,
    report_doc_url: reportDocUrl
  };
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const caseSourceRoot = path.join(projectRoot, "case_sources");
  const demoOutputRoot = path.join(projectRoot, "demo_outputs");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manager-insight-feishu-"));
  const cleanupResults = cleanupObsoleteDocs(tmpDir);

  TABLES.forEach((table) => clearTable(table, tmpDir));

  const cases = [
    { name: "case_01", dir: "case_01" }
  ];

  const summary = cases.map((item) =>
    syncCase(
      item.name,
      buildStructuredCase(path.join(caseSourceRoot, item.dir)).raw_payload,
      demoOutputRoot,
      tmpDir
    )
  );

  const outputFile = path.join(demoOutputRoot, "feishu_sync_summary.json");
  ensureDir(demoOutputRoot);
  fs.writeFileSync(
    outputFile,
    JSON.stringify({ cleanup_results: cleanupResults, synced_docs: summary }, null, 2),
    "utf8"
  );
  process.stdout.write(
    JSON.stringify({ cleanup_results: cleanupResults, synced_docs: summary }, null, 2) + "\n"
  );
}

if (require.main === module) {
  main();
}

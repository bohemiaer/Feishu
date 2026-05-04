"use strict";

const fs = require("fs");
const path = require("path");
const { TASK_STATUS, createTaskContext } = require("../src/protocol/execution");

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

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[,\n;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitParagraphs(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/\r?\n+/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function buildManagerSpeechFromSegments(segments, managerName) {
  if (!Array.isArray(segments)) return [];
  return segments
    .filter((segment) => {
      const speaker = String(segment.speaker || "").trim();
      return speaker && managerName && speaker === managerName;
    })
    .map((segment) => String(segment.summary || segment.notes || "").trim())
    .filter(Boolean);
}

function normalizeTask(task) {
  return {
    task_id: String(task.task_id || "unknown"),
    task_name: String(task.task_name || "unknown"),
    owner: String(task.owner || "unknown"),
    due_date: String(task.due_date || "unknown"),
    status: String(task.status || "unknown"),
    is_overdue: String(task.is_overdue || "false")
  };
}

function normalizeRisk(risk) {
  return {
    risk_id: String(risk.risk_id || "unknown"),
    risk_type: String(risk.risk_type || "unknown"),
    risk_level: String(risk.risk_level || "unknown"),
    risk_description: String(risk.risk_description || "unknown"),
    followup_status: String(risk.followup_status || "unknown")
  };
}

function collectMissingFields(raw) {
  const missing = [];
  const checks = [
    ["meeting.meeting_id", raw.meeting && raw.meeting.meeting_id],
    ["meeting.project_id", raw.meeting && raw.meeting.project_id],
    ["meeting.manager_id", raw.meeting && raw.meeting.manager_id],
    ["project.project_name", raw.project && raw.project.project_name],
    ["documents.main_doc", raw.documents && raw.documents.main_doc],
    ["documents.weekly_report", raw.documents && raw.documents.weekly_report],
    ["documents.review_doc", raw.documents && raw.documents.review_doc]
  ];

  checks.forEach(([name, value]) => {
    if (value === undefined || value === null || value === "") {
      missing.push(name);
    }
  });

  return missing;
}

function extractProjectGoal(mainDoc) {
  const lines = splitParagraphs(mainDoc);
  if (lines.length === 0) return "unknown";
  const goalIndex = lines.findIndex((line) => /目标|goal/i.test(line));
  if (goalIndex === -1) return lines[0];

  const goalCandidates = [];
  for (let i = goalIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s|^#\s|阶段|风险|里程碑/i.test(line)) break;
    goalCandidates.push(line);
  }

  if (goalCandidates.length === 0) return lines[goalIndex];
  return goalCandidates.join("；");
}

function normalizePayload(raw) {
  const meeting = raw.meeting || {};
  const project = raw.project || {};
  const documents = raw.documents || {};
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const risks = Array.isArray(raw.risks) ? raw.risks : [];
  const managerSpeech = splitParagraphs(meeting.manager_speech_summary || meeting.manager_speeches);
  const managerSpeechFromSegments = buildManagerSpeechFromSegments(
    meeting.discussion_segments,
    project.manager_name || meeting.manager_name
  );
  const decisions = splitParagraphs(meeting.decision_summary || meeting.decisions);
  const risksMentioned = splitParagraphs(meeting.risk_summary || meeting.risks_mentioned);
  const actionItems = splitParagraphs(meeting.action_items || meeting.action_item_summary);

  const normalizedTasks = tasks.map(normalizeTask);
  const overdueTasks = normalizedTasks.filter((task) => task.is_overdue === "true");
  const openTasks = normalizedTasks.filter((task) => !["done", "closed", "已完成", "已关闭", "true"].includes(task.status.toLowerCase ? task.status.toLowerCase() : task.status) && task.status !== "已完成");
  const normalizedRisks = risks.map(normalizeRisk);
  const openRisks = normalizedRisks.filter((risk) => !["closed", "resolved", "已关闭", "已解决"].includes(risk.followup_status));

  return {
    task_context: createTaskContext({
      task_id: raw.task_id || `task-${meeting.meeting_id || "unknown"}`,
      project_id: meeting.project_id || project.project_id || "unknown",
      manager_id: meeting.manager_id || project.manager_id || "unknown",
      meeting_id: meeting.meeting_id || "unknown",
      evaluation_period: raw.evaluation_period || "unknown",
      status: TASK_STATUS.COLLECTED
    }),
    meeting_info: {
      meeting_id: String(meeting.meeting_id || "unknown"),
      project_id: String(meeting.project_id || project.project_id || "unknown"),
      manager_id: String(meeting.manager_id || project.manager_id || "unknown"),
      meeting_title: String(meeting.meeting_title || "unknown"),
      meeting_time: String(meeting.meeting_time || "unknown"),
      participants: splitList(meeting.participants)
    },
    meeting_facts: {
      manager_speech_summary: managerSpeech.length > 0 ? managerSpeech : managerSpeechFromSegments,
      decisions,
      risks_mentioned: risksMentioned,
      action_items: actionItems
    },
    project_snapshot: {
      project_name: String(project.project_name || "unknown"),
      project_stage: String(project.project_stage || "unknown"),
      project_health: String(project.health_status || "unknown"),
      open_tasks: openTasks,
      overdue_tasks: overdueTasks,
      open_risks: openRisks
    },
    document_snapshot: {
      project_goal: extractProjectGoal(documents.main_doc),
      weekly_highlights: splitParagraphs(documents.weekly_report),
      review_highlights: splitParagraphs(documents.review_doc)
    },
    metrics: {
      action_item_count: actionItems.length,
      open_task_count: openTasks.length,
      overdue_task_count: overdueTasks.length,
      open_risk_count: openRisks.length
    },
    missing_fields: collectMissingFields(raw)
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    console.error("Usage: node scripts/normalize_meeting_payload.js --input <input.json> [--output <output.json>]");
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  const rawPayload = readJson(inputPath);
  const normalized = normalizePayload(rawPayload);
  const output = JSON.stringify(normalized, null, 2);

  if (args.output) {
    fs.writeFileSync(path.resolve(args.output), output, "utf8");
  } else {
    process.stdout.write(output + "\n");
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  normalizePayload,
  splitList,
  splitParagraphs
};

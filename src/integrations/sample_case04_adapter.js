"use strict";

const fs = require("fs");
const path = require("path");
const { fileExists, readJson } = require("../shared/fs_utils");

const CASE04_SOURCE_FILES = Object.freeze({
  cloudDoc: "01_cloud_docs/docs_fetch_main_doc_v2.json",
  chatCatalog: "02_chats/im_chat_search_user.json",
  chatMessages: "02_chats/im_messages_search_user.json",
  baseProjects: "03_task_risk_register/base_projects_record_list.json",
  baseTasks: "03_task_risk_register/base_tasks_record_list.json",
  baseRisks: "03_task_risk_register/base_risks_record_list.json",
  baseHistory: "03_task_risk_register/base_record_history_list.json",
  baseMeetings: "04_meetings/base_meetings_record_list.json",
  baseStatements: "04_meetings/base_statements_record_list.json",
  minutesSearch: "04_meetings/minutes_search_user.json",
  minutesTranscript: "04_meetings/minutes_transcript_case04.json",
  vcSearch: "04_meetings/vc_search_by_participant.json",
  managerProfile: "05_org_and_team/contact_get_user_user.json",
  contacts: "05_org_and_team/contact_search_user_project_members.json",
  calendar: "06_calendar/calendar_events_instance_view.json"
});

const SOURCE_GROUPS = Object.freeze([
  {
    name: "Base 记录",
    required: true,
    files: [
      CASE04_SOURCE_FILES.baseProjects,
      CASE04_SOURCE_FILES.baseTasks,
      CASE04_SOURCE_FILES.baseRisks,
      CASE04_SOURCE_FILES.baseMeetings,
      CASE04_SOURCE_FILES.baseStatements
    ]
  },
  {
    name: "Base 历史",
    required: false,
    files: [CASE04_SOURCE_FILES.baseHistory]
  },
  {
    name: "云文档",
    required: true,
    files: [CASE04_SOURCE_FILES.cloudDoc]
  },
  {
    name: "聊天历史",
    required: false,
    files: [CASE04_SOURCE_FILES.chatCatalog, CASE04_SOURCE_FILES.chatMessages]
  },
  {
    name: "会议/妙记",
    required: true,
    files: [
      CASE04_SOURCE_FILES.baseMeetings,
      CASE04_SOURCE_FILES.minutesSearch,
      CASE04_SOURCE_FILES.minutesTranscript,
      CASE04_SOURCE_FILES.vcSearch
    ]
  },
  {
    name: "日历",
    required: false,
    files: [CASE04_SOURCE_FILES.calendar]
  },
  {
    name: "通讯录",
    required: false,
    files: [CASE04_SOURCE_FILES.managerProfile, CASE04_SOURCE_FILES.contacts]
  }
]);

function pickFirstExisting(bundleRoot, candidates) {
  for (const relativePath of candidates) {
    if (relativePath && fileExists(path.join(bundleRoot, relativePath))) {
      return relativePath;
    }
  }
  return candidates[0] || "";
}

function pickFirstMatching(bundleRoot, directory, pattern, fallbackRelativePath) {
  const fallbackAbsolutePath = path.join(bundleRoot, fallbackRelativePath);
  if (fileExists(fallbackAbsolutePath)) {
    return fallbackRelativePath;
  }

  const absoluteDirectory = path.join(bundleRoot, directory);
  if (!fileExists(absoluteDirectory)) {
    return fallbackRelativePath;
  }

  const matchedFile = fs.readdirSync(absoluteDirectory).find((name) => pattern.test(name));
  return matchedFile ? path.posix.join(directory.replace(/\\/g, "/"), matchedFile) : fallbackRelativePath;
}

function resolveSourceFiles(bundleRoot) {
  return {
    cloudDoc: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.cloudDoc]),
    chatCatalog: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.chatCatalog]),
    chatMessages: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.chatMessages]),
    baseProjects: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.baseProjects]),
    baseTasks: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.baseTasks]),
    baseRisks: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.baseRisks]),
    baseHistory: pickFirstMatching(
      bundleRoot,
      "03_task_risk_register",
      /^base_.*history.*\.json$/i,
      CASE04_SOURCE_FILES.baseHistory
    ),
    baseMeetings: pickFirstExisting(bundleRoot, [CASE04_SOURCE_FILES.baseMeetings]),
    baseStatements: pickFirstMatching(
      bundleRoot,
      "04_meetings",
      /^base_.*statements.*\.json$/i,
      CASE04_SOURCE_FILES.baseStatements
    ),
    minutesSearch: pickFirstMatching(
      bundleRoot,
      "04_meetings",
      /^minutes_search_.*\.json$/i,
      CASE04_SOURCE_FILES.minutesSearch
    ),
    minutesTranscript: pickFirstMatching(
      bundleRoot,
      "04_meetings",
      /^minutes_transcript_.*\.json$/i,
      CASE04_SOURCE_FILES.minutesTranscript
    ),
    vcSearch: pickFirstMatching(
      bundleRoot,
      "04_meetings",
      /^vc_search_.*\.json$/i,
      CASE04_SOURCE_FILES.vcSearch
    ),
    managerProfile: pickFirstMatching(
      bundleRoot,
      "05_org_and_team",
      /^contact_get_user_.*\.json$/i,
      CASE04_SOURCE_FILES.managerProfile
    ),
    contacts: pickFirstMatching(
      bundleRoot,
      "05_org_and_team",
      /^contact_search_.*\.json$/i,
      CASE04_SOURCE_FILES.contacts
    ),
    calendar: pickFirstMatching(
      bundleRoot,
      "06_calendar",
      /^calendar_.*\.json$/i,
      CASE04_SOURCE_FILES.calendar
    )
  };
}

function parseArgsDate(value) {
  return String(value || "").replace(" ", "T");
}

function compareMeetingTime(a, b) {
  const left = new Date(parseArgsDate((a.meeting_time || a.start_time || "").slice(0, 16)));
  const right = new Date(parseArgsDate((b.meeting_time || b.start_time || "").slice(0, 16)));
  return left - right;
}

function splitPiped(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function htmlToTextLines(html) {
  const normalized = decodeHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|ul|ol|li|h2|h3|title)>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<h2>/gi, "\n## ")
    .replace(/<h3>/gi, "\n### ")
    .replace(/<title>/gi, "# ")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "");

  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function blocksToTextLines(blocks) {
  const lines = [];

  (blocks || []).forEach((block) => {
    if (!block || typeof block !== "object") {
      return;
    }

    if (block.type === "heading1") {
      lines.push(`# ${block.text || ""}`.trim());
      return;
    }
    if (block.type === "heading2") {
      lines.push(`## ${block.text || ""}`.trim());
      return;
    }
    if (block.type === "heading3") {
      lines.push(`### ${block.text || ""}`.trim());
      return;
    }
    if (block.type === "paragraph" && block.text) {
      lines.push(String(block.text).trim());
      return;
    }
    if ((block.type === "bullet" || block.type === "ordered") && Array.isArray(block.items)) {
      block.items.forEach((item) => {
        if (item) {
          lines.push(`- ${String(item).trim()}`);
        }
      });
    }
  });

  return lines.filter(Boolean);
}

function buildSectionMap(lines) {
  const sections = {};
  let current = "_root";
  sections[current] = [];

  lines.forEach((line) => {
    const heading = line.match(/^##\s+(.+)$/) || line.match(/^###\s+(.+)$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
      return;
    }

    sections[current].push(line);
  });

  return sections;
}

function extractBullets(lines) {
  return (lines || [])
    .filter((line) => /^-\s*/.test(line))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function extractHighlights(lines) {
  const bulletHighlights = extractBullets(lines);
  if (bulletHighlights.length > 0) {
    return bulletHighlights;
  }

  return (lines || [])
    .map((line) => String(line || "").trim())
    .filter((line) => line && !/^#+\s+/.test(line))
    .slice(0, 6);
}

function parseTableRecords(payload) {
  const fields = payload && payload.data && Array.isArray(payload.data.fields) ? payload.data.fields : [];
  const rows = payload && payload.data && Array.isArray(payload.data.data) ? payload.data.data : [];

  return rows.map((row) => {
    const record = {};
    fields.forEach((field, index) => {
      record[field] = row[index];
    });
    return record;
  });
}

function normalizeProjectRecord(record) {
  if (!record) return null;
  return {
    id: record.ID,
    project_name: record.project_name,
    main_doc_url: record.main_doc_url,
    latest_weekly_report_url: record.latest_weekly_report_url,
    latest_review_doc_url: record.latest_review_doc_url,
    project_stage: record.project_stage,
    business_line: record.business_line,
    manager_name: record.manager_name,
    due_date: record.due_date,
    manager_id: record.manager_id,
    project_id: record.project_id,
    start_date: record.start_date,
    health_status: record.health_status
  };
}

function normalizeTaskRecord(record) {
  return {
    id: record.ID,
    task_name: record.task_name,
    status: record.status,
    is_closed: record.is_closed,
    task_id: record.task_id,
    project_id: record.project_id,
    close_duration: record.close_duration,
    is_overdue: record.is_overdue,
    owner: record.owner,
    due_date: record.due_date,
    source_meeting_id: record.source_meeting_id
  };
}

function normalizeRiskRecord(record) {
  return {
    id: record.ID,
    followup_status: record.followup_status,
    meeting_id: record.meeting_id,
    trigger_reason: record.trigger_reason,
    risk_description: record.risk_description,
    risk_level: record.risk_level,
    project_id: record.project_id,
    suggested_action: record.suggested_action,
    risk_id: record.risk_id,
    risk_type: record.risk_type
  };
}

function normalizeMeetingRecord(record) {
  return {
    id: record.ID,
    meeting_time: record.meeting_time,
    risk_summary: record.risk_summary,
    project_id: record.project_id,
    review_status: record.review_status,
    manager_speech_summary: record.manager_speech_summary,
    decision_summary: record.decision_summary,
    action_item_count: Number(record.action_item_count || 0),
    meeting_title: record.meeting_title,
    initial_status: record.initial_status,
    participants: splitPiped(record.participants),
    meeting_id: record.meeting_id
  };
}

function normalizeStatementRecord(record) {
  return {
    id: record.ID,
    evidence_confidence: Number(record.evidence_confidence || 0),
    review_meeting_count: Number(record.review_meeting_count || 0),
    evidence_ref: record.evidence_ref,
    speaker_name: record.speaker_name,
    project_id: record.project_id,
    statement_id: record.statement_id,
    evidence_source_type: record.evidence_source_type,
    statement_summary: record.statement_summary,
    meeting_id: record.meeting_id,
    speaker_id: record.speaker_id,
    fact_check_result: record.fact_check_result
  };
}

function buildProjectDocs(projectRecord, docPayload, sourceFiles) {
  const document =
    docPayload && docPayload.data && docPayload.data.document
      ? docPayload.data.document
      : docPayload && docPayload.data
        ? docPayload.data
        : {};
  const lines = document.content
    ? htmlToTextLines(document.content)
    : blocksToTextLines(document.blocks || []);
  const sections = buildSectionMap(lines);
  const goalLines = extractHighlights(
    sections["二、本轮范围与目标"] ||
    sections["核心目标"] ||
    sections["_root"] ||
    []
  );
  const weeklyLines = []
    .concat(sections["六、周报 W1"] || [])
    .concat(sections["七、周报 W2"] || []);
  const fallbackWeeklyLines = []
    .concat(sections["当前阶段"] || [])
    .concat(sections["已知风险"] || []);
  const reviewLines = []
    .concat(sections["七、周报 W2"] || [])
    .concat(sections["八、遗留与噪音"] || [])
    .concat(sections["九、当前状态"] || []);
  const fallbackReviewLines = []
    .concat(sections["已知风险"] || [])
    .concat(sections["里程碑"] || [])
    .concat(sections["当前阶段"] || []);
  const resolvedWeeklyLines = weeklyLines.length > 0 ? weeklyLines : fallbackWeeklyLines;
  const resolvedReviewLines = reviewLines.length > 0 ? reviewLines : fallbackReviewLines;

  return {
    main_doc: {
      doc_type: "main_doc",
      doc_id: document.document_id || document.doc_id || "",
      revision_id: document.revision_id || document.last_modified || 0,
      title: document.title || "项目主文档",
      url: projectRecord && projectRecord.main_doc_url ? projectRecord.main_doc_url : "",
      content_text: lines.join("\n"),
      highlights: goalLines,
      source_file: sourceFiles.cloudDoc
    },
    weekly_report: {
      doc_type: "weekly_report",
      doc_id: `${document.document_id || document.doc_id || "doc"}-weekly`,
      revision_id: document.revision_id || document.last_modified || 0,
      title: "项目阶段进展摘录",
      url: projectRecord && projectRecord.latest_weekly_report_url ? projectRecord.latest_weekly_report_url : "",
      content_text: resolvedWeeklyLines.join("\n"),
      highlights: extractHighlights(resolvedWeeklyLines),
      source_file: sourceFiles.cloudDoc
    },
    review_doc: {
      doc_type: "review_doc",
      doc_id: `${document.document_id || document.doc_id || "doc"}-review`,
      revision_id: document.revision_id || document.last_modified || 0,
      title: "项目复盘摘录",
      url: projectRecord && projectRecord.latest_review_doc_url ? projectRecord.latest_review_doc_url : "",
      content_text: resolvedReviewLines.join("\n"),
      highlights: extractHighlights(resolvedReviewLines),
      source_file: sourceFiles.cloudDoc
    }
  };
}

function buildSourceCatalog(bundleRoot, sourceFiles) {
  const resolvedSourceGroups = [
    {
      name: "Base 记录",
      required: true,
      files: [
        sourceFiles.baseProjects,
        sourceFiles.baseTasks,
        sourceFiles.baseRisks,
        sourceFiles.baseMeetings,
        sourceFiles.baseStatements
      ]
    },
    {
      name: "Base 历史",
      required: false,
      files: [sourceFiles.baseHistory]
    },
    {
      name: "云文档",
      required: true,
      files: [sourceFiles.cloudDoc]
    },
    {
      name: "聊天历史",
      required: false,
      files: [sourceFiles.chatCatalog, sourceFiles.chatMessages]
    },
    {
      name: "会议/妙记",
      required: true,
      files: [
        sourceFiles.baseMeetings,
        sourceFiles.minutesSearch,
        sourceFiles.minutesTranscript,
        sourceFiles.vcSearch
      ]
    },
    {
      name: "日历",
      required: false,
      files: [sourceFiles.calendar]
    },
    {
      name: "通讯录",
      required: false,
      files: [sourceFiles.managerProfile, sourceFiles.contacts]
    }
  ];

  return resolvedSourceGroups.map((source) => ({
    source_name: source.name,
    required: source.required,
    files: source.files.map((relativePath) => ({
      relative_path: relativePath,
      absolute_path: path.join(bundleRoot, relativePath),
      exists: fileExists(path.join(bundleRoot, relativePath))
    }))
  }));
}

function loadJsonIfPresent(bundleRoot, relativePath) {
  const fullPath = path.join(bundleRoot, relativePath);
  if (!fileExists(fullPath)) {
    return null;
  }
  return readJson(fullPath);
}

function selectCurrentMeetingId(meetings, requestedMeetingId) {
  if (requestedMeetingId) return requestedMeetingId;
  const ordered = [...meetings].sort(compareMeetingTime);
  return ordered.length > 0 ? ordered[ordered.length - 1].meeting_id : "";
}

function loadCase04SampleBundle(bundleRoot, options = {}) {
  const sourceFiles = resolveSourceFiles(bundleRoot);
  const cloudDoc = loadJsonIfPresent(bundleRoot, sourceFiles.cloudDoc);
  const chatCatalog = loadJsonIfPresent(bundleRoot, sourceFiles.chatCatalog);
  const chatMessages = loadJsonIfPresent(bundleRoot, sourceFiles.chatMessages);
  const baseProjects = loadJsonIfPresent(bundleRoot, sourceFiles.baseProjects);
  const baseTasks = loadJsonIfPresent(bundleRoot, sourceFiles.baseTasks);
  const baseRisks = loadJsonIfPresent(bundleRoot, sourceFiles.baseRisks);
  const baseHistory = loadJsonIfPresent(bundleRoot, sourceFiles.baseHistory);
  const baseMeetings = loadJsonIfPresent(bundleRoot, sourceFiles.baseMeetings);
  const baseStatements = loadJsonIfPresent(bundleRoot, sourceFiles.baseStatements);
  const minutesSearch = loadJsonIfPresent(bundleRoot, sourceFiles.minutesSearch);
  const minutesTranscript = loadJsonIfPresent(bundleRoot, sourceFiles.minutesTranscript);
  const vcSearch = loadJsonIfPresent(bundleRoot, sourceFiles.vcSearch);
  const managerProfile = loadJsonIfPresent(bundleRoot, sourceFiles.managerProfile);
  const contacts = loadJsonIfPresent(bundleRoot, sourceFiles.contacts);
  const calendar = loadJsonIfPresent(bundleRoot, sourceFiles.calendar);

  const projectRecords = parseTableRecords(baseProjects).map(normalizeProjectRecord);
  const taskRecords = parseTableRecords(baseTasks).map(normalizeTaskRecord);
  const riskRecords = parseTableRecords(baseRisks).map(normalizeRiskRecord);
  const meetingRecords = parseTableRecords(baseMeetings).map(normalizeMeetingRecord);
  const statementRecords = parseTableRecords(baseStatements).map(normalizeStatementRecord);
  const currentMeetingId = selectCurrentMeetingId(meetingRecords, options.meetingId);
  const currentMeeting = meetingRecords.find((item) => item.meeting_id === currentMeetingId) || null;
  const currentCalendarEvent =
    calendar &&
    calendar.data &&
    Array.isArray(calendar.data.items) &&
    calendar.data.items.find((item) => item.meeting_id === currentMeetingId);
  const currentMinuteItem =
    minutesSearch &&
    minutesSearch.data &&
    Array.isArray(minutesSearch.data.items) &&
    minutesSearch.data.items.find((item) => item.meeting_id === currentMeetingId);
  const currentTranscript =
    minutesTranscript &&
    minutesTranscript.data &&
    minutesTranscript.data.meeting_id === currentMeetingId
      ? minutesTranscript.data
      : null;
  const projectRecord = projectRecords[0] || null;
  const projectDocs = buildProjectDocs(projectRecord, cloudDoc || {}, sourceFiles);
  const allContacts = [];

  if (managerProfile && managerProfile.data && managerProfile.data.user) {
    allContacts.push({
      ...managerProfile.data.user,
      source: "manager_profile"
    });
  }

  if (contacts && contacts.data && Array.isArray(contacts.data.users)) {
    contacts.data.users.forEach((user) => allContacts.push({ ...user, source: "project_contacts" }));
  }

  const dedupedContacts = Array.from(
    new Map(allContacts.map((item) => [item.open_id || item.user_id || item.name, item])).values()
  );

  return {
    bundle_root: bundleRoot,
    source_files: sourceFiles,
    manifest: {
      case_id: "case_04",
      project_id: projectRecord ? projectRecord.project_id : "PJT-CASE-04",
      manager_id: projectRecord ? projectRecord.manager_id : "MGR-CASE-04",
      manager_name: projectRecord ? projectRecord.manager_name : "陈昊"
    },
    source_catalog: buildSourceCatalog(bundleRoot, sourceFiles),
    project_record: projectRecord,
    tasks: taskRecords,
    risks: riskRecords,
    base_history: baseHistory && baseHistory.data && Array.isArray(baseHistory.data.histories)
      ? baseHistory.data.histories
      : [],
    meetings: meetingRecords,
    statements: statementRecords,
    current_meeting_id: currentMeetingId,
    current_meeting: currentMeeting,
    current_calendar_event: currentCalendarEvent || null,
    current_minute_item: currentMinuteItem || null,
    current_transcript: currentTranscript,
    minute_items:
      minutesSearch && minutesSearch.data && Array.isArray(minutesSearch.data.items)
        ? minutesSearch.data.items
        : [],
    vc_items:
      vcSearch && vcSearch.data && Array.isArray(vcSearch.data.items) ? vcSearch.data.items : [],
    project_docs: projectDocs,
    chat_catalog:
      chatCatalog && chatCatalog.data && Array.isArray(chatCatalog.data.chats) ? chatCatalog.data.chats : [],
    chat_messages:
      chatMessages && chatMessages.data && Array.isArray(chatMessages.data.messages)
        ? chatMessages.data.messages
        : [],
    calendar_events:
      calendar && calendar.data && Array.isArray(calendar.data.items) ? calendar.data.items : [],
    contacts: dedupedContacts
  };
}

module.exports = {
  CASE04_SOURCE_FILES,
  SOURCE_GROUPS,
  loadCase04SampleBundle,
  splitPiped
};

"use strict";

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

function buildProjectDocs(projectRecord, docPayload) {
  const document = docPayload && docPayload.data && docPayload.data.document ? docPayload.data.document : {};
  const lines = htmlToTextLines(document.content || "");
  const sections = buildSectionMap(lines);
  const goalLines = extractBullets(sections["二、本轮范围与目标"] || []);
  const weeklyLines = []
    .concat(sections["六、周报 W1"] || [])
    .concat(sections["七、周报 W2"] || []);
  const reviewLines = []
    .concat(sections["七、周报 W2"] || [])
    .concat(sections["八、遗留与噪音"] || [])
    .concat(sections["九、当前状态"] || []);

  return {
    main_doc: {
      doc_type: "main_doc",
      doc_id: document.document_id || "",
      revision_id: document.revision_id || 0,
      title: "履约稳定性专项治理主文档",
      url: projectRecord && projectRecord.main_doc_url ? projectRecord.main_doc_url : "",
      content_text: lines.join("\n"),
      highlights: goalLines,
      source_file: CASE04_SOURCE_FILES.cloudDoc
    },
    weekly_report: {
      doc_type: "weekly_report",
      doc_id: `${document.document_id || "doc"}-weekly`,
      revision_id: document.revision_id || 0,
      title: "履约稳定性专项治理周报摘录",
      url: projectRecord && projectRecord.latest_weekly_report_url ? projectRecord.latest_weekly_report_url : "",
      content_text: weeklyLines.join("\n"),
      highlights: extractBullets(weeklyLines),
      source_file: CASE04_SOURCE_FILES.cloudDoc
    },
    review_doc: {
      doc_type: "review_doc",
      doc_id: `${document.document_id || "doc"}-review`,
      revision_id: document.revision_id || 0,
      title: "履约稳定性专项治理阶段复盘摘录",
      url: projectRecord && projectRecord.latest_review_doc_url ? projectRecord.latest_review_doc_url : "",
      content_text: reviewLines.join("\n"),
      highlights: extractBullets(reviewLines),
      source_file: CASE04_SOURCE_FILES.cloudDoc
    }
  };
}

function buildSourceCatalog(bundleRoot) {
  return SOURCE_GROUPS.map((source) => ({
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
  const cloudDoc = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.cloudDoc);
  const chatCatalog = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.chatCatalog);
  const chatMessages = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.chatMessages);
  const baseProjects = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.baseProjects);
  const baseTasks = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.baseTasks);
  const baseRisks = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.baseRisks);
  const baseHistory = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.baseHistory);
  const baseMeetings = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.baseMeetings);
  const baseStatements = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.baseStatements);
  const minutesSearch = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.minutesSearch);
  const minutesTranscript = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.minutesTranscript);
  const vcSearch = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.vcSearch);
  const managerProfile = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.managerProfile);
  const contacts = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.contacts);
  const calendar = loadJsonIfPresent(bundleRoot, CASE04_SOURCE_FILES.calendar);

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
  const projectDocs = buildProjectDocs(projectRecord, cloudDoc || {});
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
    manifest: {
      case_id: "case_04",
      project_id: projectRecord ? projectRecord.project_id : "PJT-CASE-04",
      manager_id: projectRecord ? projectRecord.manager_id : "MGR-CASE-04",
      manager_name: projectRecord ? projectRecord.manager_name : "陈昊"
    },
    source_catalog: buildSourceCatalog(bundleRoot),
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

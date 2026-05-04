"use strict";

// Legacy case builder for the old markdown bundle flow. The active front pipeline now reads Case 04 sample JSON directly.

const fs = require("fs");
const path = require("path");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function splitLines(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n");
}

function trimBullet(line) {
  return String(line || "").replace(/^[-*]\s*/, "").trim();
}

function splitParticipants(text) {
  return String(text || "")
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMarkdownSections(markdown) {
  const lines = splitLines(markdown);
  const sections = {};
  let title = "";
  let current = null;

  lines.forEach((line) => {
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      title = h1[1].trim();
      return;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      current = h2[1].trim();
      sections[current] = [];
      return;
    }

    if (current) {
      sections[current].push(line);
    }
  });

  return {
    title,
    sections
  };
}

function sectionToParagraphs(lines) {
  return splitLines((lines || []).join("\n"))
    .map((line) => line.trim())
    .filter(Boolean);
}

function sectionToBullets(lines) {
  return sectionToParagraphs(lines)
    .filter((line) => /^[-*]\s+/.test(line))
    .map(trimBullet);
}

function sectionToListItems(lines) {
  return sectionToParagraphs(lines)
    .filter((line) => /^([-*]\s+|\d+\.\s+)/.test(line))
    .map((line) => line.replace(/^([-*]\s+|\d+\.\s+)/, "").trim());
}

function sectionToText(lines) {
  return (lines || []).join("\n").trim();
}

function extractKeyValueBullets(lines) {
  const result = {};
  sectionToBullets(lines).forEach((line) => {
    const match = line.match(/^([^：:]+)[：:]\s*(.+)$/);
    if (match) {
      result[match[1].trim()] = match[2].trim();
    }
  });
  return result;
}

function findSectionLines(sections, keyword) {
  const entry = Object.entries(sections).find(([title]) => title.includes(keyword));
  return entry ? entry[1] : [];
}

function matchMarkdownValue(markdown, label) {
  const regex = new RegExp(`[-*]\\s*${label}[：:]\\s*(.+)`);
  const match = String(markdown || "").match(regex);
  return match ? match[1].trim() : "";
}

function parseTaskLine(line, projectId, meetingId, index) {
  const match = String(line || "").match(/^\[(.+?)\]\[(.+?)\]\[(.+?)\]\[(.+?)\]\s*(.+)$/);
  if (!match) return null;
  return {
    task_id: `${projectId}-TASK-${String(index + 1).padStart(2, "0")}`,
    owner: match[2].trim(),
    due_date: match[3].trim(),
    is_overdue: match[4].trim(),
    status: match[1].trim(),
    task_name: match[5].trim(),
    source_meeting_id: meetingId
  };
}

function parseRiskLine(line, projectId, index) {
  const match = String(line || "").match(/^\[(.+?)\]\[(.+?)\]\s*(.+)$/);
  if (!match) return null;
  return {
    risk_id: `${projectId}-RISK-${String(index + 1).padStart(2, "0")}`,
    risk_level: match[1].trim(),
    followup_status: match[2].trim(),
    risk_description: match[3].trim(),
    risk_type: inferRiskType(match[3].trim())
  };
}

function parseActionLine(line) {
  const match = String(line || "").match(/^\[(.+?)\]\[(.+?)\]\s*(.+)$/);
  if (!match) return null;
  return {
    owner: match[1].trim(),
    due_date: match[2].trim(),
    action: match[3].trim()
  };
}

function inferRiskType(text) {
  if (/退款|支付|链路|配置/.test(text)) return "交付风险";
  if (/埋点|口径|参数|看板|实验/.test(text)) return "数据风险";
  if (/owner|归档|规则|目录|治理/.test(text)) return "治理风险";
  if (/环境|排期|资源/.test(text)) return "资源风险";
  return "通用风险";
}

function inferHealthStatus(risks) {
  const highCount = risks.filter((item) => item.risk_level.toLowerCase() === "high").length;
  if (highCount >= 2) return "yellow";
  if (highCount >= 1) return "attention";
  return "green";
}

function parseMeetingMinutes(markdown, manifest) {
  const { title, sections } = parseMarkdownSections(markdown);
  const lines = splitLines(markdown);

  const meetingTimeLine = lines.find((line) => /^会议时间：/.test(line)) || "";
  const durationLine = lines.find((line) => /^会议时长：/.test(line)) || "";
  const hostLine = lines.find((line) => /^主持人：/.test(line)) || "";
  const participantsLine = lines.find((line) => /^参会人：/.test(line)) || "";

  const meetingTimeMatch = meetingTimeLine.match(/^会议时间：\s*(.+)$/);
  const durationMatch = durationLine.match(/^会议时长：\s*(.+)$/);
  const hostMatch = hostLine.match(/^主持人：\s*(.+)$/);
  const participantsMatch = participantsLine.match(/^参会人：\s*(.+)$/);

  const discussionSegments = sectionToParagraphs(sections["逐段纪要"] || []).reduce((acc, line) => {
    const match = line.match(/^(\d{2}:\d{2})\s+([^：:]+)[：:]\s*(.+)$/);
    if (!match) return acc;
    acc.push({
      timestamp: match[1],
      speaker: match[2].trim(),
      summary: match[3].trim()
    });
    return acc;
  }, []);

  const decisionSummary = sectionToBullets(sections["结论与决策"] || []);
  const riskSummary = sectionToBullets(sections["风险点"] || []);
  const actionItems = sectionToBullets(sections["行动项"] || [])
    .map(parseActionLine)
    .filter(Boolean);

  return {
    meeting_id: manifest.meeting_id,
    project_id: manifest.project_id,
    manager_id: manifest.manager_id,
    manager_name: manifest.manager_name,
    meeting_title: title.replace(/^飞书妙记：/, "").trim(),
    meeting_time: meetingTimeMatch ? meetingTimeMatch[1].trim() : "",
    meeting_duration: durationMatch ? durationMatch[1].trim() : "",
    host_name: hostMatch ? hostMatch[1].trim() : manifest.manager_name,
    participants: splitParticipants(participantsMatch ? participantsMatch[1] : ""),
    ai_summary: sectionToText(sections["AI 摘要"] || []),
    pre_read_topics: sectionToListItems(sections["会前议题"] || []),
    discussion_segments: discussionSegments,
    decision_summary: decisionSummary,
    risk_summary: riskSummary,
    action_items: actionItems.map((item) => item.action),
    action_item_details: actionItems,
    raw_minutes_markdown: markdown
  };
}

function parseProjectDocument(markdown, manifest) {
  const { sections } = parseMarkdownSections(markdown);
  const info = extractKeyValueBullets(findSectionLines(sections, "项目基本信息"));
  const tasks = sectionToBullets(findSectionLines(sections, "当前任务清单"))
    .map((line, index) => parseTaskLine(line, manifest.project_id, manifest.meeting_id, index))
    .filter(Boolean);
  const risks = sectionToBullets(findSectionLines(sections, "当前风险清单"))
    .map((line, index) => parseRiskLine(line, manifest.project_id, index))
    .filter(Boolean);

  return {
    project: {
      project_id: manifest.project_id,
      project_name: manifest.project_name,
      business_line: manifest.business_line,
      manager_id: manifest.manager_id,
      manager_name: manifest.manager_name,
      project_stage: info["当前阶段"] || matchMarkdownValue(markdown, "当前阶段"),
      start_date: info["开始时间"] || matchMarkdownValue(markdown, "开始时间"),
      target_release_date:
        info["计划灰度时间"] ||
        info["计划上线时间"] ||
        matchMarkdownValue(markdown, "计划灰度时间") ||
        matchMarkdownValue(markdown, "计划上线时间"),
      north_star_metric: info["北极星指标"] || matchMarkdownValue(markdown, "北极星指标"),
      health_status: inferHealthStatus(risks)
    },
    tasks,
    risks
  };
}

function parseHistoryContext(markdown) {
  const { sections } = parseMarkdownSections(markdown);
  const historyMeetings = sectionToBullets(findSectionLines(sections, "历史会议摘要")).map((line, index) => {
    const match = line.match(/^\[(.+?)\]\s*(.+)$/);
    return {
      meeting_id: match ? match[1].trim() : `HIS-${String(index + 1).padStart(3, "0")}`,
      summary: match ? match[2].trim() : line
    };
  });

  return {
    history_meetings: historyMeetings,
    task_closure_notes: sectionToBullets(findSectionLines(sections, "历史任务闭环信号")),
    risk_notes: sectionToBullets(findSectionLines(sections, "历史风险信号"))
  };
}

function buildStructuredCase(caseDir) {
  const manifest = readJson(path.join(caseDir, "manifest.json"));
  const projectDoc = readText(path.join(caseDir, "project_doc.md"));
  const weeklyReport = readText(path.join(caseDir, "weekly_report.md"));
  const reviewDoc = readText(path.join(caseDir, "review_doc.md"));
  const meetingMinutes = readText(path.join(caseDir, "meeting_minutes.md"));
  const historyContext = readText(path.join(caseDir, "history_context.md"));

  const projectBundle = parseProjectDocument(projectDoc, manifest);
  const meeting = parseMeetingMinutes(meetingMinutes, manifest);
  const historyBundle = parseHistoryContext(historyContext);

  return {
    case_id: manifest.case_id,
    source_dir: caseDir,
    manifest,
    raw_payload: {
      task_id: `EVAL-${manifest.project_id}-${manifest.meeting_id}`,
      evaluation_period: manifest.evaluation_period,
      project: projectBundle.project,
      meeting,
      tasks: projectBundle.tasks,
      risks: projectBundle.risks,
      documents: {
        main_doc: projectDoc,
        weekly_report: weeklyReport,
        review_doc: reviewDoc
      }
    },
    history_bundle: historyBundle
  };
}

module.exports = {
  buildStructuredCase,
  parseMarkdownSections
};

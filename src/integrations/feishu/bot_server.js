"use strict";

const http = require("http");
const path = require("path");
const { runEvaluationAutomation } = require("../../workflows/evaluation_automation");
const { sendTextMessage } = require("./client");

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function maybeVerifyToken(payload) {
  const expected = process.env.FEISHU_BOT_VERIFICATION_TOKEN;
  if (!expected) {
    return true;
  }
  const actual = payload && payload.header && payload.header.token
    ? payload.header.token
    : payload && payload.token
      ? payload.token
      : "";
  return actual === expected;
}

function tokenize(command) {
  const matches = String(command || "").match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map((token) => token.replace(/^["']|["']$/g, ""));
}

function parseCommandText(text) {
  const cleaned = String(text || "")
    .replace(/<at[^>]*>.*?<\/at>/g, "")
    .trim();
  const tokens = tokenize(cleaned);
  const command = (tokens[0] || "").toLowerCase();

  if (!command) {
    return { type: "empty" };
  }
  if (["help", "/help", "帮助"].includes(command)) {
    return { type: "help" };
  }
  if (["status", "/status", "状态"].includes(command)) {
    return { type: "status", jobId: tokens[1] || "" };
  }
  if (!["run", "/run", "evaluate", "/evaluate", "评估"].includes(command)) {
    return { type: "unknown", raw: cleaned };
  }

  const options = {
    callModel: true,
    strictMeetingSelection: false
  };

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;

    if (token === "--no-model") {
      options.callModel = false;
      continue;
    }
    if (token === "--strict-latest") {
      options.strictMeetingSelection = true;
      continue;
    }
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = tokens[index + 1] && !tokens[index + 1].startsWith("--") ? tokens[++index] : "true";
      if (key === "input-dir" || key === "bundle-path") options.bundlePath = value;
      if (key === "meeting-id") options.meetingId = value;
      if (key === "output-dir") options.outputDir = value;
      if (key === "trigger-type") options.triggerType = value;
      if (key === "evaluation-period") options.evaluationPeriod = value;
      continue;
    }

    const equalIndex = token.indexOf("=");
    if (equalIndex > 0) {
      const key = token.slice(0, equalIndex).toLowerCase();
      const value = token.slice(equalIndex + 1);
      if (["bundle", "case", "input", "input-dir"].includes(key)) options.bundlePath = value;
      if (["meeting", "meeting-id"].includes(key)) options.meetingId = value;
      if (["output", "output-dir"].includes(key)) options.outputDir = value;
      continue;
    }

    if (!options.bundlePath) {
      options.bundlePath = token;
    }
  }

  if (!options.bundlePath) {
    return { type: "invalid", reason: "缺少输入目录" };
  }

  return {
    type: "run",
    options
  };
}

function extractTextContent(payload) {
  const content = payload && payload.event && payload.event.message
    ? payload.event.message.content
    : payload && payload.message
      ? payload.message.content
      : "";
  if (!content) {
    return "";
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.text || "";
  } catch (error) {
    return String(content || "");
  }
}

function extractReplyTarget(payload) {
  const event = payload && payload.event ? payload.event : payload;
  const message = event && event.message ? event.message : {};
  return {
    chatId: message.chat_id || "",
    openId: event && event.sender && event.sender.sender_id ? event.sender.sender_id.open_id || "" : ""
  };
}

function createHelpText() {
  return [
    "用法：run <bundlePath> [--meeting-id <id>] [--output-dir <dir>] [--no-model] [--strict-latest]",
    "示例：run data/fixtures/feishu_cli_case_05_desktop_robot",
    "示例：run data/fixtures/feishu_cli_case_05_desktop_robot --meeting-id MTG-CASE-05-01",
    "查询状态：status <jobId>"
  ].join("\n");
}

function createRunAcceptedText(jobId, options) {
  return [
    `已接收评估任务：${jobId}`,
    `bundle: ${options.bundlePath}`,
    options.meetingId ? `meeting_id: ${options.meetingId}` : "meeting_id: 自动选择",
    options.outputDir ? `output_dir: ${options.outputDir}` : "output_dir: 自动生成"
  ].join("\n");
}

function createSummaryText(jobId, jobState) {
  if (jobState.status === "failed") {
    return [
      `评估失败：${jobId}`,
      `error: ${jobState.error}`
    ].join("\n");
  }

  const summary = jobState.summary || {};
  return [
    `评估完成：${jobId}`,
    `meeting_id: ${summary.selected_meeting_id || ""}`,
    `front_status: ${summary.front_status || ""}`,
    `report_status: ${summary.report_status || ""}`,
    `output_dir: ${summary.output_dir || ""}`
  ].join("\n");
}

async function replyIfPossible(replyTarget, text) {
  if (!replyTarget.chatId) {
    return;
  }
  if (!process.env.FEISHU_APP_ID || !process.env.FEISHU_APP_SECRET) {
    return;
  }
  await sendTextMessage({
    receiveId: replyTarget.chatId,
    receiveIdType: "chat_id",
    text
  });
}

function createJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultOutputDir(jobId) {
  return path.resolve("data/outputs/bot_runs", jobId);
}

function startFeishuBotServer(options = {}) {
  const port = Number(options.port || process.env.PORT || 3030);
  const host = options.host || process.env.HOST || "0.0.0.0";
  const jobs = new Map();

  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      writeJson(res, 200, { ok: true, now: new Date().toISOString() });
      return;
    }

    if (req.method === "GET" && req.url === "/jobs") {
      writeJson(res, 200, {
        jobs: Array.from(jobs.values()).map((item) => ({
          job_id: item.jobId,
          status: item.status,
          output_dir: item.outputDir,
          selected_meeting_id: item.summary ? item.summary.selected_meeting_id : ""
        }))
      });
      return;
    }

    if (req.method !== "POST" || req.url !== "/webhook/feishu/bot") {
      writeJson(res, 404, { ok: false, error: "Not found" });
      return;
    }

    try {
      const body = await readRequestBody(req);
      const payload = body ? JSON.parse(body) : {};

      if (!maybeVerifyToken(payload)) {
        writeJson(res, 403, { ok: false, error: "Invalid verification token" });
        return;
      }

      if (payload.challenge) {
        writeJson(res, 200, { challenge: payload.challenge });
        return;
      }

      const parsedCommand = parseCommandText(extractTextContent(payload));
      const replyTarget = extractReplyTarget(payload);

      if (parsedCommand.type === "help" || parsedCommand.type === "empty" || parsedCommand.type === "unknown") {
        await replyIfPossible(replyTarget, createHelpText());
        writeJson(res, 200, { ok: true, accepted: false });
        return;
      }

      if (parsedCommand.type === "status") {
        const job = jobs.get(parsedCommand.jobId);
        const text = job
          ? createSummaryText(job.jobId, job)
          : `未找到任务：${parsedCommand.jobId || "(empty)"}`;
        await replyIfPossible(replyTarget, text);
        writeJson(res, 200, { ok: true, accepted: false });
        return;
      }

      if (parsedCommand.type === "invalid") {
        await replyIfPossible(replyTarget, `命令无效：${parsedCommand.reason}\n${createHelpText()}`);
        writeJson(res, 200, { ok: true, accepted: false });
        return;
      }

      const jobId = createJobId();
      const runOptions = {
        ...parsedCommand.options,
        outputDir: path.resolve(parsedCommand.options.outputDir || createDefaultOutputDir(jobId)),
        triggerType: parsedCommand.options.triggerType || "feishu_bot"
      };
      const jobState = {
        jobId,
        status: "accepted",
        outputDir: runOptions.outputDir,
        createdAt: new Date().toISOString(),
        summary: null,
        error: null
      };
      jobs.set(jobId, jobState);

      writeJson(res, 200, { ok: true, accepted: true, job_id: jobId });
      await replyIfPossible(replyTarget, createRunAcceptedText(jobId, runOptions));

      Promise.resolve().then(async () => {
        jobState.status = "running";
        try {
          const summary = await runEvaluationAutomation(runOptions);
          jobState.status = "completed";
          jobState.summary = summary;
          await replyIfPossible(replyTarget, createSummaryText(jobId, jobState));
        } catch (error) {
          jobState.status = "failed";
          jobState.error = error && error.message ? error.message : String(error);
          await replyIfPossible(replyTarget, createSummaryText(jobId, jobState));
        }
      }).catch(() => {});
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      resolve({
        server,
        port,
        host,
        jobs
      });
    });
  });
}

module.exports = {
  startFeishuBotServer
};

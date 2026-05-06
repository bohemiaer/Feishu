"use strict";

const fs = require("fs");
const path = require("path");
const lark = require("@larksuiteoapi/node-sdk");
const {
  buildCase06Summary,
  buildCleanOutputLayerInput,
  DASHBOARD_URL,
  publishOutputLayerInput,
  REVIEW_ITEMS_URL
} = require("./case06_output_layer");
const { sendInteractiveMessage, sendTextMessage } = require("./client");

const CASE06_REQUEST = Object.freeze({
  source: "feishu_bot_ws",
  request_id: "REQ-CASE06-DEMO",
  manager_name: "周牧",
  manager_id: "MGR-CASE-06",
  period_start: "2026-01-01",
  period_end: "2026-03-26",
  project_scope: "PJT-CASE-06",
  run_mode: "run_now"
});

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseMessageText(message) {
  if (!message || !message.content) return "";
  try {
    const content = JSON.parse(message.content);
    return String(content.text || "").trim();
  } catch {
    return String(message.content || "").trim();
  }
}

function isLaunchMessage(text) {
  return /发起中层管理效能评估/.test(text);
}

function isDebugRunMessage(text) {
  return /发起评估\s+case\s*0?6/i.test(text);
}

function isRunCase06Message(text) {
  return /case\s*0?6/i.test(text) || /周牧|MGR-CASE-06|PJT-CASE-06/.test(text);
}

function plainText(content) {
  return {
    tag: "plain_text",
    content
  };
}

function normalizeCardValue(value) {
  if (Array.isArray(value)) return value[0];
  if (value && typeof value === "object") {
    return value.value || value.text || value.content || value.option || value.date || value;
  }
  return value;
}

function extractSubmittedRequest(event, action) {
  const formValue = event?.form_value || event?.action?.form_value || action?.form_value || {};
  const managerName = String(
    normalizeCardValue(formValue.manager_name) ||
    normalizeCardValue(formValue.manager) ||
    action.manager_name ||
    CASE06_REQUEST.manager_name
  ).trim();
  const periodStart = String(
    normalizeCardValue(formValue.period_start) ||
    normalizeCardValue(formValue.start_date) ||
    action.period_start ||
    CASE06_REQUEST.period_start
  ).trim();
  const periodEnd = String(
    normalizeCardValue(formValue.period_end) ||
    normalizeCardValue(formValue.end_date) ||
    action.period_end ||
    CASE06_REQUEST.period_end
  ).trim();

  return {
    ...CASE06_REQUEST,
    manager_name: managerName,
    manager_id: managerName === CASE06_REQUEST.manager_name ? CASE06_REQUEST.manager_id : "",
    period_start: periodStart,
    period_end: periodEnd
  };
}

function isSupportedCase06Request(request) {
  return (request.manager_id === CASE06_REQUEST.manager_id || request.manager_name === CASE06_REQUEST.manager_name) &&
    request.period_start === CASE06_REQUEST.period_start &&
    request.period_end === CASE06_REQUEST.period_end;
}

function buildLaunchCard() {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      template: "blue",
      title: {
        tag: "plain_text",
        content: "发起中层管理效能评估"
      }
    },
    elements: [
      {
        tag: "markdown",
        content: [
          "**请确认本次评估对象和评估周期。**",
          "",
          "当前 MVP 支持：周牧 / 2026-01-01 至 2026-03-26。"
        ].join("\n")
      },
      {
        tag: "action",
        layout: "bisected",
        actions: [
          {
            tag: "select_static",
            placeholder: plainText("选择评估对象"),
            initial_option: CASE06_REQUEST.manager_name,
            option: [
              {
                text: plainText(CASE06_REQUEST.manager_name),
                value: CASE06_REQUEST.manager_name
              }
            ],
            value: {
              action: "set_manager",
              field: "manager_name"
            }
          },
          {
            tag: "date_picker",
            placeholder: plainText("评估周期开始"),
            initial_date: CASE06_REQUEST.period_start,
            value: {
              action: "set_period_start",
              field: "period_start"
            }
          }
        ]
      },
      {
        tag: "action",
        layout: "bisected",
        actions: [
          {
            tag: "date_picker",
            placeholder: plainText("评估周期结束"),
            initial_date: CASE06_REQUEST.period_end,
            value: {
              action: "set_period_end",
              field: "period_end"
            }
          },
          {
            tag: "button",
            text: {
              tag: "plain_text",
              content: "提交评估"
            },
            type: "primary",
            value: {
              action: "submit_evaluation",
              ...CASE06_REQUEST
            }
          }
        ]
      },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "如果卡片回调异常，也可以直接发送：发起评估 case06"
          }
        ]
      }
    ]
  };
}

function buildDoneText(summary) {
  return [
    `已完成「${summary.manager_name}」的中层管理效能评估。`,
    "",
    `综合评分：${summary.overall_score}`,
    `整体置信度：${summary.overall_confidence}`,
    `报告状态：${summary.report_status}`,
    `待复核项：${summary.pending_review_count} 项`,
    "",
    `查看单人评估看板：\n${summary.dashboard_url}`,
    "",
    `处理人工复核：\n${summary.review_items_url}`
  ].join("\n");
}

function buildMockDoneText(request = CASE06_REQUEST) {
  return [
    `已生成「${request.manager_name}」的中层管理效能评估结果。`,
    "",
    "综合评分：68.25",
    "整体置信度：0.7",
    "报告状态：needs_evidence 需补证",
    "待复核项：7 项",
    "",
    `查看单人评估看板：\n${DASHBOARD_URL}`,
    "",
    `处理人工复核：\n${REVIEW_ITEMS_URL}`
  ].join("\n");
}

function appendEventLog(type, payload) {
  const logDir = path.resolve(".tmp");
  fs.mkdirSync(logDir, { recursive: true });
  const event = {
    at: new Date().toISOString(),
    type,
    payload
  };
  fs.appendFileSync(path.join(logDir, "case06_bot_events.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
}

function buildProcessingCard() {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      template: "blue",
      title: {
        tag: "plain_text",
        content: "评估生成中"
      }
    },
    elements: [
      {
        tag: "markdown",
        content: [
          "已收到评估表单，正在生成并写回飞书多维表格。",
          "",
          "完成后机器人会在当前会话返回：综合评分、置信度、单人评估看板和人工复核入口。"
        ].join("\n")
      }
    ]
  };
}

function buildMockDoneCard(request = CASE06_REQUEST) {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      template: "green",
      title: plainText("评估结果已生成")
    },
    elements: [
      {
        tag: "markdown",
        content: buildMockDoneText(request)
      },
      {
        tag: "action",
        layout: "bisected",
        actions: [
          {
            tag: "button",
            text: plainText("查看单人评估看板"),
            type: "primary",
            url: DASHBOARD_URL
          },
          {
            tag: "button",
            text: plainText("处理人工复核"),
            type: "default",
            url: REVIEW_ITEMS_URL
          }
        ]
      }
    ]
  };
}

function buildUnsupportedText() {
  return [
    "当前机器人 MVP 只支持 Case06 演示数据：",
    "周牧 / 2026-01-01 至 2026-03-26。",
    "",
    "请发送「发起中层管理效能评估」重新打开表单卡片，或发送「发起评估 case06」直接运行本轮演示闭环。"
  ].join("\n");
}

function buildUnsupportedCard(request) {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      template: "orange",
      title: plainText("当前 MVP 暂不支持该评估请求")
    },
    elements: [
      {
        tag: "markdown",
        content: [
          `你提交的是：${request.manager_name || "未选择"} / ${request.period_start || "未选择"} 至 ${request.period_end || "未选择"}`,
          "",
          "当前 MVP 仅支持：周牧 / 2026-01-01 至 2026-03-26。",
          "",
          "请调整表单后重新提交，或直接发送「发起评估 case06」。"
        ].join("\n")
      }
    ]
  };
}

async function runCase06Writeback(options = {}) {
  const input = buildCleanOutputLayerInput(options.inputDir || "data/outputs/demo/case06/auto", {
    baseToken: options.baseToken
  });
  const publish = options.skipPublish
    ? null
    : publishOutputLayerInput(input, {
      baseToken: options.baseToken,
      cliPath: options.cliPath,
      noClear: options.noClear,
      dryRun: options.dryRun
    });
  return {
    input,
    publish,
    summary: buildCase06Summary(input)
  };
}

async function sendRunResult(chatId, options = {}) {
  if (!options.skipProcessingMessage) {
    await sendTextMessage({
      receiveId: chatId,
      text: "已收到评估请求，正在生成并写回飞书多维表格，请稍等。"
    });
  }
  const result = await runCase06Writeback(options);
  await sendTextMessage({
    receiveId: chatId,
    text: buildDoneText(result.summary)
  });
  return result;
}

async function sendMockRunResult(chatId, request = CASE06_REQUEST) {
  await sendTextMessage({
    receiveId: chatId,
    text: buildMockDoneText(request)
  });
}

function createEventDispatcher(options = {}) {
  return new lark.EventDispatcher({
    verificationToken: process.env.FEISHU_BOT_VERIFICATION_TOKEN,
    encryptKey: process.env.FEISHU_BOT_ENCRYPT_KEY
  }).register({
    "im.message.receive_v1": async (data) => {
      const chatId = data?.message?.chat_id;
      const text = parseMessageText(data?.message);
      appendEventLog("im.message.receive_v1", {
        chat_id: chatId,
        text
      });
      if (!chatId || !text) return {};

      if (isDebugRunMessage(text)) {
        await sendInteractiveMessage({
          receiveId: chatId,
          card: buildMockDoneCard(CASE06_REQUEST)
        });
        return {};
      }

      if (isLaunchMessage(text)) {
        await sendInteractiveMessage({
          receiveId: chatId,
          card: buildLaunchCard()
        });
        return {};
      }

      if (/评估/.test(text)) {
        await sendTextMessage({
          receiveId: chatId,
          text: buildUnsupportedText()
        });
      }
      return {};
    },
    "card.action.trigger": async (data) => {
      const event = data?.event || data || {};
      const action = event?.action?.value || data?.action?.value || {};
      const chatId = event?.context?.open_chat_id || event?.open_chat_id || data?.open_chat_id || data?.message?.chat_id;
      appendEventLog("card.action.trigger", {
        chat_id: chatId,
        open_message_id: event?.context?.open_message_id || event?.open_message_id,
        action
      });
      if (["set_manager", "set_period_start", "set_period_end"].includes(action.action)) {
        return {};
      }
      if (action.action !== "submit_evaluation" && action.action !== "run_case06") return {};
      const submittedRequest = extractSubmittedRequest(event, action);
      appendEventLog("card.action.submit", {
        chat_id: chatId,
        request: submittedRequest
      });
      if (!isSupportedCase06Request(submittedRequest)) {
        if (chatId) {
          void sendInteractiveMessage({
            receiveId: chatId,
            card: buildUnsupportedCard(submittedRequest)
          }).catch((error) => {
            appendEventLog("card.action.error", {
              chat_id: chatId,
              message: error.message
            });
          });
        }
        return {};
      }
      if (chatId) {
        void sendInteractiveMessage({
          receiveId: chatId,
          card: buildMockDoneCard({
            ...CASE06_REQUEST,
            ...submittedRequest,
            manager_name: CASE06_REQUEST.manager_name
          })
        }).catch((error) => {
          appendEventLog("card.action.error", {
            chat_id: chatId,
            message: error.message
          });
        });
      }
      return {};
    }
  });
}

function startCase06BotWs(options = {}) {
  const appId = options.appId || requireEnv("FEISHU_APP_ID");
  const appSecret = options.appSecret || requireEnv("FEISHU_APP_SECRET");
  const wsClient = new lark.WSClient({
    appId,
    appSecret,
    appType: lark.AppType.SelfBuild,
    domain: lark.Domain.Feishu,
    loggerLevel: lark.LoggerLevel.info
  });

  wsClient.start({
    eventDispatcher: createEventDispatcher(options)
  });
  return wsClient;
}

module.exports = {
  CASE06_REQUEST,
  buildDoneText,
  buildLaunchCard,
  buildMockDoneCard,
  buildMockDoneText,
  buildUnsupportedText,
  createEventDispatcher,
  isDebugRunMessage,
  isLaunchMessage,
  isRunCase06Message,
  parseMessageText,
  runCase06Writeback,
  startCase06BotWs
};

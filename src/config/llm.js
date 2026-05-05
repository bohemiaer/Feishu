"use strict";

const fs = require("fs");
const path = require("path");

function parseApiMarkdown(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const model = (content.match(/模型名称[:：]\s*(.+)/) || [])[1];
  const apiKey = (content.match(/api[:：]\s*(sk-[A-Za-z0-9_-]+)/) || [])[1];
  const baseUrl = (content.match(/url\s+(\S+)/i) || [])[1];

  if (!model || !apiKey || !baseUrl) {
    throw new Error(`Unable to parse model config from ${filePath}`);
  }

  return {
    model: model.trim(),
    apiKey: apiKey.trim(),
    baseUrl: baseUrl.trim().replace(/\/$/, "")
  };
}

function loadLlmConfig() {
  if (process.env.LLM_MODEL && process.env.LLM_API_KEY && process.env.LLM_BASE_URL) {
    return {
      model: process.env.LLM_MODEL,
      apiKey: process.env.LLM_API_KEY,
      baseUrl: process.env.LLM_BASE_URL.replace(/\/$/, "")
    };
  }

  const apiFile = path.resolve(__dirname, "..", "..", "api.md");
  if (!fs.existsSync(apiFile)) {
    return null;
  }
  return parseApiMarkdown(apiFile);
}

module.exports = {
  loadLlmConfig
};

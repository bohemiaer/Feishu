"use strict";

const { loadLlmConfig } = require("../config/llm");

function stripCodeFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function callJsonModel({ systemPrompt, userPrompt, temperature = 0.2 }) {
  const config = loadLlmConfig();
  if (!config) {
    throw new Error("LLM config not found. Please provide api.md or env vars.");
  }
  const endpoint = /\/chat\/completions$/i.test(config.baseUrl)
    ? config.baseUrl
    : `${config.baseUrl}/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  const content = json.choices && json.choices[0] && json.choices[0].message
    ? json.choices[0].message.content
    : "";

  if (!content) {
    throw new Error("LLM response did not include message content.");
  }

  return JSON.parse(stripCodeFences(content));
}

module.exports = {
  callJsonModel
};

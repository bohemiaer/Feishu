"use strict";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function fetchTenantAccessToken() {
  const appId = requireEnv("FEISHU_APP_ID");
  const appSecret = requireEnv("FEISHU_APP_SECRET");
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tenant access token: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  if (payload.code !== 0 || !payload.tenant_access_token) {
    throw new Error(`Failed to fetch tenant access token: ${JSON.stringify(payload)}`);
  }

  return payload.tenant_access_token;
}

async function sendTextMessage({ receiveId, receiveIdType = "chat_id", text }) {
  const tenantAccessToken = await fetchTenantAccessToken();
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${encodeURIComponent(receiveIdType)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAccessToken}`
    },
    body: JSON.stringify({
      receive_id: receiveId,
      msg_type: "text",
      content: JSON.stringify({ text })
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send Feishu text message: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  if (payload.code !== 0) {
    throw new Error(`Failed to send Feishu text message: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function sendInteractiveMessage({ receiveId, receiveIdType = "chat_id", card }) {
  const tenantAccessToken = await fetchTenantAccessToken();
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${encodeURIComponent(receiveIdType)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAccessToken}`
    },
    body: JSON.stringify({
      receive_id: receiveId,
      msg_type: "interactive",
      content: JSON.stringify(card)
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send Feishu interactive message: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  if (payload.code !== 0) {
    throw new Error(`Failed to send Feishu interactive message: ${JSON.stringify(payload)}`);
  }

  return payload;
}

module.exports = {
  sendInteractiveMessage,
  sendTextMessage
};

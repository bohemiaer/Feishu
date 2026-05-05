# 飞书 CLI 五维真实返回样例

这批文件不是手写示例，而是 2026-05-03 在当前机器上直接调用 `lark-cli` 后保存的真实返回。

## 目录划分

- `01_cloud_docs`
  - 云文档内容抓取样例。
- `02_chats`
  - 聊天相关样例。
  - 已补齐 `user` 身份下的真实群搜索返回。
  - 额外补了一份 `messages-search` 返回。
  - `bot` 身份也保留了一份 `chat-search` 结果，当前返回为空列表。
- `03_task_risk_register`
  - 多维表格中的项目、任务、风险真实返回。
- `04_meetings`
  - Base 中的会议记录、Statements 表，以及 `vc +search` 的真实返回。
- `05_org_and_team`
  - 通讯录/组织信息样例。
  - 已补齐 `user` 身份下的真实用户信息返回。
  - `bot` 身份也保留了一份按 `open_id` 查询的返回。

## 实际使用的命令

```powershell
lark-cli docs +fetch --api-version v2 --doc "https://jcneyh7qlo8i.feishu.cn/docx/Ne75dNMp4oqEHYx8ZUOc3yvan4g" --as user
lark-cli im +chat-search --query "项目" --as user
lark-cli im +messages-search --query "收到" --start "2026-04-01T00:00:00+08:00" --end "2026-05-03T23:59:59+08:00" --page-size 5 --as user
lark-cli im +chat-search --query "项目" --as bot
lark-cli base +record-list --base-token R7bebfixvam0AqsPowucJcuHn2e --table-id Projects --as user
lark-cli base +field-list --base-token R7bebfixvam0AqsPowucJcuHn2e --table-id Projects --as user
lark-cli base +record-list --base-token R7bebfixvam0AqsPowucJcuHn2e --table-id Tasks --as user
lark-cli base +record-list --base-token R7bebfixvam0AqsPowucJcuHn2e --table-id Risks --as user
lark-cli base +record-list --base-token R7bebfixvam0AqsPowucJcuHn2e --table-id Meetings --as user
lark-cli base +record-list --base-token R7bebfixvam0AqsPowucJcuHn2e --table-id Statements --as user
lark-cli vc +search --participant-ids ou_5bc9113415fc892be295ce60bf29bb39 --start 2026-04-01 --end 2026-05-03 --as user
lark-cli contact +get-user --user-id ou_5bc9113415fc892be295ce60bf29bb39 --user-id-type open_id --as bot
lark-cli contact +get-user --as user
```

## 当前结论

- 文档、Base、会议检索、聊天、通讯录这五条链路都已经拿到真实 CLI 返回。
- `messages-search` 当前虽然可用，但这次返回里只有 `message_ids`，CLI 提示 `failed to fetch message details, returning ID list only`，所以现阶段它更适合当作“检索结果结构样例”，不适合当作完整消息内容样例。

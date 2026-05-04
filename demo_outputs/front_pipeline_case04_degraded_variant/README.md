# 飞书 CLI 七类输入源模拟包（Case 04）

这批文件基于 [case_sources/case_04](/D:/Users/HCI_lab/Desktop/github/飞书比赛/case_sources/case_04) 的原始中文素材推导生成，用于模拟飞书 CLI 在“履约稳定性专项治理”案例下的可用输入源返回。

## 说明

- 这是模拟返回，不是真实接口抓取结果。
- 目录风格对齐 [samples/feishu_cli_actual_5d](/D:/Users/HCI_lab/Desktop/github/飞书比赛/samples/feishu_cli_actual_5d)。
- 输入源收敛为七类：Base 记录、Base 历史、云文档、聊天历史、会议/妙记、日历、通讯录。
- 只保留正向可用样例，不包含 `*_missing_scope.json`、`*_bot_empty.json` 一类权限或空返回样例。

## 目录

- `dimension_evidence_cli_matrix.json`
  - 五个评估维度的证据源矩阵。
  - 标注每个二级指标使用七类输入源中的哪些来源，以及已整合到哪些输入文件。
- `dimension_evidence_cli_capability_matrix.json`
  - 按收敛后的七类输入源分析 CLI 可获取性。
  - 覆盖 Base 记录、Base 历史、云文档、聊天历史、会议/妙记、日历、通讯录。
- `01_cloud_docs`
  - 模拟 `docs +fetch --api-version v2` 返回。
- `02_chats`
  - 模拟群搜索和消息检索返回。
- `03_task_risk_register`
  - 模拟 Base 项目表、任务表、风险表和记录历史返回。
- `04_meetings`
  - 模拟会议表、Statements 表、`vc +search` 和 Minutes 妙记返回。
- `05_org_and_team`
  - 模拟单人组织信息查询和项目成员通讯录返回。
- `06_calendar`
  - 模拟日历事件和会议参与人返回。

## 统一主键

- `project_id`: `PJT-CASE-04`
- `manager_id`: `MGR-CASE-04`
- `manager_name`: `陈昊`
- `meeting_id`: `MTG-CASE-04-01` 至 `MTG-CASE-04-04`

## 生成约束

- 保留噪音、旧附件、线下补录不完整、跨项目插话等真实输入问题。
- 不输出评估结论、维度打分、绩效判断等分析性内容。
- Base 风格文件继续使用二维数组 `data` 结构，而不是对象数组。

## CLI 可获取性结论

- 从 CLI 命令能力看，七类输入源都可以纳入自动化取证范围：Base 记录、Base 历史、云文档、聊天历史、会议/妙记、日历、通讯录。
- 覆盖最高：推进闭环力。Base 记录和 Base 历史能支撑任务完整率、延期率、关闭质量，会议/妙记和云文档用于补证。
- 覆盖较高：方向校准力、风险治理力、协同调度力。关键是把 Base、文档、聊天、会议、日历和通讯录中的时间线与角色关系串起来。
- 覆盖中高：组织行为健康度。聊天历史和会议/妙记是主证据，日历与通讯录用于判断公开场景、必要参会人和非常规时段。
- 已排除来源：邮件、飞书任务中心、审批、OKR、考勤、Drive 评论、外部 Jira/GitLab/Bug 系统、非飞书工单系统。

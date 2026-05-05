# Case 04 Full Loop Observability

Generated at: 2026-05-04T16:24:38.756Z

## Run Summary

| Field | Value |
| --- | --- |
| Project | PJT-CASE-04 |
| Manager | MGR-CASE-04 |
| Meeting | MTG-CASE-04-04 |
| Evaluation Period | 2026-04-13 ~ 2026-04-24 |
| Orchestration Status | OK |
| Completeness Status | OK |
| Assessment Status | DEGRADED |
| Report Status | DEGRADED |
| Missing Upstream Results | none |
| Report Missing Upstream | none |

## Node Observability

| Node | Status | Primary Output | Observable Counts |
| --- | --- | --- | --- |
| Master Orchestrator | collected | orchestration_state.json | blocking=0, degrade=0 |
| Input Completeness Check | ready | input_completeness_report.json | available=7, missing=0, blocking=0 |
| Data Collector | ready | raw_payload/history_bundle/meeting_fact_pack/data_quality_report | sources=7, warnings=3, issues=0 |
| Hard Metrics Engine | ready | hard_metrics_result.json | metrics=15, available=15, degraded=0, no_sample=0 |
| Evaluation Planner | full_evaluation | evaluation_plan.json | focus=5, agents=5, review_rules=5 |
| Management Reviewer | ready | management_reviewer_result.json | request_metrics=7, findings=5, human_review=2 |
| Risk & Behavior Auditor | ready | risk_behavior_auditor_result.json | request_metrics=6, findings=4, flags=4, human_review=3 |
| Coordination Lens | ready | coordination_lens_result.json | request_metrics=2, findings=2, human_review=1 |
| Capability Assessor | degraded | capability_assessor_result.json | request_metrics=15, scores=5, human_review=6 |
| Report Writer | degraded | report_result.json | human_review=6, evidence=4, risk_alerts=4, next_actions=4 |

## Source Coverage

| Source | Required | Status | Sample Count | Files | Notes |
| --- | --- | --- | --- | --- | --- |
| Base 记录 | true | OK | 43 | 03_task_risk_register/base_projects_record_list.json<br>03_task_risk_register/base_tasks_record_list.json<br>03_task_risk_register/base_risks_record_list.json<br>04_meetings/base_meetings_record_list.json<br>04_meetings/base_statements_record_list.json |  |
| Base 历史 | false | OK | 5 | 03_task_risk_register/base_record_history_list.json |  |
| 云文档 | true | OK | 1 | 01_cloud_docs/docs_fetch_main_doc_v2.json |  |
| 聊天历史 | false | OK | 18 | 02_chats/im_chat_search_user.json<br>02_chats/im_messages_search_user.json |  |
| 会议/妙记 | true | OK | 11 | 04_meetings/base_meetings_record_list.json<br>04_meetings/minutes_search_user.json<br>04_meetings/minutes_transcript_case04.json<br>04_meetings/vc_search_by_participant.json | 当前会议没有完整妙记转写，只能依赖会议表和其他留痕 |
| 日历 | false | OK | 4 | 06_calendar/calendar_events_instance_view.json |  |
| 通讯录 | false | OK | 8 | 05_org_and_team/contact_get_user_user.json<br>05_org_and_team/contact_search_user_project_members.json |  |

## Data Sample Counts

| Object | Count |
| --- | --- |
| Base history records | 5 |
| Meeting docs | 3 |
| Project docs | 3 |
| Chat messages | 18 |
| Calendar events | 4 |
| Org contacts | 8 |
| Source catalog | 7 |
| Current meeting tasks | 3 |
| History recent meetings | 3 |
| History risk records | 5 |
| Meeting action items | 3 |
| Meeting decisions | 3 |
| Meeting risks mentioned | 3 |
| Provenance refs | 10 |

## Data Quality Warnings

- 当前会议没有完整妙记转写，当前会议事实将更多依赖会议表和 Statements。
- 历史会议中存在 summary_only 样本，历史复核时需降低留痕置信度。
- 聊天样本中混入行政或噪音消息，后续使用时需按线程和关键词过滤。

## Hard Metrics

| Dimension | Metric ID | Label | Formula | Calculation | Value | Unit | Status | Anomalies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | meeting_decision_coverage_rate | 会议决策留痕覆盖率 | value = meetings_with_decision_trace / total_meetings | 4 / 4 | 1 | ratio | OK |  |
| 推进闭环力 | task_definition_completeness_rate | 任务定义完整率 | value = tasks_with_task_name_owner_due_date / total_tasks | 20 / 20 | 1 | ratio | OK |  |
| 推进闭环力 | task_overdue_rate | 任务延期率 | value = overdue_tasks / tasks_with_due_date | 5 / 20 | 0.25 | ratio | OK | PJT-CASE-04-TASK-03 输出字段冻结表草案 DDL=2026-04-16 20:00<br>PJT-CASE-04-TASK-05 修正客服异常子状态映射 DDL=2026-04-18 18:00<br>PJT-CASE-04-TASK-12 复现工单高频异常 B DDL=2026-04-21 18:00<br>PJT-CASE-04-TASK-13 输出低频回写补偿脚本 DDL=2026-04-22 20:00<br>PJT-CASE-04-TASK-16 线下沟通补录到评审纪要 DDL=2026-04-18 17:00 |
| 推进闭环力 | task_closure_rate | 任务关闭率 | value = closed_tasks / total_tasks | 14 / 20 | 0.7 | ratio | OK |  |
| 推进闭环力 | closed_task_quality_rate | 任务关闭质量代理指标 | value = qualified_closed_tasks / closed_tasks | 14 / 14 | 1 | ratio | OK |  |
| 推进闭环力 | current_meeting_action_task_rate | 当前会议行动项入表率 | value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count | 3 / 3 | 1 | ratio | OK | 会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载 |
| 推进闭环力 | meeting_action_item_coverage_rate | 会议行动项留痕覆盖率 | value = meetings_with_action_item_count_gt_0 / total_meetings | 4 / 4 | 1 | ratio | OK |  |
| 风险治理力 | high_risk_resolution_rate | 高等级风险收口率 | value = resolved_high_risks / total_high_risks | 2 / 3 | 0.6667 | ratio | OK |  |
| 风险治理力 | risk_mitigation_action_rate | 风险缓释动作覆盖率 | value = risks_with_suggested_action / total_risks | 10 / 10 | 1 | ratio | OK |  |
| 风险治理力 | open_risk_rate | 风险未收口占比 | value = open_or_tracking_risks / total_risks | 6 / 10 | 0.6 | ratio | OK | PJT-CASE-04-RISK-02 tracking<br>PJT-CASE-04-RISK-05 tracking<br>PJT-CASE-04-RISK-06 tracking<br>PJT-CASE-04-RISK-07 open<br>PJT-CASE-04-RISK-08 tracking<br>PJT-CASE-04-RISK-09 open |
| 风险治理力 | repeated_risk_type_count | 同类风险复发样本数 | value = sum(count(risk_type) where count(risk_type) > 1) | 3 | 3 | count | OK | 交付风险:3 |
| 协同调度力 | calendar_stakeholder_coverage_rate | 日历必要干系人覆盖率 | value = calendar_events_with_required_stakeholders / total_calendar_events | 4 / 4 | 1 | ratio | OK |  |
| 协同调度力 | manager_chat_signal_count | 管理者聊天同步样本数 | value = manager_chat_messages_count | 7 | 7 | count | OK |  |
| 组织行为健康度 | late_night_manager_message_rate | 管理者非常规时段消息占比 | value = manager_messages_between_22_00_and_08_00 / manager_chat_messages | 0 / 7 | 0 | ratio | OK |  |
| 组织行为健康度 | high_pressure_language_sample_rate | 高压推进语言样本占比 | value = manager_messages_matching_pressure_keywords / manager_chat_messages | 3 / 7 | 0.4286 | ratio | OK | 2026-04-15 16:16 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。<br>2026-04-19 10:44 12 点前给我 go/no-go 输入，不要等到晚上才决定。<br>2026-04-16 17:11 本轮先不争论长期最优结构，字段冻结表今天必须出，先服务上线前执行口径。 |

## Metric Formula Details

| Metric ID | Numerator | Denominator | Value Rule | Sample Scope |
| --- | --- | --- | --- | --- |
| meeting_decision_coverage_rate | 会议记录中 decision_summary 非空，或历史会议 summary 非空的会议数 | 评估周期内可用会议样本总数 | ratio 保留 4 位小数；分母为 0 时 value=null 且 status=no_sample | Base Meetings decision_summary or history summary |
| task_definition_completeness_rate | 同时具备 task_name、owner、due_date 的任务数 | Base Tasks 中评估周期内项目任务总数 | ratio 保留 4 位小数；缺字段任务进入 missing_fields/anomalies | Base Tasks: owner + DDL + task_name |
| task_overdue_rate | is_overdue 为 true/yes/1/已完成/已关闭 等真值的任务数 | 具备 due_date 的任务数 | ratio 保留 4 位小数；延期任务逐条进入 anomalies | Base Tasks with due_date |
| task_closure_rate | is_closed 为真值，或 status 属于 已完成/done/closed/resolved 的任务数 | Base Tasks 中评估周期内项目任务总数 | ratio 保留 4 位小数 | Base Tasks closed flag/status |
| closed_task_quality_rate | 已关闭且具备 close_duration、owner、due_date，并能通过 source_meeting_id 或 Base 历史找到留痕的任务数 | 已关闭任务数 | ratio 保留 4 位小数；不满足代理质量字段的任务进入 missing_fields/anomalies | Closed tasks with close_duration + owner + DDL + source/history trace |
| current_meeting_action_task_rate | source_meeting_id 等于当前会议 ID 的任务数，上限截断为会议行动项数量 | 当前会议记录中的 action_item_count | ratio 保留 4 位小数；任务关联数大于或小于行动项数都进入 anomalies | Current meeting action_item_count vs Base Tasks source_meeting_id |
| meeting_action_item_coverage_rate | action_item_count > 0 的会议数 | 评估周期内可用会议样本总数 | ratio 保留 4 位小数；action_item_count=0 的会议进入 anomalies | Base Meetings action_item_count |
| high_risk_resolution_rate | risk_level=high 且 followup_status 不属于 open/tracking 等未收口状态的风险数 | risk_level=high 的风险总数 | ratio 保留 4 位小数 | Base Risks level=high |
| risk_mitigation_action_rate | suggested_action 非空的风险数 | Base Risks 中评估周期内项目风险总数 | ratio 保留 4 位小数 | Base Risks suggested_action completeness |
| open_risk_rate | followup_status 不属于 resolved/closed/record_only/已关闭/已解决 的风险数 | Base Risks 中评估周期内项目风险总数 | ratio 保留 4 位小数；未收口风险逐条进入 anomalies | Base Risks followup_status |
| repeated_risk_type_count | 按 risk_type 分组后，出现次数大于 1 的组内样本总数 | Base Risks 中评估周期内项目风险总数 | count 指标直接返回 numerator；重复类型进入 anomalies | Base Risks grouped by risk_type |
| calendar_stakeholder_coverage_rate | 日历参会人同时覆盖评估对象、关键协作者，并命中项目通讯录成员的事件数 | 评估周期内项目日历事件数；若日历为空则回退会议样本数 | ratio 保留 4 位小数 | Calendar attendees against project contacts |
| manager_chat_signal_count | sender.name 等于评估对象姓名的聊天消息数 | 评估周期内聊天样本总数 | count 指标直接返回 numerator；denominator 用于展示样本覆盖 | Chat messages where sender is evaluation target |
| late_night_manager_message_rate | 评估对象在 22:00-08:00 发送的聊天消息数 | 评估对象发送的聊天消息总数 | ratio 保留 4 位小数；非常规时段消息逐条进入 anomalies | Manager chat messages between 22:00 and 08:00 |
| high_pressure_language_sample_rate | 评估对象消息中命中 /必须\|给我\|不要等\|不能继续\|不到位\|别留到/ 的样本数 | 评估对象发送的聊天消息总数 | ratio 保留 4 位小数；该指标只表示规则命中样本，不直接等同组织行为结论 | Rule-based keyword scan on manager chat messages |

## Metric Evidence With Original Excerpts

| Metric ID | Source | Source File | Source ID | Timestamp | Readable Evidence | Original Excerpt |
| --- | --- | --- | --- | --- | --- | --- |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-01 | 2026-04-13 10:02 - 10:58 | MTG-CASE-04-01 专项同步 | 本轮优先级先收窄到主链路稳定和退款一致性 \| 当天需收出依赖和阻塞项 \| 后续推进方案另行整理 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-02 | 2026-04-16 15:00 - 16:20 | MTG-CASE-04-02 联调状态沟通 | 中台先输出冻结表草案 \| 客服和仓配对草案做确认和补充 \| 吴恬整理统一版并回发群里 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-03 | 2026-04-18 11:45 - 12:05 | MTG-CASE-04-03 阶段评审前线下沟通补录 | 暂不直接扩面验证 \| 先收齐环境和回归输入 \| 再决定是否继续推进 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-04 | 2026-04-24 19:30 - 20:35 | MTG-CASE-04-04 专项阶段复盘 | 主链路目标基本达成 \| 字段冻结表后续可沉淀为固定机制 \| 客服链路遗留项进入下一阶段继续跟踪 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-01 | 2026-04-13 15:00 | PJT-CASE-04-TASK-01 输出专项目标与边界文档 | 输出专项目标与边界文档 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-02 | 2026-04-13 18:00 | PJT-CASE-04-TASK-02 整理跨团队阻塞项清单 | 整理跨团队阻塞项清单 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-03 | 2026-04-16 20:00 | PJT-CASE-04-TASK-03 输出字段冻结表草案 | 输出字段冻结表草案 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-04 | 2026-04-17 12:00 | PJT-CASE-04-TASK-04 确认字段冻结表最终版 | 确认字段冻结表最终版 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-05 | 2026-04-18 18:00 | PJT-CASE-04-TASK-05 修正客服异常子状态映射 | 修正客服异常子状态映射 |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-03 | 2026-04-16 20:00 | PJT-CASE-04-TASK-03 输出字段冻结表草案 | 输出字段冻结表草案 DDL=2026-04-16 20:00 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-05 | 2026-04-18 18:00 | PJT-CASE-04-TASK-05 修正客服异常子状态映射 | 修正客服异常子状态映射 DDL=2026-04-18 18:00 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-12 | 2026-04-21 18:00 | PJT-CASE-04-TASK-12 复现工单高频异常 B | 复现工单高频异常 B DDL=2026-04-21 18:00 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-13 | 2026-04-22 20:00 | PJT-CASE-04-TASK-13 输出低频回写补偿脚本 | 输出低频回写补偿脚本 DDL=2026-04-22 20:00 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-16 | 2026-04-18 17:00 | PJT-CASE-04-TASK-16 线下沟通补录到评审纪要 | 线下沟通补录到评审纪要 DDL=2026-04-18 17:00 is_overdue=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-01 | 2026-04-13 15:00 | PJT-CASE-04-TASK-01 输出专项目标与边界文档 | 输出专项目标与边界文档 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-02 | 2026-04-13 18:00 | PJT-CASE-04-TASK-02 整理跨团队阻塞项清单 | 整理跨团队阻塞项清单 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-03 | 2026-04-16 20:00 | PJT-CASE-04-TASK-03 输出字段冻结表草案 | 输出字段冻结表草案 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-04 | 2026-04-17 12:00 | PJT-CASE-04-TASK-04 确认字段冻结表最终版 | 确认字段冻结表最终版 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-06 | 2026-04-17 19:00 | PJT-CASE-04-TASK-06 补充仓配异常子状态说明 | 补充仓配异常子状态说明 status=已完成 is_closed=true |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-01 | 2026-04-13 15:00 | PJT-CASE-04-TASK-01 输出专项目标与边界文档 | 输出专项目标与边界文档 close_duration=2h15m source_meeting_id=MTG-CASE-04-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-02 | 2026-04-13 18:00 | PJT-CASE-04-TASK-02 整理跨团队阻塞项清单 | 整理跨团队阻塞项清单 close_duration=4h30m source_meeting_id=MTG-CASE-04-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-03 | 2026-04-16 20:00 | PJT-CASE-04-TASK-03 输出字段冻结表草案 | 输出字段冻结表草案 close_duration=4h06m source_meeting_id=MTG-CASE-04-02 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-04 | 2026-04-17 12:00 | PJT-CASE-04-TASK-04 确认字段冻结表最终版 | 确认字段冻结表最终版 close_duration=1h20m source_meeting_id=MTG-CASE-04-02 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-06 | 2026-04-17 19:00 | PJT-CASE-04-TASK-06 补充仓配异常子状态说明 | 补充仓配异常子状态说明 close_duration=0h48m source_meeting_id=MTG-CASE-04-02 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-11 | 2026-04-21 18:00 | PJT-CASE-04-TASK-11 复现工单高频异常 A | 复现工单高频异常 A source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-12 | 2026-04-21 18:00 | PJT-CASE-04-TASK-12 复现工单高频异常 B | 复现工单高频异常 B source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-13 | 2026-04-22 20:00 | PJT-CASE-04-TASK-13 输出低频回写补偿脚本 | 输出低频回写补偿脚本 source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-14 | 2026-04-22 19:00 | PJT-CASE-04-TASK-14 更新延期事项 owner 和新 DDL | 更新延期事项 owner 和新 DDL source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-15 | 2026-04-23 17:00 | PJT-CASE-04-TASK-15 清理文档中的旧版本路线图 | 清理文档中的旧版本路线图 source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-17 | 2026-04-24 20:00 | PJT-CASE-04-TASK-17 输出专项复盘初稿 | 输出专项复盘初稿 source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-18 | 2026-04-21 18:00 | PJT-CASE-04-TASK-18 新周报模板落地 | 新周报模板落地 source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-19 | 2026-04-24 17:00 | PJT-CASE-04-TASK-19 客服链路遗留项顺延说明 | 客服链路遗留项顺延说明 source_meeting_id=MTG-CASE-04-04 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | PJT-CASE-04-TASK-20 | 2026-04-24 18:00 | PJT-CASE-04-TASK-20 监控看板接入评估 | 监控看板接入评估 source_meeting_id=MTG-CASE-04-04 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-01 | 2026-04-13 10:02 - 10:58 | MTG-CASE-04-01 专项同步 | 专项同步 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-02 | 2026-04-16 15:00 - 16:20 | MTG-CASE-04-02 联调状态沟通 | 联调状态沟通 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-03 | 2026-04-18 11:45 - 12:05 | MTG-CASE-04-03 阶段评审前线下沟通补录 | 阶段评审前线下沟通补录 action_item_count=2 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-04-04 | 2026-04-24 19:30 - 20:35 | MTG-CASE-04-04 专项阶段复盘 | 专项阶段复盘 action_item_count=3 |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-01 | MTG-CASE-04-02 | PJT-CASE-04-RISK-01 high resolved | 字段口径不一致导致联调返工 followup_status=resolved |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-02 | MTG-CASE-04-03 | PJT-CASE-04-RISK-02 high tracking | 退款回写高峰场景尾延迟 followup_status=tracking |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-03 | MTG-CASE-04-03 | PJT-CASE-04-RISK-03 high resolved | 晚间环境窗口不稳定 followup_status=resolved |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-01 | MTG-CASE-04-02 | PJT-CASE-04-RISK-01 high resolved | 推进字段冻结表最终版并明确适配责任人 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-02 | MTG-CASE-04-03 | PJT-CASE-04-RISK-02 high tracking | 继续跟踪长尾点并补充压测结论到文档 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-03 | MTG-CASE-04-03 | PJT-CASE-04-RISK-03 high resolved | 提前确认环境负责人并保留备选窗口 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-04 | MTG-CASE-04-04 | PJT-CASE-04-RISK-04 medium closed | 补齐样本后关闭该项并同步影响范围 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-05 | MTG-CASE-04-04 | PJT-CASE-04-RISK-05 medium tracking | 保留遗留项说明并顺延到下一阶段 |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-02 | MTG-CASE-04-03 | PJT-CASE-04-RISK-02 high tracking | 退款回写高峰场景尾延迟 followup_status=tracking |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-05 | MTG-CASE-04-04 | PJT-CASE-04-RISK-05 medium tracking | 客服高频异常 B 未及时复现 followup_status=tracking |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-06 | MTG-CASE-04-03 | PJT-CASE-04-RISK-06 medium tracking | 线下结论未及时留痕 followup_status=tracking |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-07 | MTG-CASE-04-01 | PJT-CASE-04-RISK-07 medium open | 旧版文档口径误导执行 followup_status=open |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-08 | MTG-CASE-04-04 | PJT-CASE-04-RISK-08 medium tracking | 低频回写补偿脚本准备不足 followup_status=tracking |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-01 | MTG-CASE-04-02 | PJT-CASE-04-RISK-01 high resolved | 交付风险: 字段口径不一致导致联调返工 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-02 | MTG-CASE-04-03 | PJT-CASE-04-RISK-02 high tracking | 交付风险: 退款回写高峰场景尾延迟 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-03 | MTG-CASE-04-03 | PJT-CASE-04-RISK-03 high resolved | 资源风险: 晚间环境窗口不稳定 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-04 | MTG-CASE-04-04 | PJT-CASE-04-RISK-04 medium closed | 质量风险: 客服高频异常 A 未及时复现 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | PJT-CASE-04-RISK-05 | MTG-CASE-04-04 | PJT-CASE-04-RISK-05 medium tracking | 协同风险: 客服高频异常 B 未及时复现 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case04_evt_0413_sync | 2026-04-13T10:02:00+08:00 | cal_case04_evt_0413_sync 专项同步 | 专项同步 attendees=陈昊,林玥,冯子轩,沈薇,唐可,马会,罗征,吴恬 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case04_evt_0416_joint | 2026-04-16T15:00:00+08:00 | cal_case04_evt_0416_joint 联调状态沟通 | 联调状态沟通 attendees=陈昊,林玥,冯子轩,吴恬,马会,罗征 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case04_evt_0418_offline | 2026-04-18T11:45:00+08:00 | cal_case04_evt_0418_offline 阶段评审前线下沟通补录 | 阶段评审前线下沟通补录 attendees=陈昊,林玥,沈薇,唐可 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case04_evt_0424_review | 2026-04-24T19:30:00+08:00 | cal_case04_evt_0424_review 专项阶段复盘 | 专项阶段复盘 attendees=陈昊,林玥,马会,吴恬 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case04msg0002 | 2026-04-13 09:16 | 陈昊 2026-04-13 09:16 | 今天先把本轮目标和边界说清楚，不在范围里的先别展开。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case04msg0004 | 2026-04-13 09:18 | 陈昊 2026-04-13 09:18 | 先不追求全部体验项一起做，主链路稳定和退款一致先保住。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case04msg0007 | 2026-04-15 16:16 | 陈昊 2026-04-15 16:16 | 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case04msg0009 | 2026-04-14 09:34 | 陈昊 2026-04-14 09:34 | 结算项目别发到专项线程里。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case04msg0013 | 2026-04-19 10:36 | 陈昊 2026-04-19 10:36 | 这里先只说风险、影响、下一步。背景长文别贴。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case04msg0007 | 2026-04-15 16:16 | 陈昊 2026-04-15 16:16 | 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case04msg0014 | 2026-04-19 10:44 | 陈昊 2026-04-19 10:44 | 12 点前给我 go/no-go 输入，不要等到晚上才决定。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case04msg0016 | 2026-04-16 17:11 | 陈昊 2026-04-16 17:11 | 本轮先不争论长期最优结构，字段冻结表今天必须出，先服务上线前执行口径。 |

## Metric Quality

| Metric | Value |
| --- | --- |
| sample_counts | {"task_count":20,"risk_count":10,"meeting_count":4,"chat_message_count":18,"calendar_event_count":4,"contact_count":8,"base_history_count":5} |
| metric_count | 15 |
| available_count | 15 |
| degraded_count | 0 |
| no_sample_count | 0 |

## Planner Focus And Human Review Rules

| Dimension | Priority | Reason | Assigned Agents |
| --- | --- | --- | --- |
| 方向校准力 | medium |  |  |
| 推进闭环力 | high |  |  |
| 风险治理力 | high |  |  |
| 协同调度力 | medium |  |  |
| 组织行为健康度 | high |  |  |

| Rule ID | Severity | Reason | Target Nodes |
| --- | --- | --- | --- |
| review_missing_current_transcript | medium | 当前会议缺完整妙记转写，关键语义判断需人工确认上下文。 | Management Reviewer, Risk & Behavior Auditor |
| review_behavior_language_context | high | 组织行为相关语言只能作为观察项，需人工确认语境和场景。 | Risk & Behavior Auditor, Capability Assessor |
| review_unresolved_high_risks | high | 高等级风险未完全收口，风险治理结论需人工复核。 | Risk & Behavior Auditor |
| review_action_task_mapping | medium | 会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载 | Management Reviewer |
| review_data_quality_warnings | medium | 前链路数据质量报告存在 warning，后续结论需要保留置信度说明。 | Capability Assessor, Report Writer |

## Expert Findings

| Agent | # | Dimension | Type | Confidence | Summary | Evidence / Original Excerpts |
| --- | --- | --- | --- | --- | --- | --- |
| Management Reviewer | 1 | 方向校准力 | observation | 0.7 | 管理者在复盘会议中基于项目目标对阶段成果和遗留问题进行了校准，并提出了机制化改进方向。但由于缺少完整会议转写，对校准过程的细节和语境判断有限。 | cloud_doc:V2mCdcase04MainDocx (4) 原文: 范围内：主链路订单状态同步稳定性、退款状态回写一致性、客服工单联动中的关键高频异常、关键风险项的升级跟踪和回滚预案；范围外：客服体验优化类非阻断需求、仓配底层字段体系重构、新监控平台接入、历史低频长尾问题清理；五一前主链路履约状态同步成功率达到 99.95%；退款状态回写一致性达到 99.90%<br>statement:MTG-CASE-04-04-STM-1 (MTG-CASE-04-04) 原文: 前几天对字段问题的处理还是慢了。<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| Management Reviewer | 2 | 方向校准力 | strength | 0.9 | 管理者在专项执行期间，通过即时沟通持续强调并坚守项目核心目标与范围，有效防止了范围蔓延和优先级漂移。 | chat:om_case04msg0002 (2026-04-13 09:16) 原文: 今天先把本轮目标和边界说清楚，不在范围里的先别展开。<br>chat:om_case04msg0004 (2026-04-13 09:18) 原文: 先不追求全部体验项一起做，主链路稳定和退款一致先保住。<br>chat:om_case04msg0009 (2026-04-14 09:34) 原文: 结算项目别发到专项线程里。<br>base_meeting:MTG-CASE-04-02 (2026-04-16 15:00 - 16:20) 原文: 联调状态沟通: 中台先输出冻结表草案 \| 客服和仓配对草案做确认和补充 \| 吴恬整理统一版并回发群里 |
| Management Reviewer | 3 | 推进闭环力 | risk | 0.95 | 当前会议产生的行动项与任务表关联数量严重不一致（3 vs 9），表明会后存在大量任务扩展或重复挂载，闭环链条的源头（会议决策到任务生成）存在断裂或混乱风险。 | base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘<br>hard_metric:current_meeting_action_task_rate (2026-05-04T16:24:36.430Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>base_task:PJT-CASE-04-TASK-11 (2026-04-21 18:00) 原文: 复现工单高频异常 A owner=马会 status=已完成 DDL=2026-04-21 18:00<br>base_task:PJT-CASE-04-TASK-14 (2026-04-22 19:00) 原文: 更新延期事项 owner 和新 DDL owner=吴恬 status=已完成 DDL=2026-04-22 19:00 |
| Management Reviewer | 4 | 推进闭环力 | risk | 0.85 | 项目整体任务延期率较高（25%），且部分延期任务（如客服异常处理）在复盘会议后仍未明确新的闭环路径，存在闭环断裂风险。 | hard_metric:task_overdue_rate (2026-05-04T16:24:36.430Z) 原文: 任务延期率: 5 / 20 = 0.25; value = overdue_tasks / tasks_with_due_date<br>base_task:PJT-CASE-04-TASK-05 (2026-04-18 18:00) 原文: 修正客服异常子状态映射 owner=马会 status=进行中 DDL=2026-04-18 18:00<br>base_task:PJT-CASE-04-TASK-12 (2026-04-21 18:00) 原文: 复现工单高频异常 B owner=马会 status=延期 DDL=2026-04-21 18:00<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| Management Reviewer | 5 | 推进闭环力 | strength | 0.8 | 管理者在复盘会议中，对历史执行问题进行了根因反思，并提出了明确的、可执行的机制化改进动作，体现了从问题到改进的闭环思维。 | statement:MTG-CASE-04-04-STM-2 (MTG-CASE-04-04) 原文: 下次专项第 1 天就出这个表。<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| Risk & Behavior Auditor | 1 | 风险治理力 | observation | 0.7 | 高等级风险未完全收口，存在遗留风险治理动作不闭环。 | hard_metric:high_risk_resolution_rate (2026-05-04T16:24:36.430Z) 原文: 高等级风险收口率: 2 / 3 = 0.6667; value = resolved_high_risks / total_high_risks<br>base_risk:PJT-CASE-04-RISK-02 (MTG-CASE-04-03) 原文: 退款回写高峰场景尾延迟 level=high followup_status=tracking suggested_action=继续跟踪长尾点并补充压测结论到文档 |
| Risk & Behavior Auditor | 2 | 风险治理力 | observation | 0.7 | 风险未收口占比较高，存在风险识别但治理动作未闭环或延期的情况。 | hard_metric:open_risk_rate (2026-05-04T16:24:36.430Z) 原文: 风险未收口占比: 6 / 10 = 0.6; value = open_or_tracking_risks / total_risks<br>base_risk:PJT-CASE-04-RISK-05 (MTG-CASE-04-04) 原文: 客服高频异常 B 未及时复现 level=medium followup_status=tracking suggested_action=保留遗留项说明并顺延到下一阶段 |
| Risk & Behavior Auditor | 3 | 风险治理力 | observation | 0.7 | 存在同类风险复发线索，表明某些风险类型（如交付风险）的治理模式可能存在不足。 | hard_metric:repeated_risk_type_count (2026-05-04T16:24:36.430Z) 原文: 同类风险复发样本数: 3 = 3; value = sum(count(risk_type) where count(risk_type) > 1)<br>base_risk:PJT-CASE-04-RISK-01 (MTG-CASE-04-02) 原文: 字段口径不一致导致联调返工 level=high followup_status=resolved suggested_action=推进字段冻结表最终版并明确适配责任人 |
| Risk & Behavior Auditor | 4 | 组织行为健康度 | observation | 0.7 | 管理者在群聊中多次使用高压推进语言，可能对团队沟通氛围产生影响。 | hard_metric:high_pressure_language_sample_rate (2026-05-04T16:24:36.430Z) 原文: 高压推进语言样本占比: 3 / 7 = 0.4286; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case04msg0007 (2026-04-15 16:16) 原文: 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。 |
| Coordination Lens | 1 | 协同调度力 | strength | 0.9 | 管理者通过聊天和会议，有效澄清项目范围、明确依赖责任方并推动解决路径，形成闭环。 | chat:om_case04msg0002 (2026-04-13 09:16) 原文: 今天先把本轮目标和边界说清楚，不在范围里的先别展开。<br>chat:om_case04msg0007 (2026-04-15 16:16) 原文: 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。<br>chat:om_case04msg0016 (2026-04-16 17:11) 原文: 本轮先不争论长期最优结构，字段冻结表今天必须出，先服务上线前执行口径。<br>hard_metric:calendar_stakeholder_coverage_rate (2026-05-04T16:24:36.430Z) 原文: 日历必要干系人覆盖率: 4 / 4 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events |
| Coordination Lens | 2 | 协同调度力 | risk | 0.8 | 存在线下沟通未及时留痕、关键风险（客服链路遗留问题）未完全收口即进入下一阶段的情况，可能导致信息不同步和风险延续。 | statement:MTG-CASE-04-04-STM-1 (MTG-CASE-04-04) 原文: 前几天对字段问题的处理还是慢了。<br>calendar:cal_case04_evt_0418_offline (2026-04-18T11:45:00+08:00) 原文: 阶段评审前线下沟通补录 attendees=陈昊,林玥,沈薇,唐可<br>NO.206<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |

## Risk Flags

| Flag ID | Type | Severity | Confidence | Human Review | Summary | Evidence / Original Excerpts |
| --- | --- | --- | --- | --- | --- | --- |
| RF-001 | risk_governance | high | 0.9 | true | 高风险PJT-CASE-04-RISK-02（退款回写高峰场景尾延迟）在阶段复盘时仍处于tracking状态，治理动作未闭环。 | base_risk:PJT-CASE-04-RISK-02 (MTG-CASE-04-03) 原文: 退款回写高峰场景尾延迟 level=high followup_status=tracking suggested_action=继续跟踪长尾点并补充压测结论到文档<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| RF-002 | risk_governance | medium | 0.8 | true | 流程风险PJT-CASE-04-RISK-06（线下结论未及时留痕）被识别后，虽有suggested_action但状态仍为tracking，治理效果待观察。 | base_risk:PJT-CASE-04-RISK-06 (MTG-CASE-04-03) 原文: 线下结论未及时留痕 level=medium followup_status=tracking suggested_action=把补录结论同步进评审纪要并保留缺失说明<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| BF-001 | behavior_observation | medium | 0.7 | true | 管理者在群聊中多次使用包含“必须”、“给我”、“不能继续”等关键词的指令性语言，构成高压推进语言观察样本。 | chat:om_case04msg0007 (2026-04-15 16:16) 原文: 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。<br>chat:om_case04msg0014 (2026-04-19 10:44) 原文: 12 点前给我 go/no-go 输入，不要等到晚上才决定。 |
| BF-002 | behavior_observation | low | 0.6 | true | 存在会后成员反馈复盘语气带来压力的记录，但未形成正式事件，需作为行为观察项记录。 | base_risk:PJT-CASE-04-RISK-10 (MTG-CASE-04-04) 原文: 复盘沟通语气引发成员压力 level=low followup_status=record_only suggested_action=仅记录该反馈，不扩写为正式结论<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |

## Capability Scores

| Dimension | Score | Confidence | Basis | Metric Evidence | Finding Evidence | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | 8 | 0.8 | 结合专家finding：专项执行期间持续强调并坚守核心目标与范围（strength, confidence 0.9），复盘会议中基于目标校验成果并提出机制化改进方向（observation, confidence 0.7）。硬指标‘会议决策留痕覆盖率’为1，表明所有会议均有决策留痕，支持方向校准的留痕习惯。 | hard_metric:meeting_decision_coverage_rate (2026-05-04T16:24:36.430Z) 原文: 会议决策留痕覆盖率: 4 / 4 = 1; value = meetings_with_decision_trace / total_meetings | management_reviewer_result.dimension_findings<br>0<br>management_reviewer_result.dimension_findings<br>1 | 当前会议缺少完整妙记转写，对复盘会议中校准过程的细节和语境判断有限，导致置信度降低。<br>专家finding中存在‘missing_context’风险标签。 |
| 推进闭环力 | 5 | 0.7 | 结合专家finding：会议行动项与任务表严重脱节（3 vs 9）导致闭环源头混乱（risk, confidence 0.95）；任务延期率25%且部分延期任务闭环处理不彻底（risk, confidence 0.85）；但能从问题中提炼机制化改进动作（strength, confidence 0.8）。硬指标‘任务延期率’为0.25，‘任务关闭率’为0.7，‘当前会议行动项入表率’anomaly指出数量不一致。 | hard_metric:task_overdue_rate (2026-05-04T16:24:36.430Z) 原文: 任务延期率: 5 / 20 = 0.25; value = overdue_tasks / tasks_with_due_date<br>hard_metric:task_closure_rate (2026-05-04T16:24:36.430Z) 原文: 任务关闭率: 14 / 20 = 0.7; value = closed_tasks / total_tasks<br>hard_metric:current_meeting_action_task_rate (2026-05-04T16:24:36.430Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count | management_reviewer_result.dimension_findings<br>2<br>management_reviewer_result.dimension_findings<br>3<br>management_reviewer_result.dimension_findings<br>4 | 会议行动项与任务表严重不一致（3 vs 9），闭环源头存在断裂或混乱，导致评分显著降低。<br>对于转入下一阶段的遗留项，缺乏明确的下一步行动项（owner, DDL, 动作），闭环不彻底。 |
| 风险治理力 | 6 | 0.7 | 结合专家finding：高等级风险未完全收口、整体未收口占比较高及同类风险复发，表明风险治理闭环执行存在不足（observations, confidence 0.7）。硬指标‘高等级风险收口率’为0.6667，‘风险未收口占比’为0.6，‘同类风险复发样本数’为3（交付风险复发）。 | hard_metric:high_risk_resolution_rate (2026-05-04T16:24:36.430Z) 原文: 高等级风险收口率: 2 / 3 = 0.6667; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-04T16:24:36.430Z) 原文: 风险未收口占比: 6 / 10 = 0.6; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-04T16:24:36.430Z) 原文: 同类风险复发样本数: 3 = 3; value = sum(count(risk_type) where count(risk_type) > 1) | risk_behavior_auditor_result.dimension_findings<br>0<br>risk_behavior_auditor_result.dimension_findings<br>1<br>risk_behavior_auditor_result.dimension_findings<br>2 | 当前会议缺少完整妙记转写，影响对风险讨论语境的准确判断，导致置信度降低。<br>存在高风险未收口及同类风险复发的情况，表明风险治理的闭环执行存在不足。 |
| 协同调度力 | 7 | 0.8 | 结合专家finding：能通过即时通讯明确范围、推动解决依赖阻塞，且会议覆盖了必要干系人（strength, confidence 0.9）；但存在线下沟通留痕不足和关键风险项未完全收口即转入下一阶段的风险（risk, confidence 0.8）。硬指标‘日历必要干系人覆盖率’为1，‘管理者聊天同步样本数’为7。 | hard_metric:calendar_stakeholder_coverage_rate (2026-05-04T16:24:36.430Z) 原文: 日历必要干系人覆盖率: 4 / 4 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events<br>hard_metric:manager_chat_signal_count (2026-05-04T16:24:36.430Z) 原文: 管理者聊天同步样本数: 7 = 7; value = manager_chat_messages_count | coordination_lens_result.dimension_findings<br>0<br>coordination_lens_result.dimension_findings<br>1 | 线下沟通留痕不足，存在信息不同步风险。<br>关键风险项转入下一阶段的跨团队同步充分性需要进一步复核。 |
| 组织行为健康度 | 6 | 0.4 | 基于专家finding和硬指标观察：管理者在群聊中多次使用高压推进语言（observation, confidence 0.7），并有会后成员反馈压力的记录（observation, confidence 0.6）。硬指标‘高压推进语言样本占比’为0.4286。由于组织行为判断高度依赖语境，且当前会议缺少完整转写，所有相关发现均为观察项并需人工复核，因此置信度大幅降低，评分仅反映观察到的潜在风险。 | hard_metric:high_pressure_language_sample_rate (2026-05-04T16:24:36.430Z) 原文: 高压推进语言样本占比: 3 / 7 = 0.4286; value = manager_messages_matching_pressure_keywords / manager_chat_messages | risk_behavior_auditor_result.dimension_findings<br>3<br>risk_behavior_auditor_result.risk_flags<br>2<br>risk_behavior_auditor_result.risk_flags<br>3 | 组织行为相关语言（高压推进、成员反馈压力）只能作为观察项，需人工确认语境和场景，因此置信度极低。<br>当前会议缺少完整妙记转写，进一步增加了对行为语境判断的不确定性。<br>硬指标‘高压推进语言样本占比’仅为规则命中样本，不直接等同组织行为结论。 |

| Overall Score | Confidence | Top Strengths | Top Risks | Summary |
| --- | --- | --- | --- | --- |
| 6 | 0.68 | 方向校准力：专项执行期间能持续聚焦核心目标并防止范围蔓延，复盘中能校验成果并推动机制沉淀。<br>协同调度力：能主动澄清范围、推动解决依赖阻塞，且会议覆盖了必要干系人。 | 推进闭环力：会议行动项与任务表严重脱节（3 vs 9），闭环源头混乱；面对25%的延期率，复盘会议对部分遗留问题的闭环处理不够彻底。<br>风险治理力：存在高等级风险未收口、整体未收口占比较高及同类风险复发的情况，风险治理闭环执行存在不足。<br>组织行为健康度：观察到管理者多次使用高压推进语言及成员反馈压力，需人工复核语境以确认对团队氛围的实际影响。 | 管理者陈昊在专项中展现出较强的方向校准和协同调度能力，能有效聚焦目标并推动解决阻塞。然而，在推进闭环和风险治理方面存在显著短板，表现为任务管理流程混乱、延期处理不彻底以及风险收口率低。组织行为方面观察到潜在风险信号，需结合语境进行人工复核。整体管理能力因闭环和治理环节的缺陷而受限。 |

## Report Observability

| Field | Value |
| --- | --- |
| Title | PJT-CASE-04专项阶段复盘（2026-04-13 ~ 2026-04-24）管理能力评估报告 |
| Type | weekly_report |
| Status | degraded |
| Human Review Items | 6 |
| Key Evidence | 4 |
| Risk Alerts | 4 |
| Next Actions | 4 |
| Base Writeback Keys | project_id, manager_id, evaluation_period, reporting_meeting_id, overall_score, overall_confidence, dimension_scores, top_strengths, top_improvement_areas, human_review_required, next_review_focus |

## Report Items With Evidence

| Section | # | Content | Evidence / Original Excerpts |
| --- | --- | --- | --- |
| score_overview | 1 | {"dimension":"方向校准力","score":8,"confidence":0.8,"evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case04msg0002","timestamp":"2026-04-13 09:16","excerpt":"今天先把本轮目标和边界说清楚，不在范围里的先别展开。","evidence_note":"项目启动时，管理者明确要求聚焦目标与边界，体现方向校准。"},{"source_type":"current_meeting","source_file":"current_meeting_facts","source_id":"MTG-CASE-04-04","timestamp":"2026-04-24 19:30 - 20:35","excerpt":"字段冻结表后续可沉淀为固定机制","evidence_note":"会议结论表明管理者从具体问题中提炼出机制化改进方向，进行方向校准。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"meeting_decision_coverage_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id: meeting_decision_coverage_rate, formula: value = meetings_with_decision_trace / total_meetings, calculation.expression: 4 / 4, value: 1。表明所有会议均有决策留痕，支持方向校准的留痕习惯。"}],"content":"方向校准力 8"} | chat:om_case04msg0002 (2026-04-13 09:16) 原文: 今天先把本轮目标和边界说清楚，不在范围里的先别展开。<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘<br>hard_metric:meeting_decision_coverage_rate (2026-05-04T16:24:36.430Z) 原文: 会议决策留痕覆盖率: 4 / 4 = 1; value = meetings_with_decision_trace / total_meetings |
| score_overview | 2 | {"dimension":"推进闭环力","score":5,"confidence":0.7,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"current_meeting_action_task_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_note":"metric_id: current_meeting_action_task_rate, formula: value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count, calculation.expression: 3 / 3, value: 1。指标anomalies明确指出数量不一致问题。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"task_overdue_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 0.25","evidence_note":"metric_id: task_overdue_rate, formula: value = overdue_tasks / tasks_with_due_date, calculation.expression: 5 / 20, value: 0.25。"},{"source_type":"current_meeting","source_file":"current_meeting_facts","source_id":"MTG-CASE-04-04","timestamp":"2026-04-24 19:30 - 20:35","excerpt":"客服链路遗留项进入下一阶段继续跟踪","evidence_note":"会议结论之一，虽然明确了遗留项转入下一阶段，但未体现具体的跟踪owner、新DDL或转入机制，闭环动作不完整。"}],"content":"推进闭环力 5"} | hard_metric:current_meeting_action_task_rate (2026-05-04T16:24:36.430Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_overdue_rate (2026-05-04T16:24:36.430Z) 原文: 任务延期率: 5 / 20 = 0.25; value = overdue_tasks / tasks_with_due_date<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| score_overview | 3 | {"dimension":"风险治理力","score":6,"confidence":0.7,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 2 / 3","evidence_note":"metric_id=high_risk_resolution_rate, formula=resolved_high_risks / total_high_risks, calculation.expression=2 / 3, value=0.6667。指标显示仍有1个高风险未收口。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 6 / 10","evidence_note":"metric_id=open_risk_rate, formula=open_or_tracking_risks / total_risks, calculation.expression=6 / 10, value=0.6。指标显示60%的风险未收口。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 3","evidence_note":"metric_id=repeated_risk_type_count, formula=sum(count(risk_type) where count(risk_type) > 1), calculation.expression=3, value=3。anomalies显示“交付风险:3”。"}],"content":"风险治理力 6"} | hard_metric:high_risk_resolution_rate (2026-05-04T16:24:36.430Z) 原文: 高等级风险收口率: 2 / 3 = 0.6667; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-04T16:24:36.430Z) 原文: 风险未收口占比: 6 / 10 = 0.6; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-04T16:24:36.430Z) 原文: 同类风险复发样本数: 3 = 3; value = sum(count(risk_type) where count(risk_type) > 1) |
| score_overview | 4 | {"dimension":"协同调度力","score":7,"confidence":0.8,"evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case04msg0007","timestamp":"2026-04-15 16:16","excerpt":"今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。","evidence_note":"管理者在字段口径阻塞时，明确要求定下责任方和截止时间，推动解决，体现协同调度力。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"calendar_stakeholder_coverage_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 1, expression = 4 / 4","evidence_note":"metric_id: calendar_stakeholder_coverage_rate, formula: value = calendar_events_with_required_stakeholders / total_calendar_events, calculation.expression: 4 / 4, value: 1。表明所有会议都覆盖了必要的干系人。"},{"source_type":"calendar","source_file":"06_calendar/calendar_events_instance_view.json","source_id":"cal_case04_evt_0418_offline","timestamp":"2026-04-18T11:45:00+08:00","excerpt":"阶段评审前线下沟通补录 attendees=陈昊,林玥,沈薇,唐可","evidence_note":"存在线下沟通事件，且备注‘线下沟通无完整录音，后续由吴恬补录摘要’，表明存在信息留痕风险。"}],"content":"协同调度力 7"} | chat:om_case04msg0007 (2026-04-15 16:16) 原文: 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。<br>hard_metric:calendar_stakeholder_coverage_rate (2026-05-04T16:24:36.430Z) 原文: 日历必要干系人覆盖率: 4 / 4 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events<br>calendar:cal_case04_evt_0418_offline (2026-04-18T11:45:00+08:00) 原文: 阶段评审前线下沟通补录 attendees=陈昊,林玥,沈薇,唐可 |
| score_overview | 5 | {"dimension":"组织行为健康度","score":6,"confidence":0.4,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_pressure_language_sample_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 3 / 7","evidence_note":"metric_id=high_pressure_language_sample_rate, formula=manager_messages_matching_pressure_keywords / manager_chat_messages, calculation.expression=3 / 7, value=0.4286。指标显示42.86%的管理者消息命中高压关键词。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case04msg0007","timestamp":"2026-04-15 16:16","excerpt":"今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。","evidence_note":"管理者陈昊在群聊中使用高压推进语言示例。此为观察项，需人工复核语境。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"PJT-CASE-04-RISK-10","timestamp":"MTG-CASE-04-04","excerpt":"复盘沟通语气引发成员压力 followup_status=record_only","evidence_note":"风险记录显示有成员反馈压力，但仅记录。此为观察项，需人工复核上下文。"}],"content":"组织行为健康度 6"} | hard_metric:high_pressure_language_sample_rate (2026-05-04T16:24:36.430Z) 原文: 高压推进语言样本占比: 3 / 7 = 0.4286; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case04msg0007 (2026-04-15 16:16) 原文: 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。<br>base_risk:PJT-CASE-04-RISK-10 (MTG-CASE-04-04) 原文: 复盘沟通语气引发成员压力 level=low followup_status=record_only suggested_action=仅记录该反馈，不扩写为正式结论 |
| key_evidence | 1 | {"evidence_type":"strength","description":"方向校准力：专项启动时明确要求聚焦目标与边界，复盘时能提炼机制化改进方向。","evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case04msg0002","timestamp":"2026-04-13 09:16","excerpt":"今天先把本轮目标和边界说清楚，不在范围里的先别展开。","evidence_note":"项目启动时明确聚焦目标与边界。"},{"source_type":"current_meeting","source_file":"current_meeting_facts","source_id":"MTG-CASE-04-04","timestamp":"2026-04-24 19:30 - 20:35","excerpt":"字段冻结表后续可沉淀为固定机制","evidence_note":"复盘会议中从具体问题提炼机制化改进方向。"}],"content":"方向校准力：专项启动时明确要求聚焦目标与边界，复盘时能提炼机制化改进方向。"} | chat:om_case04msg0002 (2026-04-13 09:16) 原文: 今天先把本轮目标和边界说清楚，不在范围里的先别展开。<br>base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| key_evidence | 2 | {"evidence_type":"strength","description":"协同调度力：能主动通过即时通讯推动解决依赖阻塞，且会议覆盖了必要干系人。","evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case04msg0007","timestamp":"2026-04-15 16:16","excerpt":"今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。","evidence_note":"管理者在字段口径阻塞时，明确要求定下责任方和截止时间，推动解决。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"calendar_stakeholder_coverage_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 1, expression = 4 / 4","evidence_note":"metric_id: calendar_stakeholder_coverage_rate, calculation.expression: 4 / 4, value: 1。表明所有会议都覆盖了必要的干系人。"}],"content":"协同调度力：能主动通过即时通讯推动解决依赖阻塞，且会议覆盖了必要干系人。"} | chat:om_case04msg0007 (2026-04-15 16:16) 原文: 今天 5 点前必须统一一版口径，谁负责适配今天就定下来，不能继续空转。<br>hard_metric:calendar_stakeholder_coverage_rate (2026-05-04T16:24:36.430Z) 原文: 日历必要干系人覆盖率: 4 / 4 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events |
| key_evidence | 3 | {"evidence_type":"risk","description":"推进闭环力：会议行动项（3条）与任务表关联项（9条）严重脱节，且存在25%的任务延期率。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"current_meeting_action_task_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_note":"metric_id: current_meeting_action_task_rate, anomalies字段明确指出该不一致问题。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"task_overdue_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 0.25","evidence_note":"metric_id: task_overdue_rate, calculation.expression: 5 / 20, value: 0.25。"}],"content":"推进闭环力：会议行动项（3条）与任务表关联项（9条）严重脱节，且存在25%的任务延期率。"} | hard_metric:current_meeting_action_task_rate (2026-05-04T16:24:36.430Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_overdue_rate (2026-05-04T16:24:36.430Z) 原文: 任务延期率: 5 / 20 = 0.25; value = overdue_tasks / tasks_with_due_date |
| key_evidence | 4 | {"evidence_type":"risk","description":"风险治理力：存在高等级风险未收口（收口率66.67%）、整体60%风险未收口及同类风险复发（交付风险复发3次）的情况。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 2 / 3","evidence_note":"metric_id=high_risk_resolution_rate, calculation.expression=2 / 3, value=0.6667。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 6 / 10","evidence_note":"metric_id=open_risk_rate, calculation.expression=6 / 10, value=0.6。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 3","evidence_note":"metric_id=repeated_risk_type_count, calculation.expression=3, value=3。anomalies显示“交付风险:3”。"}],"content":"风险治理力：存在高等级风险未收口（收口率66.67%）、整体60%风险未收口及同类风险复发（交付风险复发3次）的情况。"} | hard_metric:high_risk_resolution_rate (2026-05-04T16:24:36.430Z) 原文: 高等级风险收口率: 2 / 3 = 0.6667; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-04T16:24:36.430Z) 原文: 风险未收口占比: 6 / 10 = 0.6; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-04T16:24:36.430Z) 原文: 同类风险复发样本数: 3 = 3; value = sum(count(risk_type) where count(risk_type) > 1) |
| risk_alerts | 1 | {"risk_level":"high","description":"推进闭环流程混乱：会议行动项与任务表严重脱节（3 vs 9），闭环源头断裂，可能导致任务跟踪失效和权责不清。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"current_meeting_action_task_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_note":"metric_id: current_meeting_action_task_rate, anomalies字段明确指出该不一致问题。"}],"content":"推进闭环流程混乱：会议行动项与任务表严重脱节（3 vs 9），闭环源头断裂，可能导致任务跟踪失效和权责不清。"} | hard_metric:current_meeting_action_task_rate (2026-05-04T16:24:36.430Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count |
| risk_alerts | 2 | {"risk_level":"high","description":"风险治理闭环不足：存在高等级风险未收口（如PJT-CASE-04-RISK-02状态为tracking），且同类交付风险复发3次，表明风险识别后的治理动作未有效闭环。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 2 / 3","evidence_note":"metric_id=high_risk_resolution_rate, calculation.expression=2 / 3, value=0.6667。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 3","evidence_note":"metric_id=repeated_risk_type_count, calculation.expression=3, value=3。anomalies显示“交付风险:3”。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"PJT-CASE-04-RISK-02","timestamp":"MTG-CASE-04-03","excerpt":"退款回写高峰场景尾延迟 followup_status=tracking","evidence_note":"高风险PJT-CASE-04-RISK-02状态为tracking，未收口。"}],"content":"风险治理闭环不足：存在高等级风险未收口（如PJT-CASE-04-RISK-02状态为tracking），且同类交付风险复发3次，表明风险识别后的治理动作未有效闭环。"} | hard_metric:high_risk_resolution_rate (2026-05-04T16:24:36.430Z) 原文: 高等级风险收口率: 2 / 3 = 0.6667; value = resolved_high_risks / total_high_risks<br>hard_metric:repeated_risk_type_count (2026-05-04T16:24:36.430Z) 原文: 同类风险复发样本数: 3 = 3; value = sum(count(risk_type) where count(risk_type) > 1)<br>base_risk:PJT-CASE-04-RISK-02 (MTG-CASE-04-03) 原文: 退款回写高峰场景尾延迟 level=high followup_status=tracking suggested_action=继续跟踪长尾点并补充压测结论到文档 |
| risk_alerts | 3 | {"risk_level":"medium","description":"关键风险项跨阶段同步风险：复盘会议决定“客服链路遗留项进入下一阶段继续跟踪”，但缺乏明确的跨团队同步证据，存在信息断层风险。","evidence_refs":[{"source_type":"current_meeting","source_file":"current_meeting_facts","source_id":"MTG-CASE-04-04","timestamp":"2026-04-24 19:30 - 20:35","excerpt":"客服链路遗留项进入下一阶段继续跟踪","evidence_note":"关键风险项的处置决策，需要确认是否已有效同步给所有相关方。"}],"content":"关键风险项跨阶段同步风险：复盘会议决定“客服链路遗留项进入下一阶段继续跟踪”，但缺乏明确的跨团队同步证据，存在信息断层风险。"} | base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| risk_alerts | 4 | {"risk_level":"medium","description":"组织行为观察项：管理者在群聊中多次使用高压推进语言（样本占比42.86%），并有成员反馈压力的记录，需人工复核具体语境以评估对团队氛围的实际影响。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_pressure_language_sample_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 3 / 7","evidence_note":"metric_id=high_pressure_language_sample_rate, calculation.expression=3 / 7, value=0.4286。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"PJT-CASE-04-RISK-10","timestamp":"MTG-CASE-04-04","excerpt":"复盘沟通语气引发成员压力 followup_status=record_only","evidence_note":"风险记录显示有成员反馈压力，但仅记录。此为观察项，需人工复核上下文。"}],"content":"组织行为观察项：管理者在群聊中多次使用高压推进语言（样本占比42.86%），并有成员反馈压力的记录，需人工复核具体语境以评估对团队氛围的实际影响。"} | hard_metric:high_pressure_language_sample_rate (2026-05-04T16:24:36.430Z) 原文: 高压推进语言样本占比: 3 / 7 = 0.4286; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>base_risk:PJT-CASE-04-RISK-10 (MTG-CASE-04-04) 原文: 复盘沟通语气引发成员压力 level=low followup_status=record_only suggested_action=仅记录该反馈，不扩写为正式结论 |
| next_actions | 1 | {"action":"复核并修正任务管理流程：明确会议行动项与Base任务表的映射规则，确保会后的任务扩展或调整有明确的留痕和审批流程。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"current_meeting_action_task_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_note":"metric_id: current_meeting_action_task_rate, anomalies字段明确指出该不一致问题。"}],"content":"复核并修正任务管理流程：明确会议行动项与Base任务表的映射规则，确保会后的任务扩展或调整有明确的留痕和审批流程。"} | hard_metric:current_meeting_action_task_rate (2026-05-04T16:24:36.430Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count |
| next_actions | 2 | {"action":"制定高风险及遗留风险专项收口计划：针对未收口的高风险（如PJT-CASE-04-RISK-02）和60%的未收口风险，制定明确的收口时间表、责任人和验收标准。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 2 / 3","evidence_note":"metric_id=high_risk_resolution_rate, calculation.expression=2 / 3, value=0.6667。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-04-13 ~ 2026-04-24","excerpt":"value = 6 / 10","evidence_note":"metric_id=open_risk_rate, calculation.expression=6 / 10, value=0.6。"}],"content":"制定高风险及遗留风险专项收口计划：针对未收口的高风险（如PJT-CASE-04-RISK-02）和60%的未收口风险，制定明确的收口时间表、责任人和验收标准。"} | hard_metric:high_risk_resolution_rate (2026-05-04T16:24:36.430Z) 原文: 高等级风险收口率: 2 / 3 = 0.6667; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-04T16:24:36.430Z) 原文: 风险未收口占比: 6 / 10 = 0.6; value = open_or_tracking_risks / total_risks |
| next_actions | 3 | {"action":"完善跨阶段事项交接机制：针对“客服链路遗留项进入下一阶段”的决策，补充跨团队同步的留痕（如会议纪要确认、任务交接文档），并明确下一阶段的跟踪要素（owner、新DDL、验收标准）。","evidence_refs":[{"source_type":"current_meeting","source_file":"current_meeting_facts","source_id":"MTG-CASE-04-04","timestamp":"2026-04-24 19:30 - 20:35","excerpt":"客服链路遗留项进入下一阶段继续跟踪","evidence_note":"关键风险项的处置决策，需要确认是否已有效同步给所有相关方。"}],"content":"完善跨阶段事项交接机制：针对“客服链路遗留项进入下一阶段”的决策，补充跨团队同步的留痕（如会议纪要确认、任务交接文档），并明确下一阶段的跟踪要素（owner、新DDL、验收标准）。"} | base_record:MTG-CASE-04-04 (2026-04-24 19:30 - 20:35) 原文: 专项阶段复盘 |
| next_actions | 4 | {"action":"结合人工复核结果，审视沟通方式：待HR-002等人审项完成后，评估高压推进语言的使用场景和团队反馈，必要时调整沟通策略。","evidence_refs":[{"source_type":"human_review_items","source_file":"capability_assessor_result","source_id":"HR-002","timestamp":"N/A","excerpt":"组织行为相关语言（高压推进、成员反馈压力）只能作为观察项，需人工确认语境和场景。","evidence_note":"待人工复核完成后，根据结论制定相应改进动作。"}],"content":"结合人工复核结果，审视沟通方式：待HR-002等人审项完成后，评估高压推进语言的使用场景和团队反馈，必要时调整沟通策略。"} | HR-002 |

# Case 05 全链路可观测报告

文档生成时间：2026-05-06T10:02:16.624Z
运行结束时间：2026-05-06T10:02:16.597Z

## 运行概览

说明：本节用于快速查看本次运行的业务上下文、整体状态，以及上下游结果是否完整。

| 字段 | 值 |
| --- | --- |
| 项目 ID | PJT-CASE-05 |
| 管理者 ID | MGR-CASE-05 |
| 会议 ID | MTG-CASE-05-03 |
| 评估周期 | 2026-01-01 ~ 2026-04-24 |
| 编排状态 | 正常 |
| 完整性状态 | 正常 |
| 能力评估状态 | 降级 |
| 报告状态 | 降级 |
| 能力评估缺失上游 | 无 |
| 报告缺失上游 | 无 |

## 运行时观测

说明：本节关注整轮运行和主要节点的耗时、状态、是否调用模型以及错误信息。

| 节点 | 状态 | 耗时（毫秒） | 是否调用模型 | 错误信息 |
| --- | --- | --- | --- | --- |
| Run Total | 已完成 | 650348 | true |  |
| Front Pipeline | 已采集/就绪 | 446 | false |  |
| Hard Metrics | 就绪 | 2 | false |  |
| Evaluation Planner | full_evaluation | 1 | false |  |
| 管理评审专家 | 正常 | 92467 | true |  |
| 风险与行为审计专家 | 正常 | 148507 | true |  |
| 协同视角专家 | 正常 | 83592 | true |  |
| 能力评估专家 | 降级 | 208451 | true |  |
| 报告生成器 | 降级 | 292891 | true |  |

## 节点观测

说明：本节逐个节点说明主要产物和关键计数，便于判断每个模块到底产出了什么、规模有多大。

| 节点 | 状态 | 主要产物 | 关键计数 |
| --- | --- | --- | --- |
| 主编排器 | 已采集 | orchestration_state.json | 阻塞原因=0, 降级原因=0 |
| 输入完整性检查 | 就绪 | input_completeness_report.json | 可用来源=7, 缺失来源=0, 阻塞原因=0 |
| 数据采集器 | 就绪 | raw_payload/history_bundle/meeting_fact_pack/data_quality_report | 数据源=7, 告警=2, 问题=0 |
| 硬指标引擎 | 就绪 | hard_metrics_result.json | 指标=15, 正常=15, 降级=0, 无样本=0 |
| 评估规划器 | full_evaluation | evaluation_plan.json | 聚焦维度=5, 专家=5, 人工复核规则=5 |
| 管理评审专家 | 就绪 | management_reviewer_result.json | 请求指标=7, 结论=3, 人工复核=2 |
| 风险与行为审计专家 | 就绪 | risk_behavior_auditor_result.json | 请求指标=6, 结论=4, 风险标记=3, 人工复核=2 |
| 协同视角专家 | 就绪 | coordination_lens_result.json | 请求指标=2, 结论=3, 人工复核=1 |
| 能力评估专家 | 降级 | capability_assessor_result.json | 请求指标=15, 评分=5, 人工复核=5 |
| 报告生成器 | 降级 | report_result.json | 人工复核=5, 关键证据=3, 风险提醒=3, 下一步动作=4 |

## 数据源覆盖

说明：本节展示本次评估依赖了哪些数据源、是否必需、是否拿到以及样本量多少。

| 数据源 | 是否必需 | 状态 | 样本数 | 文件 | 备注 |
| --- | --- | --- | --- | --- | --- |
| Base 记录 | true | 正常 | 48 | 03_task_risk_register/base_projects_record_list.json<br>03_task_risk_register/base_tasks_record_list.json<br>03_task_risk_register/base_risks_record_list.json<br>04_meetings/base_meetings_record_list.json<br>04_meetings/base_statements_record_list.json |  |
| Base 历史 | false | 正常 | 8 | 03_task_risk_register/base_record_history_list.json |  |
| 云文档 | true | 正常 | 1 | 01_cloud_docs/docs_fetch_main_doc_v2.json |  |
| 聊天历史 | false | 正常 | 50 | 02_chats/im_chat_search_user.json<br>02_chats/im_messages_search_user.json |  |
| 会议/妙记 | true | 正常 | 13 | 04_meetings/base_meetings_record_list.json<br>04_meetings/minutes_search_user.json<br>04_meetings/minutes_transcript_case05.json<br>04_meetings/vc_search_by_participant.json | 当前会议没有完整妙记转写，只能依赖会议表和其他留痕 |
| 日历 | false | 正常 | 3 | 06_calendar/calendar_events_instance_view.json |  |
| 通讯录 | false | 正常 | 5 | 05_org_and_team/contact_get_user_user.json<br>05_org_and_team/contact_search_user_project_members.json |  |

## 数据样本计数

说明：本节用于快速查看不同对象层面的样本规模，便于判断分析结论是否建立在足够的数据量之上。

| 对象 | 数量 |
| --- | --- |
| Base history records | 8 |
| Meeting docs | 3 |
| Project docs | 3 |
| Chat messages | 50 |
| Calendar events | 3 |
| Org contacts | 5 |
| Source catalog | 7 |
| Current meeting tasks | 2 |
| History recent meetings | 2 |
| History risk records | 8 |
| Meeting action items | 2 |
| Meeting decisions | 3 |
| Meeting risks mentioned | 3 |
| Provenance refs | 9 |

## 数据质量告警

说明：本节列出上游数据本身的质量风险，例如样本缺失、留痕不足或只有摘要没有原文。

- 当前会议没有完整妙记转写，当前会议事实将更多依赖会议表和 Statements。
- 历史会议中存在 summary_only 样本，历史复核时需降低留痕置信度。

## 硬指标结果

说明：本节展示可计算指标的结果、公式、状态和异常样本，是后续专家判断的重要量化输入。

| 维度 | 指标 ID | 指标名称 | 公式 | 计算过程 | 值 | 单位 | 状态 | 异常样本 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | meeting_decision_coverage_rate | 会议决策留痕覆盖率 | value = meetings_with_decision_trace / total_meetings | 3 / 3 | 1 | ratio | 正常 |  |
| 推进闭环力 | task_definition_completeness_rate | 任务定义完整率 | value = tasks_with_task_name_owner_due_date / total_tasks | 30 / 30 | 1 | ratio | 正常 |  |
| 推进闭环力 | task_overdue_rate | 任务延期率 | value = overdue_tasks / tasks_with_due_date | 0 / 30 | 0 | ratio | 正常 |  |
| 推进闭环力 | task_closure_rate | 任务关闭率 | value = closed_tasks / total_tasks | 13 / 30 | 0.4333 | ratio | 正常 |  |
| 推进闭环力 | closed_task_quality_rate | 任务关闭质量代理指标 | value = qualified_closed_tasks / closed_tasks | 13 / 13 | 1 | ratio | 正常 |  |
| 推进闭环力 | current_meeting_action_task_rate | 当前会议行动项入表率 | value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count | 2 / 3 | 0.6667 | ratio | 正常 | 会议行动项 3 条，任务表命中 2 条 |
| 推进闭环力 | meeting_action_item_coverage_rate | 会议行动项留痕覆盖率 | value = meetings_with_action_item_count_gt_0 / total_meetings | 3 / 3 | 1 | ratio | 正常 |  |
| 风险治理力 | high_risk_resolution_rate | 高等级风险收口率 | value = resolved_high_risks / total_high_risks | 0 / 2 | 0 | ratio | 正常 |  |
| 风险治理力 | risk_mitigation_action_rate | 风险缓释动作覆盖率 | value = risks_with_suggested_action / total_risks | 5 / 5 | 1 | ratio | 正常 |  |
| 风险治理力 | open_risk_rate | 风险未收口占比 | value = open_or_tracking_risks / total_risks | 5 / 5 | 1 | ratio | 正常 | NO.601 open<br>NO.602 open<br>NO.603 open<br>NO.604 open<br>NO.605 tracking |
| 风险治理力 | repeated_risk_type_count | 同类风险复发样本数 | value = sum(count(risk_type) where count(risk_type) > 1) | 2 | 2 | count | 正常 | 供应链:2 |
| 协同调度力 | calendar_stakeholder_coverage_rate | 日历必要干系人覆盖率 | value = calendar_events_with_required_stakeholders / total_calendar_events | 3 / 3 | 1 | ratio | 正常 |  |
| 协同调度力 | manager_chat_signal_count | 管理者聊天同步样本数 | value = manager_chat_messages_count | 25 | 25 | count | 正常 |  |
| 组织行为健康度 | late_night_manager_message_rate | 管理者非常规时段消息占比 | value = manager_messages_between_22_00_and_08_00 / manager_chat_messages | 0 / 25 | 0 | ratio | 正常 |  |
| 组织行为健康度 | high_pressure_language_sample_rate | 高压推进语言样本占比 | value = manager_messages_matching_pressure_keywords / manager_chat_messages | 1 / 25 | 0.04 | ratio | 正常 | 2026-04-21 09:15 本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。 |

## 指标公式明细

说明：本节补充每个指标的分子、分母、取值规则和样本口径，方便复核计算逻辑。

| 指标 ID | 分子定义 | 分母定义 | 取值规则 | 样本口径 |
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

## 指标证据与原文摘录

说明：本节把硬指标追溯回原始证据，便于确认指标是否真的由对应样本支撑。

| 指标 ID | 来源类型 | 来源文件 | 来源 ID | 时间 | 可读证据 | 原文摘录 |
| --- | --- | --- | --- | --- | --- | --- |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-05-01 | 2026-04-21 09:15 - 10:30 | MTG-CASE-05-01 V1.5迭代同步会 | 外观冻结本周完成 \| 门锁防水方案5月5日前输出 \| 成本上升15%由设计效果优先覆盖 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-05-02 | 2026-04-22 10:30 - 11:45 | MTG-CASE-05-02 供应商模具评审会 | 同步调整拔模角度压缩返工周期 \| 预算问题单独与财务沟通 \| 林峰跟进供应商排期 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-05-03 | 2026-04-24 09:00 - 09:45 | MTG-CASE-05-03 供应链风险应急沟通 | 协调供应链总监争取插队 \| 同步评估供应商C打样能力 \| 周牧单独跟进不占用群资源 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.501 | 2026-04-05 | NO.501 智能音箱概念设计稿输出 | 智能音箱概念设计稿输出 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.502 | 2026-04-05 | NO.502 扫地机器人概念设计稿输出 | 扫地机器人概念设计稿输出 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.503 | 2026-04-08 | NO.503 智能门锁概念设计稿输出 | 智能门锁概念设计稿输出 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.504 | 2026-04-10 | NO.504 概念设计评审会组织 | 概念设计评审会组织 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.505 | 2026-04-15 | NO.505 品牌颜色方案调整 | 品牌颜色方案调整 |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.501 | 2026-04-05 | NO.501 智能音箱概念设计稿输出 | 智能音箱概念设计稿输出 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.502 | 2026-04-05 | NO.502 扫地机器人概念设计稿输出 | 扫地机器人概念设计稿输出 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.503 | 2026-04-08 | NO.503 智能门锁概念设计稿输出 | 智能门锁概念设计稿输出 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.504 | 2026-04-10 | NO.504 概念设计评审会组织 | 概念设计评审会组织 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.505 | 2026-04-15 | NO.505 品牌颜色方案调整 | 品牌颜色方案调整 status=已完成 is_closed=true |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.501 | 2026-04-05 | NO.501 智能音箱概念设计稿输出 | 智能音箱概念设计稿输出 close_duration=3 source_meeting_id=MTG-CASE-05-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.502 | 2026-04-05 | NO.502 扫地机器人概念设计稿输出 | 扫地机器人概念设计稿输出 close_duration=3 source_meeting_id=MTG-CASE-05-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.503 | 2026-04-08 | NO.503 智能门锁概念设计稿输出 | 智能门锁概念设计稿输出 close_duration=5 source_meeting_id=MTG-CASE-05-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.504 | 2026-04-10 | NO.504 概念设计评审会组织 | 概念设计评审会组织 close_duration=2 source_meeting_id=MTG-CASE-05-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.505 | 2026-04-15 | NO.505 品牌颜色方案调整 | 品牌颜色方案调整 close_duration=4 source_meeting_id=MTG-CASE-05-02 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.508 | 2026-04-20 | NO.508 供应商B打样评估 | 供应商B打样评估 source_meeting_id=MTG-CASE-05-03 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.522 | 2026-04-20 | NO.522 声学团队散热孔位置确认 | 声学团队散热孔位置确认 source_meeting_id=MTG-CASE-05-03 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-05-01 | 2026-04-21 09:15 - 10:30 | MTG-CASE-05-01 V1.5迭代同步会 | V1.5迭代同步会 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-05-02 | 2026-04-22 10:30 - 11:45 | MTG-CASE-05-02 供应商模具评审会 | 供应商模具评审会 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-05-03 | 2026-04-24 09:00 - 09:45 | MTG-CASE-05-03 供应链风险应急沟通 | 供应链风险应急沟通 action_item_count=3 |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.601 | MTG-CASE-05-02 | NO.601 high open | 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 followup_status=open |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.602 | MTG-CASE-05-01 | NO.602 high open | 智能门锁防水等级从IPX4提升至IPX6，外观开口需重新设计 followup_status=open |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.601 | MTG-CASE-05-02 | NO.601 high open | 同步调整拔模角度压缩返工周期至4天 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.602 | MTG-CASE-05-01 | NO.602 high open | 评估密封圈+导流槽组合方案，5月5日前输出新方案 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.603 | MTG-CASE-05-03 | NO.603 medium open | 法务评估规避空间，调整底部轮廓线差异化设计 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.604 | MTG-CASE-05-03 | NO.604 medium open | 协调供应链总监争取插队，同步评估供应商C打样能力 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.605 | MTG-CASE-05-02 | NO.605 low tracking | 设计效果优先，预算问题单独与财务沟通 |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.601 | MTG-CASE-05-02 | NO.601 high open | 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 followup_status=open |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.602 | MTG-CASE-05-01 | NO.602 high open | 智能门锁防水等级从IPX4提升至IPX6，外观开口需重新设计 followup_status=open |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.603 | MTG-CASE-05-03 | NO.603 medium open | 竞品发布相似外观方案，存在专利侵权风险 followup_status=open |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.604 | MTG-CASE-05-03 | NO.604 medium open | 核心注塑供应商Q2产能饱和，模具排期可能延后10天 followup_status=open |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.605 | MTG-CASE-05-02 | NO.605 low tracking | ID曲面导致模具成本上升15% followup_status=tracking |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.601 | MTG-CASE-05-02 | NO.601 high open | 供应链: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.602 | MTG-CASE-05-01 | NO.602 high open | 认证变更: 智能门锁防水等级从IPX4提升至IPX6，外观开口需重新设计 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.603 | MTG-CASE-05-03 | NO.603 medium open | 知识产权: 竞品发布相似外观方案，存在专利侵权风险 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.604 | MTG-CASE-05-03 | NO.604 medium open | 供应链: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.605 | MTG-CASE-05-02 | NO.605 low tracking | 成本: ID曲面导致模具成本上升15% |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case05_evt_0421_sync | 2026-04-21T09:15:00+08:00 | cal_case05_evt_0421_sync V1.5迭代同步会 | V1.5迭代同步会 attendees=周牧,陈立,林峰,赵雪,张悦 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case05_evt_0422_tech | 2026-04-22T10:30:00+08:00 | cal_case05_evt_0422_tech 供应商模具评审会 | 供应商模具评审会 attendees=周牧,林峰,陈立 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case05_evt_0424_emergency | 2026-04-24T09:00:00+08:00 | cal_case05_evt_0424_emergency 供应链风险应急沟通 | 供应链风险应急沟通 attendees=周牧,林峰 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case05msg0002 | 2026-04-01 09:15 | 周牧 2026-04-01 09:15 | 4月项目启动，本周重点是完成智能音箱和扫地机器人的概念设计评审。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case05msg0003 | 2026-04-01 09:20 | 周牧 2026-04-01 09:20 | 概念设计稿我已经发到云文档了，大家看一下有没有问题。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case05msg0005 | 2026-04-01 10:35 | 周牧 2026-04-01 10:35 | 收到，我调整一下底部轮廓线，增加差异化。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case05msg0007 | 2026-04-02 14:05 | 周牧 2026-04-02 14:05 | 我和声学团队确认一下，如果影响比较大就调整散热孔位置。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case05msg0009 | 2026-04-03 09:05 | 周牧 2026-04-03 09:05 | 高在哪里？是材料还是工艺？ |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case05msg0025 | 2026-04-21 09:15 | 周牧 2026-04-21 09:15 | 本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。 |

## 指标质量概览

说明：本节汇总硬指标层面的质量统计，例如总指标数、可用数、降级数和无样本数。

| 指标项 | 值 |
| --- | --- |
| sample_counts | {"task_count":30,"risk_count":5,"meeting_count":3,"chat_message_count":50,"calendar_event_count":3,"contact_count":5,"base_history_count":8} |
| metric_count | 15 |
| available_count | 15 |
| degraded_count | 0 |
| no_sample_count | 0 |

## 规划聚焦与人工复核规则

说明：本节说明规划器为什么聚焦这些维度、安排了哪些专家，以及哪些情况必须交给人工复核。

| 维度 | 优先级 | 原因 | 分配专家 |
| --- | --- | --- | --- |
| 方向校准力 | medium |  |  |
| 推进闭环力 | high |  |  |
| 风险治理力 | high |  |  |
| 协同调度力 | medium |  |  |
| 组织行为健康度 | high |  |  |

| 规则 ID | 严重性 | 原因 | 目标节点 |
| --- | --- | --- | --- |
| review_missing_current_transcript | medium | 当前会议缺完整妙记转写，关键语义判断需人工确认上下文。 | Management Reviewer, Risk & Behavior Auditor |
| review_behavior_language_context | medium | 组织行为相关语言只能作为观察项，需人工确认语境和场景。 | Risk & Behavior Auditor, Capability Assessor |
| review_unresolved_high_risks | high | 高等级风险未完全收口，风险治理结论需人工复核。 | Risk & Behavior Auditor |
| review_action_task_mapping | medium | 会议行动项 3 条，任务表命中 2 条 | Management Reviewer |
| review_data_quality_warnings | medium | 前链路数据质量报告存在 warning，后续结论需要保留置信度说明。 | Capability Assessor, Report Writer |

## 专家结论

说明：本节汇总各专家节点给出的主要判断，并附带原始证据或引用链路。

| 专家 | 序号 | 维度 | 类型 | 置信度 | 结论摘要 | 证据/原文摘录 |
| --- | --- | --- | --- | --- | --- | --- |
| 管理评审专家 | 1 | 方向校准力 | 观察项 | 0.7 | 管理者在应急会议中，针对供应链风险做出了清晰的优先级判断和决策，但缺乏对项目整体目标、范围及关键约束（如压缩开模周期）的明确校准。 | base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通<br>statement:MTG-CASE-05-03-STM-2 (MTG-CASE-05-03) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。<br>base_record:PJT-CASE-05 (2026-01-01) 原文: 2026年度智能家居产品线工业设计 |
| 管理评审专家 | 2 | 推进闭环力 | 优势 | 0.9 | 会议决策和行动项有明确的留痕，且历史任务定义完整、关闭质量高，延期率为零，体现了良好的任务定义和闭环基础。 | hard_metric:meeting_decision_coverage_rate (2026-05-06T09:51:26.700Z) 原文: 会议决策留痕覆盖率: 3 / 3 = 1; value = meetings_with_decision_trace / total_meetings<br>hard_metric:task_definition_completeness_rate (2026-05-06T09:51:26.700Z) 原文: 任务定义完整率: 30 / 30 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:task_overdue_rate (2026-05-06T09:51:26.700Z) 原文: 任务延期率: 0 / 30 = 0; value = overdue_tasks / tasks_with_due_date<br>hard_metric:closed_task_quality_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭质量代理指标: 13 / 13 = 1; value = qualified_closed_tasks / closed_tasks |
| 管理评审专家 | 3 | 推进闭环力 | 风险 | 0.8 | 当前会议的行动项未完全录入任务系统，存在闭环断裂风险；同时项目整体任务关闭率偏低，大量任务积压，需关注遗留项的推进和闭环。 | hard_metric:current_meeting_action_task_rate (2026-05-06T09:51:26.700Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks<br>base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通<br>base_record:PJT-CASE-05 (2026-01-01) 原文: 2026年度智能家居产品线工业设计 |
| 风险与行为审计专家 | 1 | 风险治理力 | 观察项 | 0.7 | 高等级风险收口率为0，两个高风险（NO.601, NO.602）在评估期内持续为open状态，未见有效治理动作使其收口。 | hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>base_risk:NO.602 (MTG-CASE-05-01) 原文: 智能门锁防水等级从IPX4提升至IPX6，外观开口需重新设计 level=high followup_status=open suggested_action=评估密封圈+导流槽组合方案，5月5日前输出新方案 |
| 风险与行为审计专家 | 2 | 风险治理力 | 观察项 | 0.7 | 风险未收口占比为1，所有5个风险在评估期内均未收口（4个open，1个tracking），风险治理闭环存在显著缺口。 | hard_metric:open_risk_rate (2026-05-06T09:51:26.700Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>base_risk:NO.603 (MTG-CASE-05-03) 原文: 竞品发布相似外观方案，存在专利侵权风险 level=medium followup_status=open suggested_action=法务评估规避空间，调整底部轮廓线差异化设计<br>base_risk:NO.604 (MTG-CASE-05-03) 原文: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 level=medium followup_status=open suggested_action=协调供应链总监争取插队，同步评估供应商C打样能力 |
| 风险与行为审计专家 | 3 | 风险治理力 | 观察项 | 0.7 | 存在供应链风险复发线索，风险类型“供应链”出现2次（NO.601, NO.604），表明此类风险未被根除。 | hard_metric:repeated_risk_type_count (2026-05-06T09:51:26.700Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1)<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>base_risk:NO.604 (MTG-CASE-05-03) 原文: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 level=medium followup_status=open suggested_action=协调供应链总监争取插队，同步评估供应商C打样能力 |
| 风险与行为审计专家 | 4 | 风险治理力 | 观察项 | 0.7 | 风险缓释动作覆盖率为1，所有风险均记录了建议动作，表明风险识别后能初步形成治理思路。 | hard_metric:risk_mitigation_action_rate (2026-05-06T09:51:26.700Z) 原文: 风险缓释动作覆盖率: 5 / 5 = 1; value = risks_with_suggested_action / total_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>base_risk:NO.604 (MTG-CASE-05-03) 原文: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 level=medium followup_status=open suggested_action=协调供应链总监争取插队，同步评估供应商C打样能力 |
| 协同视角专家 | 1 | 协同调度力 | 优势 | 0.9 | 管理者在群聊中主动同步关键信息、澄清依赖并指派任务，形成有效协同。 | chat:om_case05msg0002 (2026-04-01 09:15) 原文: 4月项目启动，本周重点是完成智能音箱和扫地机器人的概念设计评审。<br>chat:om_case05msg0007 (2026-04-02 14:05) 原文: 我和声学团队确认一下，如果影响比较大就调整散热孔位置。<br>chat:om_case05msg0017 (2026-04-07 15:10) 原文: 收到，赵雪你跟进一下CMF调整。 |
| 协同视角专家 | 2 | 协同调度力 | 优势 | 0.9 | 关键风险（专利侵权、供应商产能）在群聊中被识别并同步，管理者主动介入处理，形成解决路径。 | chat:om_case05msg0033 (2026-04-23 11:20) 原文: 竞品上周发布的新品外观和我们扫地机器人的方案很像，要不要评估专利风险？<br>chat:om_case05msg0034 (2026-04-23 11:25) 原文: 已经让法务在看了，初步判断有规避空间，但需要调整底部轮廓线。<br>chat:om_case05msg0035 (2026-04-24 09:00) 原文: 核心注塑供应商Q2订单饱和，我们的模具排期可能要延后。<br>chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |
| 协同视角专家 | 3 | 协同调度力 | 观察项 | 0.8 | 跨角色响应多为有效响应，包含信息确认、问题澄清或任务承接，而非简单“收到”。 | chat:om_case05msg0005 (2026-04-01 10:35) 原文: 收到，我调整一下底部轮廓线，增加差异化。<br>chat:om_case05msg0010 (2026-04-03 09:10) 原文: 主要是工艺，我们要求的曲面精度太高，需要五轴加工。<br>chat:om_case05msg0018 (2026-04-07 15:15) 原文: 好的，我本周内输出一版新方案。 |

## 风险标记

说明：本节专门列出被显式标记的风险事项，便于快速识别需要优先跟进的问题。

| 标记 ID | 类型 | 严重性 | 置信度 | 需人工复核 | 摘要 | 证据/原文摘录 |
| --- | --- | --- | --- | --- | --- | --- |
| RF-CASE-05-01 | risk_governance | 高 | 0.9 | 是 | 高等级风险治理失效：两个高风险（供应商工艺、认证变更）在评估期内未收口，且未见明确的升级或替代缓释动作记录。 | hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>base_risk:NO.602 (MTG-CASE-05-01) 原文: 智能门锁防水等级从IPX4提升至IPX6，外观开口需重新设计 level=high followup_status=open suggested_action=评估密封圈+导流槽组合方案，5月5日前输出新方案 |
| RF-CASE-05-02 | risk_governance | 中 | 0.85 | 是 | 供应链风险复发：项目出现两次供应链风险（NO.601模具返工，NO.604产能饱和），表明供应链成为项目脆弱环节，需关注系统性治理。 | hard_metric:repeated_risk_type_count (2026-05-06T09:51:26.700Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1)<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>base_risk:NO.604 (MTG-CASE-05-03) 原文: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 level=medium followup_status=open suggested_action=协调供应链总监争取插队，同步评估供应商C打样能力 |
| RF-CASE-05-03 | behavior_observation | 中 | 0.6 | 是 | 观察到管理者使用高压推进语言样本（命中关键词“必须”），但当前会议缺完整转写，需人工复核语境以判断是否为合理的工作指令或不当施压。 | hard_metric:high_pressure_language_sample_rate (2026-05-06T09:51:26.700Z) 原文: 高压推进语言样本占比: 1 / 25 = 0.04; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case05msg0025 (2026-04-21 09:15) 原文: 本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。<br>base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通 |

## 能力评分

说明：本节把硬指标和专家判断收敛为维度分数，并解释分数依据、证据和局限性。

| 维度 | 分数 | 置信度 | 评分依据 | 指标证据 | 专家结论证据 | 局限性 |
| --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | 60 | 0.6 | 会议决策留痕覆盖率（meetings_with_decision_trace / total_meetings）为1，表明会议决策有明确留痕。但专家发现管理者在应急会议中缺乏对项目整体目标（如开模周期压缩）的明确校准，存在目标校准缺失风险。 | hard_metric:meeting_decision_coverage_rate (2026-05-06T09:51:26.700Z) 原文: 会议决策留痕覆盖率: 3 / 3 = 1; value = meetings_with_decision_trace / total_meetings | expert_finding:management_reviewer_result.dimension_findings[0] (MTG-CASE-05-03) 原文: 管理者在应急会议中，针对供应链风险做出了清晰的优先级判断和决策，但缺乏对项目整体目标、范围及关键约束（如压缩开模周期）的明确校准。 | 当前会议缺完整妙记转写，关键语义判断需人工确认上下文，导致置信度降低。 |
| 推进闭环力 | 65 | 0.8 | 任务定义完整率（tasks_with_task_name_owner_due_date / total_tasks）为1，任务延期率为0，已关闭任务质量代理指标（qualified_closed_tasks / closed_tasks）为1，表明任务管理基础能力良好。但当前会议行动项入表率（min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count）为0.6667，且项目整体任务关闭率（closed_tasks / total_tasks）仅为0.4333，存在行动项遗漏和任务积压风险。 | hard_metric:task_definition_completeness_rate (2026-05-06T09:51:26.700Z) 原文: 任务定义完整率: 30 / 30 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:task_overdue_rate (2026-05-06T09:51:26.700Z) 原文: 任务延期率: 0 / 30 = 0; value = overdue_tasks / tasks_with_due_date<br>hard_metric:closed_task_quality_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭质量代理指标: 13 / 13 = 1; value = qualified_closed_tasks / closed_tasks<br>hard_metric:current_meeting_action_task_rate (2026-05-06T09:51:26.700Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks | expert_finding:management_reviewer_result.dimension_findings[1] (MTG-CASE-05-03) 原文: 会议决策和行动项有明确的留痕，且历史任务定义完整、关闭质量高，延期率为零，体现了良好的任务定义和闭环基础。<br>expert_finding:management_reviewer_result.dimension_findings[2] (MTG-CASE-05-03) 原文: 当前会议的行动项未完全录入任务系统，存在闭环断裂风险；同时项目整体任务关闭率偏低，大量任务积压，需关注遗留项的推进和闭环。 | 会议行动项与任务表关联数量不一致，存在闭环断裂风险，需人工复核。 |
| 风险治理力 | 40 | 0.8 | 风险缓释动作覆盖率（risks_with_suggested_action / total_risks）为1，表明风险识别后能形成治理思路。但高等级风险收口率（resolved_high_risks / total_high_risks）为0，风险未收口占比（open_or_tracking_risks / total_risks）为1，且同类风险复发样本数（sum(count(risk_type) where count(risk_type) > 1)）为2（供应链风险复发），表明风险治理闭环存在显著缺口，高等级风险治理失效。 | hard_metric:risk_mitigation_action_rate (2026-05-06T09:51:26.700Z) 原文: 风险缓释动作覆盖率: 5 / 5 = 1; value = risks_with_suggested_action / total_risks<br>hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-06T09:51:26.700Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T09:51:26.700Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1) | expert_finding:risk_behavior_auditor_result.dimension_findings[0] (MTG-CASE-05-03) 原文: 高等级风险收口率为0，两个高风险（NO.601, NO.602）在评估期内持续为open状态，未见有效治理动作使其收口。<br>expert_finding:risk_behavior_auditor_result.dimension_findings[1] (MTG-CASE-05-03) 原文: 风险未收口占比为1，所有5个风险在评估期内均未收口（4个open，1个tracking），风险治理闭环存在显著缺口。<br>expert_finding:risk_behavior_auditor_result.dimension_findings[2] (MTG-CASE-05-03) 原文: 存在供应链风险复发线索，风险类型“供应链”出现2次（NO.601, NO.604），表明此类风险未被根除。<br>expert_finding:risk_behavior_auditor_result.dimension_findings[3] (MTG-CASE-05-03) 原文: 风险缓释动作覆盖率为1，所有风险均记录了建议动作，表明风险识别后能初步形成治理思路。 | 高等级风险未完全收口，风险治理结论需人工复核。 |
| 协同调度力 | 85 | 0.9 | 日历必要干系人覆盖率（calendar_events_with_required_stakeholders / total_calendar_events）为1，管理者聊天同步样本数为25。专家发现管理者在群聊中主动同步关键信息、澄清依赖、指派任务，并对关键风险能及时响应并形成解决路径，跨角色响应多为有效响应。 | hard_metric:calendar_stakeholder_coverage_rate (2026-05-06T09:51:26.700Z) 原文: 日历必要干系人覆盖率: 3 / 3 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events<br>hard_metric:manager_chat_signal_count (2026-05-06T09:51:26.700Z) 原文: 管理者聊天同步样本数: 25 = 25; value = manager_chat_messages_count | expert_finding:coordination_lens_result.dimension_findings[0] (MTG-CASE-05-03) 原文: 管理者在群聊中主动同步关键信息、澄清依赖并指派任务，形成有效协同。<br>expert_finding:coordination_lens_result.dimension_findings[1] (MTG-CASE-05-03) 原文: 关键风险（专利侵权、供应商产能）在群聊中被识别并同步，管理者主动介入处理，形成解决路径。<br>expert_finding:coordination_lens_result.dimension_findings[2] (MTG-CASE-05-03) 原文: 跨角色响应多为有效响应，包含信息确认、问题澄清或任务承接，而非简单“收到”。 | 针对‘供应链风险应急沟通’会议的关键决策，是否在会后有效同步给更广泛的核心干系人，需人工复核以确保协同一致性。 |
| 组织行为健康度 | 70 | 0.5 | 管理者非常规时段消息占比（manager_messages_between_22_00_and_08_00 / manager_chat_messages）为0。高压推进语言样本占比（manager_messages_matching_pressure_keywords / manager_chat_messages）为0.04，仅观察到一条命中样本。 | hard_metric:late_night_manager_message_rate (2026-05-06T09:51:26.700Z) 原文: 管理者非常规时段消息占比: 0 / 25 = 0; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T09:51:26.700Z) 原文: 高压推进语言样本占比: 1 / 25 = 0.04; value = manager_messages_matching_pressure_keywords / manager_chat_messages | [UNRESOLVED_REF] risk_behavior_auditor_result.risk_flags[2] | 当前会议缺完整转写，无法进行全面的行为评估。组织行为相关语言样本需人工复核语境和场景，导致置信度显著降低。 |

| 总分 | 置信度 | 主要优势 | 主要风险 | 总结 |
| --- | --- | --- | --- | --- |
| 64 | 0.7 | 协同调度力：管理者在群聊中主动同步信息、澄清依赖、指派任务，并对关键风险能及时响应并形成解决路径，协同主动性强。<br>推进闭环力（基础能力）：任务定义完整、无延期，已关闭任务质量高，体现了良好的任务管理基础。 | 风险治理力：所有风险均未收口，高等级风险收口率为0，且供应链风险出现复发，风险治理闭环存在显著缺口。<br>推进闭环力（执行风险）：当前会议行动项未完全录入任务系统，项目整体任务关闭率低（43.33%），存在行动项遗漏和任务积压风险。 | 管理者周牧在协同调度方面表现突出，能有效同步信息、处理依赖和风险。任务管理的基础能力扎实。然而，风险治理存在严重短板，所有风险均未有效收口，高等级风险治理失效。同时，任务推进存在闭环断裂和积压风险。方向校准和组织行为健康度因数据质量（会议转写缺失）和样本限制，评估置信度较低，需人工复核关键语境。 |

## 报告观测

说明：本节展示最终报告模块本身的产出状态和内容规模，帮助判断报告是否完整。

| 字段 | 值 |
| --- | --- |
| 标题 | 周牧（PJT-CASE-05）项目管理能力评估报告 - 2026-01-01 ~ 2026-04-24 |
| 类型 | weekly_report |
| 状态 | 降级 |
| 人工复核项数 | 5 |
| 关键证据数 | 3 |
| 风险提醒数 | 3 |
| 下一步动作数 | 4 |
| 回写字段键 | project_id, manager_id, meeting_id, evaluation_period, overall_score, overall_confidence, dimension_scores, top_strengths, top_risks, report_status, human_review_required |

## 报告内容与证据

说明：本节把最终报告中的各个组成部分逐条展开，并展示每条内容背后的证据引用。

| 报告部分 | 序号 | 内容 | 证据/原文摘录 |
| --- | --- | --- | --- |
| 评分概览 | 1 | {"dimension":"方向校准力","score":60,"confidence":0.6,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"meeting_decision_coverage_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id=meeting_decision_coverage_rate, formula=value = meetings_with_decision_trace / total_meetings, calculation.expression=3 / 3, value=1"},{"source_type":"base_meeting","source_file":"04_meetings/base_meetings_record_list.json","source_id":"MTG-CASE-05-03","timestamp":"2026-04-24 09:00 - 09:45","excerpt":"协调供应链总监争取插队 \| 同步评估供应商C打样能力 \| 周牧单独跟进不占用群资源","evidence_note":"会议决策摘要，显示针对供应链产能风险做出了具体决策，但未提及与核心目标的校准。"},{"source_type":"document_snapshot","source_file":"project_context","source_id":"PJT-CASE-05","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"优化供应链适配性，将开模周期从 industry average 45天压缩至32天","evidence_note":"项目核心目标之一，当前会议未提及与此目标的校准。"}],"content":"方向校准力 60"} | hard_metric:meeting_decision_coverage_rate (2026-05-06T09:51:26.700Z) 原文: 会议决策留痕覆盖率: 3 / 3 = 1; value = meetings_with_decision_trace / total_meetings<br>base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通<br>base_record:PJT-CASE-05 (2026-01-01) 原文: 2026年度智能家居产品线工业设计 |
| 评分概览 | 2 | {"dimension":"推进闭环力","score":65,"confidence":0.8,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_definition_completeness_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id=task_definition_completeness_rate, formula=value = tasks_with_task_name_owner_due_date / total_tasks, calculation.expression=30 / 30, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_overdue_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0","evidence_note":"metric_id=task_overdue_rate, formula=value = overdue_tasks / tasks_with_due_date, calculation.expression=0 / 30, value=0"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"closed_task_quality_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id=closed_task_quality_rate, formula=value = qualified_closed_tasks / closed_tasks, calculation.expression=13 / 13, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0.6667","evidence_note":"metric_id=current_meeting_action_task_rate, formula=value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count, calculation.expression=2 / 3, value=0.6667"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0.4333","evidence_note":"metric_id=task_closure_rate, formula=value = closed_tasks / total_tasks, calculation.expression=13 / 30, value=0.4333"}],"content":"推进闭环力 65"} | hard_metric:task_definition_completeness_rate (2026-05-06T09:51:26.700Z) 原文: 任务定义完整率: 30 / 30 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:task_overdue_rate (2026-05-06T09:51:26.700Z) 原文: 任务延期率: 0 / 30 = 0; value = overdue_tasks / tasks_with_due_date<br>hard_metric:closed_task_quality_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭质量代理指标: 13 / 13 = 1; value = qualified_closed_tasks / closed_tasks<br>hard_metric:current_meeting_action_task_rate (2026-05-06T09:51:26.700Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks |
| 评分概览 | 3 | {"dimension":"风险治理力","score":40,"confidence":0.8,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"risk_mitigation_action_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1, calculation.expression = 5 / 5","evidence_note":"metric_id=risk_mitigation_action_rate, formula=value = risks_with_suggested_action / total_risks, calculation.expression=5 / 5, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0, calculation.expression = 0 / 2","evidence_note":"metric_id=high_risk_resolution_rate, formula=value = resolved_high_risks / total_high_risks, calculation.expression=0 / 2, value=0"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1, calculation.expression = 5 / 5","evidence_note":"metric_id=open_risk_rate, formula=value = open_or_tracking_risks / total_risks, calculation.expression=5 / 5, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 2, anomalies = [\"供应链:2\"]","evidence_note":"metric_id=repeated_risk_type_count, formula=value = sum(count(risk_type) where count(risk_type) > 1), calculation.expression=2, value=2, 显示供应链风险复发。"}],"content":"风险治理力 40"} | hard_metric:risk_mitigation_action_rate (2026-05-06T09:51:26.700Z) 原文: 风险缓释动作覆盖率: 5 / 5 = 1; value = risks_with_suggested_action / total_risks<br>hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-06T09:51:26.700Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T09:51:26.700Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1) |
| 评分概览 | 4 | {"dimension":"协同调度力","score":85,"confidence":0.9,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"calendar_stakeholder_coverage_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id=calendar_stakeholder_coverage_rate, formula=value = calendar_events_with_required_stakeholders / total_calendar_events, calculation.expression=3 / 3, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"manager_chat_signal_count","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 25","evidence_note":"metric_id=manager_chat_signal_count, formula=value = manager_chat_messages_count, calculation.expression=25, value=25"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0002","timestamp":"2026-04-01 09:15","excerpt":"4月项目启动，本周重点是完成智能音箱和扫地机器人的概念设计评审。","evidence_note":"管理者周牧主动同步项目关键里程碑及本周重点。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0038","timestamp":"2026-04-24 09:12","excerpt":"先不在群里说了，我单独找供应链总监协调，看看能不能插队。","evidence_note":"管理者针对供应链阻塞风险，主动承担协调责任并明确升级路径。"}],"content":"协同调度力 85"} | hard_metric:calendar_stakeholder_coverage_rate (2026-05-06T09:51:26.700Z) 原文: 日历必要干系人覆盖率: 3 / 3 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events<br>hard_metric:manager_chat_signal_count (2026-05-06T09:51:26.700Z) 原文: 管理者聊天同步样本数: 25 = 25; value = manager_chat_messages_count<br>chat:om_case05msg0002 (2026-04-01 09:15) 原文: 4月项目启动，本周重点是完成智能音箱和扫地机器人的概念设计评审。<br>chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |
| 评分概览 | 5 | {"dimension":"组织行为健康度","score":70,"confidence":0.5,"evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"late_night_manager_message_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0","evidence_note":"metric_id=late_night_manager_message_rate, formula=value = manager_messages_between_22_00_and_08_00 / manager_chat_messages, calculation.expression=0 / 25, value=0"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"high_pressure_language_sample_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0.04, anomalies = [\"2026-04-21 09:15 本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。\"]","evidence_note":"metric_id=high_pressure_language_sample_rate, formula=value = manager_messages_matching_pressure_keywords / manager_chat_messages, calculation.expression=1 / 25, value=0.04, 显示存在一条命中样本。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0025","timestamp":"2026-04-21 09:15","excerpt":"本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。","evidence_note":"管理者聊天消息中命中关键词“必须”。此为观察项，需人工复核语境。"}],"content":"组织行为健康度 70"} | hard_metric:late_night_manager_message_rate (2026-05-06T09:51:26.700Z) 原文: 管理者非常规时段消息占比: 0 / 25 = 0; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T09:51:26.700Z) 原文: 高压推进语言样本占比: 1 / 25 = 0.04; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case05msg0025 (2026-04-21 09:15) 原文: 本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。 |
| 关键证据 | 1 | {"dimension":"协同调度力","evidence":"管理者在群聊中主动同步关键信息、澄清依赖、指派任务，并对关键风险能及时响应并形成解决路径。","evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0002","timestamp":"2026-04-01 09:15","excerpt":"4月项目启动，本周重点是完成智能音箱和扫地机器人的概念设计评审。","evidence_note":"管理者周牧主动同步项目关键里程碑及本周重点。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0038","timestamp":"2026-04-24 09:12","excerpt":"先不在群里说了，我单独找供应链总监协调，看看能不能插队。","evidence_note":"管理者针对供应链阻塞风险，主动承担协调责任并明确升级路径。"}],"content":"管理者在群聊中主动同步关键信息、澄清依赖、指派任务，并对关键风险能及时响应并形成解决路径。"} | chat:om_case05msg0002 (2026-04-01 09:15) 原文: 4月项目启动，本周重点是完成智能音箱和扫地机器人的概念设计评审。<br>chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |
| 关键证据 | 2 | {"dimension":"推进闭环力","evidence":"任务定义完整、无延期，已关闭任务质量高，体现了良好的任务管理基础。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_definition_completeness_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id=task_definition_completeness_rate, formula=value = tasks_with_task_name_owner_due_date / total_tasks, calculation.expression=30 / 30, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_overdue_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0","evidence_note":"metric_id=task_overdue_rate, formula=value = overdue_tasks / tasks_with_due_date, calculation.expression=0 / 30, value=0"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"closed_task_quality_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1","evidence_note":"metric_id=closed_task_quality_rate, formula=value = qualified_closed_tasks / closed_tasks, calculation.expression=13 / 13, value=1"}],"content":"任务定义完整、无延期，已关闭任务质量高，体现了良好的任务管理基础。"} | hard_metric:task_definition_completeness_rate (2026-05-06T09:51:26.700Z) 原文: 任务定义完整率: 30 / 30 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:task_overdue_rate (2026-05-06T09:51:26.700Z) 原文: 任务延期率: 0 / 30 = 0; value = overdue_tasks / tasks_with_due_date<br>hard_metric:closed_task_quality_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭质量代理指标: 13 / 13 = 1; value = qualified_closed_tasks / closed_tasks |
| 关键证据 | 3 | {"dimension":"风险治理力","evidence":"所有风险均未收口，高等级风险收口率为0，且供应链风险出现复发，风险治理闭环存在显著缺口。","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0, calculation.expression = 0 / 2","evidence_note":"metric_id=high_risk_resolution_rate, formula=value = resolved_high_risks / total_high_risks, calculation.expression=0 / 2, value=0"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 1, calculation.expression = 5 / 5","evidence_note":"metric_id=open_risk_rate, formula=value = open_or_tracking_risks / total_risks, calculation.expression=5 / 5, value=1"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 2, anomalies = [\"供应链:2\"]","evidence_note":"metric_id=repeated_risk_type_count, formula=value = sum(count(risk_type) where count(risk_type) > 1), calculation.expression=2, value=2, 显示供应链风险复发。"}],"content":"所有风险均未收口，高等级风险收口率为0，且供应链风险出现复发，风险治理闭环存在显著缺口。"} | hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>hard_metric:open_risk_rate (2026-05-06T09:51:26.700Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T09:51:26.700Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1) |
| 风险提醒 | 1 | {"risk":"风险治理闭环失效，高等级风险未收口且存在复发。","severity":"high","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0, calculation.expression = 0 / 2","evidence_note":"高等级风险收口率为0。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"NO.601","timestamp":"MTG-CASE-05-02","excerpt":"供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 followup_status=open","evidence_note":"高风险NO.601状态为open。"},{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"anomalies = [\"供应链:2\"]","evidence_note":"硬指标异常显示供应链风险复发。"}],"content":"risk_alert"} | hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>hard_metric:repeated_risk_type_count (2026-05-06T09:51:26.700Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1) |
| 风险提醒 | 2 | {"risk":"任务推进存在闭环断裂和积压风险，行动项未完全录入，任务关闭率低。","severity":"medium","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"anomalies: [\"会议行动项 3 条，任务表命中 2 条\"]","evidence_note":"硬指标异常样本，显示行动项与任务关联不一致。"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0.4333","evidence_note":"metric_id=task_closure_rate, formula=value = closed_tasks / total_tasks, calculation.expression=13 / 30, value=0.4333"}],"content":"risk_alert"} | hard_metric:current_meeting_action_task_rate (2026-05-06T09:51:26.700Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks |
| 风险提醒 | 3 | {"risk":"应急会议决策的协同同步范围可能不足，存在信息孤岛风险。","severity":"medium","evidence_refs":[{"source_type":"calendar","source_file":"06_calendar/calendar_events_instance_view.json","source_id":"cal_case05_evt_0424_emergency","timestamp":"2026-04-24T09:00:00+08:00","excerpt":"供应链风险应急沟通 attendees=周牧,林峰","evidence_note":"应急会议仅两人参加。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0038","timestamp":"2026-04-24 09:12","excerpt":"先不在群里说了，我单独找供应链总监协调，看看能不能插队。","evidence_note":"管理者决定单独协调，未在群聊中同步后续进展。"}],"content":"risk_alert"} | calendar:cal_case05_evt_0424_emergency (2026-04-24T09:00:00+08:00) 原文: 供应链风险应急沟通<br>chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |
| 下一步动作 | 1 | {"action":"立即复核并推动高等级风险（NO.601， NO.602）的收口，制定明确的收口计划。","priority":"high","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics_result","source_id":"high_risk_resolution_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0, calculation.expression = 0 / 2","evidence_note":"高等级风险收口率为0。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"NO.601","timestamp":"MTG-CASE-05-02","excerpt":"供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 followup_status=open","evidence_note":"高风险NO.601状态为open。"}],"content":"立即复核并推动高等级风险（NO.601， NO.602）的收口，制定明确的收口计划。"} | hard_metric:high_risk_resolution_rate (2026-05-06T09:51:26.700Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天 |
| 下一步动作 | 2 | {"action":"补录当前会议（MTG-CASE-05-03）缺失的行动项至任务系统，并回顾积压任务（关闭率43.33%），制定清理计划。","priority":"medium","evidence_refs":[{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"anomalies: [\"会议行动项 3 条，任务表命中 2 条\"]","evidence_note":"硬指标异常样本，显示行动项与任务关联不一致。"},{"source_type":"hard_metrics","source_file":"hard_metrics","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = 0.4333","evidence_note":"metric_id=task_closure_rate, formula=value = closed_tasks / total_tasks, calculation.expression=13 / 30, value=0.4333"}],"content":"补录当前会议（MTG-CASE-05-03）缺失的行动项至任务系统，并回顾积压任务（关闭率43.33%），制定清理计划。"} | hard_metric:current_meeting_action_task_rate (2026-05-06T09:51:26.700Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T09:51:26.700Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks |
| 下一步动作 | 3 | {"action":"在后续会议中，明确将应急决策与项目核心目标（如开模周期压缩）进行校准，并确保会议有完整转写。","priority":"medium","evidence_refs":[{"source_type":"document_snapshot","source_file":"project_context","source_id":"PJT-CASE-05","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"优化供应链适配性，将开模周期从 industry average 45天压缩至32天","evidence_note":"项目核心目标之一，当前会议未提及与此目标的校准。"},{"source_type":"current_meeting","source_file":"current_meeting","source_id":"MTG-CASE-05-03","timestamp":"2026-04-24 09:00 - 09:45","excerpt":"missing_fields: [\"meeting_docs.current_transcript\"]","evidence_note":"会议记录中缺少完整的转写文本。"}],"content":"在后续会议中，明确将应急决策与项目核心目标（如开模周期压缩）进行校准，并确保会议有完整转写。"} | base_record:PJT-CASE-05 (2026-01-01) 原文: 2026年度智能家居产品线工业设计<br>base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通 |
| 下一步动作 | 4 | {"action":"复核并确保关键应急决策（如供应链协调）的信息同步给所有相关核心干系人，避免信息孤岛。","priority":"medium","evidence_refs":[{"source_type":"calendar","source_file":"06_calendar/calendar_events_instance_view.json","source_id":"cal_case05_evt_0424_emergency","timestamp":"2026-04-24T09:00:00+08:00","excerpt":"供应链风险应急沟通 attendees=周牧,林峰","evidence_note":"应急会议仅两人参加。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0038","timestamp":"2026-04-24 09:12","excerpt":"先不在群里说了，我单独找供应链总监协调，看看能不能插队。","evidence_note":"管理者决定单独协调，未在群聊中同步后续进展。"}],"content":"复核并确保关键应急决策（如供应链协调）的信息同步给所有相关核心干系人，避免信息孤岛。"} | calendar:cal_case05_evt_0424_emergency (2026-04-24T09:00:00+08:00) 原文: 供应链风险应急沟通<br>chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |

## 观测体系告警

说明：本节只记录观测体系自身的问题，例如缺失产物、无法解引用、证据字段异常等。

| 严重性 | 类别 | 说明 | 相关 ID |
| --- | --- | --- | --- |
| warning | unresolved_reference | capability_score:组织行为健康度:finding could not resolve ref: risk_behavior_auditor_result.risk_flags[2] | capability_score:组织行为健康度:finding, risk_behavior_auditor_result.risk_flags[2] |

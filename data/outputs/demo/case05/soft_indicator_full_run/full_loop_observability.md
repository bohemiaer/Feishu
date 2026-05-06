# Case 05 全链路可观测报告

文档生成时间：2026-05-06T10:39:31.554Z
运行结束时间：2026-05-06T10:39:31.532Z

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
| Run Total | 已完成 | 765881 | true |  |
| Front Pipeline | 已采集/就绪 | 93 | false |  |
| Hard Metrics | 就绪 | 3 | false |  |
| Evaluation Planner | full_evaluation | 1 | false |  |
| 管理评审专家 | 正常 | 129004 | true |  |
| 风险与行为审计专家 | 正常 | 205372 | true |  |
| 协同视角专家 | 正常 | 108265 | true |  |
| 能力评估专家 | 降级 | 255044 | true |  |
| 报告生成器 | 降级 | 305283 | true |  |

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
| 风险与行为审计专家 | 就绪 | risk_behavior_auditor_result.json | 请求指标=6, 结论=2, 风险标记=2, 人工复核=3 |
| 协同视角专家 | 就绪 | coordination_lens_result.json | 请求指标=2, 结论=2, 人工复核=1 |
| 能力评估专家 | 降级 | capability_assessor_result.json | 请求指标=15, 评分=5, 人工复核=6 |
| 报告生成器 | 降级 | report_result.json | 人工复核=6, 关键证据=4, 风险提醒=3, 下一步动作=4 |

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
| 管理评审专家 | 1 | 方向校准力 | 观察项 | 0.6 | 管理者在应急会议中能识别核心风险并做出方向性判断，但决策依据和优先级澄清因缺少完整会议记录而难以评估。 | statement:MTG-CASE-05-03-STM-2 (MTG-CASE-05-03) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。<br>hard_metric:meeting_decision_coverage_rate (2026-05-06T10:26:45.748Z) 原文: 会议决策留痕覆盖率: 3 / 3 = 1; value = meetings_with_decision_trace / total_meetings |
| 管理评审专家 | 2 | 推进闭环力 | 风险 | 0.9 | 会议行动项与任务表映射存在不一致，且任务关闭率较低，存在闭环断裂风险。 | hard_metric:current_meeting_action_task_rate (2026-05-06T10:26:45.748Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks |
| 管理评审专家 | 3 | 推进闭环力 | 优势 | 1 | 任务定义完整且关闭质量有留痕，为闭环管理提供了良好的基础。 | hard_metric:task_definition_completeness_rate (2026-05-06T10:26:45.748Z) 原文: 任务定义完整率: 30 / 30 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:closed_task_quality_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭质量代理指标: 13 / 13 = 1; value = qualified_closed_tasks / closed_tasks |
| 风险与行为审计专家 | 1 | 风险治理力 | 观察项 | 0.7 | 高等级风险治理动作存在，但收口效果不佳，存在同类风险复发迹象。 | hard_metric:high_risk_resolution_rate (2026-05-06T10:26:45.748Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T10:26:45.748Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1) |
| 风险与行为审计专家 | 2 | 组织行为健康度 | 观察项 | 0.7 | 存在单一高压语言样本，但缺乏完整会议上下文，无法判断是否为系统性高压环境。 | hard_metric:high_pressure_language_sample_rate (2026-05-06T10:26:45.748Z) 原文: 高压推进语言样本占比: 1 / 25 = 0.04; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case05msg0025 (2026-04-21 09:15) 原文: 本周重点：智能音箱和扫地机器人的外观必须冻结，不能再改了。 |
| 协同视角专家 | 1 | 协同调度力 | 优势 | 0.9 | 管理者能有效识别并主动处理跨团队协同阻塞，形成明确的解决路径。 | chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。<br>statement:MTG-CASE-05-03-STM-2 (MTG-CASE-05-03) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。<br>chat:om_case05msg0007 (2026-04-02 14:05) 原文: 我和声学团队确认一下，如果影响比较大就调整散热孔位置。 |
| 协同视角专家 | 2 | 协同调度力 | 观察项 | 0.8 | 关键风险（如专利、供应商产能）在群聊中被识别后，管理者能及时响应并启动处理流程，但部分风险升级路径的闭环跟踪证据不足。 | chat:om_case05msg0033 (2026-04-23 11:20) 原文: 竞品上周发布的新品外观和我们扫地机器人的方案很像，要不要评估专利风险？<br>chat:om_case05msg0034 (2026-04-23 11:25) 原文: 已经让法务在看了，初步判断有规避空间，但需要调整底部轮廓线。<br>chat:om_case05msg0035 (2026-04-24 09:00) 原文: 核心注塑供应商Q2订单饱和，我们的模具排期可能要延后。 |

## 风险标记

说明：本节专门列出被显式标记的风险事项，便于快速识别需要优先跟进的问题。

| 标记 ID | 类型 | 严重性 | 置信度 | 需人工复核 | 摘要 | 证据/原文摘录 |
| --- | --- | --- | --- | --- | --- | --- |
| RF_RG_01 | risk_governance | 高 | 0.9 | 是 | 高等级风险持续未收口，且供应链类风险复发，存在治理失效风险。 | hard_metric:high_risk_resolution_rate (2026-05-06T10:26:45.748Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天<br>base_risk:NO.604 (MTG-CASE-05-03) 原文: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 level=medium followup_status=open suggested_action=协调供应链总监争取插队，同步评估供应商C打样能力 |
| RF_OBH_01 | behavior_observation | 中 | 0.8 | 是 | 观察到管理者在应对紧急供应链风险时，选择移出公开沟通渠道进行单独处理。 | chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。<br>base_risk:NO.604 (MTG-CASE-05-03) 原文: 核心注塑供应商Q2产能饱和，模具排期可能延后10天 level=medium followup_status=open suggested_action=协调供应链总监争取插队，同步评估供应商C打样能力 |

## 能力评分

说明：本节把硬指标和专家判断收敛为维度分数，并解释分数依据、证据和局限性。

| 维度 | 分数 | 置信度 | 评分依据 | 指标证据 | 专家结论证据 | 局限性 |
| --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | 70 | 0.65 | 综合软指标‘风险下的方向判断清晰度’（65分）与‘历史决策一致性’（80分），并结合硬指标‘会议决策留痕覆盖率=1’。管理者在应急会议中能识别核心风险并做出针对性决策（如协调插队），且历史决策主题与项目核心风险高度相关，显示方向一致性良好。但当前会议缺少完整转写，决策的深度、优先级澄清及与核心目标的明确关联难以评估，导致评分受限。 | hard_metric:meeting_decision_coverage_rate (2026-05-06T10:26:45.748Z) 原文: 会议决策留痕覆盖率: 3 / 3 = 1; value = meetings_with_decision_trace / total_meetings | expert_finding:management_reviewer_result.dimension_findings[0] (MTG-CASE-05-03) 原文: 管理者在应急会议中能识别核心风险并做出方向性判断，但决策依据和优先级澄清因缺少完整会议记录而难以评估。 | 当前会议（MTG-CASE-05-03）缺少完整妙记转写，决策讨论过程、优先级澄清及与核心目标的关联性无法精确评估。<br>专家finding置信度为0.6，软指标‘风险下的方向判断清晰度’置信度为0.6，均受限于上下文缺失。 |
| 推进闭环力 | 45 | 0.85 | 综合软指标‘行动项转化为任务的严谨性’（40分）与多个硬指标。任务定义完整（task_definition_completeness_rate=1）且关闭质量有留痕（closed_task_quality_rate=1）是基础优势。但当前会议行动项入表率仅为0.6667，存在行动项未转化为任务的缺口；且整体任务关闭率低（task_closure_rate=0.4333），表明从决策到执行的闭环链条存在明显断裂风险。 | hard_metric:current_meeting_action_task_rate (2026-05-06T10:26:45.748Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks<br>hard_metric:task_definition_completeness_rate (2026-05-06T10:26:45.748Z) 原文: 任务定义完整率: 30 / 30 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:closed_task_quality_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭质量代理指标: 13 / 13 = 1; value = qualified_closed_tasks / closed_tasks | expert_finding:management_reviewer_result.dimension_findings[1] (MTG-CASE-05-03) 原文: 会议行动项与任务表映射存在不一致，且任务关闭率较低，存在闭环断裂风险。<br>expert_finding:management_reviewer_result.dimension_findings[2] (MTG-CASE-05-03) 原文: 任务定义完整且关闭质量有留痕，为闭环管理提供了良好的基础。 | 无法确认未映射的行动项（如‘协调供应链总监争取插队’）是否以其他形式（如风险跟进项）或在不同会议中被跟踪。<br>低关闭率任务的具体阻塞原因未在现有证据中充分揭示。 |
| 风险治理力 | 25 | 0.85 | 综合软指标‘风险识别与缓释动作的及时性’（2分）与‘遗留及复发风险治理的有效性’（1分），并结合多个硬指标。所有风险均有缓释动作（risk_mitigation_action_rate=1），且存在从预警到治理动作的转化。但治理闭环存在严重缺陷：所有风险均未收口（open_risk_rate=1），高等级风险收口率为0（high_risk_resolution_rate=0），且供应链类风险已复发（repeated_risk_type_count=2），表明风险治理未能有效闭环，存在治理失效风险。 | hard_metric:open_risk_rate (2026-05-06T10:26:45.748Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:high_risk_resolution_rate (2026-05-06T10:26:45.748Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T10:26:45.748Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1)<br>hard_metric:risk_mitigation_action_rate (2026-05-06T10:26:45.748Z) 原文: 风险缓释动作覆盖率: 5 / 5 = 1; value = risks_with_suggested_action / total_risks | expert_finding:risk_behavior_auditor_result.dimension_findings[0] (MTG-CASE-05-03) 原文: 高等级风险治理动作存在，但收口效果不佳，存在同类风险复发迹象。 | 当前会议（MTG-CASE-05-03）缺少完整转写，无法确认风险讨论的完整决策过程和缓释动作的跟进深度。 |
| 协同调度力 | 75 | 0.8 | 综合软指标‘跨角色依赖澄清与行动指派清晰度’（8分）与‘高风险阻塞的主动升级与路径构建’（7分），并结合硬指标‘日历必要干系人覆盖率=1’。管理者能有效识别跨团队阻塞（如散热孔冲突、专利风险、供应商产能），并主动构建解决路径（如单独协调供应链总监），行动指派清晰且部分任务已完成。日历覆盖了关键干系人，为协同提供了基础。但高风险阻塞（供应商产能）的协调结果在评估期内未闭环，影响了最终效果评分。 | hard_metric:calendar_stakeholder_coverage_rate (2026-05-06T10:26:45.748Z) 原文: 日历必要干系人覆盖率: 3 / 3 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events | expert_finding:coordination_lens_result.dimension_findings[0] (MTG-CASE-05-03) 原文: 管理者能有效识别并主动处理跨团队协同阻塞，形成明确的解决路径。<br>expert_finding:coordination_lens_result.dimension_findings[1] (MTG-CASE-05-03) 原文: 关键风险（如专利、供应商产能）在群聊中被识别后，管理者能及时响应并启动处理流程，但部分风险升级路径的闭环跟踪证据不足。 | 高风险阻塞（供应商产能瓶颈，风险NO.604）的协调行动（任务NO.525）在评估期内未完成，其最终结果及对项目里程碑的影响未知，影响了协同闭环的评估。<br>样本主要来自群聊，一对一沟通的依赖澄清细节未知。 |
| 组织行为健康度 | 60 | 0.6 | 综合软指标‘公开沟通中的指令明确性与潜在压力’（3分）与‘风险沟通的渠道选择与透明度’（2分），并结合硬指标‘高压推进语言样本占比=0.04’。仅发现一条孤立的高压语言样本，大部分聊天记录为事务性沟通。一个值得关注的观察是，管理者在处理紧急供应链风险时选择移出公开渠道进行单独协调，这可能影响风险透明度。由于关键会议记录缺失，且组织行为判断需结合完整语境，所有观察结论置信度较低。 | hard_metric:high_pressure_language_sample_rate (2026-05-06T10:26:45.748Z) 原文: 高压推进语言样本占比: 1 / 25 = 0.04; value = manager_messages_matching_pressure_keywords / manager_chat_messages | expert_finding:risk_behavior_auditor_result.dimension_findings[1] (MTG-CASE-05-03) 原文: 存在单一高压语言样本，但缺乏完整会议上下文，无法判断是否为系统性高压环境。 | 当前会议（MTG-CASE-05-03）缺少完整妙记转写，无法评估会议中的互动氛围和语境，关键语义判断需人工确认。<br>单一样本不足以推断系统性行为模式，组织行为健康度的评估严重受限于样本和语境不足。<br>风险沟通渠道选择的观察需人工复核其具体原因（如信息敏感性、决策效率等）。 |

| 总分 | 置信度 | 主要优势 | 主要风险 | 总结 |
| --- | --- | --- | --- | --- |
| 55 | 0.75 | 协同调度力：能主动识别跨团队阻塞并构建清晰的解决路径，行动指派明确。<br>方向一致性：历史决策能持续围绕项目核心风险展开，显示对关键约束的把握。<br>任务定义基础：任务定义完整且关闭有留痕，为闭环管理提供了良好基础。 | 风险治理闭环失效：所有风险均未收口，高等级风险持续开放，且供应链风险已复发，存在重大治理缺口。<br>推进闭环断裂：会议行动项未能完全转化为任务，且整体任务关闭率低，从决策到执行的链条存在断裂风险。<br>关键信息缺失：当前会议缺少完整转写，影响对决策深度、优先级及组织行为语境的精确评估。 | 管理者周牧在协同调度和方向一致性上表现出优势，能主动处理阻塞并围绕核心风险决策。然而，评估揭示了两个严重的系统性风险：风险治理未能有效闭环，所有风险均未收口且同类风险复发；推进闭环链条存在断裂，行动项转化和任务关闭率均不理想。这些缺陷构成了项目执行的主要风险点。此外，由于关键会议记录缺失，对方向校准的深度判断和组织行为健康度的评估置信度降低，需人工复核相关语境。 |

## 报告观测

说明：本节展示最终报告模块本身的产出状态和内容规模，帮助判断报告是否完整。

| 字段 | 值 |
| --- | --- |
| 标题 | 周牧（MGR-CASE-05）项目管理能力评估报告 - 2026-01-01 ~ 2026-04-24 |
| 类型 | weekly_report |
| 状态 | 降级 |
| 人工复核项数 | 6 |
| 关键证据数 | 4 |
| 风险提醒数 | 3 |
| 下一步动作数 | 4 |
| 回写字段键 | project_id, manager_id, meeting_id, evaluation_period, report_generated_at, overall_score, dimension_scores, top_risks, human_review_required, human_review_item_ids, report_status |

## 报告内容与证据

说明：本节把最终报告中的各个组成部分逐条展开，并展示每条内容背后的证据引用。

| 报告部分 | 序号 | 内容 | 证据/原文摘录 |
| --- | --- | --- | --- |
| 评分概览 | 1 | {"dimension":"方向校准力","score":70,"confidence":0.65,"evidence_refs":[{"source_type":"soft_indicator","source_file":"expert_results.management_reviewer_result.soft_indicators[0]","source_id":"soft_direction_clarity_under_risk","timestamp":"2026-04-24 09:00 - 09:45","excerpt":"加分项：会议决策（协调插队、评估供应商C）直接对应了会上提及的风险（供应商产能瓶颈）。扣分项：缺少完整会议记录，无法判断管理者是否澄清了各应对方案的优先级（如插队为主、评估备选为辅），以及与项目核心目标（压缩开模周期）的明确关联。","evidence_note":"软指标评分依据，说明方向判断的优势与局限。"},{"source_type":"soft_indicator","source_file":"expert_results.management_reviewer_result.soft_indicators[2]","source_id":"soft_historical_decision_consistency","timestamp":"2026-04-22 10:30 - 11:45","excerpt":"近期会议（MTG-CASE-05-02, MTG-CASE-05-01）的决策重点（供应商问题、成本、外观冻结）与项目文档（main_doc_excerpt）中列出的核心风险（供应商产能、成本上升、认证变更）高度相关，显示管理者能持续围绕已知关键约束进行决策。","evidence_note":"软指标评分依据，说明历史决策与项目风险的一致性。"},{"source_type":"hard_metric","source_file":"hard_metrics[0]","source_id":"meeting_decision_coverage_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = meetings_with_decision_trace / total_meetings, calculation.expression=3 / 3, value=1","evidence_note":"硬指标显示所有会议均有决策留痕，为方向判断提供了基础记录。"}],"content":"方向校准力 70"} | [UNRESOLVED_REF] soft_direction_clarity_under_risk<br>[UNRESOLVED_REF] soft_historical_decision_consistency<br>hard_metric:meeting_decision_coverage_rate (2026-05-06T10:26:45.748Z) 原文: 会议决策留痕覆盖率: 3 / 3 = 1; value = meetings_with_decision_trace / total_meetings |
| 评分概览 | 2 | {"dimension":"推进闭环力","score":45,"confidence":0.85,"evidence_refs":[{"source_type":"soft_indicator","source_file":"expert_results.management_reviewer_result.soft_indicators[1]","source_id":"soft_action_to_task_conversion_rigor","timestamp":"2026-04-24 09:00 - 09:45","excerpt":"严重扣分项：当前会议行动项3条，任务表仅映射2条（NO.508, NO.522），存在1条行动项（推测为‘协调供应链总监争取插队’）未在评估周期内的任务表中找到直接对应，表明转化流程存在缺口。结合硬指标‘当前会议行动项入表率=0.6667’和‘任务关闭率=0.4333’，反映整体闭环推进存在明显阻力。","evidence_note":"软指标评分依据，直接指出行动项转化和整体闭环的严重问题。"},{"source_type":"hard_metric","source_file":"hard_metrics[5]","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count, calculation.expression=2 / 3, value=0.6667","evidence_note":"硬指标量化了当前会议行动项与任务映射的不一致。"},{"source_type":"hard_metric","source_file":"hard_metrics[3]","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = closed_tasks / total_tasks, calculation.expression=13 / 30, value=0.4333","evidence_note":"硬指标显示整体任务关闭率偏低，是闭环乏力的核心证据。"}],"content":"推进闭环力 45"} | [UNRESOLVED_REF] soft_action_to_task_conversion_rigor<br>hard_metric:current_meeting_action_task_rate (2026-05-06T10:26:45.748Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks |
| 评分概览 | 3 | {"dimension":"风险治理力","score":25,"confidence":0.85,"evidence_refs":[{"source_type":"soft_indicator","source_file":"expert_results.risk_behavior_auditor_result.soft_indicators[1]","source_id":"SI_RG_02","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"所有风险均未收口，两个高风险（供应商工艺、防水变更）持续处于open状态。同时，供应链风险已出现两次（NO.601工艺、NO.604产能），表明对特定类型的风险缺乏有效的根治或系统性缓释措施，治理闭环存在明显缺口。","evidence_note":"软指标评分依据，明确指出治理闭环的严重缺陷和风险复发问题。"},{"source_type":"hard_metric","source_file":"hard_metrics[10]","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = open_or_tracking_risks / total_risks, calculation.expression=5 / 5, value=1","evidence_note":"硬指标证明所有风险均未收口，是治理乏力的核心证据。"},{"source_type":"hard_metric","source_file":"hard_metrics[7]","source_id":"high_risk_resolution_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = resolved_high_risks / total_high_risks, calculation.expression=0 / 2, value=0","evidence_note":"硬指标证明高等级风险均未解决，凸显了重大风险敞口。"}],"content":"风险治理力 25"} | [UNRESOLVED_REF] SI_RG_02<br>hard_metric:open_risk_rate (2026-05-06T10:26:45.748Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:high_risk_resolution_rate (2026-05-06T10:26:45.748Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks |
| 评分概览 | 4 | {"dimension":"协同调度力","score":75,"confidence":0.8,"evidence_refs":[{"source_type":"soft_indicator","source_file":"expert_results.coordination_lens_result.soft_indicators[0]","source_id":"soft_coord_001","timestamp":"evaluation_period","excerpt":"管理者在收到依赖问题后，能明确澄清责任方（自己、法务、声学团队）和下一步动作（确认、评估、协调），并转化为具体任务（如NO.507, NO.516, NO.525）。大部分相关任务显示为‘已完成’，表明澄清有效并推动了进展。","evidence_note":"软指标评分依据，说明依赖澄清和行动指派的有效性。"},{"source_type":"soft_indicator","source_file":"expert_results.coordination_lens_result.soft_indicators[1]","source_id":"soft_coord_002","timestamp":"MTG-CASE-05-03","excerpt":"当面临‘供应商产能瓶颈’（NO.604）这一高风险阻塞时，管理者在应急会议（MTG-CASE-05-03）中决策‘协调供应链总监争取插队’，并在群聊中明确‘单独跟进’的升级路径，形成了被相关方（林峰）知晓的解决路径。这超越了简单的问题复述，体现了主动调度。","evidence_note":"软指标评分依据，说明对高风险阻塞的主动升级和路径构建能力。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0038","timestamp":"2026-04-24 09:12","excerpt":"先不在群里说了，我单独找供应链总监协调，看看能不能插队。","evidence_note":"管理者明确构建跨层级协调路径的原始文本，是主动调度的直接证据。"}],"content":"协同调度力 75"} | [UNRESOLVED_REF] soft_coord_001<br>[UNRESOLVED_REF] soft_coord_002<br>chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |
| 评分概览 | 5 | {"dimension":"组织行为健康度","score":60,"confidence":0.6,"evidence_refs":[{"source_type":"soft_indicator","source_file":"expert_results.risk_behavior_auditor_result.soft_indicators[2]","source_id":"SI_OBH_01","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"仅发现一条含有‘必须’、‘不能再改了’的指令性消息（om_case05msg0025），该消息在常规工作时间发出，目标明确。其余大部分聊天记录为信息同步、问题澄清和任务分配，语气中性。但由于当前会议缺少完整转写，无法评估会议中的互动氛围，因此置信度降低。","evidence_note":"软指标评分依据，说明高压语言样本的孤立性及评估局限。"},{"source_type":"soft_indicator","source_file":"expert_results.risk_behavior_auditor_result.soft_indicators[3]","source_id":"SI_OBH_02","timestamp":"2026-04-24 09:12","excerpt":"管理者在公开群聊中同步了大部分风险（如专利、成本、工艺问题），但在处理最新供应链产能风险（NO.604）时，明确表示‘先不在群里说了，我单独找供应链总监协调’。这显示在应对紧急或敏感风险时，管理者倾向于使用非公开渠道进行‘救火’，可能影响团队对整体风险态势的感知和协同应对。","evidence_note":"软指标评分依据，说明风险沟通渠道选择的观察及其潜在影响。"},{"source_type":"hard_metric","source_file":"hard_metrics[14]","source_id":"high_pressure_language_sample_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = manager_messages_matching_pressure_keywords / manager_chat_messages, calculation.expression=1 / 25, value=0.04","evidence_note":"硬指标量化了高压语言规则命中的样本占比，仅为孤立事件。"}],"content":"组织行为健康度 60"} | [UNRESOLVED_REF] SI_OBH_01<br>[UNRESOLVED_REF] SI_OBH_02<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T10:26:45.748Z) 原文: 高压推进语言样本占比: 1 / 25 = 0.04; value = manager_messages_matching_pressure_keywords / manager_chat_messages |
| 关键证据 | 1 | {"evidence_type":"优势证据","description":"协同调度与依赖澄清有效","evidence_refs":[{"source_type":"soft_indicator","source_file":"expert_results.coordination_lens_result.soft_indicators[0]","source_id":"soft_coord_001","timestamp":"evaluation_period","excerpt":"管理者在收到依赖问题后，能明确澄清责任方（自己、法务、声学团队）和下一步动作（确认、评估、协调），并转化为具体任务（如NO.507, NO.516, NO.525）。大部分相关任务显示为‘已完成’，表明澄清有效并推动了进展。","evidence_note":"软指标评分依据，说明依赖澄清和行动指派的有效性。"},{"source_type":"hard_metric","source_file":"hard_metrics[12]","source_id":"calendar_stakeholder_coverage_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = calendar_events_with_required_stakeholders / total_calendar_events, calculation.expression=3 / 3, value=1","evidence_note":"硬指标证明日历事件有效覆盖了必要干系人，为协同提供了组织基础。"}],"content":"协同调度与依赖澄清有效"} | [UNRESOLVED_REF] soft_coord_001<br>hard_metric:calendar_stakeholder_coverage_rate (2026-05-06T10:26:45.748Z) 原文: 日历必要干系人覆盖率: 3 / 3 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events |
| 关键证据 | 2 | {"evidence_type":"风险证据","description":"风险治理闭环失效","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics[10]","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = open_or_tracking_risks / total_risks, calculation.expression=5 / 5, value=1","evidence_note":"硬指标证明所有风险均未收口，是治理乏力的核心证据。"},{"source_type":"hard_metric","source_file":"hard_metrics[11]","source_id":"repeated_risk_type_count","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = sum(count(risk_type) where count(risk_type) > 1), calculation.expression=2, value=2","evidence_note":"硬指标证明‘供应链’类风险已出现两次，表明风险复发模式。"}],"content":"风险治理闭环失效"} | hard_metric:open_risk_rate (2026-05-06T10:26:45.748Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T10:26:45.748Z) 原文: 同类风险复发样本数: 2 = 2; value = sum(count(risk_type) where count(risk_type) > 1) |
| 关键证据 | 3 | {"evidence_type":"风险证据","description":"推进闭环链条断裂","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics[5]","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count, calculation.expression=2 / 3, value=0.6667","evidence_note":"硬指标量化了当前会议行动项与任务映射的不一致。"},{"source_type":"hard_metric","source_file":"hard_metrics[3]","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = closed_tasks / total_tasks, calculation.expression=13 / 30, value=0.4333","evidence_note":"硬指标显示整体任务关闭率偏低，是闭环乏力的核心证据。"}],"content":"推进闭环链条断裂"} | hard_metric:current_meeting_action_task_rate (2026-05-06T10:26:45.748Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks |
| 关键证据 | 4 | {"evidence_type":"观察证据","description":"风险沟通渠道选择观察","evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case05msg0038","timestamp":"2026-04-24 09:12","excerpt":"先不在群里说了，我单独找供应链总监协调，看看能不能插队。","evidence_note":"管理者在处理紧急供应链风险时选择移出公开渠道进行单独协调，可能影响风险透明度。此观察需人工复核语境。"}],"content":"风险沟通渠道选择观察"} | chat:om_case05msg0038 (2026-04-24 09:12) 原文: 先不在群里说了，我单独找供应链总监协调，看看能不能插队。 |
| 风险提醒 | 1 | {"risk_level":"高","description":"风险治理闭环失效，所有风险均未收口，高等级风险持续开放，且供应链类风险已复发，存在重大治理缺口和项目延期风险。","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics[10]","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = open_or_tracking_risks / total_risks, calculation.expression=5 / 5, value=1","evidence_note":"硬指标证明所有风险均未收口。"},{"source_type":"hard_metric","source_file":"hard_metrics[7]","source_id":"high_risk_resolution_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = resolved_high_risks / total_high_risks, calculation.expression=0 / 2, value=0","evidence_note":"硬指标证明高等级风险均未解决。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"NO.601","timestamp":"MTG-CASE-05-02","excerpt":"供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点；risk_level: high; followup_status: open; suggested_action: 同步调整拔模角度压缩返工周期至4天","evidence_note":"高风险之一，状态为open，可能延误T0节点。"}],"content":"风险治理闭环失效，所有风险均未收口，高等级风险持续开放，且供应链类风险已复发，存在重大治理缺口和项目延期风险。"} | hard_metric:open_risk_rate (2026-05-06T10:26:45.748Z) 原文: 风险未收口占比: 5 / 5 = 1; value = open_or_tracking_risks / total_risks<br>hard_metric:high_risk_resolution_rate (2026-05-06T10:26:45.748Z) 原文: 高等级风险收口率: 0 / 2 = 0; value = resolved_high_risks / total_high_risks<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天 |
| 风险提醒 | 2 | {"risk_level":"高","description":"推进闭环链条存在断裂风险，会议行动项未能完全转化为任务，且整体任务关闭率低（43.33%），从决策到执行的转化与落地环节受阻。","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics[5]","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count, calculation.expression=2 / 3, value=0.6667","evidence_note":"硬指标显示当前会议行动项入表率仅为66.67%。"},{"source_type":"hard_metric","source_file":"hard_metrics[3]","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-04-24","excerpt":"value = closed_tasks / total_tasks, calculation.expression=13 / 30, value=0.4333","evidence_note":"硬指标显示整体任务关闭率仅为43.33%。"},{"source_type":"soft_indicator","source_file":"expert_results.management_reviewer_result.soft_indicators[1]","source_id":"soft_action_to_task_conversion_rigor","timestamp":"2026-04-24 09:00 - 09:45","excerpt":"严重扣分项：当前会议行动项3条，任务表仅映射2条（NO.508, NO.522），存在1条行动项（推测为‘协调供应链总监争取插队’）未在评估周期内的任务表中找到直接对应，表明转化流程存在缺口。","evidence_note":"软指标直接指出行动项转化存在缺口。"}],"content":"推进闭环链条存在断裂风险，会议行动项未能完全转化为任务，且整体任务关闭率低（43.33%），从决策到执行的转化与落地环节受阻。"} | hard_metric:current_meeting_action_task_rate (2026-05-06T10:26:45.748Z) 原文: 当前会议行动项入表率: 2 / 3 = 0.6667; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_closure_rate (2026-05-06T10:26:45.748Z) 原文: 任务关闭率: 13 / 30 = 0.4333; value = closed_tasks / total_tasks<br>[UNRESOLVED_REF] soft_action_to_task_conversion_rigor |
| 风险提醒 | 3 | {"risk_level":"中","description":"关键会议（MTG-CASE-05-03）缺少完整转写，影响对决策深度、优先级及组织行为语境的精确评估，导致相关维度评分置信度降低。","evidence_refs":[{"source_type":"current_meeting","source_file":"","source_id":"MTG-CASE-05-03","timestamp":"","excerpt":"missing_fields: [\"meeting_docs.current_transcript\"]","evidence_note":"输入数据中明确指出当前会议缺少完整转写。"},{"source_type":"meeting_info","source_file":"current_meeting","source_id":"MTG-CASE-05-03","timestamp":"2026-04-24 09:00 - 09:45","excerpt":"review_status: 补录摘要","evidence_note":"会议记录状态为补录摘要，缺少完整转写。"}],"content":"关键会议（MTG-CASE-05-03）缺少完整转写，影响对决策深度、优先级及组织行为语境的精确评估，导致相关维度评分置信度降低。"} | base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通<br>base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通 |
| 下一步动作 | 1 | {"action":"人工复核并补全会议行动项与任务的映射关系，明确缺失项的处理状态。","evidence_refs":[{"source_type":"human_review_item","source_file":"capability_assessor_result.human_review_items[0]","source_id":"HR_ACTION_MAPPING_01","timestamp":"","excerpt":"会议行动项与任务表关联数量不一致。当前会议记录行动项3条，但任务表中source_meeting_id为MTG-CASE-05-03的任务仅2条（NO.508, NO.522）。需人工确认缺失的行动项（可能为‘协调供应链总监争取插队’）是否已转化为任务（如NO.525）、被合并或遗漏。","evidence_note":"待复核项，直接指向闭环断裂风险。"}],"content":"人工复核并补全会议行动项与任务的映射关系，明确缺失项的处理状态。"} | [UNRESOLVED_REF] HR_ACTION_MAPPING_01 |
| 下一步动作 | 2 | {"action":"人工复核高风险（NO.601, NO.602）的未收口原因及当前缓释进展，制定明确的收口计划。","evidence_refs":[{"source_type":"human_review_item","source_file":"capability_assessor_result.human_review_items[2]","source_id":"HR_RG_01","timestamp":"","excerpt":"高等级风险未完全收口，风险治理结论需人工复核。","evidence_note":"待复核项，直接指向风险治理失效风险。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"NO.601","timestamp":"MTG-CASE-05-02","excerpt":"供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点；risk_level: high; followup_status: open; suggested_action: 同步调整拔模角度压缩返工周期至4天","evidence_note":"高风险之一，状态为open，可能延误T0节点。"}],"content":"人工复核高风险（NO.601, NO.602）的未收口原因及当前缓释进展，制定明确的收口计划。"} | [UNRESOLVED_REF] HR_RG_01<br>base_risk:NO.601 (MTG-CASE-05-02) 原文: 供应商A模具曲面壁厚不均，需返工3处，可能延误T0节点 level=high followup_status=open suggested_action=同步调整拔模角度压缩返工周期至4天 |
| 下一步动作 | 3 | {"action":"跟进高风险阻塞（风险NO.604）的协调结果，确认插队是否成功及对T0节点的影响，并更新任务状态。","evidence_refs":[{"source_type":"human_review_item","source_file":"capability_assessor_result.human_review_items[5]","source_id":"HR_COORD_001","timestamp":"","excerpt":"需复核高风险阻塞（供应商产能瓶颈，风险NO.604）的升级协调结果。管理者周牧启动了‘供应链总监插队协调’（任务NO.525），但聊天记录显示‘需要高层会议决策’（om_case05msg0048），且任务状态为‘进行中’。需人工确认该协调的最终结果（是否成功插队）以及对关键里程碑（如模具T0节点）的实际影响，以评估协同调度的闭环有效性。","evidence_note":"待复核项，指向协同调度的闭环风险。"}],"content":"跟进高风险阻塞（风险NO.604）的协调结果，确认插队是否成功及对T0节点的影响，并更新任务状态。"} | [UNRESOLVED_REF] HR_COORD_001 |
| 下一步动作 | 4 | {"action":"补充关键会议（MTG-CASE-05-03）的完整转写，以提升后续评估中对决策深度和组织行为语境的判断置信度。","evidence_refs":[{"source_type":"human_review_item","source_file":"capability_assessor_result.human_review_items[1]","source_id":"HR_MISSING_TRANSCRIPT_01","timestamp":"","excerpt":"当前会议缺完整妙记转写，关键语义判断需人工确认上下文。例如，决策‘同步评估供应商C打样能力’的具体背景、评估标准、以及与‘协调插队’的优先级关系无法从现有摘要中准确判断，可能影响对方向校准力的评估。","evidence_note":"待复核项，指向数据质量风险。"},{"source_type":"current_meeting","source_file":"","source_id":"MTG-CASE-05-03","timestamp":"","excerpt":"missing_fields: [\"meeting_docs.current_transcript\"]","evidence_note":"输入数据中明确指出当前会议缺少完整转写。"}],"content":"补充关键会议（MTG-CASE-05-03）的完整转写，以提升后续评估中对决策深度和组织行为语境的判断置信度。"} | [UNRESOLVED_REF] HR_MISSING_TRANSCRIPT_01<br>base_record:MTG-CASE-05-03 (2026-04-24 09:00 - 09:45) 原文: 供应链风险应急沟通 |

## 观测体系告警

说明：本节只记录观测体系自身的问题，例如缺失产物、无法解引用、证据字段异常等。

| 严重性 | 类别 | 说明 | 相关 ID |
| --- | --- | --- | --- |
| warning | unresolved_reference | report_score_overview:1 could not resolve ref: soft_direction_clarity_under_risk | report_score_overview:1, soft_direction_clarity_under_risk |
| warning | unresolved_reference | report_score_overview:1 could not resolve ref: soft_historical_decision_consistency | report_score_overview:1, soft_historical_decision_consistency |
| warning | unresolved_reference | report_score_overview:2 could not resolve ref: soft_action_to_task_conversion_rigor | report_score_overview:2, soft_action_to_task_conversion_rigor |
| warning | unresolved_reference | report_score_overview:3 could not resolve ref: SI_RG_02 | report_score_overview:3, SI_RG_02 |
| warning | unresolved_reference | report_score_overview:4 could not resolve ref: soft_coord_001 | report_score_overview:4, soft_coord_001 |
| warning | unresolved_reference | report_score_overview:4 could not resolve ref: soft_coord_002 | report_score_overview:4, soft_coord_002 |
| warning | unresolved_reference | report_score_overview:5 could not resolve ref: SI_OBH_01 | report_score_overview:5, SI_OBH_01 |
| warning | unresolved_reference | report_score_overview:5 could not resolve ref: SI_OBH_02 | report_score_overview:5, SI_OBH_02 |
| warning | unresolved_reference | report_key_evidence:1 could not resolve ref: soft_coord_001 | report_key_evidence:1, soft_coord_001 |
| warning | unresolved_reference | report_risk_alert:2 could not resolve ref: soft_action_to_task_conversion_rigor | report_risk_alert:2, soft_action_to_task_conversion_rigor |
| warning | unresolved_reference | report_next_action:1 could not resolve ref: HR_ACTION_MAPPING_01 | report_next_action:1, HR_ACTION_MAPPING_01 |
| warning | unresolved_reference | report_next_action:2 could not resolve ref: HR_RG_01 | report_next_action:2, HR_RG_01 |
| warning | unresolved_reference | report_next_action:3 could not resolve ref: HR_COORD_001 | report_next_action:3, HR_COORD_001 |
| warning | unresolved_reference | report_next_action:4 could not resolve ref: HR_MISSING_TRANSCRIPT_01 | report_next_action:4, HR_MISSING_TRANSCRIPT_01 |

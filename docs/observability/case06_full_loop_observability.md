# Case 06 全链路可观测报告

文档生成时间：2026-05-06T13:20:58.523Z
运行结束时间：2026-05-06T13:20:58.487Z

## 运行概览

说明：本节用于快速查看本次运行的业务上下文、整体状态，以及上下游结果是否完整。

| 字段 | 值 |
| --- | --- |
| 项目 ID | PJT-CASE-06 |
| 管理者 ID | MGR-CASE-06 |
| 会议 ID | MTG-CASE-06-12 |
| 评估周期 | 2026-01-01 ~ 2026-03-26 |
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
| Run Total | 已完成 | 861405 | true |  |
| Front Pipeline | 已采集/就绪 | 97 | false |  |
| Hard Metrics | 就绪 | 3 | false |  |
| Evaluation Planner | full_evaluation | 1 | false |  |
| 管理评审专家 | 正常 | 187404 | true |  |
| 风险与行为审计专家 | 正常 | 283216 | true |  |
| 协同视角专家 | 正常 | 187063 | true |  |
| 能力评估专家 | 降级 | 271349 | true |  |
| 报告生成器 | 降级 | 306694 | true |  |

## 节点观测

说明：本节逐个节点说明主要产物和关键计数，便于判断每个模块到底产出了什么、规模有多大。

| 节点 | 状态 | 主要产物 | 关键计数 |
| --- | --- | --- | --- |
| 主编排器 | 已采集 | orchestration_state.json | 阻塞原因=0, 降级原因=0 |
| 输入完整性检查 | 就绪 | input_completeness_report.json | 可用来源=7, 缺失来源=0, 阻塞原因=0 |
| 数据采集器 | 就绪 | raw_payload/history_bundle/meeting_fact_pack/data_quality_report | 数据源=7, 告警=1, 问题=0 |
| 硬指标引擎 | 就绪 | hard_metrics_result.json | 指标=15, 正常=15, 降级=0, 无样本=0 |
| 评估规划器 | full_evaluation | evaluation_plan.json | 聚焦维度=5, 专家=5, 人工复核规则=4 |
| 管理评审专家 | 就绪 | management_reviewer_result.json | 请求指标=7, 结论=2, 人工复核=2 |
| 风险与行为审计专家 | 就绪 | risk_behavior_auditor_result.json | 请求指标=6, 结论=2, 风险标记=3, 人工复核=2 |
| 协同视角专家 | 就绪 | coordination_lens_result.json | 请求指标=2, 结论=3, 人工复核=1 |
| 能力评估专家 | 降级 | capability_assessor_result.json | 请求指标=15, 评分=5, 人工复核=5 |
| 报告生成器 | 降级 | report_result.json | 人工复核=10, 关键证据=5, 风险提醒=5, 下一步动作=5 |

## 数据源覆盖

说明：本节展示本次评估依赖了哪些数据源、是否必需、是否拿到以及样本量多少。

| 数据源 | 是否必需 | 状态 | 样本数 | 文件 | 备注 |
| --- | --- | --- | --- | --- | --- |
| Base 记录 | true | 正常 | 86 | 03_task_risk_register/base_projects_record_list.json<br>03_task_risk_register/base_tasks_record_list.json<br>03_task_risk_register/base_risks_record_list.json<br>04_meetings/base_meetings_record_list.json<br>04_meetings/base_statements_record_list.json |  |
| Base 历史 | false | 正常 | 8 | 03_task_risk_register/base_record_history_list.json |  |
| 云文档 | true | 正常 | 1 | 01_cloud_docs/docs_fetch_main_doc_v2.json |  |
| 聊天历史 | false | 正常 | 127 | 02_chats/im_chat_search_user.json<br>02_chats/im_messages_search_user.json |  |
| 会议/妙记 | true | 正常 | 36 | 04_meetings/base_meetings_record_list.json<br>04_meetings/minutes_search_user.json<br>04_meetings/minutes_transcript_case06.json<br>04_meetings/vc_search_by_participant.json | 当前会议没有完整妙记转写，只能依赖会议表和其他留痕 |
| 日历 | false | 正常 | 12 | 06_calendar/calendar_events_instance_view.json |  |
| 通讯录 | false | 正常 | 5 | 05_org_and_team/contact_get_user_user.json<br>05_org_and_team/contact_search_user_project_members.json |  |

## 数据样本计数

说明：本节用于快速查看不同对象层面的样本规模，便于判断分析结论是否建立在足够的数据量之上。

| 对象 | 数量 |
| --- | --- |
| Base history records | 8 |
| Meeting docs | 3 |
| Project docs | 3 |
| Chat messages | 127 |
| Calendar events | 12 |
| Org contacts | 5 |
| Source catalog | 7 |
| Current meeting tasks | 3 |
| History recent meetings | 3 |
| History risk records | 8 |
| Meeting action items | 3 |
| Meeting decisions | 1 |
| Meeting risks mentioned | 3 |
| Provenance refs | 9 |

## 数据质量告警

说明：本节列出上游数据本身的质量风险，例如样本缺失、留痕不足或只有摘要没有原文。

- 当前会议没有完整妙记转写，当前会议事实将更多依赖会议表和 Statements。

## 硬指标结果

说明：本节展示可计算指标的结果、公式、状态和异常样本，是后续专家判断的重要量化输入。

| 维度 | 指标 ID | 指标名称 | 公式 | 计算过程 | 值 | 单位 | 状态 | 异常样本 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | meeting_decision_coverage_rate | 会议决策留痕覆盖率 | value = meetings_with_decision_trace / total_meetings | 12 / 12 | 1 | ratio | 正常 |  |
| 推进闭环力 | task_definition_completeness_rate | 任务定义完整率 | value = tasks_with_task_name_owner_due_date / total_tasks | 40 / 40 | 1 | ratio | 正常 |  |
| 推进闭环力 | task_overdue_rate | 任务延期率 | value = overdue_tasks / tasks_with_due_date | 6 / 40 | 0.15 | ratio | 正常 | NO.626 手板制作 DDL=2026-03-25<br>NO.631 成本核算 DDL=2026-03-28<br>NO.636 外观颜色方案确定 DDL=2026-02-20<br>NO.637 结构详细设计 DDL=2026-02-10<br>NO.638 硬件详细设计 DDL=2026-02-15<br>NO.640 测试报告整理 DDL=2026-03-30 |
| 推进闭环力 | task_closure_rate | 任务关闭率 | value = closed_tasks / total_tasks | 25 / 40 | 0.625 | ratio | 正常 |  |
| 推进闭环力 | closed_task_quality_rate | 任务关闭质量代理指标 | value = qualified_closed_tasks / closed_tasks | 25 / 25 | 1 | ratio | 正常 |  |
| 推进闭环力 | current_meeting_action_task_rate | 当前会议行动项入表率 | value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count | 3 / 3 | 1 | ratio | 正常 | 会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载 |
| 推进闭环力 | meeting_action_item_coverage_rate | 会议行动项留痕覆盖率 | value = meetings_with_action_item_count_gt_0 / total_meetings | 8 / 12 | 0.6667 | ratio | 正常 | MTG-CASE-06-03 action_item_count=0<br>MTG-CASE-06-05 action_item_count=0<br>MTG-CASE-06-08 action_item_count=0<br>MTG-CASE-06-11 action_item_count=0 |
| 风险治理力 | high_risk_resolution_rate | 高等级风险收口率 | value = resolved_high_risks / total_high_risks | 2 / 2 | 1 | ratio | 正常 |  |
| 风险治理力 | risk_mitigation_action_rate | 风险缓释动作覆盖率 | value = risks_with_suggested_action / total_risks | 10 / 10 | 1 | ratio | 正常 |  |
| 风险治理力 | open_risk_rate | 风险未收口占比 | value = open_or_tracking_risks / total_risks | 3 / 10 | 0.3 | ratio | 正常 | NO.704 open<br>NO.709 tracking<br>NO.710 tracking |
| 风险治理力 | repeated_risk_type_count | 同类风险复发样本数 | value = sum(count(risk_type) where count(risk_type) > 1) | 7 | 7 | count | 正常 | 技术风险:5<br>成本风险:2 |
| 协同调度力 | calendar_stakeholder_coverage_rate | 日历必要干系人覆盖率 | value = calendar_events_with_required_stakeholders / total_calendar_events | 12 / 12 | 1 | ratio | 正常 |  |
| 协同调度力 | manager_chat_signal_count | 管理者聊天同步样本数 | value = manager_chat_messages_count | 60 | 60 | count | 正常 |  |
| 组织行为健康度 | late_night_manager_message_rate | 管理者非常规时段消息占比 | value = manager_messages_between_22_00_and_08_00 / manager_chat_messages | 14 / 60 | 0.2333 | ratio | 正常 | 2026-01-07 22:00 收到，我看看。<br>2026-01-08 00:15 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。<br>2026-01-10 23:30 李明，结构方案周五前必须给我，不能再拖了。<br>2026-01-15 23:00 刘洋，帮我跟催下李明的结构方案，周三前必须出终稿。<br>2026-01-23 23:30 王芳，硬件方案有几个地方需要补充，明天上午给我。<br>2026-01-29 22:30 收到，我确认下。<br>2026-01-29 23:00 没问题了，可以进行下一步。<br>2026-02-15 23:30 李明，外观设计有几个地方需要调整：颜色方案和材质选择，周一前给我。<br>2026-02-17 22:30 收到，我确认下。<br>2026-02-17 23:00 没问题了，外观设计可以冻结。<br>2026-02-28 23:30 收到，我看看。<br>2026-02-28 23:45 没问题了，继续联调。<br>2026-03-28 22:30 收到，我看看。<br>2026-03-28 23:30 先尝试软件优化，效果不好再考虑增大电池。周五前给我结果。 |
| 组织行为健康度 | high_pressure_language_sample_rate | 高压推进语言样本占比 | value = manager_messages_matching_pressure_keywords / manager_chat_messages | 10 / 60 | 0.1667 | ratio | 正常 | 2026-01-10 23:30 李明，结构方案周五前必须给我，不能再拖了。<br>2026-01-15 23:00 刘洋，帮我跟催下李明的结构方案，周三前必须出终稿。<br>2026-01-16 09:35 好，下午必须收到。<br>2026-01-23 23:30 王芳，硬件方案有几个地方需要补充，明天上午给我。<br>2026-02-15 23:30 李明，外观设计有几个地方需要调整：颜色方案和材质选择，周一前给我。<br>2026-02-27 17:15 王芳，你配合张强解决这个问题，这周内必须搞定。<br>2026-03-12 14:10 这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。<br>2026-03-26 09:00 续航必须达标，这个月内解决。张强你评估下优化方案。<br>2026-03-26 09:15 好，周五前给我方案。<br>2026-03-28 23:30 先尝试软件优化，效果不好再考虑增大电池。周五前给我结果。 |

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
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-01 | 2026-01-10 09:00 - 12:00 | MTG-CASE-06-01 项目启动会与技术方案评审 | 确认产品概念方案和技术路线; 结构设计由李明主导，2周内出初稿; 硬件方案由王芳负责，同步启动供应商评估; 算法由张强负责，尽快出demo |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-02 | 2026-01-20 14:00 - 17:00 | MTG-CASE-06-02 芯片缺货与结构方案评审会 | 接受替代芯片方案，价格上浮15%可接受; 打回结构方案重做; 立即启动备选供应商引入流程 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-03 | 2026-01-28 10:00 - 11:00 | MTG-CASE-06-03 结构方案进度跟进会 | 继续修改; 下周再讨论 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-04 | 2026-02-05 10:00 - 12:00 | MTG-CASE-06-04 硬件方案与芯片替代评审会 | 补充接口设计和电源方案; 确认芯片替代方案; 成本增加向领导汇报 |
| meeting_decision_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-05 | 2026-02-12 14:00 - 15:00 | MTG-CASE-06-05 外观设计颜色讨论会 | 继续讨论; 收集更多参考方案 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.601 | 2026-01-15 | NO.601 产品概念设计方案输出 | 产品概念设计方案输出 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.602 | 2026-01-18 | NO.602 结构设计方案初稿 | 结构设计方案初稿 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.603 | 2026-01-15 | NO.603 硬件平台选型评估 | 硬件平台选型评估 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.604 | 2026-01-25 | NO.604 核心芯片替代方案评估 | 核心芯片替代方案评估 |
| task_definition_completeness_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.605 | 2026-01-20 | NO.605 算法demo准备 | 算法demo准备 |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.626 | 2026-03-25 | NO.626 手板制作 | 手板制作 DDL=2026-03-25 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.631 | 2026-03-28 | NO.631 成本核算 | 成本核算 DDL=2026-03-28 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.636 | 2026-02-20 | NO.636 外观颜色方案确定 | 外观颜色方案确定 DDL=2026-02-20 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.637 | 2026-02-10 | NO.637 结构详细设计 | 结构详细设计 DDL=2026-02-10 is_overdue=true |
| task_overdue_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.638 | 2026-02-15 | NO.638 硬件详细设计 | 硬件详细设计 DDL=2026-02-15 is_overdue=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.601 | 2026-01-15 | NO.601 产品概念设计方案输出 | 产品概念设计方案输出 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.602 | 2026-01-18 | NO.602 结构设计方案初稿 | 结构设计方案初稿 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.603 | 2026-01-15 | NO.603 硬件平台选型评估 | 硬件平台选型评估 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.604 | 2026-01-25 | NO.604 核心芯片替代方案评估 | 核心芯片替代方案评估 status=已完成 is_closed=true |
| task_closure_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.605 | 2026-01-20 | NO.605 算法demo准备 | 算法demo准备 status=已完成 is_closed=true |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.601 | 2026-01-15 | NO.601 产品概念设计方案输出 | 产品概念设计方案输出 close_duration=5 source_meeting_id=MTG-CASE-06-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.602 | 2026-01-18 | NO.602 结构设计方案初稿 | 结构设计方案初稿 close_duration=3 source_meeting_id=MTG-CASE-06-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.603 | 2026-01-15 | NO.603 硬件平台选型评估 | 硬件平台选型评估 close_duration=4 source_meeting_id=MTG-CASE-06-01 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.604 | 2026-01-25 | NO.604 核心芯片替代方案评估 | 核心芯片替代方案评估 close_duration=5 source_meeting_id=MTG-CASE-06-02 |
| closed_task_quality_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.605 | 2026-01-20 | NO.605 算法demo准备 | 算法demo准备 close_duration=3 source_meeting_id=MTG-CASE-06-01 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.624 | 2026-03-21 | NO.624 周报同步 | 周报同步 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.625 | 2026-03-28 | NO.625 周报同步 | 周报同步 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.627 | 2026-03-30 | NO.627 手板功能测试 | 手板功能测试 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.628 | 2026-04-05 | NO.628 续航优化方案 | 续航优化方案 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.629 | 2026-04-15 | NO.629 小批量试产准备 | 小批量试产准备 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.630 | 2026-04-20 | NO.630 认证测试准备 | 认证测试准备 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.634 | 2026-04-10 | NO.634 专利布局 | 专利布局 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.635 | 2026-04-25 | NO.635 认证机构对接 | 认证机构对接 source_meeting_id=MTG-CASE-06-12 |
| current_meeting_action_task_rate | base_task | 03_task_risk_register/base_tasks_record_list.json | NO.640 | 2026-03-30 | NO.640 测试报告整理 | 测试报告整理 source_meeting_id=MTG-CASE-06-12 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-01 | 2026-01-10 09:00 - 12:00 | MTG-CASE-06-01 项目启动会与技术方案评审 | 项目启动会与技术方案评审 action_item_count=4 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-02 | 2026-01-20 14:00 - 17:00 | MTG-CASE-06-02 芯片缺货与结构方案评审会 | 芯片缺货与结构方案评审会 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-04 | 2026-02-05 10:00 - 12:00 | MTG-CASE-06-04 硬件方案与芯片替代评审会 | 硬件方案与芯片替代评审会 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-06 | 2026-02-15 14:00 - 17:00 | MTG-CASE-06-06 外观设计初稿评审会 | 外观设计初稿评审会 action_item_count=3 |
| meeting_action_item_coverage_rate | base_meeting | 04_meetings/base_meetings_record_list.json | MTG-CASE-06-07 | 2026-02-25 10:00 - 12:00 | MTG-CASE-06-07 外观冻结与进度同步会 | 外观冻结与进度同步会 action_item_count=3 |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.701 | MTG-CASE-06-02 | NO.701 high resolved | 核心芯片供应商产能不足，可能影响交期 followup_status=resolved |
| high_risk_resolution_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.707 | MTG-CASE-06-10 | NO.707 high resolved | 手板供应商CNC加工精度不够，尺寸有偏差 followup_status=resolved |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.701 | MTG-CASE-06-02 | NO.701 high resolved | 立即启动替代方案评估，寻找备选供应商 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.702 | MTG-CASE-06-03 | NO.702 medium resolved | 打回重做，调整电池仓和散热方案 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.703 | MTG-CASE-06-04 | NO.703 low resolved | 向领导汇报成本增加事项，接受价格上浮 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.704 | MTG-CASE-06-05 | NO.704 medium open | 继续讨论，收集更多参考方案 |
| risk_mitigation_action_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.705 | MTG-CASE-06-06 | NO.705 medium resolved | 补充接口设计和电源方案 |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.704 | MTG-CASE-06-05 | NO.704 medium open | 外观设计颜色方案讨论无结论，方案悬而未决 followup_status=open |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.709 | MTG-CASE-06-12 | NO.709 medium tracking | 电池续航时间低于设计指标15分钟 followup_status=tracking |
| open_risk_rate | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.710 | MTG-CASE-06-10 | NO.710 medium tracking | 手板延期可能导致后续认证测试时间压缩 followup_status=tracking |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.701 | MTG-CASE-06-02 | NO.701 high resolved | 供应链: 核心芯片供应商产能不足，可能影响交期 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.702 | MTG-CASE-06-03 | NO.702 medium resolved | 技术风险: 结构方案需要调整，电池仓和散热设计不合理 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.703 | MTG-CASE-06-04 | NO.703 low resolved | 成本风险: 替代芯片价格上浮15%，超出预算 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.704 | MTG-CASE-06-05 | NO.704 medium open | 技术风险: 外观设计颜色方案讨论无结论，方案悬而未决 |
| repeated_risk_type_count | base_risk | 03_task_risk_register/base_risks_record_list.json | NO.705 | MTG-CASE-06-06 | NO.705 medium resolved | 技术风险: 硬件方案需要补充，部分接口设计不清晰 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0110 | 2026-01-10T09:00:00+08:00 | cal_case06_evt_0110 项目启动会与技术方案评审 | 项目启动会与技术方案评审 attendees=周牧,李明,王芳,张强,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0120 | 2026-01-20T14:00:00+08:00 | cal_case06_evt_0120 芯片缺货与结构方案评审会 | 芯片缺货与结构方案评审会 attendees=周牧,李明,王芳,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0128 | 2026-01-28T10:00:00+08:00 | cal_case06_evt_0128 结构方案进度跟进会 | 结构方案进度跟进会 attendees=周牧,李明,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0205 | 2026-02-05T10:00:00+08:00 | cal_case06_evt_0205 硬件方案与芯片替代评审会 | 硬件方案与芯片替代评审会 attendees=周牧,王芳,张强,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0212 | 2026-02-12T14:00:00+08:00 | cal_case06_evt_0212 外观设计颜色讨论会 | 外观设计颜色讨论会 attendees=周牧,李明,王芳,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0215 | 2026-02-15T14:00:00+08:00 | cal_case06_evt_0215 外观设计初稿评审会 | 外观设计初稿评审会 attendees=周牧,李明,王芳,张强,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0225 | 2026-02-25T10:00:00+08:00 | cal_case06_evt_0225 外观冻结与进度同步会 | 外观冻结与进度同步会 attendees=周牧,李明,王芳,张强,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0303 | 2026-03-03T10:00:00+08:00 | cal_case06_evt_0303 项目周例会 | 项目周例会 attendees=周牧,李明,王芳,张强,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0305 | 2026-03-05T14:00:00+08:00 | cal_case06_evt_0305 联合调试启动会 | 联合调试启动会 attendees=周牧,王芳,张强,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0315 | 2026-03-15T10:00:00+08:00 | cal_case06_evt_0315 手板供应商问题专题会 | 手板供应商问题专题会 attendees=周牧,李明,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0320 | 2026-03-20T14:00:00+08:00 | cal_case06_evt_0320 供应商价格谈判会 | 供应商价格谈判会 attendees=周牧,刘洋 |
| calendar_stakeholder_coverage_rate | calendar | 06_calendar/calendar_events_instance_view.json | cal_case06_evt_0326 | 2026-03-26T09:00:00+08:00 | cal_case06_evt_0326 手板功能测试结果评审会 | 手板功能测试结果评审会 attendees=周牧,李明,王芳,张强,刘洋 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case06msg0002 | 2026-01-02 09:15 | 周牧 2026-01-02 09:15 | 各位好，桌面机器人项目今天正式启动。项目周期6个月，目标Q2完成小批量试产。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case06msg0004 | 2026-01-02 09:35 | 周牧 2026-01-02 09:35 | 刘洋，你协助我跟进下各节点的进度，每天同步一次。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case06msg0007 | 2026-01-03 10:00 | 周牧 2026-01-03 10:00 | 王芳，硬件方案这边有什么想法吗？ |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case06msg0009 | 2026-01-03 10:20 | 周牧 2026-01-03 10:20 | 好，你整理下各平台的优缺点对比，下周评审会上讨论。 |
| manager_chat_signal_count | chat | 02_chats/im_messages_search_user.json | om_case06msg0011 | 2026-01-03 14:00 | 周牧 2026-01-03 14:00 | 张强，算法这边有什么技术难点吗？ |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0015 | 2026-01-07 22:00 | 周牧 2026-01-07 22:00 | 收到，我看看。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0016 | 2026-01-08 00:15 | 周牧 2026-01-08 00:15 | 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0018 | 2026-01-10 23:30 | 周牧 2026-01-10 23:30 | 李明，结构方案周五前必须给我，不能再拖了。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0026 | 2026-01-15 23:00 | 周牧 2026-01-15 23:00 | 刘洋，帮我跟催下李明的结构方案，周三前必须出终稿。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0045 | 2026-01-23 23:30 | 周牧 2026-01-23 23:30 | 王芳，硬件方案有几个地方需要补充，明天上午给我。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0053 | 2026-01-29 22:30 | 周牧 2026-01-29 22:30 | 收到，我确认下。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0054 | 2026-01-29 23:00 | 周牧 2026-01-29 23:00 | 没问题了，可以进行下一步。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0070 | 2026-02-15 23:30 | 周牧 2026-02-15 23:30 | 李明，外观设计有几个地方需要调整：颜色方案和材质选择，周一前给我。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0073 | 2026-02-17 22:30 | 周牧 2026-02-17 22:30 | 收到，我确认下。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0074 | 2026-02-17 23:00 | 周牧 2026-02-17 23:00 | 没问题了，外观设计可以冻结。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0091 | 2026-02-28 23:30 | 周牧 2026-02-28 23:30 | 收到，我看看。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0092 | 2026-02-28 23:45 | 周牧 2026-02-28 23:45 | 没问题了，继续联调。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0125 | 2026-03-28 22:30 | 周牧 2026-03-28 22:30 | 收到，我看看。 |
| late_night_manager_message_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0126 | 2026-03-28 23:30 | 周牧 2026-03-28 23:30 | 先尝试软件优化，效果不好再考虑增大电池。周五前给我结果。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0018 | 2026-01-10 23:30 | 周牧 2026-01-10 23:30 | 李明，结构方案周五前必须给我，不能再拖了。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0026 | 2026-01-15 23:00 | 周牧 2026-01-15 23:00 | 刘洋，帮我跟催下李明的结构方案，周三前必须出终稿。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0030 | 2026-01-16 09:35 | 周牧 2026-01-16 09:35 | 好，下午必须收到。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0045 | 2026-01-23 23:30 | 周牧 2026-01-23 23:30 | 王芳，硬件方案有几个地方需要补充，明天上午给我。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0070 | 2026-02-15 23:30 | 周牧 2026-02-15 23:30 | 李明，外观设计有几个地方需要调整：颜色方案和材质选择，周一前给我。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0088 | 2026-02-27 17:15 | 周牧 2026-02-27 17:15 | 王芳，你配合张强解决这个问题，这周内必须搞定。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0102 | 2026-03-12 14:10 | 周牧 2026-03-12 14:10 | 这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0121 | 2026-03-26 09:00 | 周牧 2026-03-26 09:00 | 续航必须达标，这个月内解决。张强你评估下优化方案。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0123 | 2026-03-26 09:15 | 周牧 2026-03-26 09:15 | 好，周五前给我方案。 |
| high_pressure_language_sample_rate | chat | 02_chats/im_messages_search_user.json | om_case06msg0126 | 2026-03-28 23:30 | 周牧 2026-03-28 23:30 | 先尝试软件优化，效果不好再考虑增大电池。周五前给我结果。 |

## 指标质量概览

说明：本节汇总硬指标层面的质量统计，例如总指标数、可用数、降级数和无样本数。

| 指标项 | 值 |
| --- | --- |
| sample_counts | {"task_count":40,"risk_count":10,"meeting_count":12,"chat_message_count":127,"calendar_event_count":12,"contact_count":5,"base_history_count":8} |
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
| review_action_task_mapping | medium | 会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载 | Management Reviewer |
| review_data_quality_warnings | medium | 前链路数据质量报告存在 warning，后续结论需要保留置信度说明。 | Capability Assessor, Report Writer |

## 专家结论

说明：本节汇总各专家节点给出的主要判断，并附带原始证据或引用链路。

| 专家 | 序号 | 维度 | 类型 | 置信度 | 结论摘要 | 证据/原文摘录 |
| --- | --- | --- | --- | --- | --- | --- |
| 管理评审专家 | 1 | 方向校准力 | 观察项 | 0.7 | 管理者在阶段复盘会议中，基于测试结果对续航问题做出了明确的优先级判断（软件优化优先），并与项目文档中的风险描述保持一致。但由于缺少完整会议转写，无法评估其对目标、范围的整体校准情况。 | statement:MTG-CASE-06-12-STM-2 (MTG-CASE-06-12) 原文: 续航优化方案评估，软件优化优先。<br>base_record:PJT-CASE-06 (2026-01-01) 原文: 桌面机器人产品研发项目<br>hard_metric:meeting_decision_coverage_rate (2026-05-06T13:06:37.185Z) 原文: 会议决策留痕覆盖率: 12 / 12 = 1; value = meetings_with_decision_trace / total_meetings |
| 管理评审专家 | 2 | 推进闭环力 | 风险 | 0.9 | 当前会议行动项（3条）与任务表关联任务（9条）数量严重不一致，表明会后存在大量任务扩展或重复挂载，任务定义的源头和闭环过程存在混乱风险。同时，项目整体任务延期率（15%）和关闭率（62.5%）表明推进闭环存在压力。 | hard_metric:current_meeting_action_task_rate (2026-05-06T13:06:37.185Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_overdue_rate (2026-05-06T13:06:37.185Z) 原文: 任务延期率: 6 / 40 = 0.15; value = overdue_tasks / tasks_with_due_date<br>hard_metric:task_closure_rate (2026-05-06T13:06:37.185Z) 原文: 任务关闭率: 25 / 40 = 0.625; value = closed_tasks / total_tasks<br>base_task:NO.627 (2026-03-30) 原文: 手板功能测试 owner=张强 status=待开始 DDL=2026-03-30 |
| 风险与行为审计专家 | 1 | 风险治理力 | 观察项 | 0.7 | 风险识别与缓释动作覆盖率高，但存在风险遗留与同类风险复发问题。高等级风险已全部收口，且所有风险均有缓释动作建议。然而，仍有3个中等级风险（外观设计、电池续航、手板延期）处于未收口状态（open/tracking），占风险总数的30%。同时，技术风险（5次）和成本风险（2次）出现多次复发，表明在特定领域（如技术方案、成本控制）的风险预防和根治措施有待加强。 | hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T13:06:37.185Z) 原文: 同类风险复发样本数: 7 = 7; value = sum(count(risk_type) where count(risk_type) > 1)<br>hard_metric:risk_mitigation_action_rate (2026-05-06T13:06:37.185Z) 原文: 风险缓释动作覆盖率: 10 / 10 = 1; value = risks_with_suggested_action / total_risks |
| 风险与行为审计专家 | 2 | 组织行为健康度 | 观察项 | 0.7 | 管理者存在夜间工作与高压语言模式，但缺乏公开负向反馈与会议空转的直接证据。管理者在22:00-08:00时段发送消息占比达23.33%（14条），且其中部分消息包含高压推进语言（如“必须”、“给我”）。高压语言样本占比为16.67%（10条）。聊天记录中未发现公开的负向反馈（如指责、抱怨）。由于缺少当前会议的完整转写，无法评估会议空转情况。组织行为观察需结合具体工作语境进行人工复核。 | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T13:06:37.185Z) 原文: 高压推进语言样本占比: 10 / 60 = 0.1667; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case06msg0016 (2026-01-08 00:15) 原文: 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。 |
| 协同视角专家 | 1 | 协同调度力 | 优势 | 0.9 | 管理者积极跟进风险与阻塞，形成明确的解决路径并指派责任人，有效推动问题解决。 | chat:om_case06msg0102 (2026-03-12 14:10) 原文: 这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。<br>chat:om_case06msg0107 (2026-03-14 10:30) 原文: 价格可以谈，交期不能再延了。你去现场盯着，有问题随时向我汇报。<br>chat:om_case06msg0088 (2026-02-27 17:15) 原文: 王芳，你配合张强解决这个问题，这周内必须搞定。 |
| 协同视角专家 | 2 | 协同调度力 | 风险 | 0.75 | 关键里程碑（手板制作延期）和风险（续航不达标）在会议中被识别，但未在聊天记录中看到向更广泛的必要干系人（如上级领导）进行正式的风险升级或同步。 | statement:MTG-CASE-06-12-STM-1 (MTG-CASE-06-12) 原文: 功能测试整体达标，续航测试差15分钟。<br>chat:om_case06msg0120 (2026-03-26 08:45) 原文: 周经理，功能测试结果出来了，整体达标，但续航测试差了15分钟。<br>[UNRESOLVED_REF] task_NO.626 |
| 协同视角专家 | 3 | 协同调度力 | 观察项 | 0.8 | 管理者频繁发起进度跟进和任务催办，但部分跟进（如周报同步）存在延迟响应，需要管理者反复提醒。 | chat:om_case06msg0039 (2026-01-21 18:30) 原文: 刘洋，本周进度同步呢？怎么还没发？<br>chat:om_case06msg0040 (2026-01-21 18:35) 原文: 周经理抱歉，马上发。<br>chat:om_case06msg0080 (2026-02-23 09:00) 原文: 刘洋，本周进度同步呢？ |

## 风险标记

说明：本节专门列出被显式标记的风险事项，便于快速识别需要优先跟进的问题。

| 标记 ID | 类型 | 严重性 | 置信度 | 需人工复核 | 摘要 | 证据/原文摘录 |
| --- | --- | --- | --- | --- | --- | --- |
| RF-001 | risk_governance | 中 | 0.9 | 是 | 中等级风险遗留问题突出，存在治理延迟风险。风险NO.704（外观设计颜色）、NO.709（电池续航）、NO.710（手板延期）均处于未收口状态（open/tracking），且后两者为当前会议（MTG-CASE-06-12）及近期会议识别，需关注其治理动作的及时性与有效性。 | hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks<br>base_risk:NO.709 (MTG-CASE-06-12) 原文: 电池续航时间低于设计指标15分钟 level=medium followup_status=tracking suggested_action=评估软件功耗优化和电池容量提升两个方案 |
| RF-002 | risk_governance | 中 | 0.9 | 是 | 技术风险高频复发，表明在该领域的风险预防或根治机制可能存在缺陷。项目周期内技术风险累计出现5次，涉及结构方案、硬件方案、兼容性、外观设计、电池续航等多个方面。 | hard_metric:repeated_risk_type_count (2026-05-06T13:06:37.185Z) 原文: 同类风险复发样本数: 7 = 7; value = sum(count(risk_type) where count(risk_type) > 1)<br>base_risk:NO.702 (MTG-CASE-06-03) 原文: 结构方案需要调整，电池仓和散热设计不合理 level=medium followup_status=resolved suggested_action=打回重做，调整电池仓和散热方案<br>base_risk:NO.706 (MTG-CASE-06-09) 原文: 语音模块和主控芯片兼容性问题 level=medium followup_status=resolved suggested_action=调整接口电路，解决兼容性问题 |
| BF-001 | behavior_observation | 中 | 0.8 | 是 | 管理者存在深夜工作沟通与使用高压指令语言的行为模式，可能对团队工作节奏与心理安全产生影响，需结合具体情境进行人工复核。 | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T13:06:37.185Z) 原文: 高压推进语言样本占比: 10 / 60 = 0.1667; value = manager_messages_matching_pressure_keywords / manager_chat_messages<br>chat:om_case06msg0016 (2026-01-08 00:15) 原文: 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。 |

## 能力评分

说明：本节把硬指标和专家判断收敛为维度分数，并解释分数依据、证据和局限性。

| 维度 | 分数 | 置信度 | 评分依据 | 指标证据 | 专家结论证据 | 局限性 |
| --- | --- | --- | --- | --- | --- | --- |
| 方向校准力 | 75 | 0.7 | 基于专家软指标加权评估：判断依据充分度(70)、目标/路径修正清晰度(75)、优先级收敛耗时(65)、方向反复次数(90)。管理者在本次会议中基于具体测试结果（续航差15分钟）做出‘软件优化优先’的清晰判断，并与项目风险文档对齐，展现了基于事实的方向校准能力。历史会议决策留痕覆盖率为100%（meeting_decision_coverage_rate=1），表明决策留痕习惯良好。但存在长期未决问题（如外观颜色方案）影响优先级收敛，且因缺少完整会议转写，对整体方向把控的评估受限。 | hard_metric:meeting_decision_coverage_rate (2026-05-06T13:06:37.185Z) 原文: 会议决策留痕覆盖率: 12 / 12 = 1; value = meetings_with_decision_trace / total_meetings | expert_finding:management_reviewer_result.dimension_findings[0] (MTG-CASE-06-12) 原文: 管理者在阶段复盘会议中，基于测试结果对续航问题做出了明确的优先级判断（软件优化优先），并与项目文档中的风险描述保持一致。但由于缺少完整会议转写，无法评估其对目标、范围的整体校准情况。 | 当前会议缺少完整妙记转写，无法全面评估管理者对项目目标、范围等宏观维度的判断依据和讨论过程。<br>部分软指标（如优先级收敛耗时）为基于风险状态的代理观察，无法精确测量单次会议的共识耗时。 |
| 推进闭环力 | 60 | 0.8 | 综合硬指标与专家发现：任务延期率15%（6/40）、任务关闭率62.5%（25/40）表明推进存在压力。关键风险是会议行动项（3条）与任务表关联任务（9条）严重不匹配（current_meeting_action_task_rate异常），暴露出任务定义源头和闭环流程的混乱。任务定义完整率100%（40/40）和已关闭任务质量代理指标100%（25/25）表明基础任务管理要素齐全且关闭任务有留痕。会议行动项留痕覆盖率为66.7%（8/12），存在提升空间。 | hard_metric:task_overdue_rate (2026-05-06T13:06:37.185Z) 原文: 任务延期率: 6 / 40 = 0.15; value = overdue_tasks / tasks_with_due_date<br>hard_metric:task_closure_rate (2026-05-06T13:06:37.185Z) 原文: 任务关闭率: 25 / 40 = 0.625; value = closed_tasks / total_tasks<br>hard_metric:current_meeting_action_task_rate (2026-05-06T13:06:37.185Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count<br>hard_metric:task_definition_completeness_rate (2026-05-06T13:06:37.185Z) 原文: 任务定义完整率: 40 / 40 = 1; value = tasks_with_task_name_owner_due_date / total_tasks<br>hard_metric:closed_task_quality_rate (2026-05-06T13:06:37.185Z) 原文: 任务关闭质量代理指标: 25 / 25 = 1; value = qualified_closed_tasks / closed_tasks<br>hard_metric:meeting_action_item_coverage_rate (2026-05-06T13:06:37.185Z) 原文: 会议行动项留痕覆盖率: 8 / 12 = 0.6667; value = meetings_with_action_item_count_gt_0 / total_meetings | expert_finding:management_reviewer_result.dimension_findings[1] (MTG-CASE-06-12) 原文: 当前会议行动项（3条）与任务表关联任务（9条）数量严重不一致，表明会后存在大量任务扩展或重复挂载，任务定义的源头和闭环过程存在混乱风险。同时，项目整体任务延期率（15%）和关闭率（62.5%）表明推进闭环存在压力。 | 会议行动项与任务表的严重脱节（3 vs 9）是重大流程风险，其具体原因（会后扩展、重复挂载）需要人工复核澄清。 |
| 风险治理力 | 70 | 0.8 | 综合硬指标与专家软指标：高等级风险收口率100%（2/2）、风险缓释动作覆盖率100%（10/10）表明基础风险识别与应对机制健全。主要短板在于风险未收口占比30%（3/10）和同类风险复发样本数高（7/10，技术风险5次，成本风险2次），表明风险治理的闭环及时性与根治效果不足。专家软指标‘高等级风险识别覆盖率’(100)、‘风险升级及时率’(80)与‘同类风险复发率’(30)共同支撑了该评分，显示在及时应对高风险方面表现良好，但在预防复发和解决中等级遗留风险方面存在明显缺口。 | hard_metric:high_risk_resolution_rate (2026-05-06T13:06:37.185Z) 原文: 高等级风险收口率: 2 / 2 = 1; value = resolved_high_risks / total_high_risks<br>hard_metric:risk_mitigation_action_rate (2026-05-06T13:06:37.185Z) 原文: 风险缓释动作覆盖率: 10 / 10 = 1; value = risks_with_suggested_action / total_risks<br>hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T13:06:37.185Z) 原文: 同类风险复发样本数: 7 = 7; value = sum(count(risk_type) where count(risk_type) > 1) | expert_finding:risk_behavior_auditor_result.dimension_findings[0] (MTG-CASE-06-12) 原文: 风险识别与缓释动作覆盖率高，但存在风险遗留与同类风险复发问题。高等级风险已全部收口，且所有风险均有缓释动作建议。然而，仍有3个中等级风险（外观设计、电池续航、手板延期）处于未收口状态（open/tracking），占风险总数的30%。同时，技术风险（5次）和成本风险（2次）出现多次复发，表明在特定领域（如技术方案、成本控制）的风险预防和根治措施有待加强。 | 风险升级可能通过非记录渠道进行，无法完全捕获。风险分类粒度可能影响复发判断。 |
| 协同调度力 | 80 | 0.8 | 基于专家软指标加权评估：跨角色有效响应平均时长(70)、关键里程碑/风险同步率(60)、依赖澄清效率(85)、阻塞解决成功率(90)。管理者能快速识别阻塞、明确责任、推动解决，依赖澄清效率高，阻塞解决成功率高。日历必要干系人覆盖率100%（12/12）确保核心团队内部协同。主要风险在于关键里程碑变化和重大风险的同步可能仅限于项目核心团队（关键里程碑/风险同步率较低），缺乏向更广泛必要干系人（如上级管理层）进行正式升级或通报的证据。 | hard_metric:calendar_stakeholder_coverage_rate (2026-05-06T13:06:37.185Z) 原文: 日历必要干系人覆盖率: 12 / 12 = 1; value = calendar_events_with_required_stakeholders / total_calendar_events | expert_finding:coordination_lens_result.dimension_findings[0] (MTG-CASE-06-12) 原文: 管理者积极跟进风险与阻塞，形成明确的解决路径并指派责任人，有效推动问题解决。<br>expert_finding:coordination_lens_result.dimension_findings[1] (MTG-CASE-06-12) 原文: 关键里程碑（手板制作延期）和风险（续航不达标）在会议中被识别，但未在聊天记录中看到向更广泛的必要干系人（如上级领导）进行正式的风险升级或同步。 | 无法确认关键里程碑和风险是否已同步给所有必要的项目外干系人（如部门领导、依赖方），存在信息孤岛风险。 |
| 组织行为健康度 | 55 | 0.6 | 基于专家软指标与硬指标观察：管理者非常规时段消息占比23.33%（14/60）、高压推进语言样本占比16.67%（10/60）表明存在夜间工作与高压指令沟通模式。专家软指标‘高风险语言触发频次’(40)、‘深夜高压催办比例’(35)评分较低，而‘公开负向反馈比例’(95)较高，表明工作反馈多针对具体问题，未发现公开人身攻击。‘会议空转率’(50)因缺少会议转写而置信度极低。整体行为模式可能潜在地影响团队健康度，需结合具体项目压力背景进行人工语境复核。 | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T13:06:37.185Z) 原文: 高压推进语言样本占比: 10 / 60 = 0.1667; value = manager_messages_matching_pressure_keywords / manager_chat_messages | expert_finding:risk_behavior_auditor_result.dimension_findings[1] (MTG-CASE-06-12) 原文: 管理者存在夜间工作与高压语言模式，但缺乏公开负向反馈与会议空转的直接证据。管理者在22:00-08:00时段发送消息占比达23.33%（14条），且其中部分消息包含高压推进语言（如“必须”、“给我”）。高压语言样本占比为16.67%（10条）。聊天记录中未发现公开的负向反馈（如指责、抱怨）。由于缺少当前会议的完整转写，无法评估会议空转情况。组织行为观察需结合具体工作语境进行人工复核。 | 组织行为判断高度依赖语境。关键词命中不能直接等同于不当管理行为，需结合具体工作压力、项目阶段和团队文化进行人工复核。<br>缺少当前会议完整转录，无法评估会议效率（空转率）。 |

| 总分 | 置信度 | 主要优势 | 主要风险 | 总结 |
| --- | --- | --- | --- | --- |
| 68 | 0.7 | 风险治理基础扎实：高等级风险全部收口，所有风险均有缓释动作建议。<br>协同调度主动高效：能快速识别阻塞、明确责任、推动解决，依赖澄清效率高。<br>决策留痕习惯良好：历史会议决策留痕覆盖率达100%。 | 推进闭环流程混乱：会议行动项与任务表严重脱节（3 vs 9），任务定义源头不清，是重大流程风险。<br>风险根治效果不足：技术、成本类风险高频复发，且存在中等级风险遗留未决（占比30%）。<br>组织行为模式需关注：存在夜间工作与高压指令沟通模式，可能潜在地影响团队健康度，需人工复核语境。 | 管理者周牧在PJT-CASE-06项目MTG-CASE-06-12会议期间的表现呈现混合特征。在方向校准上，能基于事实做出清晰判断；在风险治理和协同调度方面，展现了扎实的基础能力和高效的解决推动力。然而，推进闭环流程存在严重脱节和混乱，是当前最突出的管理风险。同时，风险根治效果不足和组织行为中的高压模式是需要持续关注和改进的领域。由于关键证据（完整会议转写）缺失及部分行为观察需语境复核，整体评估置信度有所降级。 |

## 报告观测

说明：本节展示最终报告模块本身的产出状态和内容规模，帮助判断报告是否完整。

| 字段 | 值 |
| --- | --- |
| 标题 | 周牧 MTG-CASE-06-12 周报评估 |
| 类型 | weekly_report |
| 状态 | 降级 |
| 人工复核项数 | 10 |
| 关键证据数 | 5 |
| 风险提醒数 | 5 |
| 下一步动作数 | 5 |
| 回写字段键 | manager_id, project_id, report_status, fallback_reason |

## 报告内容与证据

说明：本节把最终报告中的各个组成部分逐条展开，并展示每条内容背后的证据引用。

| 报告部分 | 序号 | 内容 | 证据/原文摘录 |
| --- | --- | --- | --- |
| 评分概览 | 1 | {"dimension":"方向校准力","level":"dimension_score","content":"方向校准力 75 分","evidence_refs":[{"source_type":"statement","source_file":"04_meetings/base_statements_record_list.json","source_id":"MTG-CASE-06-12-STM-1","timestamp":"MTG-CASE-06-12","excerpt":"功能测试整体达标，续航测试差15分钟。","evidence_note":"提供了续航问题的具体数据，是后续判断的基础。"},{"source_type":"statement","source_file":"04_meetings/base_statements_record_list.json","source_id":"MTG-CASE-06-12-STM-2","timestamp":"MTG-CASE-06-12","excerpt":"续航优化方案评估，软件优化优先。","evidence_note":"管理者基于测试结果做出的明确方向判断。"}]} | statement:MTG-CASE-06-12-STM-1 (MTG-CASE-06-12) 原文: 功能测试整体达标，续航测试差15分钟。<br>statement:MTG-CASE-06-12-STM-2 (MTG-CASE-06-12) 原文: 续航优化方案评估，软件优化优先。 |
| 评分概览 | 2 | {"dimension":"推进闭环力","level":"dimension_score","content":"推进闭环力 60 分","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics","source_id":"task_overdue_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.15, calculation.expression = \"6 / 40\"","evidence_note":"metric_id=task_overdue_rate, formula=value = overdue_tasks / tasks_with_due_date, calculation.expression=6 / 40, value=0.15。表明有15%的任务已延期。"},{"source_type":"hard_metric","source_file":"hard_metrics","source_id":"task_closure_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.625, calculation.expression = \"25 / 40\"","evidence_note":"metric_id=task_closure_rate, formula=value = closed_tasks / total_tasks, calculation.expression=25 / 40, value=0.625。表明任务关闭率为62.5%。"}]} | hard_metric:task_overdue_rate (2026-05-06T13:06:37.185Z) 原文: 任务延期率: 6 / 40 = 0.15; value = overdue_tasks / tasks_with_due_date<br>hard_metric:task_closure_rate (2026-05-06T13:06:37.185Z) 原文: 任务关闭率: 25 / 40 = 0.625; value = closed_tasks / total_tasks |
| 评分概览 | 3 | {"dimension":"风险治理力","level":"dimension_score","content":"风险治理力 70 分","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.3, numerator = 3, denominator = 10, anomalies = [\"NO.704 open\", \"NO.709 tracking\", \"NO.710 tracking\"]","evidence_note":"metric_id=open_risk_rate, formula=open_or_tracking_risks / total_risks, calculation.expression=3 / 10, value=0.3。显示有3个风险未收口。"},{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"repeated_risk_type_count","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 7, numerator = 7, denominator = 10, anomalies = [\"技术风险:5\", \"成本风险:2\"]","evidence_note":"metric_id=repeated_risk_type_count, formula=sum(count(risk_type) where count(risk_type) > 1), calculation.expression=7, value=7。显示技术风险复发5次，成本风险复发2次。"}]} | hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks<br>hard_metric:repeated_risk_type_count (2026-05-06T13:06:37.185Z) 原文: 同类风险复发样本数: 7 = 7; value = sum(count(risk_type) where count(risk_type) > 1) |
| 评分概览 | 4 | {"dimension":"协同调度力","level":"dimension_score","content":"协同调度力 80 分","evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case06msg0102","timestamp":"2026-03-12 14:10","excerpt":"这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。","evidence_note":"针对手板供应商CNC精度问题，管理者（周牧）立即决策更换供应商，并明确指派刘洋为责任方，展示快速调度。"},{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case06msg0088","timestamp":"2026-02-27 17:15","excerpt":"王芳，你配合张强解决这个问题，这周内必须搞定。","evidence_note":"针对联合调试中的兼容性问题，管理者（周牧）明确责任方（王芳）和配合方（张强），并设定明确时限，展示依赖澄清效率。"}]} | chat:om_case06msg0102 (2026-03-12 14:10) 原文: 这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。<br>chat:om_case06msg0088 (2026-02-27 17:15) 原文: 王芳，你配合张强解决这个问题，这周内必须搞定。 |
| 评分概览 | 5 | {"dimension":"组织行为健康度","level":"dimension_score","content":"组织行为健康度 55 分","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"late_night_manager_message_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.2333, numerator = 14, denominator = 60, anomalies = [\"2026-01-08 00:15 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。\", ...]","evidence_note":"metric_id=late_night_manager_message_rate, formula=manager_messages_between_22_00_and_08_00 / manager_chat_messages, calculation.expression=14 / 60, value=0.2333。显示管理者在非常规时段发送消息比例较高。"},{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"high_pressure_language_sample_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.1667, numerator = 10, denominator = 60, anomalies = [\"2026-01-10 23:30 李明，结构方案周五前必须给我，不能再拖了。\", ...]","evidence_note":"metric_id=high_pressure_language_sample_rate, formula=manager_messages_matching_pressure_keywords / manager_chat_messages, calculation.expression=10 / 60, value=0.1667。显示管理者消息中规则命中的高压语言样本比例。"}]} | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T13:06:37.185Z) 原文: 高压推进语言样本占比: 10 / 60 = 0.1667; value = manager_messages_matching_pressure_keywords / manager_chat_messages |
| 关键证据 | 1 | {"dimension":"方向校准力","level":"evidence","content":"功能测试整体达标，续航测试差15分钟。","evidence_refs":[{"source_type":"statement","source_file":"04_meetings/base_statements_record_list.json","source_id":"MTG-CASE-06-12-STM-1","timestamp":"MTG-CASE-06-12","excerpt":"功能测试整体达标，续航测试差15分钟。","evidence_note":"提供了续航问题的具体数据，是后续判断的基础。"}]} | statement:MTG-CASE-06-12-STM-1 (MTG-CASE-06-12) 原文: 功能测试整体达标，续航测试差15分钟。 |
| 关键证据 | 2 | {"dimension":"推进闭环力","level":"evidence","content":"value = 0.15, calculation.expression = \"6 / 40\"","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics","source_id":"task_overdue_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.15, calculation.expression = \"6 / 40\"","evidence_note":"metric_id=task_overdue_rate, formula=value = overdue_tasks / tasks_with_due_date, calculation.expression=6 / 40, value=0.15。表明有15%的任务已延期。"}]} | hard_metric:task_overdue_rate (2026-05-06T13:06:37.185Z) 原文: 任务延期率: 6 / 40 = 0.15; value = overdue_tasks / tasks_with_due_date |
| 关键证据 | 3 | {"dimension":"风险治理力","level":"evidence","content":"value = 0.3, numerator = 3, denominator = 10, anomalies = [\"NO.704 open\", \"NO.709 tracking\", \"NO.710 tracking\"]","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.3, numerator = 3, denominator = 10, anomalies = [\"NO.704 open\", \"NO.709 tracking\", \"NO.710 tracking\"]","evidence_note":"metric_id=open_risk_rate, formula=open_or_tracking_risks / total_risks, calculation.expression=3 / 10, value=0.3。显示有3个风险未收口。"}]} | hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks |
| 关键证据 | 4 | {"dimension":"协同调度力","level":"evidence","content":"这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。","evidence_refs":[{"source_type":"chat","source_file":"02_chats/im_messages_search_user.json","source_id":"om_case06msg0102","timestamp":"2026-03-12 14:10","excerpt":"这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。","evidence_note":"针对手板供应商CNC精度问题，管理者（周牧）立即决策更换供应商，并明确指派刘洋为责任方，展示快速调度。"}]} | chat:om_case06msg0102 (2026-03-12 14:10) 原文: 这个问题很严重，必须更换供应商。刘洋你去联系备选供应商。 |
| 关键证据 | 5 | {"dimension":"组织行为健康度","level":"evidence","content":"value = 0.2333, numerator = 14, denominator = 60, anomalies = [\"2026-01-08 00:15 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。\", ...]","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"late_night_manager_message_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.2333, numerator = 14, denominator = 60, anomalies = [\"2026-01-08 00:15 李明，结构方案有几个问题：电池仓设计不合理，散热方案需要优化。不能用，打回重做。\", ...]","evidence_note":"metric_id=late_night_manager_message_rate, formula=manager_messages_between_22_00_and_08_00 / manager_chat_messages, calculation.expression=14 / 60, value=0.2333。显示管理者在非常规时段发送消息比例较高。"}]} | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages |
| 风险提醒 | 1 | {"dimension":"方向校准力","level":"medium","content":"当前会议缺完整妙记转写，关键语义判断需人工确认上下文。","evidence_refs":[{"source_type":"planner_slice","source_file":"input","source_id":"human_review_rules","timestamp":"","excerpt":"当前会议缺完整妙记转写，关键语义判断需人工确认上下文。","evidence_note":"来自planner_slice中human_review_rules的明确要求。"},{"source_type":"current_meeting","source_file":"input","source_id":"missing_fields","timestamp":"","excerpt":"[\"meeting_docs.current_transcript\"]","evidence_note":"当前会议记录中明确缺少完整转写。"}]} | [UNRESOLVED_REF] human_review_rules<br>[UNRESOLVED_REF] missing_fields |
| 风险提醒 | 2 | {"dimension":"推进闭环力","level":"medium","content":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_refs":[{"source_type":"planner_slice","source_file":"input","source_id":"human_review_rules","timestamp":"","excerpt":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_note":"来自planner_slice中human_review_rules的明确要求。"},{"source_type":"hard_metric","source_file":"hard_metrics","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"anomalies = [\"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载\"]","evidence_note":"硬指标异常明确指出了行动项与任务数量不匹配的问题。"}]} | [UNRESOLVED_REF] human_review_rules<br>hard_metric:current_meeting_action_task_rate (2026-05-06T13:06:37.185Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count |
| 风险提醒 | 3 | {"dimension":"组织行为健康度","level":"medium","content":"管理者存在深夜工作沟通与使用高压指令语言的行为模式，可能对团队工作节奏与心理安全产生影响，需结合具体情境进行人工复核。","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"late_night_manager_message_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.2333, numerator = 14, denominator = 60","evidence_note":"metric_id=late_night_manager_message_rate, value=0.2333，显示管理者23.33%的消息在非常规时段发送。"},{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"high_pressure_language_sample_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.1667, numerator = 10, denominator = 60","evidence_note":"metric_id=high_pressure_language_sample_rate, value=0.1667，显示16.67%的消息命中高压语言关键词。"}]} | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T13:06:37.185Z) 原文: 高压推进语言样本占比: 10 / 60 = 0.1667; value = manager_messages_matching_pressure_keywords / manager_chat_messages |
| 风险提醒 | 4 | {"dimension":"风险治理力","level":"medium","content":"中等级风险遗留问题突出，存在治理延迟风险。风险NO.704（外观设计颜色）、NO.709（电池续航）、NO.710（手板延期）均处于未收口状态（open/tracking），需关注其治理动作的及时性与有效性。","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.3, numerator = 3, denominator = 10, anomalies = [\"NO.704 open\", \"NO.709 tracking\", \"NO.710 tracking\"]","evidence_note":"metric_id=open_risk_rate, value=0.3，明确列出三个未收口风险。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"NO.709","timestamp":"MTG-CASE-06-12","excerpt":"电池续航时间低于设计指标15分钟 followup_status=tracking risk_level=medium","evidence_note":"风险NO.709在当前会议MTG-CASE-06-12中被识别并标记为tracking。"}]} | hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks<br>base_risk:NO.709 (MTG-CASE-06-12) 原文: 电池续航时间低于设计指标15分钟 level=medium followup_status=tracking suggested_action=评估软件功耗优化和电池容量提升两个方案 |
| 风险提醒 | 5 | {"dimension":"协同调度力","level":"medium","content":"需要人工复核：关键里程碑（手板制作延期）和重大风险（续航不达标、供应商成本增加）是否已按照组织要求，同步给项目外的必要干系人（如部门总监、产品线负责人、财务部门）？当前证据仅显示在项目核心团队内部同步。","evidence_refs":[{"source_type":"coordination_context","source_file":"internal_context","source_id":"task_NO.626","timestamp":"2026-03-26","excerpt":"{\"id\": \"NO.626\", \"task_name\": \"手板制作\", \"status\": \"进行中\", \"is_closed\": \"false\", \"is_overdue\": \"true\", \"due_date\": \"2026-03-25\"}","evidence_note":"手板制作任务已逾期，是关键里程碑延期。"},{"source_type":"statement","source_file":"04_meetings/base_statements_record_list.json","source_id":"MTG-CASE-06-12-STM-1","timestamp":"MTG-CASE-06-12","excerpt":"功能测试整体达标，续航测试差15分钟。","evidence_note":"续航不达标是当前会议识别的重大技术风险。"}]} | [UNRESOLVED_REF] task_NO.626<br>statement:MTG-CASE-06-12-STM-1 (MTG-CASE-06-12) 原文: 功能测试整体达标，续航测试差15分钟。 |
| 下一步动作 | 1 | {"dimension":"方向校准力","level":"medium","content":"当前会议缺完整妙记转写，关键语义判断需人工确认上下文。","evidence_refs":[{"source_type":"planner_slice","source_file":"input","source_id":"human_review_rules","timestamp":"","excerpt":"当前会议缺完整妙记转写，关键语义判断需人工确认上下文。","evidence_note":"来自planner_slice中human_review_rules的明确要求。"},{"source_type":"current_meeting","source_file":"input","source_id":"missing_fields","timestamp":"","excerpt":"[\"meeting_docs.current_transcript\"]","evidence_note":"当前会议记录中明确缺少完整转写。"}]} | [UNRESOLVED_REF] human_review_rules<br>[UNRESOLVED_REF] missing_fields |
| 下一步动作 | 2 | {"dimension":"推进闭环力","level":"medium","content":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_refs":[{"source_type":"planner_slice","source_file":"input","source_id":"human_review_rules","timestamp":"","excerpt":"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载","evidence_note":"来自planner_slice中human_review_rules的明确要求。"},{"source_type":"hard_metric","source_file":"hard_metrics","source_id":"current_meeting_action_task_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"anomalies = [\"会议行动项 3 条，任务表关联 9 条，存在会后扩展任务或重复挂载\"]","evidence_note":"硬指标异常明确指出了行动项与任务数量不匹配的问题。"}]} | [UNRESOLVED_REF] human_review_rules<br>hard_metric:current_meeting_action_task_rate (2026-05-06T13:06:37.185Z) 原文: 当前会议行动项入表率: 3 / 3 = 1; value = min(tasks_linked_to_current_meeting, current_meeting_action_item_count) / current_meeting_action_item_count |
| 下一步动作 | 3 | {"dimension":"组织行为健康度","level":"medium","content":"管理者存在深夜工作沟通与使用高压指令语言的行为模式，可能对团队工作节奏与心理安全产生影响，需结合具体情境进行人工复核。","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"late_night_manager_message_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.2333, numerator = 14, denominator = 60","evidence_note":"metric_id=late_night_manager_message_rate, value=0.2333，显示管理者23.33%的消息在非常规时段发送。"},{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"high_pressure_language_sample_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.1667, numerator = 10, denominator = 60","evidence_note":"metric_id=high_pressure_language_sample_rate, value=0.1667，显示16.67%的消息命中高压语言关键词。"}]} | hard_metric:late_night_manager_message_rate (2026-05-06T13:06:37.185Z) 原文: 管理者非常规时段消息占比: 14 / 60 = 0.2333; value = manager_messages_between_22_00_and_08_00 / manager_chat_messages<br>hard_metric:high_pressure_language_sample_rate (2026-05-06T13:06:37.185Z) 原文: 高压推进语言样本占比: 10 / 60 = 0.1667; value = manager_messages_matching_pressure_keywords / manager_chat_messages |
| 下一步动作 | 4 | {"dimension":"风险治理力","level":"medium","content":"中等级风险遗留问题突出，存在治理延迟风险。风险NO.704（外观设计颜色）、NO.709（电池续航）、NO.710（手板延期）均处于未收口状态（open/tracking），需关注其治理动作的及时性与有效性。","evidence_refs":[{"source_type":"hard_metric","source_file":"hard_metrics_result","source_id":"open_risk_rate","timestamp":"2026-01-01 ~ 2026-03-26","excerpt":"value = 0.3, numerator = 3, denominator = 10, anomalies = [\"NO.704 open\", \"NO.709 tracking\", \"NO.710 tracking\"]","evidence_note":"metric_id=open_risk_rate, value=0.3，明确列出三个未收口风险。"},{"source_type":"base_risk","source_file":"03_task_risk_register/base_risks_record_list.json","source_id":"NO.709","timestamp":"MTG-CASE-06-12","excerpt":"电池续航时间低于设计指标15分钟 followup_status=tracking risk_level=medium","evidence_note":"风险NO.709在当前会议MTG-CASE-06-12中被识别并标记为tracking。"}]} | hard_metric:open_risk_rate (2026-05-06T13:06:37.185Z) 原文: 风险未收口占比: 3 / 10 = 0.3; value = open_or_tracking_risks / total_risks<br>base_risk:NO.709 (MTG-CASE-06-12) 原文: 电池续航时间低于设计指标15分钟 level=medium followup_status=tracking suggested_action=评估软件功耗优化和电池容量提升两个方案 |
| 下一步动作 | 5 | {"dimension":"协同调度力","level":"medium","content":"需要人工复核：关键里程碑（手板制作延期）和重大风险（续航不达标、供应商成本增加）是否已按照组织要求，同步给项目外的必要干系人（如部门总监、产品线负责人、财务部门）？当前证据仅显示在项目核心团队内部同步。","evidence_refs":[{"source_type":"coordination_context","source_file":"internal_context","source_id":"task_NO.626","timestamp":"2026-03-26","excerpt":"{\"id\": \"NO.626\", \"task_name\": \"手板制作\", \"status\": \"进行中\", \"is_closed\": \"false\", \"is_overdue\": \"true\", \"due_date\": \"2026-03-25\"}","evidence_note":"手板制作任务已逾期，是关键里程碑延期。"},{"source_type":"statement","source_file":"04_meetings/base_statements_record_list.json","source_id":"MTG-CASE-06-12-STM-1","timestamp":"MTG-CASE-06-12","excerpt":"功能测试整体达标，续航测试差15分钟。","evidence_note":"续航不达标是当前会议识别的重大技术风险。"}]} | [UNRESOLVED_REF] task_NO.626<br>statement:MTG-CASE-06-12-STM-1 (MTG-CASE-06-12) 原文: 功能测试整体达标，续航测试差15分钟。 |

## 观测体系告警

说明：本节只记录观测体系自身的问题，例如缺失产物、无法解引用、证据字段异常等。

| 严重性 | 类别 | 说明 | 相关 ID |
| --- | --- | --- | --- |
| warning | unresolved_reference | 协同视角专家 finding #2 could not resolve ref: task_NO.626 | 协同视角专家 finding #2, task_NO.626 |
| warning | unresolved_reference | report_risk_alert:1 could not resolve ref: human_review_rules | report_risk_alert:1, human_review_rules |
| warning | unresolved_reference | report_risk_alert:1 could not resolve ref: missing_fields | report_risk_alert:1, missing_fields |
| warning | unresolved_reference | report_risk_alert:2 could not resolve ref: human_review_rules | report_risk_alert:2, human_review_rules |
| warning | unresolved_reference | report_risk_alert:5 could not resolve ref: task_NO.626 | report_risk_alert:5, task_NO.626 |
| warning | unresolved_reference | report_next_action:1 could not resolve ref: human_review_rules | report_next_action:1, human_review_rules |
| warning | unresolved_reference | report_next_action:1 could not resolve ref: missing_fields | report_next_action:1, missing_fields |
| warning | unresolved_reference | report_next_action:2 could not resolve ref: human_review_rules | report_next_action:2, human_review_rules |
| warning | unresolved_reference | report_next_action:5 could not resolve ref: task_NO.626 | report_next_action:5, task_NO.626 |

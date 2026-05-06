# MVP Gaps And Next Steps For Agents

更新时间：2026-05-05

本文档只回答一个问题：**按我们当前 MVP 方案，项目还差什么、差在整个工作流的哪个节点、下一步该做什么。**

如果你是后续接手的 Agent，请先读这个文件，再决定改哪里。不要一上来重写已有 Agent 链路；当前主要缺口在“输出层适配、证据下钻、人审收敛、飞书多维表格写回和系统级呈现”。

## 1. 当前 MVP 目标工作流

```text
0. Human / Admin 选择评估对象、周期、项目范围
   ↓
1. Data Input / Front Pipeline
   会议、文档、Base、聊天、日历、通讯录进入
   ↓
2. Input Completeness & Data Quality
   输入完整性、数据覆盖、缺失、降级判断
   ↓
3. Fact Pack / History Bundle
   当前会议事实包、历史上下文、原始 payload
   ↓
4. Hard Metrics Engine
   可硬算指标、样本量、分子分母、异常样本
   ↓
5. Evaluation Planner
   本轮评估维度、降级策略、人审规则
   ↓
6. Expert Agents
   Management Reviewer / Risk Behavior Auditor / Coordination Lens
   ↓
7. Capability Assessor
   五维汇总、整体结论、置信度、人审项
   ↓
8. Consistency Judge
   去重、冲突判断、置信度收敛、人审项归并
   ↓
9. Report Writer
   正式报告 JSON、摘要、证据摘要、建议动作、Base 回写建议
   ↓
10. Output Workbench Adapter
   转成最终飞书评审工作台表结构
   ↓
11. Feishu Base Writeback
   写入多维表格记录、关联记录、报告状态、人审状态
   ↓
12. App Page / Dashboard / Views
   人员总览、评审首页、BI 看板、人审队列、证据下钻
   ↓
13. Human Review / Approval
   复核、补证、驳回、修改、签字
   ↓
14. Next Cycle Learning
   历史结论、复核结果、反馈进入下一周期
```

## 2. 总体缺口地图

| 缺口 | 所在节点 | 当前状态 | 影响 | 下一步产物 |
| --- | --- | --- | --- | --- |
| 最终输出层适配器缺失 | 10. Output Workbench Adapter | 只有旧 CSV 写回脚本 | 现有 JSON 无法直接落到最终 7 张评审表 | `output_workbench_adapter.js` |
| `evidence_index` 未拆表 | 8-10. Consistency / Adapter | 证据嵌在 `evidence_refs_json` 中 | 无法实现证据溯源、权限状态、冲突下钻 | `evidence_index.records.json` |
| `review_items` 未归并 | 8. Consistency Judge | 各 Agent 分散生成人审项 | 重复、冲突、低置信项难以形成工单队列 | `review_items.records.json` |
| Consistency Judge 节点缺失 | 8. Consistency Judge | 没有独立实现 | Report Writer 前缺少统一收敛层 | `consistency_judge_result.json` |
| 最终 7 张表 schema 缺失 | 10. Adapter | 只有 Agent 链路 schema | 无法校验工作台写回结构 | `output_workbench_records.schema.json` |
| 真实飞书写回缺失 | 11. Feishu Base Writeback | 只生成 CSV，不写真实 Base | 多维表格无法自动承接最终结果 | `write_output_workbench_to_feishu.js` 或 CLI 写回脚本 |
| 关联记录写回缺失 | 11. Feishu Base Writeback | 旧 CSV 无关联字段 | 下钻链路断裂 | link field 写回策略 |
| 人审状态流转未闭环 | 13. Human Review / Approval | 只有 pending CSV | 复核、补证、驳回、签字不能联动报告状态 | 人审状态同步策略 |
| 系统级页面配置缺失 | 12. App Page / Dashboard / Views | Base 表已可设计，应用页面未落地 | 评审看到的是表，不是工作台 | 应用首页 / Dashboard 配置手册或搭建结果 |
| 测试体系缺失 | 全链路 | 当前无 `tests/` | 改动容易破坏 demo 输出 | schema + adapter 测试 |

## 3. 分节点缺口与下一步

### 3.1 节点 0：Human / Admin 选择评估对象

已有：

- `task_request.json` 中已有 `evaluation_target.manager_id`、`manager_name`、`project_id`、`evaluation_period`、`current_meeting_id`。
- `front_pipeline.js` 可以构建评估任务请求。

缺口：

- 缺少系统级“人员池 / 中层总览”的输入承接。
- 当前更像单项目单负责人 demo，不像一轮评估周期中的人员列表。

下一步：

- 在输出层适配器中生成 `people_overview.records.json`。
- 从 `task_request.evaluation_target` 映射出 `person_id`、`中层姓名`、`项目范围`、`是否纳入本轮评估`。
- 后续真实生产中再接组织/人员底表，不要在本 MVP 里强行搭完整组织架构。

建议产物：

```text
data/outputs/demo/case04/output_workbench/people_overview.records.json
```

### 3.2 节点 1-3：Data Input / Front Pipeline / Fact Pack

已有：

- `front_pipeline.js`
- `task_request.json`
- `raw_payload.json`
- `meeting_fact_pack.json`
- `history_bundle.json`
- `input_completeness_report.json`
- `data_quality_report.json`

缺口：

- 这些产物主要服务 Agent 分析，不是最终评审展示。
- 数据覆盖信息没有被转换成 `evaluation_runs` 和 `metric_results` 可读字段。
- 原始 payload 不应整包写入最终 Base，但其中的来源信息需要被抽取到证据索引。

下一步：

- 抽取数据覆盖摘要到 `evaluation_runs.数据覆盖等级`、`evaluation_runs.数据覆盖摘要`。
- 抽取各数据源质量到 `metric_results.数据源`、`metric_results.数据源质量`。
- 抽取可引用来源到 `evidence_index`，但不要写入原始聊天全文、会议全文。

建议产物：

```text
evaluation_runs.records.json
metric_results.records.json
evidence_index.records.json
```

### 3.3 节点 4：Hard Metrics Engine

已有：

- `hard_metrics_result.json`
- `hard_metrics_result.schema.json`
- `src/domain/evaluation/hard_metrics_engine.js`
- 旧 CSV：`metric_results.csv`

缺口：

- 当前旧 `metric_results.csv` 字段偏工程输出，未完全对齐最终 `metric_results` 表。
- 缺少统一字段：`指标类型`、`判断结果`、`指标状态`、`缺失率`、`数据源质量`、`是否降级`、`是否纳入主评分`、`关联证据`。
- `evidence_refs_json` 还没有拆成独立证据记录。

下一步：

- 将 `hard_metrics_result.hard_metrics_result` 映射到最终 `metric_results.records.json`。
- 为每条指标生成稳定 `metric_result_id`。
- 从 metric 的 `evidence_refs` 中提取证据，写入 `evidence_index.records.json`。
- 保留 `numerator`、`denominator`、`calculation.expression`，可放入 `计算口径` 或展示字段中。

建议字段映射：

| 当前字段 | 目标表字段 |
| --- | --- |
| `metric_id` / `metric_label` | `指标名称` |
| `value` | `指标值` |
| `unit` | `指标值文本` 或 `指标单位` |
| `status` | `指标状态` / `判断结果` |
| `numerator` / `denominator` | `计算口径` |
| `sample_scope` | `样本量` / `计算口径` |
| `evidence_refs_json` | `关联证据` |

### 3.4 节点 5：Evaluation Planner

已有：

- `evaluation_plan.json`
- `evaluation_plan.schema.json`
- `src/domain/evaluation/evaluation_planner.js`

缺口：

- 评估规划输出没有直接转成工作台可读的“启用维度”“降级策略”“人审规则”。
- 当前适合 Agent 消费，不适合评审入口展示。

下一步：

- 把 `evaluation_focus` 映射到 `evaluation_runs.启用维度`。
- 把降级和人审规则摘要映射到 `evaluation_runs.备注` 或 `dimension_results.边界说明`。
- 不要把完整 planner JSON 写入 Base。

建议产物：

```text
evaluation_runs.records.json
dimension_results.records.json
```

### 3.5 节点 6：Expert Agents

已有：

- `management_reviewer_result.json`
- `risk_behavior_auditor_result.json`
- `coordination_lens_result.json`
- 三类 Agent 都会产出 `dimension_findings` 和 `human_review_items`。

缺口：

- Expert findings 当前适合内部分析，不适合作为最终表结构直接写回。
- 多 Agent 的人审项可能重复或冲突。
- findings 到证据索引的关联还没有标准化。

下一步：

- 将 Expert findings 作为 `dimension_results.关键发现`、`关键证据摘要`、`建议动作` 的候选来源。
- 将 findings 中的 `evidence_refs` 拆入 `evidence_index`。
- 将 findings 中触发的 `human_review_items` 统一交给 Consistency Judge 归并。

不要做：

- 不要把所有 expert finding 原样塞入 Base。
- 不要将 Expert Agent 的低置信判断直接写成正式维度结论。

### 3.6 节点 7：Capability Assessor

已有：

- `capability_assessor_result.json`
- `dimension_scores`
- `overall_assessment`
- `human_review_items`
- `missing_upstream_results`

缺口：

- `dimension_scores` 与最终 `dimension_results` 字段还没有标准映射。
- `overall_assessment` 与 `evaluation_runs` 还没有标准映射。
- 人审项仍未去重、未统一分类。

下一步：

- 将 `dimension_scores` 映射到 `dimension_results.records.json`。
- 将 `overall_assessment` 映射到 `evaluation_runs`。
- 将 `human_review_items` 交给 Consistency Judge。

建议字段映射：

| 当前字段 | 目标表字段 |
| --- | --- |
| `dimension` | `维度名称` |
| `score` | `维度分数` |
| `confidence` | `置信度` |
| `score_basis` | `核心结论` / `关键发现` |
| `limitations` | `边界说明` |
| `evidence_quotes` | `关联证据` |

### 3.7 节点 8：Consistency Judge

已有：

- 无独立节点。
- 低置信、人审项和证据冲突分散在各 Agent 输出中。

缺口：

- 无去重。
- 无冲突收敛。
- 无统一复核类型。
- 无统一 `是否允许报告生效` 规则。
- 无“仅观察 / 无法判断 / 需补证”的最终收口层。

下一步：

新增 Consistency Judge，输入：

```text
management_reviewer_result.json
risk_behavior_auditor_result.json
coordination_lens_result.json
capability_assessor_result.json
hard_metrics_result.json
data_quality_report.json
```

输出：

```text
consistency_judge_result.json
```

建议输出字段：

```json
{
  "evaluation_id": "",
  "judge_status": "passed|review_required|needs_evidence|blocked",
  "confidence_summary": {},
  "deduped_review_items": [],
  "evidence_conflicts": [],
  "low_confidence_items": [],
  "observation_only_items": [],
  "report_effective_policy": {
    "allow_report_finalize": false,
    "blocking_review_item_ids": []
  }
}
```

这是当前最关键的缺失节点之一。

### 3.8 节点 9：Report Writer

已有：

- `report_writer.js`
- `report_result.json`
- `report_status`
- `summary`
- `score_overview`
- `key_evidence`
- `risk_alerts`
- `human_review_items`
- `next_actions`
- `base_writeback_payload`

缺口：

- Report Writer 现在直接接 Capability Assessor 和专家结果，缺少 Consistency Judge 的收敛结果。
- `base_writeback_payload` 不是最终 7 张工作台表结构。
- 没有生成飞书文档正文，只是生成报告 JSON。

下一步：

- 修改 Report Writer 的输入，增加 `consistency_judge_result`。
- 报告中必须展示数据覆盖、低置信、降级、人审状态。
- `base_writeback_payload` 后续可弱化，主要由 Output Workbench Adapter 统一生成写回记录。

短期可以不改 Report Writer 主逻辑，先在 Adapter 层兼容现有 `report_result.json`。

### 3.9 节点 10：Output Workbench Adapter

已有：

- 无最终版本。
- 只有旧脚本 `scripts/dev/write_feishu_base_csv.js`。

缺口：

- 这是当前最需要补的工程节点。
- 没有把现有 JSON 转成最终 7 张工作台表。

下一步：

新增：

```text
src/workflows/output_workbench_adapter.js
scripts/demo/run_output_workbench_adapter.js
schemas/output_workbench_records.schema.json
```

输入目录：

```text
data/outputs/demo/case04/current
```

输出目录：

```text
data/outputs/demo/case04/output_workbench
```

输出文件：

```text
people_overview.records.json
evaluation_runs.records.json
dimension_results.records.json
metric_results.records.json
review_items.records.json
evidence_index.records.json
workspace_home.records.json
```

优先级最高。

### 3.10 节点 11：Feishu Base Writeback

已有：

- 旧 CSV 生成。
- 当前没有真实写入飞书多维表格的项目内脚本。

缺口：

- 不支持真实 Base record upsert。
- 不支持 link 字段。
- 不支持写回失败状态。
- 不支持写回日志。

下一步：

第一阶段先不直接写飞书，先输出标准 records JSON。

第二阶段新增写回脚本：

```text
scripts/dev/write_output_workbench_to_feishu.js
```

建议支持：

- `--input-dir`
- `--base-token`
- `--dry-run`
- `--write`
- `--identity user|bot`

写回顺序：

```text
people_overview
-> evaluation_runs
-> dimension_results
-> metric_results
-> evidence_index
-> review_items
-> 回填关联字段
```

注意：关联字段必须等目标记录都创建后再回填。

### 3.11 节点 12：App Page / Dashboard / Views

已有：

- 仓库内无页面配置。
- 外部飞书多维表格已按方案搭过部分表结构和仪表盘，但不应硬编码进仓库。

缺口：

- 没有应用首页配置文件。
- 没有仪表盘配置说明。
- 没有视图配置说明。
- 没有页面层验收清单。

下一步：

新增一个配置说明文档，而不是代码强绑：

```text
docs/product/feishu_workbench_page_config.md
```

内容包含：

- 首页卡片区。
- KPI 区。
- 数据覆盖区。
- 人审队列区。
- 证据下钻区。
- 每个组件绑定哪张表/哪个视图。

如果后续使用浏览器进入飞书应用搭建器代搭页面，以该文档作为操作清单。

### 3.12 节点 13：Human Review / Approval

已有：

- `human_review_items` 字段和 CSV。
- 报告中能列出人审项。

缺口：

- 缺少完整复核状态流转。
- 缺少复核人、复核备注、复核时间、是否允许报告生效。
- 缺少复核项和证据、维度、指标之间的关联。
- 缺少复核结果反向影响报告状态的机制。

下一步：

- 在 `review_items.records.json` 中补齐字段：
  - `复核类型`
  - `系统初判`
  - `触发原因`
  - `证据摘要`
  - `建议处理`
  - `复核状态`
  - `复核人`
  - `复核备注`
  - `是否允许报告生效`
  - `关联证据`
  - `关联报告`
- 暂时不做自动工作流联动，先把状态字段打通。

### 3.13 节点 14：Next Cycle Learning

已有：

- PRD 中有持续追踪与反馈学习设想。
- 旧结构里有 `FeedbackLogs` 概念。

缺口：

- 当前最终工作台 MVP 暂不落 `feedback_logs` 表。
- 没有复核结果回流训练/阈值调优逻辑。

下一步：

- 本 MVP 只保留 `review_items` 的最终处理结果。
- 后续再决定是否新增 `feedback_logs`。
- 不要在当前阶段引入复杂离线评测平台。

## 4. 立即下一步建议

如果只能做一件事，先做：

```text
Output Workbench Adapter
```

原因：

- 现有 Agent 链路已经能产出 demo 结果。
- 飞书多维表格已经有目标结构思路。
- 现在最大断点是“结果 JSON 不能自然落表”。
- 补齐 Adapter 后，后续 Consistency Judge、Base 写回、页面呈现都有稳定输入。

建议拆成 5 个小任务：

1. 定义 `output_workbench_records.schema.json`。
2. 实现 `output_workbench_adapter.js`，先只处理 case04/current。
3. 从 `evidence_refs` 中生成 `evidence_index.records.json`。
4. 从各 Agent 和报告结果中生成 `review_items.records.json`。
5. 新增 `run_output_workbench_adapter.js`，输出到 `data/outputs/demo/case04/output_workbench`。

## 5. 验收标准

输出层适配器完成后，至少满足：

- 能从 `data/outputs/demo/case04/current` 生成 6 到 7 个 records JSON。
- 每条 `dimension_results` 有 `evaluation_id`、`维度名称`、`维度等级/分数`、`置信度`、`核心结论`。
- 每条 `metric_results` 有 `指标名称`、`指标值/文本`、`样本量或计算口径`、`数据源质量`。
- 每条 `review_items` 有 `复核类型`、`触发原因`、`复核状态`、`关联证据`。
- 每条 `evidence_index` 有 `evidence_id`、`来源类型`、`证据片段`、`证据质量`、`权限状态`。
- 不写入原始聊天全文、会议全文、prompt、推理过程。
- 所有低置信、需补证、证据冲突事项能在 `review_items` 中看到。

## 6. 不要做的事

- 不要重写五维评估体系。
- 不要为了展示效果绕过证据链。
- 不要把旧 CSV 表结构当作最终工作台结构。
- 不要把 `report_items.csv` 直接当作 `evidence_index`。
- 不要把 Agent 原始全量 JSON 写进 Base。
- 不要在没有权限/字段确认的情况下直接写真实飞书 Base。
- 不要在 MVP 阶段做完整绩效系统、横向排名或组织级正式结论。

## 7. 推荐文件落点

建议后续新增文件：

```text
schemas/output_workbench_records.schema.json
src/workflows/output_workbench_adapter.js
scripts/demo/run_output_workbench_adapter.js
scripts/dev/write_output_workbench_csv.js
docs/product/feishu_workbench_page_config.md
```

建议输出目录：

```text
data/outputs/demo/case04/output_workbench/
```

建议不要修改：

```text
data/outputs/demo/legacy/
```

建议保留兼容：

```text
scripts/dev/write_feishu_base_csv.js
```

可以新增新脚本，不要直接破坏旧 demo 流程。


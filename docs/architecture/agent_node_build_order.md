# Agent Node Build Order

本文档记录当前按 PRD 架构逐个生成的节点状态。

## 1. Master Orchestrator

状态：prompt 已更新为全局总控。

位置：

- `docs/prompts/front_pipeline_system_prompts.md`
- `schemas/orchestration_state.schema.json`

职责：

- 接收任务、调度节点、维护 `orchestration_state`
- 处理继续、降级、阻断、人审、报告和回写状态
- 不替代专家 Agent 做事实判断、能力评分或人审签字

## 2. Input Completeness Check

状态：已实现。

位置：

- `src/workflows/front_pipeline.js`
- `schemas/input_completeness_report.schema.json`

输出：

- `input_completeness_report`

运行：

```powershell
npm run front:case04
```

## 3. Data Collector

状态：已实现。

位置：

- `src/integrations/sample_case04_adapter.js`
- `src/workflows/front_pipeline.js`
- `schemas/raw_payload.schema.json`
- `schemas/history_bundle.schema.json`
- `schemas/meeting_fact_pack.schema.json`
- `schemas/data_quality_report.schema.json`

输出：

- `raw_payload`
- `history_bundle`
- `meeting_fact_pack`
- `data_quality_report`

运行：

```powershell
npm run front:case04
```

## 4. Hard Metrics Engine

状态：已实现。

位置：

- `src/domain/evaluation/hard_metrics_engine.js`
- `scripts/demo/run_hard_metrics.js`
- `schemas/hard_metrics_result.schema.json`

输入：

- `meeting_fact_pack`
- `history_bundle`
- `raw_payload`

输出：

- `hard_metrics_result`
- `metric_quality_report`
- `metric_gaps`
- `anomaly_samples`

运行：

```powershell
npm run metrics:case04
```

当前 Case 04 指标：

- 共生成 15 个确定性指标。
- 指标覆盖方向校准力、推进闭环力、风险治理力、协同调度力、组织行为健康度。
- 每个指标都包含分子、分母、时间窗、样本口径、缺口、异常样本和证据引用。

## 5. Evaluation Planner

状态：已实现。

位置：

- `src/domain/evaluation/evaluation_planner.js`
- `scripts/demo/run_evaluation_planner.js`
- `schemas/evaluation_plan.schema.json`

输入：

- `task_request`
- `meeting_fact_pack`
- `history_bundle`
- `raw_payload`
- `data_quality_report`
- `input_completeness_report`
- `hard_metrics_result`

输出：

- `evaluation_focus`
- `execution_plan`
- `human_review_rules`

运行：

```powershell
npm run plan:case04
```

当前 Case 04 规划结果：

- 执行模式：`full_evaluation`
- 高优先维度：推进闭环力、风险治理力、组织行为健康度
- 中优先维度：方向校准力、协同调度力
- 专家 Agent：Management Reviewer、Risk & Behavior Auditor、Coordination Lens
- 收口 Agent：Capability Assessor、Report Writer
- 人审规则：缺完整转写、组织行为语境、高等级风险未收口、行动项映射异常、数据质量 warning

## 6. Management Reviewer

状态：已生成 request builder、system prompt、schema 和 CLI 入口。

位置：

- `docs/prompts/front_pipeline_system_prompts.md`
- `src/agents/management_reviewer.js`
- `scripts/demo/run_management_reviewer.js`
- `schemas/management_reviewer_request.schema.json`
- `schemas/management_reviewer_result.schema.json`

输入：

- `meeting_fact_pack`
- `history_bundle`
- `hard_metrics_result`
- `evaluation_plan`

输出：

- `dimension_findings`
- `human_review_items`
- `management_review_summary`

运行：

```powershell
npm run review:management:case04
```

当前 Case 04 request：

- 重点维度：方向校准力、推进闭环力
- 硬指标：7 个
- 人审规则：缺完整转写、行动项映射异常
- 默认只构建 request；需要真实调用模型时使用 `--call-model`

## 7. Risk & Behavior Auditor

状态：已生成 request builder、system prompt、schema 和 CLI 入口。

位置：

- `docs/prompts/front_pipeline_system_prompts.md`
- `src/agents/risk_behavior_auditor.js`
- `scripts/demo/run_risk_behavior_auditor.js`
- `schemas/risk_behavior_auditor_request.schema.json`
- `schemas/risk_behavior_auditor_result.schema.json`

输入：

- `meeting_fact_pack`
- `history_bundle`
- `raw_payload`
- `hard_metrics_result`
- `evaluation_plan`

输出：

- `dimension_findings`
- `risk_flags`
- `human_review_items`
- `risk_behavior_summary`

运行：

```powershell
npm run audit:risk-behavior:case04
```

当前 Case 04 request：

- 重点维度：风险治理力、组织行为健康度
- 硬指标：6 个
- 人审规则：3 条
- 默认只构建 request；需要真实调用模型时使用 `--call-model`

## 8. Coordination Lens

状态：已生成 request builder、system prompt、schema 和 CLI 入口。

位置：

- `docs/prompts/front_pipeline_system_prompts.md`
- `src/agents/coordination_lens.js`
- `scripts/demo/run_coordination_lens.js`
- `schemas/coordination_lens_request.schema.json`
- `schemas/coordination_lens_result.schema.json`

输入：

- `meeting_fact_pack`
- `raw_payload`
- `hard_metrics_result`
- `evaluation_plan`

输出：

- `dimension_findings`
- `human_review_items`
- `coordination_summary`

运行：

```powershell
npm run review:coordination:case04
```

当前 Case 04 request：

- 重点维度：协同调度力
- 硬指标：2 个
- 人审规则：0 条
- 默认只构建 request；需要真实调用模型时使用 `--call-model`

## 9. Capability Assessor

状态：已生成 Case 04 五维 request builder、system prompt、schema 和 CLI 入口；当前因专家结果未产出而显式阻断。

位置：

- `docs/prompts/front_pipeline_system_prompts.md`
- `src/agents/capability_assessor.js`
- `scripts/demo/run_capability_assessor.js`
- `schemas/capability_assessor_request.schema.json`
- `schemas/capability_assessor_result.schema.json`

输入：

- `meeting_fact_pack`
- `hard_metrics_result`
- `evaluation_plan`
- `input_completeness_report`
- `data_quality_report`
- `management_reviewer_result`
- `risk_behavior_auditor_result`
- `coordination_lens_result`

输出：

- `dimension_scores`
- `overall_assessment`
- `human_review_items`
- `missing_upstream_results`

运行：

```powershell
npm run assess:capability:case04
```

当前 Case 04 状态：

- readiness：`blocked`
- 缺失：`management_reviewer_result`、`risk_behavior_auditor_result`、`coordination_lens_result`
- 硬指标：15 个
- 人审规则：2 条

## 10. Report Writer

状态：已生成 Case 04 request builder、system prompt、schema 和 CLI 入口；当前跟随 Capability Assessor 显式阻断。

位置：

- `docs/prompts/front_pipeline_system_prompts.md`
- `src/agents/report_writer.js`
- `scripts/demo/run_report_writer.js`
- `schemas/report_writer_request.schema.json`
- `schemas/report_result.schema.json`

输入：

- `capability_assessor_result`
- `evaluation_plan`
- `hard_metrics_result`
- `meeting_fact_pack`
- 各专家 Agent 的 summary 和人审项

输出：

- `report_status`
- `summary`
- `score_overview`
- `key_evidence`
- `risk_alerts`
- `human_review_items`
- `next_actions`
- `base_writeback_payload`

运行：

```powershell
npm run report:case04
```

当前 Case 04 状态：

- readiness：`blocked`
- 缺失：`capability_assessor_result_ready`

## Next

下一步：接真实模型执行层或 mock 专家结果。

可选路径：

- 接入 `--call-model` 生成三个专家结果，再跑 Capability 和 Report
- 先补 mock result fixtures，用于端到端 schema 与 report contract 测试

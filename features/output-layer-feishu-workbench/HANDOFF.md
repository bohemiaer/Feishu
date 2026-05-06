# Output Layer Feature Handoff

## Feature Name

`output-layer-feishu-workbench`

## Goal

Make Feishu Bitable the final review workspace for middle-management evaluation results.

## Final Product Principle

The final product is the Feishu Bitable workspace:

```text
structured results
-> review dashboard
-> dimension drilldown
-> metric/data quality
-> evidence trace
-> human review status
```

Report Writer output is only a candidate readable source. The final user-facing output must come from the Bitable workspace after Output Gate and writeback mapping.

## Upstream Dependencies

| Upstream Item | Required | Notes |
|---|---|---|
| `capability_assessor_result.json` | Yes | Source for five dimensions, scores, confidence, conclusions |
| `hard_metrics_result.json` | Yes | Source for metric results, sample size, data quality |
| `report_result.json` | Optional | Use only if not degraded; fallback text should not become user-facing summary |
| `data_quality_report.json` | Yes | Source for coverage and boundary notes |
| `input_completeness_report.json` | Yes | Source for missing data and review triggers |
| Agent evidence refs | Yes | Source for `evidence_index` |

## Output Artifacts

| Artifact | Purpose |
|---|---|
| `output_layer_input.json` | Single standard input for the Feishu output layer |
| `workspace_home.csv` | System home/navigation entries |
| `people_overview.csv` | People-level review entry |
| `evaluation_runs.csv` | Single evaluation package |
| `dimension_results.csv` | Five-dimension judgement rows |
| `metric_results.csv` | Metric and data coverage rows |
| `review_items.csv` | Human review work items |
| `evidence_index.csv` | Evidence trace rows |

## Field Policy

### Keep User-Facing

| Category | Examples |
|---|---|
| Status | 报告状态, 签字状态, 人工复核要求 |
| Scores | 综合评分, 维度分数, 加权得分, 置信度 |
| Coverage | 数据覆盖等级, 样本量, 缺失率, 数据源质量 |
| Judgement | 核心结论, 建议动作, 边界说明 |
| Drilldown | 关联指标, 关联复核项, 关联证据 |
| Review action | 复核状态, 复核备注, 是否允许报告生效 |

### Hide Or Remove From User Views

| Category | Examples |
|---|---|
| Backend IDs | `evaluation_id`, `metric_result_id`, `evidence_id` |
| Agent traces | `management_reviewer_result.dimension_findings[0]` |
| Local paths | `04_meetings/base_meetings_record_list.json` |
| Raw formulas | `value = ...`, `expression: ...`, `sample_scope: ...` |
| Duplicate person fields | `所属人员` when `中层姓名` exists |

## Current UI Decisions

| Decision | Status |
|---|---|
| `所属部门` stays even if currently blank | Confirmed |
| `review_items` is the only human update entry | Confirmed |
| Single-person Review Packet is dashboard-first | Confirmed |
| Feishu Doc/PDF report is optional, not required for MVP | Confirmed |
| Free-form bot intent parsing is not the MVP default | Confirmed |

## Known Feishu API Limitations

Some view filters and field deletions may return:

```text
OpenAPIUpdateViewFilter limited
OpenAPIDeleteField limited
```

When this happens, do not fake success. Mark the item as requiring manual UI configuration.

## Next Implementation Tasks

| Priority | Task | Owner Area |
|---|---|---|
| P0 | Keep `output_layer_input.json` as the only standard input for Bitable writeback | Output Gate |
| P0 | Ensure fallback Report Writer text never becomes user-facing summary | Output Gate |
| P0 | Keep five-dimension confidence at dimension level only | Dimension results |
| P0 | Finish manual filters for views blocked by Feishu API | Bitable UI |
| P1 | Convert raw metric formulas into Chinese calculation口径 | Metric results |
| P1 | Replace English status prefixes with pure Chinese labels where safe | UX cleanup |
| P1 | Define bot/form request payload as upstream contract | Integration contract |


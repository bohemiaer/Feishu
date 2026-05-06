# Feature: Output Layer Feishu Workbench

## Scope

This feature owns the final output layer for the Manager Insight MVP.

It turns validated Agent results into a Feishu Bitable review workspace. The workspace is the final user-facing product. It is not a temporary export, not a standalone web page, and not a long-form report generator.

## What This Feature Owns

| Area | Owner Scope | Output |
|---|---|---|
| Output Gate input | Define the final structured input after Report Writer and consistency checks | `output_layer_input.json` |
| Feishu Bitable mapping | Map final output into Feishu Bitable tables | 7-table writeback package |
| Review workspace | Keep user-facing tables, views, filters, dashboard links, and drilldown paths readable | Feishu Bitable workspace |
| Human review loop | Define where reviewers update status and how results return to the output layer | `review_items` as the only human update surface |
| Evidence drilldown | Preserve evidence snippets, source quality, permission state, and original links | `evidence_index` |
| Dashboard handoff | Define what the personal Review Packet dashboard should show | Single-person review dashboard contract |

## What This Feature Does Not Own

| Out Of Scope | Reason |
|---|---|
| Feishu bot implementation | Bot is an upstream trigger. This feature only defines the payload contract it should send. |
| Natural language intent parsing | MVP should prefer form/card fields. Parsing can be a later upstream feature. |
| Raw Agent reasoning storage | Final workspace must not expose prompts, reasoning traces, or raw JSON payloads. |
| Full Feishu App Builder page | Current MVP uses Bitable tables, dashboards, views, and record drilldown. |
| Formal PDF or standalone Feishu Doc report | Optional future archive format. Current final product is Bitable. |
| larksuitecli changes | CLI repo is protected and should not be modified for this feature. |

## Current Feishu Workspace

| Item | Value |
|---|---|
| Base token | `Z6d9bO5UqajK01swK9CcoGU9nkf` |
| Workspace URL | `https://jcneyh7qlo8i.feishu.cn/base/Z6d9bO5UqajK01swK9CcoGU9nkf` |
| Personal dashboard | `单人评估看板` |
| Personal dashboard URL | `https://jcneyh7qlo8i.feishu.cn/base/Z6d9bO5UqajK01swK9CcoGU9nkf?dashboard=blkwsVk95GtFvTLA` |

## Final Bitable Tables

| User-Facing Name | Internal Table | Role |
|---|---|---|
| 系统首页 | `workspace_home` | Front-door navigation for evaluators |
| 人员评估总览 | `people_overview` | People-level review entry |
| 单人评估包 | `evaluation_runs` | Evaluation package record and dashboard source |
| 五维结论 | `dimension_results` | Dimension-level judgement and drilldown |
| 五维评审 | `metric_results` | Metric values, data coverage, quality, degradation |
| 人工复核 | `review_items` | Human review workflow and only manual update surface |
| 证据索引 | `evidence_index` | Evidence drilldown, source quality, permission state |

## User Path

```text
系统首页
-> 人员评估总览
-> 单人评估看板
-> 五维结论
-> 五维评审 / 人工复核 / 证据索引
```

The user should feel they are using a review workspace, not operating seven backend tables.

## Human Review Rule

Reviewers update only `人工复核 / review_items`.

Allowed manual fields:

| Field | Purpose |
|---|---|
| `复核状态` | Main review workflow state |
| `复核人` | Reviewer assignment |
| `复核备注` | Human judgement and explanation |
| `复核时间` | Review completion timestamp |
| `是否允许报告生效` | Whether the evaluation package can take effect |

All other tables should be updated by the writeback adapter after review results are collected.

## Bot Trigger Contract

The bot or form is upstream. It should send structured fields, not rely on free-form parsing.

Recommended request payload:

```json
{
  "source": "feishu_bot_or_form",
  "request_id": "REQ-YYYYMMDD-001",
  "manager_name": "陈昊",
  "manager_user_id": "",
  "period_start": "2026-04-13",
  "period_end": "2026-04-24",
  "project_scope": "PJT-CASE-04",
  "requested_by": "",
  "run_mode": "run_now"
}
```

This feature consumes the final evaluated result. It does not implement the bot UI.

## Merge Boundary

Future GitHub merge should treat this folder as the feature handoff boundary for output-layer work.

Expected related implementation paths:

| Path | Purpose |
|---|---|
| `schemas/output_layer_input.schema.json` | Standard input schema for the output layer |
| `scripts/dev/build_output_layer_input.js` | Builds final output-layer input from upstream Agent results |
| `scripts/dev/write_feishu_base_csv.js` | Generates local Feishu Bitable writeback package |
| `scripts/dev/publish_feishu_base_output.js` | Publishes structured results to Feishu Bitable |
| `scripts/dev/rebuild_person_review_packet_dashboard_v2.js` | Maintains the personal Review Packet dashboard |


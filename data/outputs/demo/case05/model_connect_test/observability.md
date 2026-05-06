# Run Observability

Generated at: 2026-05-06T10:02:16.603Z

## Run Summary

| Field | Value |
| --- | --- |
| Run Status | completed |
| Call Model | true |
| Trigger Type | manual |
| Selected Meeting | MTG-CASE-05-03 |
| Total Duration (ms) | 650348 |
| Front Status | collected |
| Completeness Status | ready |
| Fallback Used | false |
| Selection Attempts | 1 |
| Error |  |

## Pipeline Nodes

| Node | Status | Duration (ms) | Observable Counts |
| --- | --- | --- | --- |
| Front Pipeline | collected/ready | 446 | blocking=0, degrade=0 |
| Hard Metrics | ready | 2 | metrics=15, available=15, degraded=0 |
| Evaluation Planner | full_evaluation | 1 | focus=5, agents=5, review_rules=5 |

## Agent Runs

| Agent | Status | Model | Duration (ms) | Req Bytes | Resp Bytes | Findings | Human Review | Other Counts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Management Reviewer | completed | true | 92467 | 39168 | 6883 | 3 | 2 | metrics=7, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Risk & Behavior Auditor | completed | true | 148507 | 42216 | 11207 | 4 | 2 | metrics=6, risk_flags=3, scores=0, key_evidence=0, next_actions=0 |
| Coordination Lens | completed | true | 83592 | 35663 | 6701 | 3 | 1 | metrics=2, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Capability Assessor | degraded | true | 208451 | 55699 | 17946 | 0 | 5 | metrics=15, risk_flags=0, scores=5, key_evidence=0, next_actions=0 |
| Report Writer | degraded | true | 292891 | 63135 | 23522 | 0 | 5 | metrics=0, risk_flags=0, scores=0, key_evidence=3, next_actions=4 |

## Data Counts

| Metric | Count |
| --- | --- |
| source_catalog_count | 7 |
| chat_message_count | 50 |
| calendar_event_count | 3 |
| org_contact_count | 5 |
| project_doc_count | 3 |
| meeting_doc_count | 3 |
| base_history_count | 8 |
| recent_meeting_count | 2 |
| risk_history_count | 8 |
| action_item_count | 2 |
| decision_count | 3 |
| meeting_risk_count | 3 |
| provenance_ref_count | 9 |
| hard_metric_count | 15 |
| hard_metric_available_count | 15 |
| hard_metric_degraded_count | 0 |
| hard_metric_no_sample_count | 0 |
| anomaly_sample_count | 8 |
| metric_gap_count | 0 |
| planner_focus_count | 5 |
| planner_agent_count | 5 |
| human_review_rule_count | 5 |
| data_quality_warning_count | 2 |
| data_quality_issue_count | 0 |

## Observability Warnings

No observability warnings.

## Meeting Selection Attempts

| Meeting ID | Status | Completeness | Blocking Reasons |
| --- | --- | --- | --- |
| MTG-CASE-05-03 | collected | ready | 0 |

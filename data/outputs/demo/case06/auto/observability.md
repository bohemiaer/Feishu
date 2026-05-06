# Run Observability

Generated at: 2026-05-06T13:20:58.503Z

## Run Summary

| Field | Value |
| --- | --- |
| Run Status | completed |
| Call Model | true |
| Trigger Type | manual |
| Selected Meeting | MTG-CASE-06-12 |
| Total Duration (ms) | 861405 |
| Front Status | collected |
| Completeness Status | ready |
| Fallback Used | false |
| Selection Attempts | 1 |
| Error |  |

## Pipeline Nodes

| Node | Status | Duration (ms) | Observable Counts |
| --- | --- | --- | --- |
| Front Pipeline | collected/ready | 97 | blocking=0, degrade=0 |
| Hard Metrics | ready | 3 | metrics=15, available=15, degraded=0 |
| Evaluation Planner | full_evaluation | 1 | focus=5, agents=5, review_rules=4 |

## Agent Runs

| Agent | Status | Model | Duration (ms) | Req Bytes | Resp Bytes | Findings | Human Review | Other Counts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Management Reviewer | completed | true | 187404 | 46417 | 13346 | 2 | 2 | metrics=7, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Risk & Behavior Auditor | completed | true | 283216 | 77056 | 23515 | 2 | 2 | metrics=6, risk_flags=3, scores=0, key_evidence=0, next_actions=0 |
| Coordination Lens | completed | true | 187063 | 67573 | 14512 | 3 | 1 | metrics=2, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Capability Assessor | degraded | true | 271349 | 100490 | 24296 | 0 | 5 | metrics=15, risk_flags=0, scores=5, key_evidence=0, next_actions=0 |
| Report Writer | degraded | true | 306694 | 232749 | 61683 | 0 | 10 | metrics=0, risk_flags=0, scores=0, key_evidence=5, next_actions=5 |

## Data Counts

| Metric | Count |
| --- | --- |
| source_catalog_count | 7 |
| chat_message_count | 127 |
| calendar_event_count | 12 |
| org_contact_count | 5 |
| project_doc_count | 3 |
| meeting_doc_count | 3 |
| base_history_count | 8 |
| recent_meeting_count | 3 |
| risk_history_count | 8 |
| action_item_count | 3 |
| decision_count | 1 |
| meeting_risk_count | 3 |
| provenance_ref_count | 9 |
| hard_metric_count | 15 |
| hard_metric_available_count | 15 |
| hard_metric_degraded_count | 0 |
| hard_metric_no_sample_count | 0 |
| anomaly_sample_count | 40 |
| metric_gap_count | 0 |
| planner_focus_count | 5 |
| planner_agent_count | 5 |
| human_review_rule_count | 4 |
| data_quality_warning_count | 1 |
| data_quality_issue_count | 0 |

## Observability Warnings

No observability warnings.

## Meeting Selection Attempts

| Meeting ID | Status | Completeness | Blocking Reasons |
| --- | --- | --- | --- |
| MTG-CASE-06-12 | collected | ready | 0 |

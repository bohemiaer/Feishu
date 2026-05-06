# Run Observability

Generated at: 2026-05-05T07:58:22.659Z

## Run Summary

| Field | Value |
| --- | --- |
| Run Status | degraded |
| Call Model | false |
| Trigger Type | manual |
| Selected Meeting | MTG-CASE-05-01 |
| Total Duration (ms) | 103 |
| Front Status | collected |
| Completeness Status | degraded |
| Fallback Used | true |
| Selection Attempts | 3 |
| Error |  |

## Pipeline Nodes

| Node | Status | Duration (ms) | Observable Counts |
| --- | --- | --- | --- |
| Front Pipeline | collected/degraded | 88 | blocking=0, degrade=1 |
| Hard Metrics | ready | 3 | metrics=15, available=15, degraded=0 |
| Evaluation Planner | degraded_evaluation | 1 | focus=5, agents=5, review_rules=4 |

## Agent Runs

| Agent | Status | Model | Duration (ms) | Req Bytes | Resp Bytes | Findings | Human Review | Other Counts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Management Reviewer | skipped_model_disabled | false | 0 | 39293 | 0 | 0 | 0 | metrics=7, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Risk & Behavior Auditor | skipped_model_disabled | false | 0 | 38267 | 0 | 0 | 0 | metrics=6, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Coordination Lens | skipped_model_disabled | false | 0 | 35573 | 0 | 0 | 0 | metrics=2, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Capability Assessor | blocked | false | 0 | 31276 | 457 | 0 | 0 | metrics=15, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |
| Report Writer | blocked | false | 0 | 34995 | 407 | 0 | 0 | metrics=0, risk_flags=0, scores=0, key_evidence=0, next_actions=0 |

## Data Counts

| Metric | Count |
| --- | --- |
| source_catalog_count | 7 |
| chat_message_count | 50 |
| calendar_event_count | 3 |
| org_contact_count | 5 |
| project_doc_count | 3 |
| meeting_doc_count | 3 |
| base_history_count | 0 |
| recent_meeting_count | 2 |
| risk_history_count | 0 |
| action_item_count | 3 |
| decision_count | 3 |
| meeting_risk_count | 3 |
| provenance_ref_count | 8 |
| hard_metric_count | 15 |
| hard_metric_available_count | 15 |
| hard_metric_degraded_count | 0 |
| hard_metric_no_sample_count | 0 |
| anomaly_sample_count | 8 |
| metric_gap_count | 0 |
| planner_focus_count | 5 |
| planner_agent_count | 5 |
| human_review_rule_count | 4 |
| data_quality_warning_count | 1 |
| data_quality_issue_count | 0 |

## Meeting Selection Attempts

| Meeting ID | Status | Completeness | Blocking Reasons |
| --- | --- | --- | --- |
| MTG-CASE-05-03 | blocked | blocked | 1 |
| MTG-CASE-05-02 | blocked | blocked | 1 |
| MTG-CASE-05-01 | collected | degraded | 0 |

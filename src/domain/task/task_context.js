"use strict";

const TASK_STATUS = Object.freeze({
  PENDING: "pending",
  COLLECTED: "collected",
  METRICS_READY: "metrics_ready",
  PLANNED: "planned",
  EXPERT_ANALYZED: "expert_analyzed",
  ASSESSED: "assessed",
  REPORTED: "reported",
  DEGRADED: "degraded",
  FAILED: "failed"
});

const AGENT_NAMES = Object.freeze({
  DATA_COLLECTOR: "data_collector",
  HARD_METRICS_ENGINE: "hard_metrics_engine",
  EVALUATION_PLANNER: "evaluation_planner",
  MANAGEMENT_REVIEWER: "management_reviewer",
  RISK_BEHAVIOR_AUDITOR: "risk_behavior_auditor",
  COORDINATION_LENS: "coordination_lens",
  CAPABILITY_ASSESSOR: "capability_assessor",
  REPORT_WRITER: "report_writer"
});

function createTaskContext(input) {
  return {
    task_id: input.task_id,
    project_id: input.project_id,
    manager_id: input.manager_id,
    meeting_id: input.meeting_id,
    evaluation_period: input.evaluation_period || "unknown",
    status: input.status || TASK_STATUS.PENDING,
    created_at: input.created_at || new Date().toISOString(),
    updated_at: input.updated_at || new Date().toISOString()
  };
}

module.exports = {
  AGENT_NAMES,
  TASK_STATUS,
  createTaskContext
};

"use strict";

const TASK_STATUS = Object.freeze({
  PENDING: "pending",
  COLLECTED: "collected",
  VERIFIED: "verified",
  REVIEWED: "reviewed",
  EVALUATED: "evaluated",
  REPORTED: "reported",
  DEGRADED: "degraded",
  FAILED: "failed"
});

const AGENT_NAMES = Object.freeze({
  DATA_COLLECTOR: "data_collector",
  EVIDENCE_VERIFIER: "evidence_verifier",
  REVIEW_ENGINE: "review_engine",
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

"use strict";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function flattenMetrics(hardMetricsResult) {
  return Object.entries(hardMetricsResult && hardMetricsResult.hard_metrics_result || {})
    .flatMap(([, metrics]) => asArray(metrics));
}

function pushIssue(issues, issue) {
  issues.push({
    severity: issue.severity || "warning",
    category: issue.category || "unknown",
    message: asText(issue.message),
    related_ids: asArray(issue.related_ids).map((item) => asText(item)).filter(Boolean)
  });
}

function dedupeIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    const key = JSON.stringify(issue);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectObservabilityIssues({ missingArtifacts = [], hardMetricsResult = null, unresolvedRefs = [] } = {}) {
  const issues = [];

  asArray(missingArtifacts).forEach((artifactName) => {
    pushIssue(issues, {
      severity: "warning",
      category: "missing_artifact",
      message: `Missing artifact: ${artifactName}`,
      related_ids: [artifactName]
    });
  });

  flattenMetrics(hardMetricsResult).forEach((metric) => {
    asArray(metric.evidence_refs).forEach((ref, index) => {
      if (!asText(ref && ref.source_id)) {
        pushIssue(issues, {
          severity: "warning",
          category: "metric_evidence_missing_source_id",
          message: `${metric.metric_id} evidence_refs[${index}] is missing source_id`,
          related_ids: [metric.metric_id, asText(ref && ref.source_file), asText(ref && ref.evidence_label)]
        });
      }
      if (!asText(ref && ref.excerpt)) {
        pushIssue(issues, {
          severity: "warning",
          category: "metric_evidence_missing_excerpt",
          message: `${metric.metric_id} evidence_refs[${index}] is missing excerpt`,
          related_ids: [metric.metric_id, asText(ref && ref.source_file), asText(ref && ref.source_id)]
        });
      }
    });

    asArray(metric.anomalies).forEach((detail) => {
      if (/\bundefined\b|\bnull\b/i.test(asText(detail))) {
        pushIssue(issues, {
          severity: "warning",
          category: "metric_anomaly_unresolved_token",
          message: `${metric.metric_id} anomaly contains unresolved token: ${detail}`,
          related_ids: [metric.metric_id]
        });
      }
    });
  });

  asArray(unresolvedRefs).forEach((item) => {
    pushIssue(issues, {
      severity: "warning",
      category: "unresolved_reference",
      message: `${asText(item.context) || "evidence"} could not resolve ref: ${asText(item.ref)}`,
      related_ids: [asText(item.context), asText(item.ref)].filter(Boolean)
    });
  });

  return dedupeIssues(issues);
}

module.exports = {
  collectObservabilityIssues,
  flattenMetrics
};

"use strict";

const fs = require("fs");
const path = require("path");
const { DIMENSION_WEIGHTS_PERCENT, weightedScore } = require("./dimension_weights");

const BASE_URL = "https://jcneyh7qlo8i.feishu.cn/base/Z6d9bO5UqajK01swK9CcoGU9nkf";

const TABLE_LINKS = {
  people_overview: `${BASE_URL}?table=tblfQS3bHVLNavvZ`,
  evaluation_runs: `${BASE_URL}?table=tblcGy0h0fx4pIoG`,
  dimension_results: `${BASE_URL}?table=tblMUq8orwwRSi1c`,
  metric_results: `${BASE_URL}?table=tbldjPFXVZ4PD9RJ`,
  review_items: `${BASE_URL}?table=tblShT3KAkGRjj1T`,
  evidence_index: `${BASE_URL}?table=tblQenU1BAdECcY2`
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    args[key] = value;
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath, fallback = {}) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

function unique(values) {
  return [...new Set((values || []).filter((value) => value !== undefined && value !== null && value !== ""))];
}

function stableId(...parts) {
  return parts
    .filter((part) => part !== undefined && part !== null && String(part).trim() !== "")
    .map((part) => String(part).trim().replace(/[^\p{L}\p{N}_-]+/gu, "_"))
    .join("-");
}

function splitPeriod(period) {
  const [start = "", end = ""] = String(period || "").split("~").map((item) => item.trim());
  return { start, end };
}

function flattenMetrics(hardMetricsResult) {
  return Object.entries(hardMetricsResult.hard_metrics_result || {}).flatMap(([dimension, metrics]) =>
    (metrics || []).map((metric) => ({ ...metric, dimension: metric.dimension || dimension }))
  );
}

function collectHumanReviewItems(...sources) {
  const byKey = new Map();
  sources.flatMap((source) => source?.human_review_items || []).forEach((item, index) => {
    const normalized = {
      ...item,
      review_id: item.review_id || item.item_id || `HR-${String(index + 1).padStart(3, "0")}`
    };
    const key = stableId(
      normalized.review_id,
      normalized.related_dimension || "",
      normalized.reason || normalized.review_reason || ""
    );
    if (!byKey.has(key)) byKey.set(key, normalized);
  });
  return [...byKey.values()];
}

function extractText(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.content || item.description || item.action || item.summary || item.evidence || "";
}

function mapReportStatus(reportStatus, hasOpenReview, needsEvidence) {
  if (needsEvidence || reportStatus === "blocked") return "needs_evidence 需补证";
  if (hasOpenReview) return "review_required 待复核";
  if (reportStatus === "ready") return "reviewed 已复核";
  if (reportStatus === "degraded") return "observation_only 仅观察";
  return "draft 草稿";
}

function mapSignatureStatus(reportStatus, hasOpenReview, needsEvidence) {
  return reportStatus === "ready" && !hasOpenReview && !needsEvidence ? "待签字" : "未签字";
}

function mapDataCoverageLevel(inputCompletenessReport, dataQualityReport, reportStatus) {
  if ((inputCompletenessReport.missing_sources || []).length > 0) return "缺失";
  if ((inputCompletenessReport.degrade_reasons || []).length > 0) return "低";
  const warnings = [
    ...(dataQualityReport.warnings || []),
    ...(dataQualityReport.issues || []),
    ...(dataQualityReport.source_coverage || []).flatMap((source) => source.notes || [])
  ];
  if (reportStatus === "degraded" || warnings.length > 0) return "中";
  return "高";
}

function buildCoverageSummary(inputCompletenessReport, dataQualityReport) {
  const available = inputCompletenessReport.available_sources || [];
  const missing = inputCompletenessReport.missing_sources || [];
  const degradeReasons = inputCompletenessReport.degrade_reasons || [];
  const warnings = [
    ...(dataQualityReport.warnings || []),
    ...(dataQualityReport.issues || [])
  ];
  return [
    available.length ? `可用数据源：${available.join("、")}` : "",
    missing.length ? `缺失数据源：${missing.join("、")}` : "",
    degradeReasons.length ? `降级原因：${degradeReasons.join("；")}` : "",
    warnings.length ? `质量提醒：${warnings.join("；")}` : ""
  ].filter(Boolean).join("\n");
}

function mapDimensionLevel(score, confidence) {
  if (confidence < 0.5) return "仅观察";
  if (score === undefined || score === null || score === "") return "无法判断";
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "无法判断";
  const normalizedScore = numericScore > 10 ? numericScore / 10 : numericScore;
  if (normalizedScore >= 7) return "健康";
  if (normalizedScore >= 5) return "中等";
  return "需关注";
}

function mapMetricJudgement(metric) {
  if (metric.status && metric.status !== "available") return "无法判断";
  if ((metric.missing_fields || []).length > 0) return "无法判断";
  if ((metric.anomalies || []).length > 0) return "需关注";
  return "健康";
}

function mapMetricStatus(metric) {
  if (metric.status && metric.status !== "available") return "not_available 无法判断";
  if ((metric.missing_fields || []).length > 0 || (metric.anomalies || []).length > 0) {
    return "downgraded 已降级";
  }
  return "calculated 已计算";
}

function mapSourceType(sourceType) {
  const source = String(sourceType || "").toLowerCase();
  if (source.includes("task") || source.includes("base_task") || source.includes("hard_metrics")) return "Base任务表";
  if (source.includes("risk")) return "风险表";
  if (source.includes("minutes")) return "妙记";
  if (source.includes("meeting") || source.includes("statement")) return "会议纪要";
  if (source.includes("chat") || source.includes("im")) return "聊天记录";
  if (source.includes("doc")) return "云文档";
  if (source.includes("weekly")) return "周报";
  if (source.includes("review")) return "复盘";
  return "人工补录";
}

function mapDataSources(refs) {
  return unique((refs || []).map((ref) => mapSourceType(ref.source_type)));
}

function mapEvidenceQuality(ref) {
  if (!ref || !(ref.excerpt || ref.evidence_note || ref.quote)) return "低";
  const source = String(ref.source_type || "").toLowerCase();
  if (source.includes("unresolved")) return "不可用";
  if (source.includes("hard_metrics") || source.includes("base_task") || source.includes("base_risk")) return "高";
  return "中";
}

function mapSourceQuality(metric) {
  if (metric.status && metric.status !== "available") return "缺失";
  if ((metric.missing_fields || []).length > 0) return "低";
  if ((metric.anomalies || []).length > 0) return "中";
  return (metric.evidence_refs || []).length > 0 ? "高" : "中";
}

function inferReviewType(item) {
  const text = `${item.reason || ""} ${item.review_reason || ""} ${item.related_dimension || ""}`;
  if (/冲突|不一致|重复挂载/.test(text)) return "证据冲突";
  if (/责任|归因/.test(text)) return "责任归因";
  if (/敏感|高压|组织行为|语气|语境/.test(text)) return "敏感判断";
  if (/样本|缺少|缺完整|不足/.test(text)) return "样本不足";
  if (/补证|权限/.test(text)) return "需补证";
  if (/降级|观察/.test(text)) return "降级确认";
  return "低置信";
}

function suggestedActionForReviewType(type) {
  if (type === "样本不足" || type === "需补证") return "补证";
  if (type === "敏感判断" || type === "降级确认") return "降级为观察项";
  if (type === "证据冲突" || type === "责任归因") return "修改";
  return "通过";
}

function metricDisplayValue(metric) {
  if (metric.value === undefined || metric.value === null || metric.value === "") return "";
  if (metric.unit === "ratio") return `${metric.value}`;
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function calculationRule(metric) {
  return [
    metric.formula?.formula || "",
    metric.calculation?.expression ? `expression: ${metric.calculation.expression}` : "",
    metric.sample_scope ? `sample_scope: ${metric.sample_scope}` : ""
  ].filter(Boolean).join("\n");
}

function missingRate(metric) {
  const denominator = Number(metric.denominator ?? metric.calculation?.denominator);
  const missingCount = (metric.missing_fields || []).length;
  if (!denominator || denominator <= 0) return missingCount > 0 ? 1 : 0;
  return Number((missingCount / denominator).toFixed(4));
}

function createEvidenceCollector(evaluationId) {
  const evidenceById = new Map();

  function add(ref, context = {}) {
    if (!ref) return "";
    const key = stableId(ref.source_type || "source", ref.source_file || "", ref.source_id || ref.excerpt || ref.evidence_note || "");
    const evidenceId = `EVD-${key || stableId("manual", evidenceById.size + 1)}`;
    const current = evidenceById.get(evidenceId) || {
      evidence_id: evidenceId,
      evaluation_id: evaluationId,
      "关联评估任务": evaluationId,
      "来源类型": mapSourceType(ref.source_type),
      "来源名称": ref.source_file || ref.source_type || "",
      "原始链接": "",
      "证据时间": ref.timestamp || "",
      "证据片段": ref.excerpt || ref.quote || ref.evidence_note || "",
      "关联对象": ref.source_id || "",
      "关联维度": "",
      "关联指标": "",
      "证据质量": mapEvidenceQuality(ref),
      "是否关键证据": false,
      "是否存在冲突": false,
      "冲突说明": "",
      "可见范围": "仅摘要可见",
      "权限状态": "仅摘要可见",
      "关联维度结果": "",
      "关联指标结果": "",
      "关联复核项": ""
    };

    current["关联维度"] = current["关联维度"] || context.dimension || "";
    current["关联指标"] = current["关联指标"] || context.metric || "";
    current["是否关键证据"] = Boolean(current["是否关键证据"] || context.isKeyEvidence);
    current["是否存在冲突"] = Boolean(current["是否存在冲突"] || context.hasConflict);
    current["冲突说明"] = unique([current["冲突说明"], context.conflictNote]).join("\n");
    current["可见范围"] = current["是否关键证据"] ? "评审可见" : current["可见范围"];
    current["关联维度结果"] = unique([current["关联维度结果"], context.dimensionResultId]).join("\n");
    current["关联指标结果"] = unique([current["关联指标结果"], context.metricResultId]).join("\n");
    current["关联复核项"] = unique([current["关联复核项"], context.reviewItemId]).join("\n");

    evidenceById.set(evidenceId, current);
    return evidenceId;
  }

  return {
    add,
    rows: () => [...evidenceById.values()]
  };
}

function buildWorkspaceHomeRows() {
  return [
    {
      module_id: "front_people_overview",
      "模块名称": "人员评估总览",
      "平台视角": "评估平台",
      "模块说明": "前台一级入口：按中层管理者查看本轮评估状态、数据覆盖、待复核数量和报告入口。",
      "入口链接": TABLE_LINKS.people_overview,
      "关联数据表": ["people_overview", "evaluation_runs"],
      "推荐使用人": "HRBP / 评审负责人 / 业务负责人",
      "展示顺序": 1,
      "展示状态": "启用",
      "备注": "用户心智：看人。"
    },
    {
      module_id: "front_review_packet",
      "模块名称": "单人 Review Packet",
      "平台视角": "评估平台",
      "模块说明": "核心阅读页：围绕单个中层展示评估概览、五维结论、指标卡、低置信/降级、关键证据、人工复核和建议动作。",
      "入口链接": TABLE_LINKS.evaluation_runs,
      "关联数据表": ["evaluation_runs", "dimension_results", "metric_results", "review_items", "evidence_index"],
      "推荐使用人": "上级管理者 / HRBP / 签字人",
      "展示顺序": 2,
      "展示状态": "启用",
      "备注": "用户心智：看报告。"
    },
    {
      module_id: "front_metric_coverage_dashboard",
      "模块名称": "指标与数据覆盖看板",
      "平台视角": "BI看板",
      "模块说明": "BI/看板入口：查看指标值、样本量、缺失率、数据源质量、降级原因和证据权限风险。",
      "入口链接": TABLE_LINKS.metric_results,
      "关联数据表": ["metric_results", "evidence_index", "仪表盘"],
      "推荐使用人": "PMO / 数据负责人 / Agent 评测人员",
      "展示顺序": 3,
      "展示状态": "启用",
      "备注": "用户心智：看数据质量。"
    },
    {
      module_id: "front_human_review",
      "模块名称": "人工复核工作台",
      "平台视角": "复核审批",
      "模块说明": "工单/审批入口：复核人只在这里更新复核状态、复核备注、是否允许报告生效。",
      "入口链接": TABLE_LINKS.review_items,
      "关联数据表": ["review_items", "evidence_index"],
      "推荐使用人": "复核人 / HRBP / 评审负责人",
      "展示顺序": 4,
      "展示状态": "启用",
      "备注": "人工 update 在 review_items；结果由写回 Agent / Adapter 返回其他结果表。"
    },
    {
      module_id: "front_evidence_library",
      "模块名称": "证据溯源库",
      "平台视角": "证据下钻",
      "模块说明": "证据下钻入口：默认查看关键证据和冲突证据，辅助证据折叠查看。",
      "入口链接": TABLE_LINKS.evidence_index,
      "关联数据表": ["evidence_index"],
      "推荐使用人": "复核人 / 审计查看人 / Agent 评测人员",
      "展示顺序": 5,
      "展示状态": "启用",
      "备注": "只保留证据片段、原始链接、权限状态和冲突说明。"
    }
  ];
}

function buildOutputLayerInput(inputDir) {
  const taskRequest = readJson(path.join(inputDir, "task_request.json"));
  const hardMetricsResult = readJson(path.join(inputDir, "hard_metrics_result.json"));
  const evaluationPlan = readJson(path.join(inputDir, "evaluation_plan.json"));
  const capabilityResult = readJson(path.join(inputDir, "capability_assessor_result.json"));
  const reportResult = readJson(path.join(inputDir, "report_result.json"));
  const dataQualityReport = readOptionalJson(path.join(inputDir, "data_quality_report.json"));
  const inputCompletenessReport = readOptionalJson(path.join(inputDir, "input_completeness_report.json"));
  const managementResult = readOptionalJson(path.join(inputDir, "management_reviewer_result.json"));
  const riskBehaviorResult = readOptionalJson(path.join(inputDir, "risk_behavior_auditor_result.json"));
  const coordinationResult = readOptionalJson(path.join(inputDir, "coordination_lens_result.json"));

  const target = taskRequest.evaluation_target || {};
  const generatedAt = new Date().toISOString();
  const evaluationId = `EVAL-${target.project_id}-${target.current_meeting_id}`;
  const personId = target.manager_id;
  const period = splitPeriod(target.evaluation_period);
  const humanReviewItems = collectHumanReviewItems(
    reportResult,
    capabilityResult,
    managementResult,
    riskBehaviorResult,
    coordinationResult
  );
  const dataCoverageLevel = mapDataCoverageLevel(inputCompletenessReport, dataQualityReport, reportResult.report_status);
  const needsEvidence = dataCoverageLevel === "缺失" || humanReviewItems.some((item) =>
    ["需补证", "样本不足"].includes(inferReviewType(item))
  );
  const hasOpenReview = humanReviewItems.length > 0;
  const reportStatus = mapReportStatus(reportResult.report_status, hasOpenReview, needsEvidence);
  const signatureStatus = mapSignatureStatus(reportResult.report_status, hasOpenReview, needsEvidence);
  const coverageSummary = buildCoverageSummary(inputCompletenessReport, dataQualityReport);
  const focusDimensions = evaluationPlan.evaluation_focus?.focus_dimensions || [];
  const enabledDimensions = unique(focusDimensions.map((item) => item.dimension));
  const highPriorityDimensions = unique(focusDimensions.filter((item) => item.priority === "high").map((item) => item.dimension));
  const dimensionScores = capabilityResult.dimension_scores || reportResult.score_overview || [];
  const evidence = createEvidenceCollector(evaluationId);
  const metrics = flattenMetrics(hardMetricsResult);

  const metricResults = metrics.map((metric) => {
    const metricResultId = `MET-${stableId(evaluationId, metric.metric_id || metric.label)}`;
    const evidenceIds = (metric.evidence_refs || []).map((ref) => evidence.add(ref, {
      dimension: metric.dimension,
      metric: metric.label || metric.metric_id,
      metricResultId
    }));
    const metricStatus = mapMetricStatus(metric);
    return {
      metric_result_id: metricResultId,
      evaluation_id: evaluationId,
      "关联评估任务": evaluationId,
      "关联维度结果": `DIM-${stableId(evaluationId, metric.dimension)}`,
      "维度名称": metric.dimension,
      "指标名称": metric.label || metric.metric_id,
      "指标类型": "硬",
      "指标值": metric.value ?? "",
      "指标值文本": metricDisplayValue(metric),
      "判断结果": mapMetricJudgement(metric),
      "指标状态": metricStatus,
      "样本量": metric.denominator ?? metric.calculation?.denominator ?? "",
      "缺失率": missingRate(metric),
      "数据源": mapDataSources(metric.evidence_refs || []),
      "数据源质量": mapSourceQuality(metric),
      "置信度": "",
      "是否硬算": true,
      "是否降级": metricStatus === "downgraded 已降级",
      "降级原因": unique([...(metric.anomalies || []), ...(metric.missing_fields || [])]).join("\n"),
      "阈值版本": "v0.1-case04",
      "计算口径": calculationRule(metric),
      "是否纳入主评分": metricStatus !== "not_available 无法判断",
      "关联证据": evidenceIds
    };
  });

  const metricRowsByDimension = metricResults.reduce((acc, row) => {
    if (!acc[row["维度名称"]]) acc[row["维度名称"]] = [];
    acc[row["维度名称"]].push(row);
    return acc;
  }, {});

  const reviewItems = humanReviewItems.map((item, index) => {
    const reviewItemId = item.review_id || `HR-${String(index + 1).padStart(3, "0")}`;
    const reviewType = inferReviewType(item);
    const evidenceIds = (item.evidence_refs || []).map((ref) => evidence.add(ref, {
      dimension: item.related_dimension || "",
      reviewItemId,
      hasConflict: reviewType === "证据冲突",
      conflictNote: reviewType === "证据冲突" ? item.reason || "" : ""
    }));
    return {
      review_item_id: reviewItemId,
      evaluation_id: evaluationId,
      "关联评估任务": evaluationId,
      "关联维度结果": item.related_dimension ? `DIM-${stableId(evaluationId, item.related_dimension)}` : "",
      "关联指标结果": "",
      "复核类型": reviewType,
      "系统初判": item.system_judgement || "",
      "触发原因": item.reason || item.review_reason || "",
      "证据摘要": (item.evidence_refs || []).map((ref) => ref.excerpt || ref.evidence_note || "").filter(Boolean).join("\n"),
      "置信度": "",
      "建议处理": suggestedActionForReviewType(reviewType),
      "复核状态": "pending 待复核",
      "复核人": "",
      "复核备注": "",
      "复核时间": "",
      "是否允许报告生效": false,
      "关联证据": evidenceIds,
      "关联报告": ""
    };
  });

  const reviewRowsByDimension = reviewItems.reduce((acc, row) => {
    const source = humanReviewItems.find((item) => (item.review_id || item.item_id) === row.review_item_id);
    const dimension = source?.related_dimension || "";
    if (!acc[dimension]) acc[dimension] = [];
    acc[dimension].push(row);
    return acc;
  }, {});

  const dimensionResults = dimensionScores.map((score) => {
    const dimension = score.dimension;
    const dimensionResultId = `DIM-${stableId(evaluationId, dimension)}`;
    const evidenceRefs = score.evidence_quotes || score.evidence_refs || [];
    const evidenceIds = evidenceRefs.map((ref) => evidence.add(ref, {
      dimension,
      dimensionResultId,
      isKeyEvidence: true
    }));
    const level = mapDimensionLevel(score.score, score.confidence);
    const relatedMetrics = metricRowsByDimension[dimension] || [];
    const relatedReviews = reviewRowsByDimension[dimension] || [];
    const nextActions = (reportResult.next_actions || [])
      .filter((item) => !item.dimension || item.dimension === dimension)
      .map(extractText)
      .filter(Boolean);
    return {
      dimension_result_id: dimensionResultId,
      evaluation_id: evaluationId,
      "关联评估任务": evaluationId,
      "维度名称": dimension,
      "维度等级": level,
      "维度分数": score.score ?? "",
      "维度权重": DIMENSION_WEIGHTS_PERCENT[dimension] ?? "",
      "加权得分": weightedScore(score.score, dimension),
      "置信度": score.confidence ?? "",
      "是否主评分": level !== "仅观察" && level !== "无法判断",
      "是否需复核": relatedReviews.length > 0 || Number(score.confidence ?? 1) < 0.7,
      "核心结论": score.score_basis || score.content || "",
      "关键发现": unique([...(score.supporting_finding_refs || []), ...(score.supporting_metric_refs || [])]).join("\n"),
      "关键证据摘要": evidenceRefs.slice(0, 3).map((ref) => ref.evidence_note || ref.excerpt || "").filter(Boolean).join("\n"),
      "边界说明": (score.limitations || []).join("\n"),
      "降级原因": Number(score.confidence ?? 1) < 0.7 ? (score.limitations || []).join("\n") : "",
      "建议动作": nextActions.join("\n"),
      "关联指标": relatedMetrics.map((row) => row.metric_result_id),
      "关联证据": evidenceIds,
      "关联复核项": relatedReviews.map((row) => row.review_item_id)
    };
  });

  (reportResult.score_overview || []).forEach((item) => {
    (item.evidence_refs || []).forEach((ref) => evidence.add(ref, {
      dimension: item.dimension || "",
      isKeyEvidence: true,
      dimensionResultId: item.dimension ? `DIM-${stableId(evaluationId, item.dimension)}` : ""
    }));
  });
  (reportResult.key_evidence || []).forEach((item) => {
    (item.evidence_refs || []).forEach((ref) => evidence.add(ref, {
      dimension: item.dimension || "",
      isKeyEvidence: true
    }));
  });
  (reportResult.risk_alerts || []).forEach((item) => {
    const alertText = extractText(item);
    (item.evidence_refs || []).forEach((ref) => evidence.add(ref, {
      dimension: item.dimension || item.related_dimension || "",
      isKeyEvidence: true,
      hasConflict: /冲突|不一致/.test(alertText),
      conflictNote: /冲突|不一致/.test(alertText) ? alertText : ""
    }));
  });

  const highRiskDimensionCount = dimensionResults.filter((row) =>
    ["需关注", "仅观察", "无法判断"].includes(row["维度等级"])
  ).length;

  const peopleOverview = [{
    person_id: personId,
    "中层姓名": target.manager_name || personId,
    "所属部门": "",
    "业务域": target.project_id || "",
    "管理范围": target.project_id || "",
    "团队规模": "",
    "项目范围": target.project_id || "",
    "主责角色": "项目负责人",
    "是否纳入本轮评估": true,
    "最新报告状态": reportStatus,
    "最新签字状态": signatureStatus,
    "最新整体置信度": capabilityResult.overall_assessment?.confidence ?? "",
    "数据覆盖等级": dataCoverageLevel,
    "待复核数量": reviewItems.filter((row) => row["复核状态"] === "pending 待复核").length,
    "需补证数量": reviewItems.filter((row) => row["建议处理"] === "补证").length,
    "高风险维度数": highRiskDimensionCount,
    "主关注维度": highPriorityDimensions,
    "最新报告链接": "",
    "备注": "中层人员总览只承接管理范围上下文，不评价下属个人绩效。",
    "关联评估任务": evaluationId
  }];

  const evaluationRun = {
    evaluation_id: evaluationId,
    "评估对象名称": target.manager_name || personId,
    "项目名称": target.project_id || "",
    "项目范围": target.project_id || "",
    "评估周期开始": period.start,
    "评估周期结束": period.end,
    "启用维度": enabledDimensions,
    "报告状态": reportStatus,
    "整体置信度": capabilityResult.overall_assessment?.confidence ?? "",
    "数据覆盖等级": dataCoverageLevel,
    "数据覆盖结论": coverageSummary,
    "人工复核要求": hasOpenReview ? "需要" : "不需要",
    "人审未完成数量": reviewItems.filter((row) => row["复核状态"] === "pending 待复核").length,
    "报告链接": "",
    "签字状态": signatureStatus,
    "评估总览": reportResult.summary || capabilityResult.overall_assessment?.summary || "",
    "评审入口类型": "人员评审包",
    "关联人员总览": personId
  };

  const tablesToWrite = [
    "workspace_home",
    "people_overview",
    "evaluation_runs",
    "dimension_results",
    "metric_results",
    "review_items",
    "evidence_index"
  ];

  return {
    metadata: {
      generated_at: generatedAt,
      input_dir: inputDir,
      evaluation_id: evaluationId,
      project_id: target.project_id || "",
      manager_id: personId || "",
      package_type: "output_layer_input"
    },
    workspace_home: buildWorkspaceHomeRows(),
    people_overview: peopleOverview,
    evaluation_run: evaluationRun,
    dimension_results: dimensionResults,
    metric_results: metricResults,
    review_items: reviewItems,
    evidence_index: evidence.rows(),
    writeback_decisions: {
      report_can_finalize: !hasOpenReview && !needsEvidence && reportStatus === "reviewed 已复核",
      report_status: reportStatus,
      needs_human_review: hasOpenReview,
      needs_evidence: needsEvidence || reviewItems.some((row) => row["建议处理"] === "补证"),
      observation_only: reportStatus === "observation_only 仅观察" || dimensionResults.some((row) => row["维度等级"] === "仅观察"),
      tables_to_write: tablesToWrite
    }
  };
}

function main() {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["input-dir"] || "data/outputs/demo/case04/current");
  const outputPath = path.resolve(args.output || path.join(inputDir, "output_layer_input.json"));
  const output = buildOutputLayerInput(inputDir);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(JSON.stringify({
    output: outputPath,
    evaluation_id: output.metadata.evaluation_id,
    rows: {
      workspace_home: output.workspace_home.length,
      people_overview: output.people_overview.length,
      evaluation_runs: 1,
      dimension_results: output.dimension_results.length,
      metric_results: output.metric_results.length,
      review_items: output.review_items.length,
      evidence_index: output.evidence_index.length
    },
    writeback_decisions: output.writeback_decisions
  }, null, 2) + "\n");
}

if (require.main === module) {
  main();
}

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { DIMENSION_WEIGHTS_PERCENT, weightedScore } = require("../../../scripts/dev/dimension_weights");

const DEFAULT_INPUT_DIR = "data/outputs/demo/case06/auto";
const DEFAULT_BASE_TOKEN = "Z6d9bO5UqajK01swK9CcoGU9nkf";
const DEFAULT_CLI = "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";
const DASHBOARD_URL = "https://jcneyh7qlo8i.feishu.cn/base/Z6d9bO5UqajK01swK9CcoGU9nkf?dashboard=blkwsVk95GtFvTLA";
const REVIEW_ITEMS_URL = "https://jcneyh7qlo8i.feishu.cn/base/Z6d9bO5UqajK01swK9CcoGU9nkf?table=tblShT3KAkGRjj1T";

const TABLES = {
  workspace_home: { id: "tblxWr6IUn9c8pZz", key: "module_id", source: "workspace_home" },
  people_overview: { id: "tblfQS3bHVLNavvZ", key: "person_id", source: "people_overview" },
  evaluation_runs: { id: "tblcGy0h0fx4pIoG", key: "evaluation_id", source: "evaluation_run" },
  dimension_results: { id: "tblMUq8orwwRSi1c", key: "dimension_result_id", source: "dimension_results" },
  metric_results: { id: "tbldjPFXVZ4PD9RJ", key: "metric_result_id", source: "metric_results" },
  review_items: { id: "tblShT3KAkGRjj1T", key: "review_item_id", source: "review_items" },
  evidence_index: { id: "tblQenU1BAdECcY2", key: "evidence_id", source: "evidence_index" }
};

const CREATE_ORDER = [
  "workspace_home",
  "people_overview",
  "evaluation_runs",
  "dimension_results",
  "metric_results",
  "review_items",
  "evidence_index"
];

const DELETE_ORDER = CREATE_ORDER.slice().reverse();

const FIELD_IDS = {
  workspace_home: {
    module_id: "fldAkHuByZ",
    平台视角: "fldNz3xtQr",
    模块说明: "fldfonU9re",
    入口链接: "fldxyb49l0",
    推荐使用人: "fld9lQ2hno",
    展示状态: "fldWkAan7w",
    关联数据表: "fld5ttw93V",
    备注: "fldXnIJc7b"
  },
  people_overview: {
    中层姓名: "fldrKpSCEw",
    所属部门: "fldloWSH3x",
    主责角色: "fldi4XWu5n",
    最新报告状态: "fldLgY6pwD",
    最新签字状态: "fldbVNOIcC",
    最新整体置信度: "fldrzUvsuB",
    数据覆盖等级: "fldsJF6pL5",
    待复核数量: "fldM3qNqJs",
    需补证数量: "fldZtoQQv2",
    人工复核要求: "fldNFfHhNv",
    主关注维度: "fldqEwVrCc",
    评估总览: "fldtSIJPSN",
    数据覆盖结论: "fldfimJtla",
    综合评分: "fldG7T5Pjg",
    评估周期: "fld3z1wVcR",
    单人ReviewPacket: "fldluAs2az",
    方向校准力详情: "flddd9JcEw",
    推进闭环力详情: "fldHoJ1Qj5",
    风险治理力详情: "fldwb9N0JF",
    协同调度力详情: "fld6POdbxP",
    组织行为健康度详情: "fld8yvuNxF",
    人工复核入口: "fldd7v9bFB"
  },
  evaluation_runs: {
    评估包标题: "fldsg4VPg4",
    评估对象名称: "fldLDxkGYn",
    项目范围: "fldwWUalvC",
    评估周期: "fldgpREfQE",
    报告状态: "fldYgEtgk9",
    综合评分: "fldYjI5nrr",
    整体置信度: "fldZad0Vok",
    数据覆盖等级: "fldq5iB8x4",
    数据覆盖结论: "fldDanPy7N",
    人工复核要求: "fldSiDgpTW",
    人审未完成数量: "fldLYif6Q6",
    单人ReviewPacket: "fldPmDDKvi",
    签字状态: "fldAd33YmL",
    评估总览: "fldwC2lCQP",
    启用维度: "fldB5wfO8G",
    五维结论入口: "fldX8TtHfU",
    方向校准力详情: "fldYm599Uh",
    推进闭环力详情: "fldQIZN140",
    风险治理力详情: "fldpZJlYkz",
    协同调度力详情: "fldCkeZ41y",
    组织行为健康度详情: "fld8yYZnrd",
    人工复核入口: "fldqM4j8zj"
  },
  dimension_results: {
    维度页标题: "fld5VYH5EI",
    中层姓名: "fld7sDqjVy",
    所属人员: "fldtsRAKVE",
    评估周期: "fldAe1bYF7",
    维度等级: "fldMTMBdAb",
    维度分数: "fldCL0QJpt",
    维度权重: "fldCj5anVq",
    加权得分: "fldufIHern",
    置信度: "flddiOhROC",
    是否需复核: "fldYLAPxtE",
    核心结论: "fldDQYIH6N",
    关键证据摘要: "fldJiUfMA2",
    边界说明: "fldsK8dcC6",
    建议动作: "fldw58FjG6",
    关联指标: "fldbGQ9NXz",
    关联复核项: "fld2P5tt03",
    关联证据: "fldLXm939u"
  },
  metric_results: {
    指标页标题: "fldhE9KKZK",
    中层姓名: "fldg161UgA",
    评估周期: "fldfYOWtEi",
    维度名称: "fld3b7pJ6n",
    指标值文本: "fld1pxrWwV",
    判断结果: "fldHEaJXsH",
    样本量: "fld1pTJlBM",
    缺失率: "fldKvpO5tu",
    数据源质量: "fldQPmdY0K",
    是否降级: "fldXMl7j5p",
    关联证据: "fldbwOYK3z"
  },
  review_items: {
    复核事项: "fldFK0Y4Si",
    中层姓名: "fldDZZTtTD",
    所属人员: "fldFctElIg",
    评估周期: "fldpUOTRIW",
    复核类型: "fldoa42DwS",
    复核状态: "fldXnau1Jj",
    系统初判: "fldTOoH2wn",
    触发原因: "fldpsKGvEu",
    证据摘要: "fld3FFiYwd",
    建议处理: "fldwxknKdT",
    复核备注: "fldb5PRgmu",
    复核时间: "fldA1hU97h",
    是否允许报告生效: "fld5WOe72J",
    关联维度结果: "fldGN3U6x2",
    关联指标结果: "fldYIJTtfe",
    关联证据: "fld4LSarDF"
  },
  evidence_index: {
    证据标题: "fldCfWZCKK",
    中层姓名: "fldRZCoVGh",
    评估周期: "fldYlABByC",
    来源类型: "fldJalFLTq",
    证据片段: "fldMglP2UC",
    关联维度: "fldFDnYeTD",
    证据质量: "fldIemeJhg",
    是否关键证据: "fldTAhrAB8",
    是否存在冲突: "fldWqCAU4c",
    冲突说明: "fld8jD7kG2",
    权限状态: "fldvvM7RNI"
  }
};

const LINK_FIELD_NAMES = new Set([
  "方向校准力详情",
  "推进闭环力详情",
  "风险治理力详情",
  "协同调度力详情",
  "组织行为健康度详情",
  "人工复核入口",
  "五维结论入口",
  "关联指标",
  "关联复核项",
  "关联证据",
  "关联维度结果",
  "关联指标结果"
]);

const DIMENSION_LEVEL = [
  { min: 75, level: "健康" },
  { min: 60, level: "中等" },
  { min: 0, level: "需关注" }
];

function readJson(inputDir, name) {
  return JSON.parse(fs.readFileSync(path.join(inputDir, name), "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function compactText(value, max = 260) {
  const text = Array.isArray(value) ? value.filter(Boolean).join("\n") : String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function levelFromScore(score) {
  const found = DIMENSION_LEVEL.find((item) => Number(score) >= item.min);
  return found ? found.level : "无法判断";
}

function metricJudgement(metric) {
  if (metric.status && metric.status !== "available") return "仅观察";
  const value = Number(metric.value);
  if (!Number.isFinite(value)) return "无法判断";
  if (metric.unit === "count") return value <= 3 ? "健康" : "需关注";
  if (value >= 0.85) return "健康";
  if (value >= 0.6) return "中等";
  return "需关注";
}

function sourceTypeFromRef(ref) {
  const sourceType = String(ref.source_type || "");
  const sourceFile = String(ref.source_file || "");
  if (sourceType.includes("chat")) return "聊天记录";
  if (sourceType.includes("risk") || sourceFile.includes("risk")) return "风险表";
  if (sourceType.includes("meeting") || sourceType.includes("statement") || sourceFile.includes("meeting")) return "会议纪要";
  if (sourceType.includes("doc")) return "云文档";
  if (sourceType.includes("hard_metric")) return "人工补录";
  return "人工补录";
}

function evidenceIdFromRef(ref, prefix = "EVD") {
  return `${prefix}-${String(ref.source_type || "source")}-${String(ref.source_id || ref.source_file || "unknown")}`
    .replace(/[^A-Za-z0-9_\-.]+/g, "_")
    .slice(0, 160);
}

function normalizeEvidenceRef(ref, context) {
  const id = evidenceIdFromRef(ref);
  const note = ref.evidence_note ? `${ref.excerpt || ""}\n${ref.evidence_note}` : ref.excerpt || "";
  return {
    evidence_id: id,
    中层姓名: context.managerName,
    评估周期: context.period,
    来源类型: sourceTypeFromRef(ref),
    证据标题: `${sourceTypeFromRef(ref)}｜${context.dimension || "评估"}｜${context.isKey ? "关键证据" : "证据"}`,
    证据片段: compactText(note, 500),
    关联维度: context.dimension || "",
    related_metric_id: context.metricId || "",
    证据质量: context.quality || "中",
    是否关键证据: Boolean(context.isKey),
    是否存在冲突: Boolean(context.hasConflict),
    冲突说明: context.conflictNote || "",
    权限状态: "仅摘要可见",
    review_ids: context.reviewId ? [context.reviewId] : []
  };
}

function mergeEvidence(records) {
  const merged = new Map();
  for (const record of records) {
    if (!record.evidence_id) continue;
    const current = merged.get(record.evidence_id);
    if (!current) {
      merged.set(record.evidence_id, { ...record });
      continue;
    }
    current.是否关键证据 = current.是否关键证据 || record.是否关键证据;
    current.是否存在冲突 = current.是否存在冲突 || record.是否存在冲突;
    current.冲突说明 = current.冲突说明 || record.冲突说明;
    current.related_metric_id = current.related_metric_id || record.related_metric_id;
    current.review_ids = Array.from(new Set([...(current.review_ids || []), ...(record.review_ids || [])]));
  }
  return Array.from(merged.values());
}

function buildWorkspaceHome(baseToken) {
  const base = `https://jcneyh7qlo8i.feishu.cn/base/${baseToken}`;
  return [
    ["人员评估总览看板", "评估看板", "看本轮评估对象、状态、数据覆盖和报告入口。", `${base}?table=tblfQS3bHVLNavvZ`, "HRBP / 评审负责人", ["people_overview", "evaluation_runs"]],
    ["单人评估看板", "评估看板", "看单个中层的综合评分、五维形状和阻断项。", DASHBOARD_URL, "上级管理者 / HRBP", ["evaluation_runs", "dimension_results", "metric_results"]],
    ["五维结论", "维度数据", "看五个一级维度的等级、置信度、结论和下钻入口。", `${base}?table=tblMUq8orwwRSi1c`, "评审负责人 / 上级管理者", ["dimension_results"]],
    ["五维评审", "BI看板", "看指标值、样本量、缺失率和数据源质量。", `${base}?table=tbldjPFXVZ4PD9RJ`, "PMO / 数据负责人", ["metric_results", "evidence_index"]],
    ["人工复核", "复核审批", "处理低置信、证据冲突、责任归因和补证事项。", REVIEW_ITEMS_URL, "复核人 / HRBP", ["review_items", "evidence_index"]],
    ["证据索引", "证据下钻", "查看关键证据、冲突证据、权限状态和证据片段。", `${base}?table=tblQenU1BAdECcY2`, "复核人 / 审计查看人", ["evidence_index"]]
  ].map(([moduleId, platform, description, url, users, related]) => ({
    module_id: moduleId,
    平台视角: platform,
    模块说明: description,
    入口链接: url,
    推荐使用人: users,
    展示状态: "启用",
    关联数据表: related,
    备注: "系统首页入口配置"
  }));
}

function buildDataCoverageConclusion(report) {
  const available = (report.source_coverage || [])
    .filter((item) => item.status === "available")
    .map((item) => item.source_name)
    .join("、");
  const warnings = (report.warnings || []).join("；");
  return compactText(`可用数据源：${available || "暂无"}。${warnings ? `质量提醒：${warnings}` : ""}`, 420);
}

function buildCleanOutputLayerInput(inputDir = DEFAULT_INPUT_DIR, options = {}) {
  const resolvedInputDir = path.resolve(inputDir);
  const task = readJson(resolvedInputDir, "task_request.json");
  const capability = readJson(resolvedInputDir, "capability_assessor_result.json");
  const hardMetrics = readJson(resolvedInputDir, "hard_metrics_result.json");
  const dataQuality = readJson(resolvedInputDir, "data_quality_report.json");
  const report = readJson(resolvedInputDir, "report_result.json");

  const target = task.evaluation_target || {};
  const managerName = target.manager_name || "周牧";
  const managerId = target.manager_id || "MGR-CASE-06";
  const projectId = target.project_id || "PJT-CASE-06";
  const period = target.evaluation_period || "2026-01-01 ~ 2026-03-26";
  const evaluationId = `EVAL-${projectId}-${target.current_meeting_id || "MTG-CASE-06-12"}`;
  const overallConfidence = Number(capability.overall_assessment?.confidence ?? 0.7);
  const overallScore = Number(
    capability.dimension_scores
      .reduce((sum, item) => sum + Number(weightedScore(item.score, item.dimension) || 0), 0)
      .toFixed(2)
  );
  const reportStatus = "needs_evidence 需补证";
  const signatureStatus = "未签字";
  const coverageLevel = "中";
  const coverageConclusion = buildDataCoverageConclusion(dataQuality);
  const dimensions = capability.dimension_scores || [];

  const baseReviewItems = Array.isArray(capability.human_review_items) ? capability.human_review_items : [];
  const lowConfidenceItems = dimensions
    .filter((item) => Number(item.confidence) < 0.75)
    .map((item) => ({
      review_id: `low_confidence_${item.dimension}`,
      reason: `${item.dimension}置信度为 ${item.confidence}，建议评审人确认边界说明与关键证据。`,
      severity: "medium",
      related_dimension: item.dimension,
      evidence_refs: item.evidence_quotes || []
    }));
  const reviewSource = [...baseReviewItems, ...lowConfidenceItems].slice(0, 7);
  const reviewCount = reviewSource.length;

  const dimensionResults = dimensions.map((item) => {
    const evidenceRefs = Array.isArray(item.evidence_quotes) ? item.evidence_quotes : [];
    const limitations = Array.isArray(item.limitations) ? item.limitations.join("\n") : "";
    const relatedReviewIds = reviewSource
      .filter((reviewItem) => reviewItem.related_dimension === item.dimension)
      .map((reviewItem) => reviewItem.review_id);
    return {
      dimension_result_id: `DIM-${evaluationId}-${item.dimension}`,
      维度页标题: item.dimension,
      中层姓名: managerName,
      所属人员: managerName,
      评估周期: period,
      维度等级: levelFromScore(item.score),
      维度分数: item.score,
      维度权重: DIMENSION_WEIGHTS_PERCENT[item.dimension] || 0,
      加权得分: weightedScore(item.score, item.dimension),
      置信度: item.confidence,
      是否需复核: relatedReviewIds.length > 0,
      核心结论: compactText(item.score_basis, 900),
      关键证据摘要: compactText(evidenceRefs.map((ref) => ref.evidence_note || ref.excerpt).slice(0, 3).join("\n"), 700),
      边界说明: compactText(limitations, 700),
      建议动作: compactText(relatedReviewIds.length ? "该维度存在复核项，请从关联复核项进入处理。" : "持续保留关键证据和指标留痕。", 260),
      关联指标: [],
      关联证据: evidenceRefs.map((ref) => evidenceIdFromRef(ref)),
      关联复核项: relatedReviewIds
    };
  });

  const metricResults = Object.entries(hardMetrics.hard_metrics_result || {}).flatMap(([dimension, metrics]) =>
    (metrics || []).map((metric) => ({
      metric_result_id: `MET-${evaluationId}-${metric.metric_id}`,
      metric_id: metric.metric_id,
      指标页标题: `${dimension}｜${metric.label || metric.metric_id}`,
      中层姓名: managerName,
      评估周期: period,
      维度名称: dimension,
      指标值文本: `${metric.value ?? ""}${metric.unit ? ` ${metric.unit}` : ""}`.trim(),
      判断结果: metricJudgement(metric),
      样本量: Number(metric.denominator ?? metric.calculation?.denominator ?? 0),
      缺失率: metric.missing_fields && metric.missing_fields.length ? 1 : 0,
      数据源质量: metric.status === "available" ? "高" : "低",
      是否降级: metric.status !== "available",
      关联证据: [
        evidenceIdFromRef({
          source_type: "hard_metric",
          source_id: metric.metric_id
        })
      ]
    }))
  );

  for (const dimension of dimensionResults) {
    dimension.关联指标 = metricResults
      .filter((metric) => metric.维度名称 === dimension.维度页标题)
      .map((metric) => metric.metric_result_id);
  }

  const reviewItems = reviewSource.map((item) => {
    const reviewType = item.review_id.startsWith("low_confidence")
      ? "低置信"
      : item.reason.includes("缺完整") || item.reason.includes("补证")
        ? "需补证"
        : item.reason.includes("冲突") || item.reason.includes("不匹配")
          ? "证据冲突"
          : item.related_dimension === "组织行为健康度"
            ? "敏感判断"
            : "降级确认";
    return {
      review_item_id: item.review_id,
      复核事项: `${reviewType}｜${item.related_dimension || "评估"}`,
      中层姓名: managerName,
      所属人员: managerName,
      评估周期: period,
      复核类型: reviewType,
      复核状态: item.reason.includes("缺完整") ? "needs_evidence 需补证" : "pending 待复核",
      系统初判: compactText(item.reason, 500),
      触发原因: compactText(item.reason, 500),
      证据摘要: compactText((item.evidence_refs || []).map((ref) => ref.evidence_note || ref.excerpt).join("\n"), 700),
      建议处理: item.reason.includes("缺完整") ? "补证" : "降级为观察项",
      复核备注: "",
      是否允许报告生效: false,
      关联维度结果: item.related_dimension ? [`DIM-${evaluationId}-${item.related_dimension}`] : [],
      关联指标结果: [],
      关联证据: (item.evidence_refs || []).map((ref) => evidenceIdFromRef(ref))
    };
  });

  const evidenceFromDimensions = dimensions.flatMap((dimension) =>
    (dimension.evidence_quotes || []).map((ref) => normalizeEvidenceRef(ref, {
      managerName,
      period,
      dimension: dimension.dimension,
      isKey: true,
      quality: ref.source_type === "hard_metric" ? "高" : "中"
    }))
  );
  const evidenceFromMetrics = metricResults.map((metric) => normalizeEvidenceRef({
    source_type: "hard_metric",
    source_id: metric.metric_id,
    excerpt: `指标值：${metric.指标值文本}；判断结果：${metric.判断结果}；样本量：${metric.样本量}`
  }, {
    managerName,
    period,
    dimension: metric.维度名称,
    metricId: metric.metric_id,
    isKey: true,
    quality: metric.数据源质量
  }));
  const evidenceFromReviews = reviewSource.flatMap((review) =>
    (review.evidence_refs || []).map((ref) => normalizeEvidenceRef(ref, {
      managerName,
      period,
      dimension: review.related_dimension,
      isKey: true,
      hasConflict: review.reason.includes("不匹配") || review.reason.includes("冲突"),
      conflictNote: review.reason.includes("不匹配") || review.reason.includes("冲突") ? review.reason : "",
      reviewId: review.review_id
    }))
  );
  const evidenceIndex = mergeEvidence([...evidenceFromDimensions, ...evidenceFromMetrics, ...evidenceFromReviews]);

  const peopleOverview = [{
    person_id: managerId,
    中层姓名: managerName,
    所属部门: "",
    管理范围: projectId,
    主责角色: "项目负责人",
    最新报告状态: reportStatus,
    最新签字状态: signatureStatus,
    最新整体置信度: overallConfidence,
    数据覆盖等级: coverageLevel,
    待复核数量: reviewCount,
    需补证数量: 1,
    人工复核要求: reviewCount > 0 ? "需要" : "不需要",
    主关注维度: dimensions.filter((item) => item.score < 70 || item.confidence < 0.75).map((item) => item.dimension),
    评估总览: compactText(capability.overall_assessment?.summary || report.summary, 900),
    数据覆盖结论: coverageConclusion,
    综合评分: overallScore,
    评估周期: period,
    单人ReviewPacket: DASHBOARD_URL,
    关联维度: dimensionResults.map((item) => item.dimension_result_id),
    关联复核项: reviewItems.map((item) => item.review_item_id)
  }];

  const evaluationRun = {
    evaluation_id: evaluationId,
    评估包标题: `${managerName}｜单人 Review Packet`,
    评估对象名称: managerName,
    项目范围: projectId,
    评估周期: period,
    报告状态: reportStatus,
    综合评分: overallScore,
    整体置信度: overallConfidence,
    数据覆盖等级: coverageLevel,
    数据覆盖结论: coverageConclusion,
    人工复核要求: reviewCount > 0 ? "需要" : "不需要",
    人审未完成数量: reviewCount,
    单人ReviewPacket: DASHBOARD_URL,
    签字状态: signatureStatus,
    评估总览: compactText(capability.overall_assessment?.summary || report.summary, 900),
    启用维度: dimensions.map((item) => item.dimension),
    五维结论入口: dimensionResults.map((item) => item.dimension_result_id),
    人工复核入口: reviewItems.map((item) => item.review_item_id)
  };

  const output = {
    metadata: {
      generated_at: new Date().toISOString(),
      input_dir: resolvedInputDir,
      evaluation_id: evaluationId,
      project_id: projectId,
      manager_id: managerId,
      package_type: "output_layer_input"
    },
    workspace_home: buildWorkspaceHome(options.baseToken || DEFAULT_BASE_TOKEN),
    people_overview: peopleOverview,
    evaluation_run: evaluationRun,
    dimension_results: dimensionResults,
    metric_results: metricResults,
    review_items: reviewItems,
    evidence_index: evidenceIndex,
    writeback_decisions: {
      report_can_finalize: false,
      report_status: reportStatus,
      needs_human_review: reviewCount > 0,
      needs_evidence: true,
      observation_only: false,
      tables_to_write: CREATE_ORDER
    }
  };

  writeJson(path.join(resolvedInputDir, "output_layer_input.json"), output);
  return output;
}

function tableRecords(input, tableName) {
  const source = TABLES[tableName].source;
  if (source === "evaluation_run") return input.evaluation_run ? [input.evaluation_run] : [];
  return Array.isArray(input[source]) ? input[source] : [];
}

function runCli(cliPath, args, opts = {}) {
  if (opts.dryRun) return {};
  const out = execFileSync(cliPath, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: opts.timeout || 120_000,
    cwd: process.cwd()
  });
  return out.trim() ? JSON.parse(out) : {};
}

function makeTempWriter() {
  const tempDirRelative = path.join(".tmp", "feishu_case06_publish");
  const tempDir = path.resolve(tempDirRelative);
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  return {
    write(value) {
      const relativeFile = path.join(tempDirRelative, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
      fs.writeFileSync(path.resolve(relativeFile), JSON.stringify(value), "utf8");
      return `@${relativeFile.replace(/\\/g, "/")}`;
    },
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

function recordIdFromResponse(response) {
  return response?.data?.record?.record_id
    || response?.data?.record_id
    || response?.data?.record?.record_id_list?.[0]
    || response?.data?.records?.[0]?.record_id
    || response?.data?.record?.id;
}

function listRecordIds(cliPath, baseToken, tableName, opts = {}) {
  const response = runCli(cliPath, [
    "base", "+record-list",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--limit", "200",
    "--format", "json"
  ], opts);
  return response?.data?.record_id_list || [];
}

function deleteRecord(cliPath, baseToken, tableName, recordId, opts = {}) {
  runCli(cliPath, [
    "base", "+record-delete",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--record-id", recordId,
    "--yes"
  ], opts);
}

function convertFieldValue(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && item !== "");
  return value;
}

function buildPayload(tableName, row) {
  const map = FIELD_IDS[tableName];
  const payload = {};
  for (const [fieldName, fieldId] of Object.entries(map)) {
    if (LINK_FIELD_NAMES.has(fieldName)) {
      continue;
    }
    const value = convertFieldValue(row[fieldName]);
    if (value !== undefined) payload[fieldId] = value;
  }
  return payload;
}

function createRecord(cliPath, baseToken, temp, tableName, row, opts = {}) {
  const payload = buildPayload(tableName, row);
  const response = runCli(cliPath, [
    "base", "+record-upsert",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--json", temp.write(payload)
  ], opts);
  const recordId = opts.dryRun ? `dry-${tableName}-${row[TABLES[tableName].key]}` : recordIdFromResponse(response);
  if (!recordId) {
    throw new Error(`Cannot find created record_id for ${tableName}: ${JSON.stringify(response).slice(0, 1000)}`);
  }
  return recordId;
}

function updateRecord(cliPath, baseToken, temp, tableName, recordId, patch, opts = {}) {
  if (!patch || Object.keys(patch).length === 0) return;
  runCli(cliPath, [
    "base", "+record-upsert",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--record-id", recordId,
    "--json", temp.write(patch)
  ], opts);
}

function ids(keys, idMap) {
  return (Array.isArray(keys) ? keys : [keys]).map((key) => idMap.get(key)).filter(Boolean);
}

function firstIdByDimension(dimension, idMaps) {
  return idMaps.dimension_results.get(`DIM-${idMaps.evaluationId}-${dimension}`);
}

function buildLinkPatch(tableName, row, idMaps) {
  const patch = {};
  const map = FIELD_IDS[tableName];
  if (tableName === "people_overview") {
    patch[map.方向校准力详情] = ids(`DIM-${idMaps.evaluationId}-方向校准力`, idMaps.dimension_results);
    patch[map.推进闭环力详情] = ids(`DIM-${idMaps.evaluationId}-推进闭环力`, idMaps.dimension_results);
    patch[map.风险治理力详情] = ids(`DIM-${idMaps.evaluationId}-风险治理力`, idMaps.dimension_results);
    patch[map.协同调度力详情] = ids(`DIM-${idMaps.evaluationId}-协同调度力`, idMaps.dimension_results);
    patch[map.组织行为健康度详情] = ids(`DIM-${idMaps.evaluationId}-组织行为健康度`, idMaps.dimension_results);
    patch[map.人工复核入口] = Array.from(idMaps.review_items.values());
  }
  if (tableName === "evaluation_runs") {
    patch[map.五维结论入口] = ids(row.五维结论入口, idMaps.dimension_results);
    patch[map.方向校准力详情] = ids(`DIM-${idMaps.evaluationId}-方向校准力`, idMaps.dimension_results);
    patch[map.推进闭环力详情] = ids(`DIM-${idMaps.evaluationId}-推进闭环力`, idMaps.dimension_results);
    patch[map.风险治理力详情] = ids(`DIM-${idMaps.evaluationId}-风险治理力`, idMaps.dimension_results);
    patch[map.协同调度力详情] = ids(`DIM-${idMaps.evaluationId}-协同调度力`, idMaps.dimension_results);
    patch[map.组织行为健康度详情] = ids(`DIM-${idMaps.evaluationId}-组织行为健康度`, idMaps.dimension_results);
    patch[map.人工复核入口] = ids(row.人工复核入口, idMaps.review_items);
  }
  if (tableName === "dimension_results") {
    patch[map.关联指标] = ids(row.关联指标, idMaps.metric_results);
    patch[map.关联复核项] = ids(row.关联复核项, idMaps.review_items);
    patch[map.关联证据] = ids(row.关联证据, idMaps.evidence_index);
  }
  if (tableName === "metric_results") {
    patch[map.关联证据] = ids(row.关联证据, idMaps.evidence_index);
  }
  if (tableName === "review_items") {
    patch[map.关联维度结果] = ids(row.关联维度结果, idMaps.dimension_results);
    patch[map.关联指标结果] = ids(row.关联指标结果, idMaps.metric_results);
    patch[map.关联证据] = ids(row.关联证据, idMaps.evidence_index);
  }
  for (const key of Object.keys(patch)) {
    if (!patch[key] || patch[key].length === 0) delete patch[key];
  }
  return patch;
}

function publishOutputLayerInput(input, options = {}) {
  const cliPath = path.resolve(options.cliPath || process.env.LARK_CLI || DEFAULT_CLI);
  const baseToken = options.baseToken || process.env.FEISHU_BASE_TOKEN || DEFAULT_BASE_TOKEN;
  const temp = makeTempWriter();
  const idMaps = {
    evaluationId: input.metadata.evaluation_id,
    workspace_home: new Map(),
    people_overview: new Map(),
    evaluation_runs: new Map(),
    dimension_results: new Map(),
    metric_results: new Map(),
    review_items: new Map(),
    evidence_index: new Map()
  };
  const before = {};
  const after = {};
  const created = {};
  const opts = { dryRun: Boolean(options.dryRun) };

  try {
    for (const tableName of CREATE_ORDER) before[tableName] = opts.dryRun ? 0 : listRecordIds(cliPath, baseToken, tableName).length;
    if (!options.noClear) {
      for (const tableName of DELETE_ORDER) {
        for (const recordId of listRecordIds(cliPath, baseToken, tableName, opts)) {
          deleteRecord(cliPath, baseToken, tableName, recordId, opts);
        }
      }
    }
    for (const tableName of CREATE_ORDER) {
      created[tableName] = [];
      for (const row of tableRecords(input, tableName)) {
        const recordId = createRecord(cliPath, baseToken, temp, tableName, row, opts);
        idMaps[tableName].set(row[TABLES[tableName].key], recordId);
        created[tableName].push(recordId);
      }
    }
    for (const tableName of CREATE_ORDER) {
      for (const row of tableRecords(input, tableName)) {
        const recordId = idMaps[tableName].get(row[TABLES[tableName].key]);
        updateRecord(cliPath, baseToken, temp, tableName, recordId, buildLinkPatch(tableName, row, idMaps), opts);
      }
    }
    for (const tableName of CREATE_ORDER) after[tableName] = opts.dryRun ? created[tableName].length : listRecordIds(cliPath, baseToken, tableName).length;
    return {
      base_url: `https://jcneyh7qlo8i.feishu.cn/base/${baseToken}`,
      dashboard_url: DASHBOARD_URL,
      review_items_url: REVIEW_ITEMS_URL,
      before,
      after,
      created_record_counts: Object.fromEntries(Object.entries(created).map(([key, value]) => [key, value.length]))
    };
  } finally {
    temp.cleanup();
  }
}

function buildCase06Summary(input) {
  return {
    manager_name: input.people_overview?.[0]?.中层姓名 || "周牧",
    manager_id: input.metadata.manager_id,
    project_id: input.metadata.project_id,
    period: input.evaluation_run.评估周期,
    overall_score: input.evaluation_run.综合评分,
    overall_confidence: input.evaluation_run.整体置信度,
    report_status: input.evaluation_run.报告状态,
    signature_status: input.evaluation_run.签字状态,
    needs_evidence_count: input.people_overview?.[0]?.需补证数量 || 0,
    pending_review_count: input.review_items.length,
    dashboard_url: DASHBOARD_URL,
    review_items_url: REVIEW_ITEMS_URL
  };
}

module.exports = {
  DASHBOARD_URL,
  REVIEW_ITEMS_URL,
  buildCase06Summary,
  buildCleanOutputLayerInput,
  publishOutputLayerInput
};

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DEFAULT_BASE_TOKEN = "Z6d9bO5UqajK01swK9CcoGU9nkf";
const DEFAULT_INPUT = "data/outputs/demo/case04/current/output_layer_input.json";
const DEFAULT_CLI = "E:/GITHUB-RES/larksuitecli/bin/lark-cli.exe";

const FIELD_IDS = {
  peopleLatestReportLink: "fldmC24b9u",
  evaluationReportLink: "fldPmDDKvi"
};

const TABLES = {
  workspace_home: { id: "tblxWr6IUn9c8pZz", key: "module_id", source: "workspace_home" },
  people_overview: { id: "tblfQS3bHVLNavvZ", key: "person_id", source: "people_overview" },
  evaluation_runs: { id: "tblcGy0h0fx4pIoG", key: "evaluation_id", source: "evaluation_run" },
  dimension_results: { id: "tblMUq8orwwRSi1c", key: "dimension_result_id", source: "dimension_results" },
  metric_results: { id: "tbldjPFXVZ4PD9RJ", key: "metric_result_id", source: "metric_results" },
  review_items: { id: "tblShT3KAkGRjj1T", key: "review_item_id", source: "review_items" },
  evidence_index: { id: "tblQenU1BAdECcY2", key: "evidence_id", source: "evidence_index" }
};

const ORDER = [
  "workspace_home",
  "people_overview",
  "evaluation_runs",
  "dimension_results",
  "metric_results",
  "review_items",
  "evidence_index"
];

const LINK_FIELDS = new Set([
  "关联人员总览",
  "关联评估任务",
  "关联维度结果",
  "关联指标",
  "关联证据",
  "关联复核项",
  "关联指标结果"
]);

const OMIT_FIELDS = new Set([
  "评估对象",
  "最终签字人",
  "中层人员",
  "复核人",
  "创建时间",
  "最后更新时间"
]);

const DATETIME_FIELDS = new Set([
  "评估周期开始",
  "评估周期结束",
  "复核时间",
  "证据时间"
]);

const ALLOWED_METRIC_OPTIONS = new Set([
  "判断依据度",
  "目标纠偏清晰度",
  "优先级收敛时长",
  "方向反复变更次数",
  "任务定义完整率",
  "任务延期率",
  "任务关闭质量",
  "跨角色有效响应时长",
  "关键里程碑同步率",
  "依赖澄清时长",
  "协同阻塞清理成功率",
  "高等级风险识别覆盖率",
  "缓释动作落地率",
  "风险升级及时率",
  "同类风险复发率",
  "高风险语言触发频次",
  "公开负向反馈占比",
  "深夜高压催办占比",
  "重复催办率",
  "会议空转率"
]);

const METRIC_ID_TO_OPTION = {
  meeting_decision_coverage_rate: "判断依据度",
  task_definition_completeness_rate: "任务定义完整率",
  task_overdue_rate: "任务延期率",
  task_closure_rate: "任务关闭质量",
  closed_task_quality_rate: "任务关闭质量",
  current_meeting_action_task_rate: "任务定义完整率",
  meeting_action_item_coverage_rate: "任务定义完整率",
  high_risk_resolution_rate: "缓释动作落地率",
  risk_mitigation_action_rate: "缓释动作落地率",
  open_risk_rate: "风险升级及时率",
  repeated_risk_type_count: "同类风险复发率",
  calendar_stakeholder_coverage_rate: "关键里程碑同步率",
  manager_chat_signal_count: "跨角色有效响应时长",
  late_night_manager_message_rate: "深夜高压催办占比",
  high_pressure_language_sample_rate: "高风险语言触发频次"
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

function tableRecords(input, tableName) {
  const source = TABLES[tableName].source;
  if (source === "evaluation_run") return input.evaluation_run ? [input.evaluation_run] : [];
  return Array.isArray(input[source]) ? input[source] : [];
}

function runCli(cliPath, args, opts = {}) {
  const max = opts.retries ?? 3;
  for (let attempt = 1; attempt <= max; attempt += 1) {
    try {
      const out = execFileSync(cliPath, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: opts.timeout || 90_000,
        cwd: process.cwd()
      });
      return out.trim() ? JSON.parse(out) : {};
    } catch (err) {
      const stderr = err.stderr ? String(err.stderr) : "";
      const stdout = err.stdout ? String(err.stdout) : "";
      const transient = /EOF|timeout|temporarily|rate/i.test(`${stderr}\n${stdout}\n${err.message}`);
      if (attempt < max && transient) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000 * attempt);
        continue;
      }
      throw new Error(`lark-cli failed: ${args.join(" ")}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
    }
  }
  return {};
}

function makeTempWriter() {
  const tempDir = path.resolve(".tmp_feishu_upload");
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  return {
    write(value) {
      const file = `.tmp_feishu_upload/${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
      fs.writeFileSync(path.resolve(file), JSON.stringify(value), "utf8");
      return `@${file}`;
    },
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

function normalizeDateTime(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim();
  const match = text.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:[ T]([0-9]{2}):([0-9]{2}))?/);
  if (!match) return undefined;
  const [, year, month, day, hour = "00", minute = "00"] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:00`;
}

function metricOptionFromId(metricResultId) {
  const id = String(metricResultId || "");
  const found = Object.keys(METRIC_ID_TO_OPTION).find((metricId) => id.includes(metricId));
  return found ? METRIC_ID_TO_OPTION[found] : undefined;
}

function sanitizeFields(row, tableName, metricLabelToOption) {
  const fields = {};
  for (const [key, rawValue] of Object.entries(row)) {
    if (LINK_FIELDS.has(key) || OMIT_FIELDS.has(key)) continue;
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;
    if (Array.isArray(rawValue) && rawValue.length === 0) continue;

    if (DATETIME_FIELDS.has(key)) {
      const normalized = normalizeDateTime(rawValue);
      if (normalized) fields[key] = normalized;
      continue;
    }

    if (tableName === "metric_results" && key === "指标名称") {
      const mapped = metricOptionFromId(row.metric_result_id) || rawValue;
      if (ALLOWED_METRIC_OPTIONS.has(mapped)) fields[key] = mapped;
      continue;
    }

    if (tableName === "evidence_index" && key === "关联指标") {
      const mapped = metricLabelToOption.get(rawValue) || rawValue;
      if (ALLOWED_METRIC_OPTIONS.has(mapped)) fields[key] = mapped;
      continue;
    }

    if (typeof rawValue === "number" && !Number.isFinite(rawValue)) continue;
    fields[key] = rawValue;
  }
  return fields;
}

function recordIdFromResponse(response) {
  return response?.data?.record?.record_id ||
    response?.data?.record?.id ||
    response?.data?.record?.record_id_list?.[0] ||
    response?.data?.record_id ||
    response?.record?.record_id ||
    response?.record_id;
}

function splitIds(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function resolveIds(value, recordMap) {
  return splitIds(value).map((id) => recordMap.get(id)).filter(Boolean);
}

function buildLinkPatch(tableName, row, idMaps) {
  const patch = {};
  if (tableName === "people_overview") {
    patch["关联评估任务"] = resolveIds(row["关联评估任务"], idMaps.evaluation_runs);
  }
  if (tableName === "evaluation_runs") {
    patch["关联人员总览"] = resolveIds(row["关联人员总览"], idMaps.people_overview);
  }
  if (tableName === "dimension_results") {
    patch["关联评估任务"] = resolveIds(row["关联评估任务"], idMaps.evaluation_runs);
    patch["关联指标"] = resolveIds(row["关联指标"], idMaps.metric_results);
    patch["关联证据"] = resolveIds(row["关联证据"], idMaps.evidence_index);
    patch["关联复核项"] = resolveIds(row["关联复核项"], idMaps.review_items);
  }
  if (tableName === "metric_results") {
    patch["关联评估任务"] = resolveIds(row["关联评估任务"], idMaps.evaluation_runs);
    patch["关联维度结果"] = resolveIds(row["关联维度结果"], idMaps.dimension_results);
    patch["关联证据"] = resolveIds(row["关联证据"], idMaps.evidence_index);
  }
  if (tableName === "review_items") {
    patch["关联评估任务"] = resolveIds(row["关联评估任务"], idMaps.evaluation_runs);
    patch["关联维度结果"] = resolveIds(row["关联维度结果"], idMaps.dimension_results);
    patch["关联指标结果"] = resolveIds(row["关联指标结果"], idMaps.metric_results);
    patch["关联证据"] = resolveIds(row["关联证据"], idMaps.evidence_index);
  }
  if (tableName === "evidence_index") {
    patch["关联评估任务"] = resolveIds(row["关联评估任务"], idMaps.evaluation_runs);
    patch["关联维度结果"] = resolveIds(row["关联维度结果"], idMaps.dimension_results);
    patch["关联指标结果"] = resolveIds(row["关联指标结果"], idMaps.metric_results);
    patch["关联复核项"] = resolveIds(row["关联复核项"], idMaps.review_items);
  }
  for (const key of Object.keys(patch)) {
    if (!patch[key] || patch[key].length === 0) delete patch[key];
  }
  return patch;
}

function listRecordIds(cliPath, baseToken, tableName) {
  const response = runCli(cliPath, [
    "base", "+record-list",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--limit", "200",
    "--format", "json"
  ]);
  return response?.data?.record_id_list || [];
}

function deleteRecord(cliPath, baseToken, tableName, recordId) {
  runCli(cliPath, [
    "base", "+record-delete",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--record-id", recordId,
    "--yes"
  ]);
}

function createRecord(cliPath, baseToken, temp, tableName, row, metricLabelToOption) {
  const payload = sanitizeFields(row, tableName, metricLabelToOption);
  const response = runCli(cliPath, [
    "base", "+record-upsert",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--json", temp.write(payload)
  ]);
  const recordId = recordIdFromResponse(response);
  if (!recordId) {
    throw new Error(`Cannot find created record_id for ${tableName}: ${JSON.stringify(response).slice(0, 1000)}`);
  }
  return recordId;
}

function updateRecord(cliPath, baseToken, temp, tableName, recordId, patch) {
  if (!patch || Object.keys(patch).length === 0) return;
  runCli(cliPath, [
    "base", "+record-upsert",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--record-id", recordId,
    "--json", temp.write(patch)
  ]);
}

function createRecordShareLinks(cliPath, baseToken, tableName, recordIds) {
  if (!recordIds.length) return {};
  const response = runCli(cliPath, [
    "base", "+record-share-link-create",
    "--base-token", baseToken,
    "--table-id", TABLES[tableName].id,
    "--record-ids", recordIds.join(",")
  ]);
  return response?.data?.record_share_links || {};
}

function main() {
  const args = parseArgs(process.argv);
  const cliPath = path.resolve(args.cli || DEFAULT_CLI);
  const baseToken = args["base-token"] || DEFAULT_BASE_TOKEN;
  const inputPath = path.resolve(args.input || DEFAULT_INPUT);
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const temp = makeTempWriter();

  const metricLabelToOption = new Map();
  for (const row of input.metric_results || []) {
    const mapped = metricOptionFromId(row.metric_result_id) || row["指标名称"];
    if (row["指标名称"] && mapped) metricLabelToOption.set(row["指标名称"], mapped);
  }

  try {
    const before = {};
    for (const tableName of ORDER) {
      before[tableName] = listRecordIds(cliPath, baseToken, tableName).length;
    }

    for (const tableName of ORDER) {
      for (const recordId of listRecordIds(cliPath, baseToken, tableName)) {
        deleteRecord(cliPath, baseToken, tableName, recordId);
      }
    }

    const idMaps = {};
    const created = {};
    for (const tableName of ORDER) {
      idMaps[tableName] = new Map();
      created[tableName] = [];
      for (const row of tableRecords(input, tableName)) {
        const recordId = createRecord(cliPath, baseToken, temp, tableName, row, metricLabelToOption);
        idMaps[tableName].set(row[TABLES[tableName].key], recordId);
        created[tableName].push(recordId);
      }
    }

    for (const tableName of ORDER) {
      for (const row of tableRecords(input, tableName)) {
        const recordId = idMaps[tableName].get(row[TABLES[tableName].key]);
        updateRecord(cliPath, baseToken, temp, tableName, recordId, buildLinkPatch(tableName, row, idMaps));
      }
    }

    const evaluationShareLinks = createRecordShareLinks(cliPath, baseToken, "evaluation_runs", created.evaluation_runs);
    for (const row of tableRecords(input, "evaluation_runs")) {
      const evaluationRecordId = idMaps.evaluation_runs.get(row.evaluation_id);
      const shareLink = evaluationShareLinks[evaluationRecordId];
      if (!shareLink) continue;
      updateRecord(cliPath, baseToken, temp, "evaluation_runs", evaluationRecordId, {
        [FIELD_IDS.evaluationReportLink]: shareLink
      });
      const peopleRecordIds = resolveIds(row["关联人员总览"], idMaps.people_overview);
      for (const peopleRecordId of peopleRecordIds) {
        updateRecord(cliPath, baseToken, temp, "people_overview", peopleRecordId, {
          [FIELD_IDS.peopleLatestReportLink]: shareLink
        });
      }
    }

    const after = {};
    for (const tableName of ORDER) {
      after[tableName] = listRecordIds(cliPath, baseToken, tableName).length;
    }

    process.stdout.write(JSON.stringify({
      base_url: `https://jcneyh7qlo8i.feishu.cn/base/${baseToken}`,
      input: inputPath,
      before,
      after,
      created_record_counts: Object.fromEntries(Object.entries(created).map(([key, value]) => [key, value.length]))
    }, null, 2) + "\n");
  } finally {
    temp.cleanup();
  }
}

if (require.main === module) {
  main();
}

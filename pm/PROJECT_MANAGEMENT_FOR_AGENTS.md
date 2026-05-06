# Project Management For Agents

更新时间：2026-05-05

本文档给后续接手的 AI Agent / 工程协作者使用，用来快速理解 `Manager Insight MVP` 当前项目状态、已有能力、可运行链路、输出产物，以及距离“中层管理效能评估 Agent 最终评审工作台”还缺什么。

## 1. 项目定位

本项目是一个运行在飞书生态内的“中层管理效能评估 Agent”MVP。它不是独立网页应用，也不是单轮问答机器人，而是围绕飞书会议、文档、多维表格、聊天、日历和通讯录数据，完成以下闭环：

```text
会议 / 文档 / Base 数据进入
-> 事实结构化
-> 数据完整性与质量检查
-> 硬指标计算
-> 动态评估规划
-> 多 Agent 分析
-> 综合能力评估
-> 报告生成
-> 人工复核
-> 飞书多维表格写回
-> 下一周期持续观察
```

当前仓库主要完成了“评估链路前半段 + demo 输出 + CSV 写回准备”。最终飞书多维表格评审工作台的系统级呈现层仍在补齐中。

## 2. 当前业务范围

当前 MVP 聚焦产品 / 研发项目周会场景，评估对象是项目型中层负责人。

默认评估范围：

- 单项目。
- 单负责人。
- 单周期评估。
- 当前会议 + 最近 3 到 5 场同项目历史会议。
- 默认报告周期按周生成。

明确不做：

- 不做跨项目横向排名。
- 不做人事任免建议。
- 不直接输出绩效定级。
- 不输出人格判断。
- 不把低置信结论写成强事实。
- 不将 Agent 原始推理过程、prompt、调试日志、原始聊天全文写入最终评审工作台。

## 3. 五维评估框架

项目当前使用五个一级维度：

| 一级维度 | 核心问题 | MVP 关注指标 |
| --- | --- | --- |
| 方向校准力 | 管理者下达方向是否基于数据、文档、历史决议和项目事实。 | 判断依据度、目标纠偏清晰度、优先级收敛时长、方向反复变更次数 |
| 推进闭环力 | 管理者是否能把讨论沉淀为任务，并推动到真实交付。 | 任务定义完整率、任务延期率、任务关闭质量 |
| 风险治理力 | 管理者是否能早识别、早干预、早升级并减少同类复发。 | 高等级风险识别覆盖率、缓释动作落地率、风险升级及时率、同类风险复发率 |
| 协同调度力 | 管理者是否能跨团队响应、澄清依赖、同步里程碑并清理阻塞。 | 跨角色有效响应时长、关键里程碑同步率、依赖澄清时长、协同阻塞清理成功率 |
| 组织行为健康度 | 管理者是否采用低内耗、可持续的沟通和推进方式。 | 高风险语言触发频次、公开负向反馈占比、深夜高压催办占比、重复催办率、会议空转率 |

注意：`AI 替代风险指数` 只作为衍生观察项，不参与五维主评分机械加总，不输出人事处置建议。

## 4. 当前仓库结构

```text
E:/GITHUB-RES/Feishu
├── data/
│   ├── cases/                 # 原始案例素材
│   ├── fixtures/              # 可直接运行的模拟输入和飞书 CLI 采样结果
│   ├── outputs/               # demo 输出、自动化输出、CSV 写回准备
│   └── seeds/                 # 早期飞书 Base 初始化种子数据
├── docs/
│   ├── architecture/          # 架构、Bot、节点构建顺序、系统图
│   ├── observability/         # 可观测性输出示例
│   ├── product/               # PRD、比赛要求、评估维度
│   └── prompts/               # Agent system prompt 和 prompt 模板
├── schemas/                   # 各节点 request/result JSON schema
├── scripts/
│   ├── demo/                  # 演示入口脚本
│   └── dev/                   # 本地辅助脚本
├── src/
│   ├── agents/                # 单 Agent 能力模块
│   ├── config/                # LLM 配置加载
│   ├── domain/                # 评估规划、硬指标计算、任务上下文
│   ├── integrations/          # 飞书 Bot、样例数据适配
│   ├── llm/                   # 模型调用封装
│   ├── shared/                # 文件工具
│   └── workflows/             # front pipeline 和完整评估编排
├── package.json
└── README.md
```

当前盘点状态：

- `docs`：13 个文件。
- `schemas`：19 个 schema。
- `src`：16 个源码文件。
- `scripts`：12 个脚本。
- `data/fixtures`：58 个文件。
- `data/outputs`：214 个 demo / 自动化输出文件。
- 当前没有 `tests/` 目录。

## 5. 当前核心代码入口

### 5.1 前置事实结构化

入口文件：

```text
src/workflows/front_pipeline.js
```

职责：

- 构建 `task_request`。
- 检查输入完整性。
- 聚合样例包。
- 生成 `raw_payload`、`history_bundle`、`meeting_fact_pack`、`data_quality_report`。

高频命令：

```bash
npm run front:case04
```

等价于：

```bash
node scripts/demo/run_front_pipeline.js --input-dir data/fixtures/feishu_cli_case_04_simulated_5d --output-dir data/outputs/demo/case04/current
```

### 5.2 完整评估编排

入口文件：

```text
src/workflows/evaluation_automation.js
```

职责：

1. 选择当前可评估会议。
2. 运行前置 pipeline。
3. 执行硬指标计算。
4. 生成评估计划。
5. 并行调用多 Agent。
6. 调用 Capability Assessor 汇总五维。
7. 调用 Report Writer 生成报告 JSON。
8. 输出自动化 summary。

高频命令：

```bash
npm run auto:case05
```

如需不调用模型，应使用脚本参数：

```bash
node scripts/demo/run_evaluation_automation.js --input-dir data/fixtures/feishu_cli_case_05_desktop_robot --output-dir data/outputs/demo/case05/auto --no-model
```

### 5.3 Base CSV 写回准备

入口文件：

```text
scripts/dev/write_feishu_base_csv.js
```

职责：

- 读取 `case04/current` 下的评估结果。
- 生成准备写回飞书 Base 的 CSV。
- 当前不是直接写入真实飞书多维表格。

高频命令：

```bash
npm run writeback:csv:case04
```

输出目录：

```text
data/outputs/demo/case04/feishu_base_csv
```

## 6. 当前 Agent 节点

| Agent | 文件 | 主要职责 |
| --- | --- | --- |
| Management Reviewer | `src/agents/management_reviewer.js` | 方向校准力、推进闭环力相关判断 |
| Risk & Behavior Auditor | `src/agents/risk_behavior_auditor.js` | 风险治理力、组织行为健康度相关判断 |
| Coordination Lens | `src/agents/coordination_lens.js` | 协同调度力专项判断 |
| Capability Assessor | `src/agents/capability_assessor.js` | 汇总五维结果、置信度、人审项、整体结论 |
| Report Writer | `src/agents/report_writer.js` | 生成报告 JSON、证据摘要、Base 回写建议 |

当前还没有独立的 `Consistency Judge` 节点。低置信、证据冲突、人审触发项目前分散在各 Agent 结果和 Report Writer 结果中。

## 7. 当前 Schema 资产

`schemas/` 下已经覆盖主链路对象：

| 类别 | 代表 schema |
| --- | --- |
| 任务与状态 | `task_request.schema.json`、`orchestration_state.schema.json` |
| 输入事实包 | `raw_payload.schema.json`、`meeting_fact_pack.schema.json`、`history_bundle.schema.json` |
| 数据质量 | `input_completeness_report.schema.json`、`data_quality_report.schema.json` |
| 规划与硬指标 | `evaluation_plan.schema.json`、`hard_metrics_result.schema.json` |
| 专家 Agent | `management_reviewer_*`、`risk_behavior_auditor_*`、`coordination_lens_*` |
| 汇总评估 | `capability_assessor_request.schema.json`、`capability_assessor_result.schema.json` |
| 报告 | `report_writer_request.schema.json`、`report_result.schema.json` |

缺口：

- 没有最终飞书多维表格输出层 schema。
- 没有 `people_overview`、`workspace_home`、`evaluation_runs`、`dimension_results`、`metric_results`、`review_items`、`evidence_index` 的写回 schema。
- 没有 `Consistency Judge` 输出 schema。

## 8. 当前 Demo 输出

主输出目录：

```text
data/outputs/demo/case04/current
```

常见文件：

| 文件 | 说明 |
| --- | --- |
| `task_request.json` | 评估任务请求 |
| `orchestration_state.json` | 编排状态 |
| `input_completeness_report.json` | 输入完整性检查 |
| `raw_payload.json` | 标准化原始输入 |
| `history_bundle.json` | 历史会议、历史风险、历史评估等上下文 |
| `meeting_fact_pack.json` | 当前会议事实包 |
| `data_quality_report.json` | 数据质量报告 |
| `hard_metrics_result.json` | 硬指标计算结果 |
| `evaluation_plan.json` | 动态评估计划 |
| `management_reviewer_request/result.json` | 管理审阅 Agent 输入输出 |
| `risk_behavior_auditor_request/result.json` | 风险与行为审计 Agent 输入输出 |
| `coordination_lens_request/result.json` | 协同专项 Agent 输入输出 |
| `capability_assessor_request/result.json` | 五维汇总 Agent 输入输出 |
| `report_writer_request.json` | 报告生成请求 |
| `report_result.json` | 最终报告 JSON |

CSV 输出目录：

```text
data/outputs/demo/case04/feishu_base_csv
```

当前 CSV：

| CSV | 当前含义 | 与新工作台关系 |
| --- | --- | --- |
| `evaluations.csv` | 评估主记录 | 可映射到 `evaluation_runs`，但字段需重构 |
| `evaluation_dimension_scores.csv` | 五维评分明细 | 可映射到 `dimension_results` |
| `metric_results.csv` | 硬指标计算结果 | 可映射到 `metric_results`，需补数据覆盖字段 |
| `human_review_items.csv` | 人工复核项 | 可映射到 `review_items`，字段不足 |
| `reports.csv` | 报告主记录 | 可合并进 `evaluation_runs.报告链接/报告状态` |
| `report_items.csv` | 报告条目、证据、风险、动作 | 部分可拆到 `dimension_results`、`evidence_index` |
| `risk_flags.csv` | 风险与行为 flag | 可进入 `review_items` 或 `dimension_results` |
| `expert_findings.csv` | 专家 Agent findings | 可进入维度结论或证据索引，但不应整包写回 |

## 9. 最终飞书评审工作台目标结构

我们当前的 MVP 输出层方案不是复用旧 9 张业务底表，而是构建一个面向评审的系统级工作台。

目标表：

| 表 | 系统角色 | 承接内容 |
| --- | --- | --- |
| `workspace_home` | 首页 / 导航层 | 系统入口、模块说明、推荐使用人、入口链接 |
| `people_overview` | 人员总览层 | 中层人员池、评估对象状态、最新报告、待复核数量、数据覆盖等级 |
| `evaluation_runs` | 评估任务入口 | 单次 review packet、报告状态、签字状态、整体置信度、数据覆盖摘要 |
| `dimension_results` | 维度结论层 | 五维结论、分数、等级、置信度、边界说明、建议动作 |
| `metric_results` | 指标 / BI 层 | 指标值、样本量、缺失率、数据源质量、是否降级、计算口径 |
| `review_items` | 人工复核 / 工单层 | 低置信、证据冲突、敏感判断、样本不足、补证、复核状态 |
| `evidence_index` | 证据溯源层 | 证据片段、原始链接、来源类型、证据质量、权限状态、冲突说明 |

下钻路径：

```text
workspace_home
-> people_overview
-> evaluation_runs
-> dimension_results
-> metric_results
-> evidence_index
```

人工复核路径：

```text
review_items
-> 关联维度结果
-> 关联指标结果
-> 关联证据
-> 原始链接
-> 复核状态 / 复核备注 / 是否允许报告生效
```

注意：目标飞书 Base token、内部链接和权限信息不应硬编码到仓库文件中，应由运行环境、任务上下文或部署配置提供。

## 10. 当前已经具备的能力

当前已具备：

- 五维评估 PRD 和指标口径。
- Case 04 / Case 05 样例输入。
- 前置数据完整性检查。
- 数据质量报告。
- 会议事实包和历史上下文构建。
- 硬指标计算。
- 动态评估计划。
- 三个专家 Agent。
- 五维 Capability Assessor。
- Report Writer。
- demo 输出落盘。
- CSV 写回准备。
- 飞书 Bot webhook 服务雏形。

这些能力足够支撑“本地跑通一轮 demo”。

## 11. 距离最终 MVP 还缺什么

### 11.1 输出层适配器缺失

当前只有旧 CSV 写回结构，还没有将现有 JSON 转成最终七张评审工作台表的适配器。

需要新增一个输出层转换模块，输入：

- `task_request.json`
- `orchestration_state.json`
- `input_completeness_report.json`
- `data_quality_report.json`
- `hard_metrics_result.json`
- `evaluation_plan.json`
- `capability_assessor_result.json`
- `report_result.json`

输出：

- `people_overview.records.json`
- `evaluation_runs.records.json`
- `dimension_results.records.json`
- `metric_results.records.json`
- `review_items.records.json`
- `evidence_index.records.json`
- `workspace_home.records.json` 可选，仅导航配置变更时输出

### 11.2 Evidence Index 未拆表

当前证据多以 `evidence_refs_json` 嵌套在报告、指标、人审项里。

缺口：

- 没有统一 `evidence_id`。
- 没有独立证据质量字段。
- 没有权限状态字段。
- 没有冲突标记字段。
- 没有从维度 / 指标 / 复核项到证据的显式关联记录。

### 11.3 Consistency Judge 未独立

当前低置信、人审项、证据冲突由各 Agent 分散产生。

建议新增 `Consistency Judge`，职责：

- 去重重复人审项。
- 合并同一证据冲突。
- 识别 Agent 间结论冲突。
- 给出统一置信度。
- 生成最终 `review_items`。
- 标记哪些结论可进入正式报告，哪些只能作为观察项。

### 11.4 飞书多维表格真实写回缺失

当前 `write_feishu_base_csv.js` 只生成 CSV，不直接写飞书 Base。

缺口：

- 没有使用飞书 CLI / OpenAPI 创建或更新记录。
- 没有处理关联记录字段。
- 没有处理写回失败重试。
- 没有 Base 写回日志。
- 没有“报告生成成功但 Base 写回失败”的任务状态。

### 11.5 应用页面 / Dashboard 呈现缺失

当前代码仓库不包含应用搭建器页面配置。

最终需要：

- `workspace_home` 首页导航。
- `people_overview` 人员总览卡片。
- 评审总览仪表盘。
- 待复核工作队列。
- 数据覆盖看板。
- 证据权限 / 证据质量看板。

如果用飞书应用搭建器页面，当前 `lark-cli` 不直接支持页面布局生成，只能通过浏览器 UI 或手动配置完成。

### 11.6 测试体系缺失

当前没有 `tests/` 目录。

最低测试建议：

- Schema 校验测试：每个 demo 输出必须通过对应 schema。
- 输出层映射测试：固定 case04 输入映射到七张表时字段不缺失。
- Evidence Index 拆分测试：同一证据引用去重并能反向关联。
- Review Items 去重测试：重复低置信项只生成一条主复核项。
- No-model 流程测试：`--no-model` 能生成可解释的阻断 / 降级 summary。

## 12. 建议的下一步任务拆解

优先级从高到低：

1. 新增输出层适配器。
   - 目标：把现有结果 JSON 转为最终七张表的 records JSON。
   - 原则：先生成本地文件，不立即写飞书。

2. 新增 `evidence_index` 拆分逻辑。
   - 目标：从 `evidence_refs` 中提取独立证据记录。
   - 原则：保留原文片段，不写原始全文。

3. 新增 `review_items` 归并逻辑。
   - 目标：把各 Agent 的 `human_review_items` 合并成可复核工单。
   - 原则：低置信、证据冲突、敏感判断、样本不足必须可区分。

4. 改造 `write_feishu_base_csv.js`。
   - 目标：输出新七张表 CSV 或 JSON，而不是旧 8 个 CSV。
   - 原则：保持旧脚本可用时，可新增脚本而不是破坏旧 demo。

5. 增加 schema。
   - 目标：为最终输出层对象增加 schema。

6. 增加最小测试。
   - 目标：保证 case04/current 能稳定映射到新输出层。

7. 接入真实飞书写回。
   - 目标：使用飞书 CLI / OpenAPI 写入多维表格。
   - 原则：先 dry-run / 本地 JSON，再真实写回。

## 13. 建议新增文件

建议后续新增：

```text
schemas/output_workbench_records.schema.json
src/workflows/output_workbench_adapter.js
scripts/demo/run_output_workbench_adapter.js
scripts/dev/write_output_workbench_csv.js
data/outputs/demo/case04/output_workbench/
tests/output_workbench_adapter.test.js
```

若不建立测试框架，至少新增一个本地校验脚本：

```text
scripts/dev/validate_output_workbench_records.js
```

## 14. 运行约定

Node 版本：

- 项目 README 写明 Node 18+。
- 当前本地基础命令已在 Node 24 系列下验证过。

常用命令：

```bash
npm run front:case04
npm run metrics:case04
npm run plan:case04
npm run review:management:case04
npm run audit:risk-behavior:case04
npm run review:coordination:case04
npm run assess:capability:case04
npm run report:case04
npm run writeback:csv:case04
npm run auto:case05
```

如果要跑完整链路并调用模型，需要配置：

```bash
LLM_MODEL=your-model
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://your-endpoint/v1
```

如果要启动 Bot webhook，需要配置：

```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_BOT_VERIFICATION_TOKEN=optional_verify_token
```

不要把真实密钥提交到仓库。

## 15. Agent 工作守则

后续 Agent 接手时请遵守：

- 先读 `docs/product/PRD-MVP.md` 和 `docs/product/中层评估维度.md`。
- 先跑现有 demo，确认当前输出形态，再改代码。
- 不要把旧 9 张业务底表和新 7 张输出工作台表混为一谈。
- 不要把 `evidence_refs_json` 原样塞进最终工作台；要拆成 `evidence_index`。
- 不要把低置信结论写成正式评价。
- 不要把人审项绕过 Report Writer 或签字层。
- 不要向仓库写入真实飞书 token、内部 Base 链接、用户隐私原文、聊天全文或会议全文。
- 输出给评审的内容必须支持“从报告到证据”的下钻。
- 所有写回失败都必须形成可见状态，不能静默吞掉。

## 16. 当前最重要的一句话

这个仓库已经有了“能跑的评估流水线”，但还缺“面向评审的输出层产品化”。

下一步不要重写 Agent，而是先补齐：

```text
现有 JSON 结果
-> 输出层适配器
-> 七张评审工作台表
-> evidence_index 下钻
-> review_items 人审流转
-> 飞书多维表格真实写回
-> 应用首页 / 仪表盘呈现
```

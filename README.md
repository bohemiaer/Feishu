# 飞书比赛 / Manager Insight MVP

一个围绕“中层管理者评估”的 Agent Workflow 原型项目。它面向飞书内的项目管理场景，读取会议纪要、云文档、多维表格、聊天、日历和通讯录等输入，完成前置数据整理、硬指标计算、多 Agent 评估、结构化报告生成，以及后续自动化接入准备。

当前仓库更接近“可演示的 MVP + 可继续工程化演进的工作流骨架”，适合比赛演示、评估链路验证和后续产品化拆分。

## 1. 项目目标

项目聚焦产品/研发项目中的项目型中层负责人，核心目标是持续观察其在项目推进中的管理行为，并输出有证据链支撑的结构化评估结果。

当前 MVP 重点覆盖 5 个一级维度：

- 方向校准力
- 推进闭环力
- 风险治理力
- 协同调度力
- 组织行为健康度

核心业务闭环：

`飞书数据输入 -> 前置事实结构化 -> 硬指标计算 -> 动态评估规划 -> 多 Agent 分析 -> 综合评估 -> 报告生成 -> 后续回写/自动化`

## 2. 当前能力边界

仓库已经具备以下能力：

- 基于样例包运行前置 pipeline，输出 `task_request`、`meeting_fact_pack`、`history_bundle`、`data_quality_report` 等中间产物。
- 对任务、风险、会议、聊天等数据计算确定性硬指标。
- 基于不同职责拆分多个 Agent：
  - `management_reviewer`
  - `risk_behavior_auditor`
  - `coordination_lens`
  - `capability_assessor`
  - `report_writer`
- 支持从飞书 Bot webhook 触发自动化评估任务。
- 支持使用本地 fixture 做离线演示，不依赖真实飞书环境即可跑通主链路。

当前还处于持续重构阶段，`docs/`、`data/`、`src/workflows/`、`src/integrations/` 已经按新结构收口，部分旧目录和旧产物已归档到 `data/outputs/demo/legacy/`。

## 3. 仓库结构

```text
.
├─ data/
│  ├─ cases/            # 原始案例素材
│  ├─ fixtures/         # 可直接运行的模拟输入
│  ├─ outputs/          # 演示输出、自动化输出
│  └─ seeds/            # 飞书 Base 初始化/回写相关种子数据
├─ docs/
│  ├─ architecture/     # 架构设计、流程说明
│  ├─ observability/    # 可观测性输出示例
│  ├─ product/          # PRD、比赛要求、评估维度
│  └─ prompts/          # Agent prompt 与模板
├─ schemas/             # request/result schema
├─ scripts/
│  ├─ demo/             # 演示和批处理入口
│  └─ dev/              # 本地开发辅助脚本
├─ src/
│  ├─ agents/           # 单 Agent 能力模块
│  ├─ config/           # 配置加载
│  ├─ domain/           # 领域逻辑与指标计算
│  ├─ integrations/     # 飞书与样例输入接入
│  ├─ llm/              # 模型调用封装
│  ├─ shared/           # 通用工具
│  └─ workflows/        # 多步骤工作流编排
├─ tests/
├─ api.md               # 可选，本地模型配置文件
└─ package.json
```

## 4. 运行环境

- Node.js 18 及以上
- Windows PowerShell、macOS、Linux 均可，当前仓库已在 Node `v24.14.1` 下验证基础命令可运行
- 当前 `package.json` 主要是脚本入口，运行主链路依赖 Node 内置能力

如果你只想跑离线演示样例，通常不需要真实飞书凭证。

## 5. 配置方式

### 5.1 LLM 配置

调用模型时，优先通过环境变量配置：

```bash
LLM_MODEL=your-model
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://your-endpoint/v1
```

也支持本地 `api.md` 兜底解析。格式示例：

```md
模型名称：your-model
api:sk-xxxx
url https://your-endpoint/v1/chat/completions
```

说明：

- 更推荐使用环境变量。
- `api.md` 只建议用于本地调试。
- 不要把真实密钥提交到仓库。

### 5.2 飞书 Bot 配置

如需启动 Bot webhook，还需要：

```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_BOT_VERIFICATION_TOKEN=optional_verify_token
```

## 6. 快速开始

### 6.1 跑前置数据链路

使用 Case 04 的模拟输入，生成前置产物：

```bash
node scripts/demo/run_front_pipeline.js --input-dir data/fixtures/feishu_cli_case_04_simulated_5d --output-dir data/outputs/demo/case04/current
```

执行后会生成：

- `task_request.json`
- `orchestration_state.json`
- `input_completeness_report.json`
- `raw_payload.json`
- `history_bundle.json`
- `meeting_fact_pack.json`
- `data_quality_report.json`

### 6.2 跑完整自动化链路（不调用模型）

先验证工作流编排和文件产出是否正常：

```bash
node scripts/demo/run_evaluation_automation.js --input-dir data/fixtures/feishu_cli_case_05_desktop_robot --output-dir data/outputs/demo/case05/auto --no-model
```

这个模式会继续完成：

- 硬指标计算
- 评估规划
- 各 Agent request 生成
- `automation_summary.json` 汇总

但不会真正请求 LLM。

### 6.3 跑完整自动化链路（调用模型）

在配置好 `LLM_MODEL`、`LLM_API_KEY`、`LLM_BASE_URL` 或 `api.md` 后运行：

```bash
node scripts/demo/run_evaluation_automation.js --input-dir data/fixtures/feishu_cli_case_05_desktop_robot --output-dir data/outputs/demo/case05/auto_with_model
```

## 7. 常用 npm 脚本

`package.json` 中当前保留了几组高频脚本：

| 命令 | 作用 |
| --- | --- |
| `npm run demo` | 跑 Case 04 前置 pipeline 默认演示链路 |
| `npm run front:case04` | 输出 Case 04 前置产物 |
| `npm run metrics:case04` | 计算 Case 04 硬指标 |
| `npm run plan:case04` | 生成评估计划 |
| `npm run review:management:case04` | 生成管理评审 request |
| `npm run audit:risk-behavior:case04` | 生成风险与行为审计 request |
| `npm run review:coordination:case04` | 生成协同评审 request |
| `npm run assess:capability:case04` | 生成综合能力评估结果 |
| `npm run report:case04` | 生成报告结果 |
| `npm run observability:case04` | 输出可观测性 Markdown |
| `npm run writeback:csv:case04` | 生成飞书 Base 回写 CSV |
| `npm run auto:case05` | 跑 Case 05 自动化样例 |
| `npm run automation:run` | 通用自动化入口 |
| `npm run bot:server` | 启动飞书 Bot 服务 |

## 8. 飞书 Bot 使用方式

启动服务：

```bash
node scripts/dev/run_feishu_bot_server.js --port 3030
```

默认可用接口：

- `GET /health`
- `GET /jobs`
- `POST /webhook/feishu/bot`

Bot 支持的文本命令：

- `help`
- `status <jobId>`
- `run <bundlePath> [--meeting-id <id>] [--output-dir <dir>] [--no-model] [--strict-latest]`

示例：

```text
run data/fixtures/feishu_cli_case_05_desktop_robot --no-model
```

## 9. 主要输入与输出

### 9.1 输入

当前项目主要围绕 7 类输入源构建统一样例包：

- Base 记录
- Base 历史
- 云文档
- 聊天历史
- 会议/妙记
- 日历
- 通讯录

默认演示输入位于：

- `data/fixtures/feishu_cli_case_04_simulated_5d`
- `data/fixtures/feishu_cli_case_05_desktop_robot`

### 9.2 输出

工作流会产出几类文件：

- 前置任务与编排状态：`task_request.json`、`orchestration_state.json`
- 输入质量与完整性：`input_completeness_report.json`、`data_quality_report.json`
- 标准化事实包：`raw_payload.json`、`history_bundle.json`、`meeting_fact_pack.json`
- 领域计算结果：`hard_metrics_result.json`、`evaluation_plan.json`
- Agent 请求与结果：`*_request.json`、`*_result.json`
- 总结文件：`automation_summary.json`

演示输出默认位于 `data/outputs/demo/`。

## 10. 核心工作流

### 10.1 `front_pipeline`

入口：`src/workflows/front_pipeline.js`

负责：

- 构建评估任务请求
- 检查输入完整性
- 聚合样例包
- 生成原始 payload、历史包、会议事实包、数据质量报告

### 10.2 `evaluation_automation`

入口：`src/workflows/evaluation_automation.js`

负责串联完整自动化链路：

1. 选择当前可评估会议
2. 运行前置 pipeline
3. 执行硬指标计算
4. 生成评估计划
5. 调用多 Agent
6. 汇总综合评估
7. 生成报告与自动化摘要

## 11. 关键模块说明

- `src/agents/`
  - 单个 Agent 的 request 构建、模型调用和结果整理
- `src/domain/evaluation/`
  - `hard_metrics_engine.js`：确定性指标计算
  - `evaluation_planner.js`：决定本轮评估重点和降级策略
- `src/integrations/sample_case04_adapter.js`
  - 把模拟飞书 CLI 输入包适配成统一内部结构
- `src/integrations/feishu/`
  - 飞书 Bot 服务与消息发送逻辑
- `src/shared/fs_utils.js`
  - 输出目录、JSON 文件等通用文件工具

## 12. 相关文档

- 产品说明：[docs/product/PRD-MVP.md](docs/product/PRD-MVP.md)
- 比赛要求：[docs/product/比赛要求.md](docs/product/比赛要求.md)
- 评估维度：[docs/product/中层评估维度.md](docs/product/中层评估维度.md)
- 架构规划：[docs/architecture/项目结构规划.md](docs/architecture/项目结构规划.md)
- 飞书 Bot 自动化：[docs/architecture/feishu_bot_automation.md](docs/architecture/feishu_bot_automation.md)
- 可观测性样例：[docs/observability/case04_full_loop_observability.md](docs/observability/case04_full_loop_observability.md)

## 13. 当前状态与建议

这个仓库目前适合两类使用方式：

- 比赛演示：直接使用 `data/fixtures/` 中的模拟包跑完整链路
- 工程演进：继续围绕 `src/workflows/`、`src/integrations/`、`schemas/` 和 `docs/` 深化

建议优先关注：

- 补充测试目录下的单元测试和集成测试
- 进一步完善真实飞书数据拉取与回写闭环
- 明确 schema 版本和结果校验策略
- 清理本地调试配置，避免提交真实密钥

---

如果你想从最小命令开始，推荐先执行：

```bash
npm run demo
```

然后查看 `data/outputs/demo/case04/current/` 下生成的中间产物，再继续跑自动化或 Bot 集成。

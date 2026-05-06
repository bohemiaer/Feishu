# Schema 版本与结果校验策略

## 1. 当前 Schema 版本

仓库当前采用一套集中式 schema bundle 管理：

- schema bundle 版本：`2026-05-05.v1`
- manifest 文件：[schemas/schema_manifest.json](/D:/Users/HCI_lab/Desktop/github/飞书比赛/schemas/schema_manifest.json)
- JSON Schema 方言：`draft/2020-12`

说明：

- 单个产物的结构定义仍然保存在 `schemas/*.schema.json`
- 版本号不分散写在每个业务 JSON 文件里，而是由 `schema_manifest.json` 统一声明和索引
- 运行时按“产物名 -> schema 文件”映射进行校验，例如 `task_request.json -> task_request.schema.json`

## 2. 版本策略

当前采用 `schema bundle version` 策略，而不是每个文件各自独立发版。

适用原则：

- 只要任一 schema 的必填字段、枚举值、嵌套结构、额外字段约束发生变化，都需要提升 bundle 版本
- 纯文案说明、注释、README 描述更新，不提升 schema 版本
- 向后不兼容的调整，必须同步更新：
  - `schemas/schema_manifest.json`
  - 对应 `schemas/*.schema.json`
  - 相关产物生成逻辑
  - 相关 demo / workflow 校验链路

推荐约定：

- 小范围兼容性增强：递增尾部版本，例如 `2026-05-05.v2`
- 有明显结构变更：切新日期并重置序号，例如 `2026-06-01.v1`

## 3. 校验策略

### 3.1 校验分层

当前统一分成三层：

1. 代码生成产物校验  
`front_pipeline`、`hard_metrics_engine`、`evaluation_planner` 这类确定性产物，在函数返回前执行严格 schema 校验。

2. 文件读写校验  
主流程和 demo 脚本在读关键输入、写关键输出时，统一通过 `src/shared/schema_validation.js` 做严格校验。

3. 模型结果校验  
Agent 的 request 在发送前校验；LLM result 在必要归一化后再做严格校验，失败即抛错，不静默落盘。

### 3.2 校验模式

manifest 中当前有两类模式：

- `strict_read_write`
  适用于请求、前置中间件、确定性结果
- `strict_post_model`
  适用于 LLM 结果，要求模型输出在归一化后必须完全满足 schema

### 3.3 失败处理

校验失败时，直接中断当前步骤并抛出带上下文的错误信息，错误中会包含：

- artifact 名称
- 校验阶段（`read` / `write` / `post_model`）
- schema bundle 版本
- schema 文件名
- 具体字段错误列表

## 4. 运行入口

运行主流程时，schema 校验会自动执行。

如果需要对某个输出目录做离线验收，可以执行：

```bash
node scripts/dev/validate_artifact_dir.js --input-dir data/outputs/demo/case04/current
```

或：

```bash
npm run validate:smoke
```

## 5. 当前边界

当前策略已经覆盖：

- 前置 pipeline 产物
- 硬指标结果
- 评估计划
- Agent request / result
- 报告 request / result
- 自动化主链路中的关键 JSON 落盘

当前仍未强制覆盖的内容：

- `automation_summary.json`
- 观测性辅助文件
- CSV 回写文件

这些文件更偏运行摘要或派生视图，后续如需要，也可以继续补充 schema 合同。

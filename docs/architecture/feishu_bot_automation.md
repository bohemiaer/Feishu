# 飞书机器人自动化触发说明

## 目标

把原来需要人工逐个执行的流程，收敛成：

`飞书机器人消息 -> 自动编排 workflow -> 多 Agent 执行 -> 结果落盘 -> 可选消息回发`

## 入口

- 本地启动：
  - `npm run bot:server`
- webhook：
  - `POST /webhook/feishu/bot`
- 健康检查：
  - `GET /health`
- 任务列表：
  - `GET /jobs`

## 机器人命令

- 帮助：
  - `help`
- 查询状态：
  - `status <jobId>`
- 发起评估：
  - `run <bundlePath>`
  - `run <bundlePath> --meeting-id <meetingId>`
  - `run <bundlePath> --meeting-id <meetingId> --output-dir <outputDir>`
  - `run <bundlePath> --no-model`
  - `run <bundlePath> --strict-latest`

示例：

```text
run data/fixtures/feishu_cli_case_05_desktop_robot
run data/fixtures/feishu_cli_case_05_desktop_robot --meeting-id MTG-CASE-05-01
```

## 自动编排行为

- 统一 workflow 在 `src/workflows/evaluation_automation.js`
- 默认链路：
  - `front_pipeline`
  - `hard_metrics_engine`
  - `evaluation_planner`
  - `management_reviewer`
  - `risk_behavior_auditor`
  - `coordination_lens`
  - `capability_assessor`
  - `report_writer`
- 当未显式传入 `meeting_id` 时：
  - 默认按会议时间从新到旧尝试
  - 如果最新会议因为留痕不足被 `blocked`，会自动回退到最近一个可评估会议
  - 该回退过程会记录在 `automation_summary.json`

## 环境变量

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BOT_VERIFICATION_TOKEN`
- `PORT`
- `HOST`

说明：

- `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 用于把任务受理/完成结果回发到飞书聊天。
- `FEISHU_BOT_VERIFICATION_TOKEN` 仅在你启用事件订阅 token 校验时需要配置。
- 若未配置 `FEISHU_APP_ID` / `FEISHU_APP_SECRET`，机器人仍可收 webhook 并本地跑流程，但不会主动回消息。

## 输出

每次任务都会输出到独立目录，并包含：

- `task_request.json`
- `orchestration_state.json`
- `input_completeness_report.json`
- `raw_payload.json`
- `history_bundle.json`
- `meeting_fact_pack.json`
- `data_quality_report.json`
- `hard_metrics_result.json`
- `evaluation_plan.json`
- `*_request.json`
- `*_result.json`
- `automation_summary.json`

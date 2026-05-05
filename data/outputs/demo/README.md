# Demo Outputs

本目录只保存可再生的演示输出。

## Directory Layout

- `case04/current/`：Case 04 当前主链路输出，所有 npm demo 脚本默认读写这里。
- `case04/feishu_base_csv/`：准备回写到飞书 Base 的 CSV 表数据。
- `case04/variants/`：Case 04 降级、阻断等测试变体输出。
- `legacy/`：旧版 demo 输出归档，不再作为默认链路输入。

## Case 04 CSV Tables

`case04/feishu_base_csv/` 当前包含：

- `evaluations.csv`：评估主记录。
- `evaluation_dimension_scores.csv`：五维评分明细。
- `reports.csv`：报告主记录。
- `report_items.csv`：报告条目、关键证据、风险提示、下一步动作。
- `human_review_items.csv`：人工复核项。
- `metric_results.csv`：硬指标计算结果。
- `risk_flags.csv`：风险与组织行为 flag。
- `expert_findings.csv`：专家 Agent findings。

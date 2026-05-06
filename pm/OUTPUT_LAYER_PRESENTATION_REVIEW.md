# 输出层呈现方案评审稿

更新时间：2026-05-05

本文档用于交给另一个 Agent 评估“中层管理效能评估 Agent”的最终输出层方案。核心结论是：**最终输出不是 `report_result.json`，而是飞书多维表格评审工作台**。Report Writer 只生成候选可读内容；Consistency Judge / Output Gate 负责治理和生效判断；Output Layer Adapter 只把治理后的标准输入写成飞书多维表格 7 表结构。

## 1. 输出层定位

当前 MVP 的输出层由三部分组成：

```text
飞书多维表格：最终结构化评审工作台
飞书文档：正式报告正文链接和可读正文
飞书应用页面 / 仪表盘：系统级入口、指标卡和任务队列
```

其中，给用户看的最终状态以飞书多维表格为准，包括：

- 人员评估总览
- 单人 Review Packet
- 五维结论
- 指标与数据覆盖
- 证据溯源
- 人工复核状态
- 报告状态、签字状态和是否可生效

一句话定位：

```text
一个以飞书多维表格为数据底座、以工作台首页为入口、以单人 Review Packet 为核心阅读页、以人工复核队列为治理闭环、以证据索引为审计底座的评审运营系统。
```

## 2. 职责边界

输出链路必须按以下职责拆分：

```text
Report Writer
-> 生成报告候选稿、可读结论、摘要、建议动作、证据摘要

Consistency Judge / Output Gate
-> 校验候选内容，做去重、冲突、置信度、人审触发、生效判断
-> 生成 output_layer_input.json

Output Layer Adapter
-> 只做字段映射
-> output_layer_input.json -> 飞书多维表格 7 表 CSV / 后续 OpenAPI 写回
```

关键原则：

- `Report Writer` 不能直接决定最终写回。
- `report_result.json` 不是最终输出，只是候选信号来源之一。
- `output_layer_input.json` 是飞书输出层唯一标准输入。
- `write_feishu_base_csv.js` 不再做复杂治理判断，只做 Adapter 映射。
- 人工复核只更新 `review_items`，其他表由写回 Agent / Adapter 根据复核结果同步。

## 3. 前台页面层 vs 底层表结构

用户不应该感觉自己在操作 7 张表，而应该感觉自己在使用一个“评审工作台”。因此前台只收敛成 5 个入口，底层保留 7 张表支撑结构化写回和下钻。

| 前台入口 | 用户心智 | 底层主表 | 辅助表 |
| --- | --- | --- | --- |
| 人员评估总览 | 看每个中层当前状态 | `people_overview` | `evaluation_runs` |
| 单人 Review Packet | 看某个人的一次评估包 | `evaluation_runs` | `dimension_results`、`metric_results`、`review_items`、`evidence_index` |
| 指标与数据覆盖看板 | 看指标卡、样本量、缺失率、数据源质量 | `metric_results` | `evidence_index` |
| 人工复核工作台 | 处理低置信、冲突、责任归因、补证 | `review_items` | `evidence_index`、`dimension_results`、`metric_results` |
| 证据溯源库 | 查结论证据、权限、冲突、原始链接 | `evidence_index` | `metric_results`、`review_items` |

底层协作链路：

```text
workspace_home
-> people_overview
  -> evaluation_runs
    -> dimension_results
      -> metric_results
        -> evidence_index
    -> review_items
      -> evidence_index
```

## 4. 底层 7 表职责

| 表 | 系统角色 | 只回答什么 | 不回答什么 |
| --- | --- | --- | --- |
| `workspace_home` | 工作台入口层 | 有哪些前台入口、入口链接是什么 | 不承接评估事实 |
| `people_overview` | 人员聚合层 | 每个中层的最新状态、数据覆盖、人审数量 | 不评价下属个人绩效 |
| `evaluation_runs` | 单人评估包层 | 一次评估的周期、报告状态、签字状态、数据覆盖 | 不展开指标计算细节 |
| `dimension_results` | 管理判断层 | 这个维度整体怎么看、为什么、建议什么 | 不做每个指标的计算解释 |
| `metric_results` | BI 指标层 | 指标怎么算、样本量多少、是否降级 | 不做管理能力归因 |
| `review_items` | 人工流程层 | 哪些结论不能自动生效、谁处理、处理结果是什么 | 不重新生成报告 |
| `evidence_index` | 证据底座 | 证据来自哪里、质量如何、能否访问、是否冲突 | 不做结论判断 |

## 5. 工作台首页设计

首页不是表格目录页，而是任务驱动型工作台。它必须回答：

```text
我今天要处理什么？
哪些报告不能生效？
哪些人风险最高？
哪些地方数据不足？
```

首页固定 4 块：

| 区块 | 展示内容 | 用户动作 | 来源 |
| --- | --- | --- | --- |
| 本轮评估进度 | 本轮人数、已生成报告、待复核、已签字、需补证 | 看整体进展 | `people_overview`、`evaluation_runs` |
| 风险与阻断 | 低置信、证据冲突、责任归因、权限不足、敏感判断 | 优先处理高风险 | `review_items`、`evidence_index` |
| 待办队列 | 待我复核、需补证、被驳回、待签字 | 进入处理 | `review_items`、`evaluation_runs` |
| 快捷下钻 | 人员总览、Review Packet、指标看板、证据库 | 进入具体模块 | `workspace_home` |

首页 KPI 建议：

| KPI | 含义 | 来源 |
| --- | --- | --- |
| 本轮评估人数 | 本周期纳入评估的中层数量 | `people_overview` |
| 已生成报告 | 已生成评估任务数量 | `evaluation_runs` |
| 待复核报告 | `报告状态 = review_required 待复核` | `evaluation_runs` |
| 需补证报告 | `报告状态 = needs_evidence 需补证` | `evaluation_runs` |
| 已签字报告 | `报告状态 = approved 已签字` | `evaluation_runs` |
| 低数据覆盖人数 | `数据覆盖等级 = 低 / 缺失` | `people_overview` |

## 6. 单人 Review Packet

单人 Review Packet 现在按“入口页 -> 维度二级页 -> 指标/复核/证据链”的方式组织，不再在首页直接铺开全部指标和证据。

当前前台减法原则：

- `people_overview` 是唯一一级入口，点开人名就是单人 Review Packet。
- `evaluation_runs` 降级为后台评估包承接层，不再作为普通用户主入口。
- `dimension_results` 是五维二级页，主标题使用 `维度页标题`，不显示 `DIM-*`。
- `metric_results` 是指标解释页，主标题使用 `指标页标题`，不显示 `metric_result_id`。
- `review_items` 是人工复核工单页，主标题使用 `复核事项`，不显示 `review_item_id`。
- `evidence_index` 是证据链页，主标题使用 `证据标题`，不显示 `evidence_id`。
- `evaluation_id`、各类 `_id`、创建时间、后台关联任务等字段只留在本地标准输入/写回逻辑，不作为飞书前台展示字段。

核心跳转链路：

```text
people_overview 人员总览
-> 单人 Review Packet / evaluation_runs
   -> 方向校准力详情 / dimension_results
   -> 推进闭环力详情 / dimension_results
   -> 风险治理力详情 / dimension_results
   -> 协同调度力详情 / dimension_results
   -> 组织行为健康度详情 / dimension_results
   -> 人工复核入口 / review_items
```

维度二级页继续下钻：

```text
dimension_results 五维详情页
-> 关联指标 / metric_results
   -> 关联证据 / evidence_index
      -> 原始链接
-> 关联复核项 / review_items
   -> 关联证据 / evidence_index
      -> 原始链接
-> 关联证据 / evidence_index
```

首页只保留 P0 信息：评估对象、报告状态、签字状态、整体置信度、数据覆盖等级、人工复核要求、人审未完成数量、评估总览、数据覆盖结论、五个维度详情入口、人工复核入口。

不在首页展示：全量指标、全量证据、原始材料链接、Agent 中间过程。

单人 Review Packet 是上级 / HRBP 真正阅读、复核、签字的核心页面。它应该像 Lattice review packet，而不是让用户跳转多张底层表。

模板：

```text
陈昊｜2026-04 中层管理效能评估

状态：待复核
整体置信度：0.68
数据覆盖：中
是否可生效：否
报告链接：xxx
待处理复核：6 项

一、评估概览
- 周期
- 项目范围
- 启用维度
- 数据覆盖结论

二、五维结论
- 方向校准力
- 推进闭环力
- 风险治理力
- 协同调度力
- 组织行为健康度

三、指标卡
- 指标值
- 判断结果
- 样本量
- 数据源质量
- 是否降级

四、低置信 / 降级
- 无法判断指标
- 仅观察维度
- 数据源质量低的指标

五、证据摘要
- 关键证据
- 冲突证据
- 权限不足证据

六、人工复核
- 复核类型
- 触发原因
- 复核状态
- 是否允许报告生效

七、建议动作
- 维度级建议
- 补证建议
- 下周期改进建议
```

## 7. 人工复核在哪里更新，结果返回哪里

人工复核的唯一人工写入口是 `review_items`。

人工更新字段：

- `复核状态`
- `复核人`
- `复核备注`
- `复核时间`
- `是否允许报告生效`
- 必要时更新 `建议处理`

结果返回逻辑：

| 人工复核结果 | 返回目标 | 返回内容 |
| --- | --- | --- |
| `approved 已通过` | `evaluation_runs` | 若所有复核项完成，可进入 `reviewed 已复核` |
| `modified 已修改` | `dimension_results` / `metric_results` | 更新结论、边界说明、降级原因、是否纳入主评分 |
| `rejected 已驳回` | `evaluation_runs` | 报告状态进入 `rejected 已驳回` |
| `needs_evidence 需补证` | `evaluation_runs` / `evidence_index` | 报告状态进入 `needs_evidence 需补证`，证据权限或质量待补齐 |
| `waived 已豁免` | `evaluation_runs` / `review_items` | 记录豁免备注，允许进入已复核但保留审计痕迹 |

边界：

```text
人工 update：只发生在 review_items
结果 return：由写回 Agent / Adapter 返回 evaluation_runs、dimension_results、metric_results、evidence_index
```

## 8. 状态主流程

`report_status` 和 `review_status` 是输出层主流程，不是辅助字段。

### 8.1 report_status

| 状态 | 含义 | 是否可生效 |
| --- | --- | --- |
| `draft 草稿` | 已生成初稿，未进入复核 | 否 |
| `review_required 待复核` | 存在未处理人审项 | 否 |
| `reviewed 已复核` | 人审项处理完成，未签字 | 待签字 |
| `approved 已签字` | 正式可生效 | 是 |
| `needs_evidence 需补证` | 关键证据不足 | 否 |
| `observation_only 仅观察` | 只能观察，不做正式判断 | 否 |
| `rejected 已驳回` | 报告或关键结论被驳回 | 否 |

### 8.2 review_status

| 状态 | 是否允许报告生效 | 对报告状态影响 |
| --- | --- | --- |
| `pending 待复核` | 否 | `review_required 待复核` |
| `approved 已通过` | 是 | 全部通过后可进入 `reviewed 已复核` |
| `modified 已修改` | 视情况 | 报告需同步修改 |
| `rejected 已驳回` | 否 | `rejected 已驳回` |
| `needs_evidence 需补证` | 否 | `needs_evidence 需补证` |
| `waived 已豁免` | 是，但需备注 | 可进入 `reviewed 已复核` |

## 9. 证据呈现策略

任何结论、指标、人审项都必须能下钻到证据，但不能把所有证据默认堆给评审人。

| 证据类型 | 判定方式 | 默认展示策略 |
| --- | --- | --- |
| 关键证据 | `是否关键证据 = true` | 默认展示 |
| 辅助证据 | 非关键、非冲突，且质量不低 | 折叠展示 |
| 冲突证据 | `是否存在冲突 = true` | 高亮展示 |
| 低质量证据 | `证据质量 = 低 / 不可用` | 仅在质量视图展示 |
| 权限不足证据 | `权限状态 = 权限不足 / 仅摘要可见` | 高亮风险 |

不落表内容：

- Agent prompt
- 模型推理过程
- 原始聊天全文
- 完整会议全文
- 调试日志
- 全量 raw payload
- 未脱敏敏感内容

落表方式：

```text
证据片段 + 原始链接 + 权限状态 + 证据质量 + 冲突说明
```

## 10. output_layer_input.json

`output_layer_input.json` 是输出层唯一标准输入，生成位置：

```text
data/outputs/demo/case04/current/output_layer_input.json
```

生成命令：

```bash
npm run output:case04
```

它由简版 Output Gate 生成，包含：

| 顶层字段 | 用途 |
| --- | --- |
| `metadata` | 生成时间、输入目录、评估 ID、项目 ID、人员 ID |
| `workspace_home` | 5 个前台入口配置 |
| `people_overview` | 中层人员总览状态 |
| `evaluation_run` | 单次评估包状态 |
| `dimension_results` | 五维最终结论 |
| `metric_results` | 指标值、样本量、数据质量、降级 |
| `review_items` | 去重后的人审项 |
| `evidence_index` | 去重后的证据索引 |
| `writeback_decisions` | 报告是否可生效、是否需人审、是否需补证、写回表清单 |

## 11. CSV 写回包

写回包生成命令：

```bash
npm run writeback:csv:case04
```

该命令会先生成 `output_layer_input.json`，再输出飞书多维表格 7 表 CSV：

```text
data/outputs/demo/case04/feishu_base_csv
```

输出文件：

| 文件 | 对应飞书表 | 用途 |
| --- | --- | --- |
| `workspace_home.csv` | `workspace_home` | 5 个前台入口配置 |
| `people_overview.csv` | `people_overview` | 人员总览、最新状态、数据覆盖、人审数量 |
| `evaluation_runs.csv` | `evaluation_runs` | 单次评估包状态、报告状态、签字状态 |
| `dimension_results.csv` | `dimension_results` | 五维结论、等级、置信度、边界、建议 |
| `metric_results.csv` | `metric_results` | 指标值、样本量、缺失率、数据源质量、降级原因 |
| `review_items.csv` | `review_items` | 人工复核项、复核状态、建议处理、是否允许生效 |
| `evidence_index.csv` | `evidence_index` | 证据片段、来源、权限、质量、冲突说明 |
| `manifest.json` | 写回包清单 | 文件行数、生成时间、评估 ID、写回决策 |

## 12. 三条主用户路径

### HRBP 看整体

```text
工作台首页
-> 待复核报告
-> 人工复核工作台
-> 处理 review_items
-> 回到报告状态
```

### 上级看某个人

```text
人员评估总览
-> 单人 Review Packet
-> 维度结论
-> 关键证据
-> 签字 / 要求补证
```

### PMO / 管理员看数据质量

```text
指标与数据覆盖看板
-> 降级指标
-> 低质量证据
-> 需补证任务
```

## 13. 另一个 Agent 应重点评估的问题

1. 是否已经把 7 张底层表包装成评审工作台，而不是表格目录。
2. 首页是否是任务驱动型，而不是单纯导航页。
3. 单人 Review Packet 是否足够支撑阅读、复核、签字。
4. `dimension_results` 和 `metric_results` 边界是否清晰。
5. `evidence_index` 是否既能下钻，又避免证据过载。
6. `review_items` 是否能支撑人工复核闭环。
7. `report_status` 和 `review_status` 是否已经成为主流程。
8. 是否有不该落表的敏感内容被设计进表里。
9. 是否能在 3 天 MVP 内落地。
10. 是否能不开发网页，先用多维表格 + 仪表盘 + 应用页面承接。

## 14. 最终判断

输出层不应被定义为“报告生成器”，而应被定义为：

```text
一个从人员到评估任务、从维度到指标、从指标到证据、从证据到人工复核和报告生效状态的飞书评审运营工作台。
```

评估这套方案时，不要只看字段是否齐全，更要看：

```text
评审者能不能看懂
管理者能不能接受
证据能不能追溯
人工能不能介入
报告能不能安全生效
下一周期能不能复用
```

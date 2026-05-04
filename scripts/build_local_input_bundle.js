"use strict";

// Legacy helper for the old evaluation_inputs-based flow. Case 04 front pipeline no longer depends on it.

const fs = require("fs");
const path = require("path");

const HISTORY_MINUTES = [
  {
    meetingId: "HIS-001",
    title: "支付链路升级灰度条件对齐会",
    time: "2026-04-15 10:00 - 10:40",
    host: "张磊",
    participants: ["张磊", "赵敏", "陈凯", "吴桐", "周舟"],
    body: [
      "10:00 张磊：今天主要确认一个事情，退款回调问题不清零，这个项目就不能进入灰度申请。",
      "10:03 赵敏：主支付链路问题不大，但退款回调还有一块状态回写要继续看。",
      "10:06 陈凯：测试样本里正常支付已经够了，异常退款还缺几类边界样本。",
      "10:10 张磊：那就不要用“整体差不多”这种口径，我只认关键风险是不是关掉。",
      "10:15 周舟：商户侧现在最担心的是退款出问题后能不能及时兜住。",
      "10:22 吴桐：我会把灰度前条件单独拉出来，不和普通进度混写。",
      "10:30 张磊：结论很简单，退款回调问题不清零，不进入灰度申请。"
    ],
    decisions: [
      "退款回调问题清零前不提交灰度申请",
      "测试补齐异常退款样本",
      "单独维护灰度前置条件"
    ]
  },
  {
    meetingId: "HIS-002",
    title: "支付链路升级周中收口会",
    time: "2026-04-18 21:00 - 21:35",
    host: "张磊",
    participants: ["张磊", "赵敏", "陈凯", "何嘉", "吴桐"],
    body: [
      "21:00 张磊：今天只看灰度条件，不看表面进度。",
      "21:04 赵敏：主支付路径联通没有问题，退款回调还有一点幂等校验波动。",
      "21:08 陈凯：如果只看主链路，确实会觉得快结束了，但样本验证其实还没齐。",
      "21:14 何嘉：环境窗口这几天都比较紧，最好别把动作都堆在最后。",
      "21:20 张磊：灰度条件一定要和关键链路验证完成度绑定，不能按节点直接推进。",
      "21:28 吴桐：我会把‘是否可灰度’和‘是否达到里程碑’分开记录。 "
    ],
    decisions: [
      "灰度条件与关键链路验证完成度绑定",
      "环境窗口纳入每日风险追踪"
    ]
  },
  {
    meetingId: "HIS-003",
    title: "支付链路升级回滚演练准备会",
    time: "2026-04-21 19:30 - 20:10",
    host: "刘宁",
    participants: ["刘宁", "张磊", "何嘉", "周舟", "吴桐"],
    body: [
      "19:30 刘宁：单商户回滚我们已经跑过，但批量回滚还没做。",
      "19:35 张磊：那这件事不能再停留在口头上了，要形成动作闭环。",
      "19:40 何嘉：如果要演练，运维需要提前锁窗口，不适合最后一刻临时插入。",
      "19:46 周舟：商户侧更关注批量回滚，因为线上真实风险不是单商户。",
      "19:55 吴桐：我把批量回滚演练单独记为灰度前必做事项。 "
    ],
    decisions: [
      "批量回滚演练列为灰度前必做事项",
      "演练后必须形成记录"
    ]
  },
  {
    meetingId: "HIS-004",
    title: "支付链路升级商户关注点同步会",
    time: "2026-04-23 16:00 - 16:45",
    host: "周舟",
    participants: ["周舟", "张磊", "吴桐", "赵敏"],
    body: [
      "16:00 周舟：商户这边主要关心两件事，一是退款有没有延迟，二是回滚是不是可控。",
      "16:06 张磊：回滚触发条件我们会明确写进灰度前置条件里。",
      "16:15 赵敏：退款主路径已经稳定，但弱网重试场景还需要再补证据。",
      "16:22 吴桐：我会把商户关注点和内部观察指标做一版映射。 ",
      "16:38 张磊：对外口径先统一成‘准备中’，不提前承诺具体灰度时间。 "
    ],
    decisions: [
      "回滚触发条件写入灰度前置条件",
      "商户关注点与内部观察指标建立映射"
    ]
  },
  {
    meetingId: "HIS-005",
    title: "支付链路升级样本验证短会",
    time: "2026-04-25 11:00 - 11:25",
    host: "陈凯",
    participants: ["陈凯", "张磊", "赵敏", "吴桐"],
    body: [
      "11:00 陈凯：正常支付样本基本够了，但异常退款和弱网场景还不能说齐。",
      "11:05 张磊：那就明确写成‘样本未齐’，别在会上讲得太乐观。",
      "11:11 赵敏：研发这边会配合补路径和日志，下午再看一轮联调。",
      "11:18 吴桐：我会在周报里把‘样本齐套’单列为灰度前条件之一。 "
    ],
    decisions: [
      "样本齐套列为灰度前条件之一",
      "周报中单列样本验证状态"
    ]
  }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function copyFile(sourcePath, targetPath) {
  writeText(targetPath, readText(sourcePath));
}

function buildHistoryMeetingMarkdown(item) {
  return [
    `# 飞书妙记：${item.title}`,
    "",
    `会议时间：${item.time}  `,
    `主持人：${item.host}  `,
    `参会人：${item.participants.join("、")}`,
    "",
    "## 逐段纪要",
    "",
    ...item.body.map((line) => `${line}  `),
    "",
    "## 结论与决策",
    "",
    ...item.decisions.map((line) => `- ${line}`),
    ""
  ].join("\n");
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const sourceRoot = path.join(projectRoot, "case_sources", "case_01");
  const targetRoot = path.join(projectRoot, "evaluation_inputs", "case_01");

  ensureDir(targetRoot);
  ensureDir(path.join(targetRoot, "current_meeting"));
  ensureDir(path.join(targetRoot, "project_documents"));
  ensureDir(path.join(targetRoot, "review_context"));
  ensureDir(path.join(targetRoot, "review_meetings"));

  copyFile(
    path.join(sourceRoot, "meeting_minutes.md"),
    path.join(targetRoot, "current_meeting", "meeting_minutes.md")
  );
  copyFile(
    path.join(sourceRoot, "project_doc.md"),
    path.join(targetRoot, "project_documents", "project_main_doc.md")
  );
  copyFile(
    path.join(sourceRoot, "weekly_report.md"),
    path.join(targetRoot, "project_documents", "weekly_report.md")
  );
  copyFile(
    path.join(sourceRoot, "review_doc.md"),
    path.join(targetRoot, "project_documents", "stage_review.md")
  );
  copyFile(
    path.join(sourceRoot, "history_context.md"),
    path.join(targetRoot, "review_context", "history_context.md")
  );
  copyFile(
    path.join(sourceRoot, "manifest.json"),
    path.join(targetRoot, "manifest.json")
  );

  HISTORY_MINUTES.forEach((item) => {
    writeText(
      path.join(targetRoot, "review_meetings", `${item.meetingId}_meeting_minutes.md`),
      buildHistoryMeetingMarkdown(item)
    );
  });

  const bundleIndex = {
    case_id: "case_01",
    current_meeting: "current_meeting/meeting_minutes.md",
    project_documents: [
      "project_documents/project_main_doc.md",
      "project_documents/weekly_report.md",
      "project_documents/stage_review.md"
    ],
    review_context: "review_context/history_context.md",
    review_meetings: HISTORY_MINUTES.map((item) => `review_meetings/${item.meetingId}_meeting_minutes.md`)
  };

  writeText(
    path.join(targetRoot, "bundle_index.json"),
    JSON.stringify(bundleIndex, null, 2)
  );

  process.stdout.write(
    JSON.stringify(
      {
        bundle_root: targetRoot,
        review_meeting_count: HISTORY_MINUTES.length
      },
      null,
      2
    ) + "\n"
  );
}

if (require.main === module) {
  main();
}

// INPUT: release metadata definitions
// OUTPUT: Ordered release note records for the in-app update center
// EFFECT: Publishes the latest shipped version and per-user seen-state keys for the release history feature
export type ReleaseNoteLocale = "en" | "zh";

export type ReleaseNote = {
  id: string;
  version: string;
  releasedAt: string;
  title: Record<ReleaseNoteLocale, string>;
  summary: Record<ReleaseNoteLocale, string>;
  changes: Record<ReleaseNoteLocale, string[]>;
};

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    id: "2026-04-22-responsive-shell-and-mobile-dialogs",
    version: "v1.5.0",
    releasedAt: "2026-04-22",
    title: {
      en: "Responsive shell and mobile-first dialogs",
      zh: "响应式外壳与移动端优先弹窗"
    },
    summary: {
      en: "The planner now adapts its layout across screen sizes with a fluid shell, mobile bottom navigation, and full-screen editing flows on phones.",
      zh: "应用现已支持跨屏幕自适应布局，包含流式页面外壳、移动端底部导航，以及手机上的全屏编辑流程。"
    },
    changes: {
      en: [
        "Updated the application shell to use a fluid layout that grows from mobile width up to a 1200px desktop maximum.",
        "Added a desktop sidebar and mobile bottom navigation for faster section switching.",
        "Changed Task and Reminder dialogs to open full-screen on mobile and as centered modals on larger screens.",
        "Reduced heading and content typography on smaller screens to prevent horizontal overflow.",
        "Expanded in-app help and release notes to document the new responsive behavior."
      ],
      zh: [
        "将应用外壳更新为流式布局，从移动端全宽扩展到桌面端最大 1200px。",
        "新增桌面侧边栏与移动端底部导航，便于快速切换页面。",
        "Task 与 Reminder 弹窗在手机上改为全屏，在较大屏幕上保持居中弹窗。",
        "缩小小屏幕上的标题与内容字号，减少横向溢出。",
        "扩展应用内帮助与更新说明，记录新的响应式行为。"
      ]
    }
  },
  {
    id: "2026-04-20-help-center-and-public-questions",
    version: "v1.4.0",
    releasedAt: "2026-04-20",
    title: {
      en: "Help center and public questions",
      zh: "帮助中心与公开问题"
    },
    summary: {
      en: "The app now includes a help center with usage instructions, FAQ content, and a shared question board for all users.",
      zh: "应用现已提供帮助中心，包含使用说明、常见问答，以及所有用户可见的共享提问区。"
    },
    changes: {
      en: [
        "Added a Help page with step-by-step instructions for using the planner.",
        "Added a FAQ section for common workflow questions.",
        "Added a shared question form backed by MongoDB so every signed-in user can see submitted questions.",
        "Week view now lets you click a date header to jump to that day in Today.",
        "Clicking a blank area in Week view now sets the default date for the next new task."
      ],
      zh: [
        "新增 Help 页面，提供逐步使用说明。",
        "新增 FAQ 常见问答区。",
        "新增基于 MongoDB 的共享提问功能，所有已登录用户都能看到提交的问题。",
        "Week 页面现在支持点击日期标题直接跳转到对应的 Today 页面。",
        "现在点击 Week 页面中的空白区域后，下一次新增任务会默认带入该日期。"
      ]
    }
  },
  {
    id: "2026-04-20-month-page-past-day-marker",
    version: "v1.3.1",
    releasedAt: "2026-04-20",
    title: {
      en: "Month page past-day marker update",
      zh: "月视图过去日期标记更新"
    },
    summary: {
      en: "Past days in the month view now use a red check mark beside the date for faster scanning.",
      zh: "月视图中的过去日期现在会在日期旁显示红色对勾，方便更快区分。"
    },
    changes: {
      en: [
        "Changed the past-day indicator in month view from a red X to a red check mark.",
        "Kept the marker limited to dates before today so future days stay visually clean."
      ],
      zh: [
        "将月视图中过去日期的标记从红色叉号改为红色对勾。",
        "该标记仍只显示在今天之前的日期上，未来日期保持简洁。"
      ]
    }
  },
  {
    id: "2026-04-20-release-notes",
    version: "v1.3.0",
    releasedAt: "2026-04-20",
    title: {
      en: "Localization, scheduling fixes, and week-view upgrades",
      zh: "多语言、时间修复与周视图升级"
    },
    summary: {
      en: "The app now supports more translated screens, safer timed-task behavior, and a cleaner weekly calendar.",
      zh: "现在有更多页面支持翻译，定时任务行为更安全，周历界面也更清晰。"
    },
    changes: {
      en: [
        "Applied translations to Today, Week, Month, and Reminder flows.",
        "Prevented timed tasks without an end time from spilling into the next day.",
        "Improved overlapping task layout in the week time grid.",
        "Added validation so end time cannot be earlier than start time.",
        "Added a frontend-only release notes popup and history drawer."
      ],
      zh: [
        "已将翻译扩展到 Today、Week、Month 与 Reminder 流程。",
        "修复没有结束时间的定时任务跨到第二天的问题。",
        "优化周视图时间网格中重叠任务的布局。",
        "新增结束时间不能早于开始时间的校验。",
        "新增仅前端实现的更新弹窗与历史抽屉。"
      ]
    }
  }
];

export const LATEST_RELEASE_ID = RELEASE_NOTES[0]?.id ?? "";

// INPUT: username
// OUTPUT: localStorage key for the release notes seen marker
// EFFECT: Isolates release-history read state per signed-in user
export function getReleaseNotesSeenKey(username: string) {
  return `release-notes-seen:${username}`;
}

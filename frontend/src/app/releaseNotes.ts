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
    id: "2026-04-27-collapsed-today-stats-panel",
    version: "v1.11.0",
    releasedAt: "2026-04-27",
    title: {
      en: "Expandable Today insights",
      zh: "可展开的 Today 效率概览"
    },
    summary: {
      en: "Today now starts with a compact productivity pitch and opens the full statistics and chart view only when you ask for it.",
      zh: "Today 现在会先显示一个精简的效率提示，并只在你主动查看时展开完整的统计与图表。"
    },
    changes: {
      en: [
        "Folded the Today productivity section by default so the page stays lighter until you open the full stats view.",
        "Added a quick productivity pitch with a one-click View Stats and Visualization action.",
        "Kept the selected-day, 7-day, 30-day, and 7-day chart insights available on demand."
      ],
      zh: [
        "默认将 Today 的效率区折叠起来，让页面在你展开完整统计前保持更轻量。",
        "新增精简的效率提示，并提供一键查看统计与图表的入口。",
        "所选日期、最近 7 天、最近 30 天以及 7 天图表的完整信息仍会在需要时展开。"
      ]
    }
  },
  {
    id: "2026-04-27-today-chart-and-public-release-note-cleanup",
    version: "v1.10.1",
    releasedAt: "2026-04-27",
    title: {
      en: "Clearer Today insights",
      zh: "更清晰的 Today 效率概览"
    },
    summary: {
      en: "Today now shows a clearer 7-day productivity chart, the Week header is cleaner, and the Updates center uses more public-facing release wording.",
      zh: "Today 现在会显示更清晰的 7 天效率图表，Week 页头也更简洁，同时更新中心改用了更适合公开展示的版本说明。"
    },
    changes: {
      en: [
        "Replaced the old completed-history block on Today with a clearer 7-day productivity chart.",
        "Kept the selected-day, 7-day, and 30-day completion summaries while making progress easier to scan at a glance.",
        "Removed extra Week header hint labels for a cleaner calendar header.",
        "Simplified public update notes so the Updates center focuses on product changes instead of internal implementation details."
      ],
      zh: [
        "将 Today 页面原来的已完成历史区替换为更清晰的 7 天效率图表。",
        "保留所选日期、最近 7 天与最近 30 天的完成汇总，同时让进度更容易一眼看懂。",
        "移除了 Week 页头中额外的提示标签，让日历页头更简洁。",
        "简化公开版本说明，让更新中心聚焦于产品变化，而不是内部实现细节。"
      ]
    }
  },
  {
    id: "2026-04-27-admin-help-review-and-task-insights",
    version: "v1.10.0",
    releasedAt: "2026-04-27",
    title: {
      en: "Admin help review and task insights",
      zh: "管理员帮助审核与任务效率概览"
    },
    summary: {
      en: "The Help Center now supports admin review, Week renders repeating events more efficiently, and Today handles completed tasks with clearer productivity tracking.",
      zh: "帮助中心现已支持管理员审核，Week 对重复事件的渲染更高效，Today 也能以更清晰的方式追踪已完成任务与效率表现。"
    },
    changes: {
      en: [
        "Added admin review mode in the Help Center so admins can review and remove submitted questions while each standard user only sees their own questions.",
        "Improved Week performance by generating repeating events only for the visible date range.",
        "Completed tasks now leave active Today, Week, Month, and reminder flows immediately after completion.",
        "Added Today productivity summaries for the selected day, the last 7 days, and the last 30 days.",
        "Kept completed task data available for 30 days before automatic cleanup."
      ],
      zh: [
        "帮助中心新增管理员审核模式，管理员可以查看并删除用户提交的问题，而普通用户仍只会看到自己的提问。",
        "通过只生成当前可见日期范围内的重复事件，提升了 Week 页面性能。",
        "任务完成后会立刻从 Today、Week、Month 与提醒相关的进行中视图中消失。",
        "Today 页面新增所选日期、最近 7 天与最近 30 天的效率汇总。",
        "已完成任务数据会保留 30 天，之后再自动清理。"
      ]
    }
  },
  {
    id: "2026-04-27-help-post-safety-and-week-override-timing",
    version: "v1.9.2",
    releasedAt: "2026-04-27",
    title: {
      en: "Safer help posts and accurate recurring event timing",
      zh: "更安全的帮助提问与准确的重复事件时间"
    },
    summary: {
      en: "Shared help questions now save as new server-owned posts, failed submissions keep the draft, and Week respects one-day recurring-task time overrides when placing calendar events.",
      zh: "共享帮助问题现在会保存为新的服务器端帖子，发布失败时会保留草稿，同时 Week 在放置日历事件时也会正确使用重复任务单次覆盖后的时间。"
    },
    changes: {
      en: [
        "Changed shared help-question posting to create new server-owned posts instead of overwriting older questions through public ids.",
        "Kept the help-question draft visible and showed an error message when question posting fails.",
        "Fixed Week calendar events so single-occurrence recurring-task overrides now use the correct title and time slot."
      ],
      zh: [
        "将共享帮助问题的发布改为创建新的服务器端帖子，不再通过公开 id 覆盖旧问题。",
        "在帮助问题发布失败时保留草稿，并显示明确的错误提示。",
        "修复 Week 日历事件，让重复任务的单次覆盖现在会使用正确的标题与时间段。"
      ]
    }
  },
  {
    id: "2026-04-27-task-dialog-mobile-nav-visibility",
    version: "v1.9.1",
    releasedAt: "2026-04-27",
    title: {
      en: "Task-dialog mobile navigation visibility",
      zh: "任务弹窗期间隐藏移动端底部导航"
    },
    summary: {
      en: "The mobile bottom navigation now hides whenever the add-task or edit-task window is open so the dialog keeps full focus.",
      zh: "现在当新增任务或编辑任务窗口打开时，移动端底部导航会自动隐藏，让弹窗保持完整焦点。"
    },
    changes: {
      en: [
        "Hide the mobile bottom navigation while the add-task dialog is open.",
        "Hide the mobile bottom navigation while the edit-task dialog is open.",
        "Restore the mobile bottom navigation after the task dialog closes."
      ],
      zh: [
        "在新增任务弹窗打开时隐藏移动端底部导航。",
        "在编辑任务弹窗打开时隐藏移动端底部导航。",
        "在任务弹窗关闭后恢复移动端底部导航。"
      ]
    }
  },
  {
    id: "2026-04-26-mobile-week-range-create",
    version: "v1.9.0",
    releasedAt: "2026-04-26",
    title: {
      en: "Week Time Grid default and mobile gesture navigation",
      zh: "Week 默认时间网格与移动端手势导航"
    },
    summary: {
      en: "Week now opens in Time Grid by default, mobile Week creates tasks from a press-held time range, and Month uses a refreshed card-based calendar layout with split desktop and mobile navigation.",
      zh: "Week 现在默认以时间网格打开，移动端 Week 可通过长按时间范围创建任务，而 Month 则使用了更新的卡片式日历布局，并区分桌面端与移动端的导航方式。"
    },
    changes: {
      en: [
        "Changed Week to open in Time Grid by default on desktop and mobile.",
        "Removed the global Add Task button from the mobile Week header.",
        "Added press-hold time-range selection in the mobile Week time grid before task creation opens.",
        "Prefilled the new task dialog with the selected date, start time, and end time from the chosen range.",
        "Reduced Month view to a cleaner task grid layout with direct vertical swipe navigation.",
        "Added a Jump to Current Month button back to Month view.",
        "Refreshed MonthPage UI with the new card-based calendar styling while keeping desktop arrows and mobile swipe behavior separate.",
        "Removed the per-day task-count label from Month cards so the cells stay focused on task previews.",
        "Raised the mobile bottom navigation above overlapping planner content so nav taps stay reliable."
      ],
      zh: [
        "将 Week 改为在桌面端和移动端默认以时间网格打开。",
        "移除了移动端 Week 页头中的全局 Add Task 按钮。",
        "在移动端 Week 时间网格中新增长按时间范围后再打开创建任务流程。",
        "将新任务弹窗预填为所选时间范围对应的日期、开始时间与结束时间。",
        "将 Month 简化为更清晰的任务网格布局，并保留直接上下滑动切换月份的方式。",
        "为 Month 页面重新加入 Jump to Current Month 按钮。",
        "为 MonthPage 换上新的卡片式日历视觉设计，同时继续区分桌面端箭头切换与移动端滑动切换。",
        "移除了 Month 日期卡片中的每日任务数量标签，让每个格子专注显示任务预览。",
        "提高了移动端底部导航的层级，让它在与 Week 页面内容重叠时仍能稳定响应点击。"
      ]
    }
  },
  {
    id: "2026-04-26-bounded-notification-history",
    version: "v1.8.0",
    releasedAt: "2026-04-26",
    title: {
      en: "Bounded browser notification history",
      zh: "有上限的浏览器通知历史"
    },
    summary: {
      en: "Browser reminders now tolerate timer drift, ask for notification permission only after user interaction, and keep a bounded three-day notification history.",
      zh: "浏览器提醒现在可以容忍计时漂移，只会在用户交互后请求通知权限，并保留有上限的三天通知历史。"
    },
    changes: {
      en: [
        "Changed daily and task reminder checks to use crossed-time windows so delayed intervals do not skip 10:00, 21:00, or 15-minute reminder triggers.",
        "Moved browser notification permission requests to the first user interaction instead of automatic page load.",
        "Pruned old reminder notification markers after three days."
      ],
      zh: [
        "将每日提醒和任务提醒改为跨时间窗口检查，避免 `10:00`、`21:00` 和提前 15 分钟提醒因定时器延迟而被跳过。",
        "将浏览器通知权限请求改为等待第一次用户交互，而不是在页面加载时自动触发。",
        "为旧的提醒通知标记增加了三天后的自动清理。"
      ]
    }
  },
  {
    id: "2026-04-25-repeat-label-spacing",
    version: "v1.7.2",
    releasedAt: "2026-04-25",
    title: {
      en: "Repeat label spacing fix",
      zh: "重复标签间距修复"
    },
    summary: {
      en: "The repeat selector now sits lower in its dialog so the label is fully visible below the header.",
      zh: "重复选择器现在会在弹窗中稍微下移，标签可以完整显示在标题下方。"
    },
    changes: {
      en: [
        "Added top spacing to the repeat selector in the repeat-options dialog.",
        "Prevented the Repeat label from clipping against the dialog header."
      ],
      zh: [
        "为重复设置弹窗中的重复选择器增加顶部间距。",
        "避免 Repeat 标签贴住弹窗标题而被裁切。"
      ]
    }
  },
  {
    id: "2026-04-25-repeat-dialog-sizing",
    version: "v1.7.1",
    releasedAt: "2026-04-25",
    title: {
      en: "Repeat dialog sizing alignment",
      zh: "重复设置弹窗尺寸对齐"
    },
    summary: {
      en: "The repeat-options window now matches the main task editor size and opens full-screen on phones.",
      zh: "重复设置窗口现在与主任务编辑弹窗保持相同尺寸，并会在手机上全屏打开。"
    },
    changes: {
      en: [
        "Matched the repeat-options dialog width to the main task editor on larger screens.",
        "Changed the repeat-options dialog to full-screen on mobile."
      ],
      zh: [
        "让重复设置弹窗在大屏幕上与主任务编辑弹窗保持相同宽度。",
        "将重复设置弹窗改为在移动端全屏打开。"
      ]
    }
  },
  {
    id: "2026-04-25-flexible-task-recurrence",
    version: "v1.7.0",
    releasedAt: "2026-04-25",
    title: {
      en: "Flexible task recurrence and occurrence edits",
      zh: "更灵活的任务重复规则与单次编辑"
    },
    summary: {
      en: "Tasks now start from a begin date and a repeat-options flow, and repeating-task edits can target one occurrence or the whole series.",
      zh: "任务现在从开始日期与重复设置流程开始，重复任务的修改也可以只作用于某一天，或作用于整个系列。"
    },
    changes: {
      en: [
        "Replaced the old one-time versus weekly type selector with a repeat options flow.",
        "Added daily, weekly, monthly, and yearly repeat rules with interval and end-date controls.",
        "Added single-day versus entire-series save choices for repeating task edits.",
        "Kept older task data compatible with the new recurrence flow."
      ],
      zh: [
        "将旧的一次性 / 每周类型选择改为重复设置流程。",
        "新增每天、每周、每月、每年的重复规则，并支持间隔与结束日期设置。",
        "为重复任务编辑新增只改当天或修改整个系列的保存选择。",
        "继续兼容旧版任务数据。"
      ]
    }
  },
  {
    id: "2026-04-25-mobile-week-swipe-stability",
    version: "v1.6.1",
    releasedAt: "2026-04-25",
    title: {
      en: "Mobile week swipe stability",
      zh: "移动端周视图滑动稳定性"
    },
    summary: {
      en: "Week view on phones now settles each swipe before changing pages so one gesture cannot skip across multiple week ranges.",
      zh: "手机上的周视图现在会在滑动结束后再决定翻页，避免一次手势跨过多个周页面。"
    },
    changes: {
      en: [
        "Changed mobile Week swipe handling to wait for the gesture to settle before selecting the next page.",
        "Prevented one swipe from cascading across multiple 4-day and 3-day week pages.",
        "Kept the rolling week sequence, date jumps, task editing, and blank-slot prefilling intact."
      ],
      zh: [
        "将移动端 Week 页面的滑动处理改为等待手势结束后再决定下一页。",
        "防止一次滑动连续跨过多个 4 天页与 3 天页。",
        "继续保留跨周滚动顺序、日期跳转、任务编辑与空白区域默认日期带入功能。"
      ]
    }
  },
  {
    id: "2026-04-25-mobile-week-paging",
    version: "v1.6.0",
    releasedAt: "2026-04-25",
    title: {
      en: "Mobile week paging and login language switch",
      zh: "移动端周视图分页与登录页语言切换"
    },
    summary: {
      en: "Week view on phones now uses a horizontal paged layout that starts with 4 days, continues with 3 days, and users can also switch the authentication screen between English and Chinese before signing in.",
      zh: "手机上的周视图现在改为横向分页布局，先显示 4 天，再显示 3 天；同时也支持在登录前切换认证界面的英文与中文。"
    },
    changes: {
      en: [
        "Changed mobile Week view from a single 7-day compressed layout to a horizontal paged experience.",
        "Added a 4-day first page and a 3-day second page, then continued the swipe flow into the next week.",
        "Removed the manual previous and next week arrow controls from the mobile Week header.",
        "Added an EN / 中文 language switch directly on the login and registration screen.",
        "Translated login titles, field labels, actions, success states, and common auth errors.",
        "Kept week-view date jumps, blank-slot date prefilling, and task editing flows working across the rolling mobile pages."
      ],
      zh: [
        "将移动端 Week 页面从单屏压缩 7 天改为横向分页体验。",
        "新增第一页 4 天、第二页 3 天，并让滑动流程继续进入下一周。",
        "移除了移动端 Week 页头中用于切换上一周和下一周的箭头按钮。",
        "在登录与注册页面直接新增 EN / 中文 语言切换按钮。",
        "为登录标题、字段标签、操作文案、成功状态与常见认证错误补充翻译。",
        "在滚动分页中继续保留日期跳转、空白区域默认日期带入与任务编辑流程。"
      ]
    }
  },
  {
    id: "2026-04-24-idempotent-saves-and-sync-recovery",
    version: "v1.5.1",
    releasedAt: "2026-04-24",
    title: {
      en: "Safer saves and sync recovery",
      zh: "更安全的保存与同步恢复"
    },
    summary: {
      en: "The planner now protects saved data more aggressively by avoiding duplicate submissions and reloading stored data after failed task or reminder syncs.",
      zh: "应用现在会通过避免重复提交，并在任务或提醒同步失败后重新加载已存储的数据，进一步保护你的内容。"
    },
    changes: {
      en: [
        "Repeated task, reminder, and help-question submissions now avoid creating duplicates.",
        "Failed task and reminder sync attempts now reload stored data so unsaved local changes do not replace it."
      ],
      zh: [
        "Task、Reminder 与 Help Question 的重复提交现在不会再生成重复内容。",
        "当任务或提醒同步失败时，应用会重新加载已存储的数据，避免未保存的本地变更替代它。"
      ]
    }
  },
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
        "Reduced heading and content typography on smaller screens to prevent horizontal overflow."
      ],
      zh: [
        "将应用外壳更新为流式布局，从移动端全宽扩展到桌面端最大 1200px。",
        "新增桌面侧边栏与移动端底部导航，便于快速切换页面。",
        "Task 与 Reminder 弹窗在手机上改为全屏，在较大屏幕上保持居中弹窗。",
        "缩小小屏幕上的标题与内容字号，减少横向溢出。"
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
        "Added a shared question form so every signed-in user can see submitted questions.",
        "Week view now lets you click a date header to jump to that day in Today.",
        "Clicking a blank area in Week view now sets the default date for the next new task."
      ],
      zh: [
        "新增 Help 页面，提供逐步使用说明。",
        "新增 FAQ 常见问答区。",
        "新增共享提问功能，所有已登录用户都能看到提交的问题。",
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
        "Added the in-app update popup and release history drawer."
      ],
      zh: [
        "已将翻译扩展到 Today、Week、Month 与 Reminder 流程。",
        "修复没有结束时间的定时任务跨到第二天的问题。",
        "优化周视图时间网格中重叠任务的布局。",
        "新增结束时间不能早于开始时间的校验。",
        "新增应用内更新弹窗与历史抽屉。"
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

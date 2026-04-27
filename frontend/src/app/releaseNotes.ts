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
    id: "2026-04-27-admin-help-access-and-windowed-week-events",
    version: "v1.10.0",
    releasedAt: "2026-04-27",
    title: {
      en: "Admin help controls and windowed Week events",
      zh: "管理员帮助控制与按窗口生成的 Week 事件"
    },
    summary: {
      en: "Accounts now carry USER or ADMIN roles, Help questions stay owner-only for non-admin users while admins can review and delete them, and Week only expands recurring events for the visible range while caching repeated occurrence windows.",
      zh: "账号现在会携带 USER 或 ADMIN 角色，帮助问题会对普通用户保持仅限本人查看，而管理员可以审核和删除问题，Week 也只会为可见范围展开重复事件，并缓存重复使用的发生日期窗口。"
    },
    changes: {
      en: [
        "Added persistent USER and ADMIN roles to accounts and included the session role in login responses.",
        "Scoped help-question reads so standard users only see their own submissions while admins can review every question, including legacy rows that only have username ownership.",
        "Added optional ADMIN_USERNAMES bootstrap config for admin privileges.",
        "Added admin-only help-question deletion from the Help Center and backend API.",
        "Backfilled missing user role fields on successful login so older accounts are written back to the dataset.",
        "Updated the Help Center copy to describe the admin review flow, role-specific question lists, and the fact that My Questions is the standard non-admin view.",
        "Reworked Week recurring event expansion so it only generates occurrences for the visible range and reuses cached occurrence windows.",
        "Added backend and frontend regression coverage for admin-scoped help access, owner-only help reads, admin deletion, role-aware login persistence, and visible-range recurring occurrence generation."
      ],
      zh: [
        "为账号新增持久化的 USER 与 ADMIN 角色，并在登录响应中返回当前会话角色。",
        "将帮助问题读取改为按权限范围展示，普通用户只能看到自己的提交，管理员可以查看全部问题，同时兼容只保留了用户名归属的旧数据。",
        "新增可选的 ADMIN_USERNAMES 配置，用于初始化管理员权限。",
        "新增帮助中心和后端接口中的管理员专用帮助问题删除功能。",
        "在成功登录时回填缺失的用户角色字段，让旧账号也会把角色写回数据集。",
        "更新帮助中心文案，说明管理员审核流程、按角色区分的问题列表，以及“我的问题”是普通用户视图这一点。",
        "重构 Week 的重复事件展开逻辑，只为当前可见范围生成发生项，并复用缓存的日期窗口。",
        "新增管理员帮助访问、仅限本人帮助读取、管理员删除、登录角色持久化以及可见范围重复发生项生成的前后端回归测试。"
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
        "Fixed Week calendar events so single-occurrence recurring-task overrides now use the correct title and time slot.",
        "Replaced JSON-stringify task and reminder sync comparisons with explicit field comparisons and removed the shell-level task-dialog DOM observer.",
        "Tightened reminder and help-question schema fields and added backend reminder CRUD coverage plus frontend regression coverage for help-question failures and recurring-event override timing."
      ],
      zh: [
        "将共享帮助问题的发布改为创建新的服务器端帖子，不再通过公开 id 覆盖旧问题。",
        "在帮助问题发布失败时保留草稿，并显示明确的错误提示。",
        "修复 Week 日历事件，让重复任务的单次覆盖现在会使用正确的标题与时间段。",
        "用显式字段比较替换任务和提醒同步时的 JSON-stringify 比较，并移除了应用外壳中用于任务弹窗的 DOM 观察器。",
        "收紧提醒与帮助问题的数据模型字段，并新增提醒 CRUD 的后端覆盖，以及帮助问题失败流程与重复事件覆盖时间的前端回归测试。"
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
        "Restore the mobile bottom navigation after the task dialog closes.",
        "Added frontend regression coverage for task-dialog-driven mobile navigation visibility."
      ],
      zh: [
        "在新增任务弹窗打开时隐藏移动端底部导航。",
        "在编辑任务弹窗打开时隐藏移动端底部导航。",
        "在任务弹窗关闭后恢复移动端底部导航。",
        "新增由任务弹窗控制移动端导航显示状态的前端回归测试。"
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
        "Reduced Month view to the task grid only by removing its extra header controls while keeping vertical swipe navigation directly on the grid.",
        "Added a Jump to Current Month button back to Month view without restoring the removed header shell.",
        "Refreshed MonthPage UI with the new card-based calendar styling while keeping desktop arrows and mobile swipe behavior separate.",
        "Removed the per-day task-count label from Month cards so the cells stay focused on task previews.",
        "Raised the mobile bottom navigation above overlapping planner content so nav taps win over the Week grid underneath.",
        "Documented the simplified Month layout in README and in-app Help.",
        "Added frontend regression coverage for default Week Time Grid behavior, the refreshed Month layout with split desktop/mobile navigation, the restored Month jump button, and stronger mobile bottom-navigation layering."
      ],
      zh: [
        "将 Week 改为在桌面端和移动端默认以时间网格打开。",
        "移除了移动端 Week 页头中的全局 Add Task 按钮。",
        "在移动端 Week 时间网格中新增长按时间范围后再打开创建任务流程。",
        "将新任务弹窗预填为所选时间范围对应的日期、开始时间与结束时间。",
        "将 Month 简化为仅保留任务网格，移除了额外的页头控件，同时保留直接在网格中上下滑动切换月份。",
        "在不恢复已移除页头外壳的前提下，为 Month 页面重新加入 Jump to Current Month 按钮。",
        "为 MonthPage 换上新的卡片式日历视觉设计，同时继续区分桌面端箭头切换与移动端滑动切换。",
        "移除了 Month 日期卡片中的每日任务数量标签，让每个格子专注显示任务预览。",
        "提高了移动端底部导航的层级，让它在与 Week 页面内容重叠时优先响应点击。",
        "在 README 与应用内 Help 中补充 Month 简化布局的说明。",
        "新增 Week 默认时间网格、更新后的 Month 布局与桌面端/移动端分离导航、Month 返回本月按钮，以及更强的移动端底部导航层级的前端回归测试。"
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
        "Replaced per-notification localStorage keys with one retained notification-history entry.",
        "Changed daily and task reminder checks to use crossed-time windows so delayed intervals do not skip 10:00, 21:00, or 15-minute reminder triggers.",
        "Moved browser notification permission requests to the first user interaction instead of automatic page load.",
        "Pruned daily and task reminder notification markers after three days without rewriting storage on every history read.",
        "Added frontend regression coverage for retained notification history, pruning, permission requests, and shell-level reminder writes."
      ],
      zh: [
        "将每次通知单独的 localStorage key 改为统一的 notification-history 历史记录。",
        "将每日提醒和任务提醒改为跨时间窗口检查，避免 `10:00`、`21:00` 和提前 15 分钟提醒因定时器延迟而被跳过。",
        "将浏览器通知权限请求改为等待第一次用户交互，而不是在页面加载时自动触发。",
        "为每日提醒和任务提醒增加三天保留期，并避免在每次读取历史时都重写存储。",
        "新增通知历史保留、清理、权限请求，以及应用层提醒写入行为的前端回归测试。"
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
        "Prevented the Repeat label from clipping against the dialog header.",
        "Added a frontend regression test for the repeat dialog label rendering."
      ],
      zh: [
        "为重复设置弹窗中的重复选择器增加顶部间距。",
        "避免 Repeat 标签贴住弹窗标题而被裁切。",
        "新增重复设置弹窗标签渲染的前端回归测试。"
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
        "Changed the repeat-options dialog to full-screen on mobile.",
        "Added frontend regression coverage for the mobile repeat dialog layout."
      ],
      zh: [
        "让重复设置弹窗在大屏幕上与主任务编辑弹窗保持相同宽度。",
        "将重复设置弹窗改为在移动端全屏打开。",
        "新增移动端重复设置弹窗布局的前端回归测试。"
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
        "Kept older TEMPORARY and PERMANENT task datasets renderable through compatibility normalization.",
        "Added regression tests for recurrence rendering, occurrence overrides, and the updated task API payloads."
      ],
      zh: [
        "将旧的一次性 / 每周类型选择改为重复设置流程。",
        "新增每天、每周、每月、每年的重复规则，并支持间隔与结束日期设置。",
        "为重复任务编辑新增只改当天或修改整个系列的保存选择。",
        "通过兼容性归一化继续支持旧的 TEMPORARY 与 PERMANENT 任务数据渲染。",
        "新增重复渲染、单次覆盖与任务接口新载荷的回归测试。"
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
        "Kept the rolling week sequence, date jumps, task editing, and blank-slot prefilling intact.",
        "Added frontend regression coverage for one-swipe single-step paging."
      ],
      zh: [
        "将移动端 Week 页面的滑动处理改为等待手势结束后再决定下一页。",
        "防止一次滑动连续跨过多个 4 天页与 3 天页。",
        "继续保留跨周滚动顺序、日期跳转、任务编辑与空白区域默认日期带入功能。",
        "新增单次滑动只前进一页的前端回归测试。"
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
        "Kept week-view date jumps, blank-slot date prefilling, and task editing flows working across the rolling mobile pages.",
        "Added frontend behavior coverage for the login-page language toggle.",
        "Expanded README and in-app Help content to document the mobile paging behavior and pre-login language switching."
      ],
      zh: [
        "将移动端 Week 页面从单屏压缩 7 天改为横向分页体验。",
        "新增第一页 4 天、第二页 3 天，并让滑动流程继续进入下一周。",
        "移除了移动端 Week 页头中用于切换上一周和下一周的箭头按钮。",
        "在登录与注册页面直接新增 EN / 中文 语言切换按钮。",
        "为登录标题、字段标签、操作文案、成功状态与常见认证错误补充翻译。",
        "在滚动分页中继续保留日期跳转、空白区域默认日期带入与任务编辑流程。",
        "新增登录页语言切换的前端行为测试。",
        "扩展 README 与应用内 Help 内容，记录新的移动端分页行为与登录前语言切换方式。"
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
      en: "The planner now protects saved data more aggressively by making create requests idempotent and reloading server state after failed task or reminder syncs.",
      zh: "应用现在通过让创建请求具备幂等性，并在任务或提醒同步失败后重新加载服务器状态，进一步保护已保存的数据。"
    },
    changes: {
      en: [
        "Task, reminder, and help-question create routes now reuse the same record id instead of creating duplicates on repeated submissions.",
        "Failed task and reminder sync attempts now trigger a reload from the backend so unsaved local changes do not replace stored data.",
        "Added regression tests for duplicate-safe task saves and failed task-save recovery.",
        "Expanded help and README documentation with the new data-safety behavior."
      ],
      zh: [
        "Task、Reminder 与 Help Question 的创建接口现在会复用同一条记录 id，重复提交不会再产生重复数据。",
        "当任务或提醒同步失败时，应用会重新从后端加载数据，避免未保存的本地变更替代已存储内容。",
        "新增重复保存保护与失败保存恢复的回归测试。",
        "扩展了 Help 与 README 中关于数据安全行为的说明。"
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

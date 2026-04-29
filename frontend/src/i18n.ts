// INPUT: translation resources and browser language detection
// OUTPUT: initialized i18n instance
// EFFECT: Supplies bilingual copy across the planner shell, dialogs, release notes, and help flows
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      app: {
        loading: "Loading your data..."
      },
      common: {
        confirm: "Confirm",
        cancel: "Cancel",
        close: "Close",
        delete: "Delete",
        done: "Done",
        undo: "Undo",
        save: "Save",
        add: "Add",
        edit: "Edit",
        moveToToday: "Move to Today",
        moveOccurrenceToToday: "Move occurrence to Today",
        repeat: "Repeat",
        beginDate: "Begin date",
        endDate: "End date",
        date: "Date",
        weekday: "Weekday",
        emergency: "Emergency",
        startTimeOptional: "Start Time (Optional)",
        endTimeOptional: "End Time (Optional)",
        descriptionOptional: "Description (Optional)",
        locationOptional: "Location (Optional)",
        mapProvider: "Map Provider"
      },
      nav: {
        reminders: "Reminders",
        today: "Today",
        week: "Week",
        month: "Month",
        help: "Help",
        mobileNavigation: "Mobile navigation",
        logout: "Logout",
        greeting: "Hi, {{name}}!"
      },
      login: {
        title: {
          login: "Welcome Back",
          register: "Create an Account"
        },
        fields: {
          username: "Username",
          password: "Password"
        },
        actions: {
          login: "Login",
          register: "Register",
          waiting: "Please wait...",
          switchToLogin: "Already have an account? Log in",
          switchToRegister: "Don't have an account? Register"
        },
        status: {
          registrationSuccess: "Registration successful! Please log in."
        },
        errors: {
          usernameTaken: "Username taken",
          invalidCredentials: "Invalid credentials",
          failedToRegister: "Failed to register",
          failedToLogin: "Failed to log in",
          generic: "Something went wrong"
        }
      },
      notifications: {
        dailyReminderTitle: "Daily Reminder",
        dailyReminderBody: "Don't forget your tasks for today.",
        taskStartingSoonTitle: "Task Starting Soon: {{title}}",
        taskStartingSoonBody: "Starts at {{time}}"
      },
      today: {
        allDay: "All-Day Tasks",
        scheduled: "Scheduled Tasks",
        noTasks: "No tasks scheduled for this date.",
        addTask: "Add Task",
        goToToday: "Go to Today",
        importIcs: "Import ICS",
        importIcsInput: "Import ICS file",
        importSuccess: "Imported {{count}} tasks from {{name}}.",
        importSuccessWithSkipped: "Imported {{count}} tasks from {{name}} and skipped {{skipped}} unsupported entries.",
        importEmpty: "No importable events were found in {{name}}.",
        importError: "We couldn't import {{name}}.",
        markAllDone: "Mark All Done",
        activeCount: "Active {{count}}",
        completedCount: "Completed {{count}}",
        productivityTitle: "Productivity Stats",
        productivityPitch: "See your recent completion pattern at a glance. Last 7 days: {{completed}} / {{total}} completed ({{percent}}%).",
        productivityToday: "Selected Day",
        productivityLast7Days: "Last 7 Days",
        productivityLast30Days: "Last 30 Days",
        viewProductivityDetails: "View Stats and Visualization",
        hideProductivityDetails: "Hide Stats and Visualization",
        statsValue: "{{completed}} / {{total}} completed ({{percent}}%)",
        productivityTrendTitle: "7-Day Completion Trend",
        productivityTrendHint: "Bar height shows workload. Green shows completed tasks and gray shows what stayed open.",
        productivityLegendCompleted: "Completed",
        productivityLegendRemaining: "Remaining",
        taskMeta: "{{type}} • Priority {{priority}}",
        locationLabel: "Location: {{location}}",
        modify: "Modify",
        toToday: "To Today",
        toTomorrow: "To Tomorrow",
        map: "Map",
        previousDay: "Previous day",
        nextDay: "Next day",
        taskTypes: {
          once: "Once",
          daily: "Daily",
          weekly: "Weekly",
          monthly: "Monthly",
          yearly: "Yearly"
        }
      },
      week: {
        title: "Week View",
        listView: "List View",
        timeGridView: "Time Grid",
        todayButton: "Today",
        mobileCreateHint: "On phones, press-hold a time range in Time Grid to create a task there, including ranges that cross into the next day."
      },
      month: {
        jumpToCurrentMonth: "Jump to Current Month",
        moreTasks: "+{{count}} more",
        mobileSwipeHint: "Swipe up or down to change month",
        mobileGestureDescription: "Swipe up for previous month or down for next month.",
        desktopHint: "Arrow navigation on desktop",
        scanHint: "Scan workload by day",
        weekdays: {
          sun: "Sun",
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat"
        }
      },
      reminder: {
        title: "Active Reminders",
        addReminder: "Add Reminder",
        empty: "You have no active reminders!",
        priority: "Priority: {{value}}",
        modify: "Modify",
        createTitle: "Create Reminder",
        editTitle: "Edit Reminder",
        reminderTitle: "Title",
        notesOptional: "Notes (Optional)",
        emergencyField: "Emergency (1=Highest, 5=Lowest)"
      },
      release: {
        toolbar: "Updates",
        dialogTitle: "What's New",
        historyTitle: "Release History",
        viewHistory: "View History",
        latestBadge: "Latest",
        releasedOn: "Released {{date}}"
      },
      help: {
        title: "Help Center",
        subtitleUser: "Learn how to use the planner, check common answers, and send a question to the admin review board.",
        subtitleAdmin: "Learn how to use the planner, check common answers, and review every submitted help question.",
        submitSuccess: "Your question has been saved.",
        submitError: "We couldn't post your question. Your draft is still here.",
        guides: {
          title: "How To Use This Website",
          step0: "Use the EN / 中文 button on the login page whenever you want to switch the sign-in flow between English and Chinese before entering the app.",
          step1: "Use Today to add, edit, complete, or move tasks for the current day. Completed tasks leave the active list immediately, stay retained for 30 days, and contribute to the expandable productivity stats and trend chart shown on the page.",
          step2: "Use the Import ICS action on Today when you want to turn calendar events from a `.ics` file into planner tasks. The importer keeps multi-day all-day ranges, timed events, and supported daily, weekly, monthly, or yearly repeat rules.",
          step3: "Use Week and Month to review your schedule and jump between dates quickly. Week now opens in Time Grid by default, and on phones you can press-hold a time range before creating a task while Month stays as a simplified task grid.",
          step4: "Use Reminders for ongoing notes that should stay visible until you mark them done.",
          step5: "On phones, use the bottom navigation to switch between planner sections, while larger screens keep the sidebar visible. When a task dialog opens, the mobile bottom navigation hides until the task window closes.",
          step6: "Task, Reminder, and repeat-option forms open full-screen on mobile for easier editing, and stay centered as dialogs on larger screens.",
          step7: "Planner notifications now use background Web Push on supported desktop browsers and installed mobile web apps. After you interact with the app and allow notifications, daily prompts and upcoming timed-task alerts can arrive even when the planner tab is closed. Browsers without Web Push support still fall back to in-page notifications while the planner stays open."
        },
        faq: {
          title: "Common Q&A",
          q1: {
            question: "How does repeat work for tasks?",
            answer: "Each task starts with a begin date and a repeat setting. You can keep it as Once, or repeat it daily, weekly, monthly, or yearly with interval and end-date controls. Completing a task now stores a completion timestamp, hides it from active views, keeps retained analytics data for 30 days, and feeds the expandable productivity stats on Today."
          },
          q2: {
            question: "How do reminders differ from tasks?",
            answer: "Reminders are lightweight notes for ongoing follow-up, while tasks are date-based items managed in Today, Week, and Month."
          },
          q3: {
            question: "Why does a task need a valid end time?",
            answer: "If you set an end time, it must be equal to or later than the start time so the calendar can render it correctly."
          },
          q4: {
            question: "Who can see the submitted questions?",
            answer: "Standard users can only see their own submitted questions in the My Questions list, while admin accounts can review the full question list and delete questions when needed. Every submission is stored as its own post instead of overwriting an older question."
          },
          q5: {
            question: "How does clicking in Week view work?",
            answer: "Click a day header to jump to that date in Today, click an empty spot on larger screens so the next new task uses that date by default, and on mobile the Week page now opens in Time Grid so you can press-hold a time range immediately while swiping through each week's 4-day and 3-day pages. If your selected range crosses into the next day, the new task also keeps that end date."
          },
          q6: {
            question: "How does the layout change on mobile devices?",
            answer: "The planner switches to a bottom navigation layout, narrows typography, uses a swipeable Week view that rolls from 4 days to 3 days and into the next week, replaces the Week add button with press-hold time-range creation, keeps Month as a simplified task grid, expands Task and Reminder forms to full-screen for easier touch use, and hides the mobile bottom navigation whenever an add-task or edit-task window is open."
          },
          q7: {
            question: "What happens if a save request fails?",
            answer: "The app reloads tasks or reminders from the server after a failed save so unsaved local changes do not replace your stored data. If posting a help question fails, the draft stays in the editor and the page shows an error instead of a fake success message."
          },
          q8: {
            question: "Can I change the language before logging in?",
            answer: "Yes. Use the EN / 中文 button on the login page to switch the authentication screen before you sign in or register."
          },
          q9: {
            question: "What happens when I edit one repeating task occurrence?",
            answer: "After you save or delete one repeating task occurrence, the app asks whether the action should affect only that day or the entire series. Single-day changes are stored as occurrence overrides so the original series stays intact."
          },
          q10: {
            question: "Do browser reminder notifications keep growing in storage?",
            answer: "No. The fallback in-page notification history still stays bounded to three days in one retained browser record, and the new background push scheduler also prunes per-device notification history so duplicate daily or task alerts do not keep growing."
          },
          q12: {
            question: "How do I get notifications on phone and computer?",
            answer: "Allow notifications after you interact with the app. On desktop, supported browsers can receive background alerts through Web Push. On iPhone or iPad, add the app to the home screen first and then allow notifications from the installed web app. Daily prompts and 15-minute task alerts are then delivered from the backend even if the planner page is not open."
          },
          q11: {
            question: "What does the ICS importer support?",
            answer: "Import ICS on Today to convert calendar events into tasks. The importer keeps titles, notes, locations, multi-day all-day ranges, timed events, and supported daily, weekly, monthly, or yearly repeat rules. Unsupported entries are skipped and reported after the import."
          }
        },
        ask: {
          title: "Ask A Question",
          field: "Your question",
          submit: "Send Question"
        },
        community: {
          titleUser: "My Questions",
          titleAdmin: "All User Questions",
          scopeUser: "Only you and admin accounts can see the questions in this list.",
          scopeAdmin: "Admin view: you can review questions from every signed-in user.",
          deleteSuccess: "The question has been deleted.",
          deleteError: "We couldn't delete that question.",
          empty: "No questions yet.",
          meta: "Asked by {{username}} on {{createdAt}}"
        }
      },
      dialog: {
        doneMessage: "Mark \"{{title}}\" as done?",
        deleteMessage: "Delete \"{{title}}\"?",
        allDoneMessage: "Mark all tasks for this day as done?",
        allDoneAction: "All done",
        addTaskTitle: "Add task",
        editTaskTitle: "Edit task",
        taskName: "Task name",
        endDateError: "End date must be the same as or later than begin date.",
        endTimeError: "End time must be equal to or later than start time.",
        repeatTitle: "Repeat options",
        editRepeat: "Edit",
        repeatEvery: "Repeat every",
        repeatIntervalValue: "Every {{value}} {{unit}}",
        onDays: "On days",
        onMonthDays: "On days of month",
        until: "Until",
        forever: "Forever",
        endDate: "End date",
        editSeriesTitle: "Update repeating task",
        editSeriesMessage: "Choose whether these changes should affect only this day or the entire repeating series.",
        editSeriesHint: "Repeat and begin-date changes apply when you update the entire series.",
        deleteSeriesTitle: "Delete repeating task",
        deleteSeriesMessage: "Choose whether to delete only this day or the entire repeating series.",
        deleteSeriesHint: "Deleting only this day hides that one occurrence and keeps the rest of the series available.",
        editingOccurrence: "Editing occurrence on {{date}}",
        editEntireSeries: "Editing repeating task",
        thisDayOnly: "This day only",
        entireSeries: "Entire series",
        repeatOptions: {
          none: "None (Once)",
          daily: "Daily",
          weekly: "Weekly",
          monthly: "Monthly",
          yearly: "Yearly"
        },
        repeatUnits: {
          daily: "day(s)",
          weekly: "week(s)",
          monthly: "month(s)",
          yearly: "year(s)"
        },
        highest: "{{value}} (Highest)",
        lowest: "{{value}} (Lowest)",
        weekdays: {
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          sunday: "Sunday"
        },
        mapProviders: {
          google: "Google Maps",
          apple: "Apple Maps",
          baidu: "Baidu Maps"
        }
      }
    }
  },
  zh: {
    translation: {
      app: {
        loading: "正在加载数据..."
      },
      common: {
        confirm: "确认",
        cancel: "取消",
        close: "关闭",
        delete: "删除",
        done: "完成",
        undo: "撤销",
        save: "保存",
        add: "添加",
        edit: "编辑",
        moveToToday: "移到今天",
        moveOccurrenceToToday: "将本次移到今天",
        repeat: "重复",
        beginDate: "开始日期",
        endDate: "结束日期",
        date: "日期",
        weekday: "星期",
        emergency: "紧急程度",
        startTimeOptional: "开始时间（可选）",
        endTimeOptional: "结束时间（可选）",
        descriptionOptional: "描述（可选）",
        locationOptional: "地点（可选）",
        mapProvider: "地图提供商"
      },
      nav: {
        reminders: "提醒",
        today: "今天",
        week: "周视图",
        month: "月视图",
        help: "帮助",
        mobileNavigation: "移动端导航",
        logout: "退出登录",
        greeting: "你好，{{name}}！"
      },
      login: {
        title: {
          login: "欢迎回来",
          register: "创建账号"
        },
        fields: {
          username: "用户名",
          password: "密码"
        },
        actions: {
          login: "登录",
          register: "注册",
          waiting: "请稍候...",
          switchToLogin: "已有账号？去登录",
          switchToRegister: "还没有账号？去注册"
        },
        status: {
          registrationSuccess: "注册成功，请登录。"
        },
        errors: {
          usernameTaken: "用户名已被使用",
          invalidCredentials: "用户名或密码错误",
          failedToRegister: "注册失败",
          failedToLogin: "登录失败",
          generic: "发生了一些问题"
        }
      },
      notifications: {
        dailyReminderTitle: "每日提醒",
        dailyReminderBody: "别忘了今天的任务。",
        taskStartingSoonTitle: "任务即将开始：{{title}}",
        taskStartingSoonBody: "开始时间：{{time}}"
      },
      today: {
        allDay: "全天任务",
        scheduled: "日程安排",
        noTasks: "当日没有安排任务。",
        addTask: "添加任务",
        goToToday: "回到今天",
        importIcs: "导入 ICS",
        importIcsInput: "导入 ICS 文件",
        importSuccess: "已从 {{name}} 导入 {{count}} 个任务。",
        importSuccessWithSkipped: "已从 {{name}} 导入 {{count}} 个任务，并跳过 {{skipped}} 个暂不支持的条目。",
        importEmpty: "{{name}} 中没有可导入的事件。",
        importError: "无法导入 {{name}}。",
        markAllDone: "全部完成",
        activeCount: "进行中 {{count}}",
        completedCount: "已完成 {{count}}",
        productivityTitle: "效率统计",
        productivityPitch: "先快速看一下最近的完成节奏。最近 7 天完成 {{completed}} / {{total}}（{{percent}}%）。",
        productivityToday: "所选日期",
        productivityLast7Days: "最近 7 天",
        productivityLast30Days: "最近 30 天",
        viewProductivityDetails: "查看统计与图表",
        hideProductivityDetails: "收起统计与图表",
        statsValue: "完成 {{completed}} / {{total}}（{{percent}}%）",
        productivityTrendTitle: "近 7 天完成趋势",
        productivityTrendHint: "柱形高度表示当天任务量，绿色表示已完成，灰色表示仍未完成。",
        productivityLegendCompleted: "已完成",
        productivityLegendRemaining: "未完成",
        taskMeta: "{{type}} • 优先级 {{priority}}",
        locationLabel: "地点：{{location}}",
        modify: "修改",
        toToday: "移到今天",
        toTomorrow: "移到明天",
        map: "地图",
        previousDay: "前一天",
        nextDay: "后一天",
        taskTypes: {
          once: "一次",
          daily: "每天",
          weekly: "每周",
          monthly: "每月",
          yearly: "每年"
        }
      },
      week: {
        title: "周视图",
        listView: "列表视图",
        timeGridView: "时间网格",
        todayButton: "今天",
        mobileCreateHint: "在手机上可直接在时间网格中长按一段时间范围，在该时段创建任务，也支持跨到下一天的范围。"
      },
      month: {
        jumpToCurrentMonth: "跳到当前月份",
        moreTasks: "+{{count}} 个更多",
        mobileSwipeHint: "上下滑动切换月份",
        mobileGestureDescription: "向上滑到上个月，向下滑到下个月。",
        desktopHint: "桌面端使用箭头切换",
        scanHint: "按天查看任务密度",
        weekdays: {
          sun: "日",
          mon: "一",
          tue: "二",
          wed: "三",
          thu: "四",
          fri: "五",
          sat: "六"
        }
      },
      reminder: {
        title: "进行中的提醒",
        addReminder: "添加提醒",
        empty: "目前没有进行中的提醒！",
        priority: "优先级：{{value}}",
        modify: "修改",
        createTitle: "创建提醒",
        editTitle: "编辑提醒",
        reminderTitle: "标题",
        notesOptional: "备注（可选）",
        emergencyField: "紧急程度（1=最高，5=最低）"
      },
      release: {
        toolbar: "更新",
        dialogTitle: "最新更新",
        historyTitle: "更新历史",
        viewHistory: "查看历史",
        latestBadge: "最新",
        releasedOn: "发布时间 {{date}}"
      },
      help: {
        title: "帮助中心",
        subtitleUser: "了解如何使用这个计划工具、查看常见问答，并把问题提交到管理员审核列表。",
        subtitleAdmin: "了解如何使用这个计划工具、查看常见问答，并查看所有用户提交的问题。",
        submitSuccess: "你的问题已保存。",
        submitError: "问题发布失败，草稿会保留在输入框中。",
        guides: {
          title: "网站使用说明",
          step0: "如果你想在登录前切换语言，可以先使用登录页上的 EN / 中文 按钮，在英文和中文之间切换认证界面。",
          step1: "在 Today 页面中添加、编辑、完成或移动当天任务。任务完成后会立即从进行中列表隐藏，并保留 30 天的完成数据，同时这些记录也会计入页面上可展开的效率统计与趋势图。",
          step2: "如果你有日历导出的 `.ics` 文件，可以在 Today 页面使用导入按钮把事件直接转换成任务。导入会保留跨天全天范围、定时事件，以及受支持的每天、每周、每月、每年重复规则。",
          step3: "在 Week 和 Month 页面快速查看整体安排并跳转日期。Week 现在默认进入时间网格；在手机上可直接长按时间范围创建任务，而 Month 则保持为简化后的任务网格。",
          step4: "使用 Reminders 记录持续存在、直到你手动完成的提醒事项。",
          step5: "在手机上可使用底部导航切换页面；在较大屏幕上会显示侧边栏导航。当任务弹窗打开时，移动端底部导航会先隐藏，直到任务窗口关闭。",
          step6: "Task、Reminder 和重复设置表单在手机上会全屏打开，较大屏幕上则保持居中弹窗。",
          step7: "计划器通知现在会在受支持的桌面浏览器和已安装的移动端网页应用中使用后台 Web Push。你与应用交互并允许通知后，每日提醒和即将开始的定时任务提醒即使在计划器标签页关闭后也能送达。不支持 Web Push 的浏览器仍会在页面保持打开时使用页内通知作为兜底。"
        },
        faq: {
          title: "常见问答",
          q1: {
            question: "任务的重复设置怎么用？",
            answer: "每个任务都会先设置开始日期，再选择重复方式。你可以保持为一次，也可以设置为每天、每周、每月或每年，并配置间隔和结束日期。任务完成后会记录完成时间，从进行中视图隐藏，并保留 30 天的分析数据，同时会计入 Today 页面可展开的效率统计。"
          },
          q2: {
            question: "提醒和任务有什么不同？",
            answer: "提醒更适合持续跟进的简短事项，而任务是按日期管理的内容，会出现在 Today、Week 和 Month 中。"
          },
          q3: {
            question: "为什么结束时间必须有效？",
            answer: "如果设置了结束时间，它必须等于或晚于开始时间，这样日历才能正确显示任务。"
          },
          q4: {
            question: "谁可以看到提交的问题？",
            answer: "普通用户只能在“我的问题”列表中看到自己提交的问题，而管理员账号可以查看完整的问题列表，并在需要时删除问题。每次提交都会作为独立帖子保存，不会覆盖旧问题。"
          },
          q5: {
            question: "Week 页面中的点击行为是什么？",
            answer: "点击某一天的日期标题会跳转到对应的 Today 页面；在较大屏幕上点击周历中的空白区域后，再新增任务时会默认带入该日期；在手机上 Week 页面默认就是时间网格，可直接长按某段时间范围打开该时段的任务创建流程，同时仍可在每周的 4 天页与 3 天页之间持续滑动并进入下一周。如果所选范围跨到下一天，新任务也会保留那个结束日期。"
          },
          q6: {
            question: "移动设备上的布局会怎样变化？",
            answer: "应用会切换到底部导航、缩小排版字号，并让 Week 页面改为可持续左右滑动的布局，按每周先 4 天再 3 天的顺序切换，同时把 Week 页面上的新增任务入口改成长按时间范围，并让 Month 页面保持为简化后的任务网格，同时让 Task 与 Reminder 表单改为全屏显示，方便触控操作；当新增任务或编辑任务窗口打开时，移动端底部导航会自动隐藏。"
          },
          q7: {
            question: "如果保存请求失败会怎样？",
            answer: "当保存失败时，应用会从服务器重新加载任务或提醒，避免未保存的本地变更覆盖你已经存储的数据。如果帮助问题发布失败，草稿会保留在输入框中，页面也会显示错误提示，而不是误报成功。"
          },
          q8: {
            question: "我可以在登录前切换语言吗？",
            answer: "可以。使用登录页上的 EN / 中文 按钮，就能在登录或注册前先切换认证界面的语言。"
          },
          q9: {
            question: "修改重复任务的一天时会发生什么？",
            answer: "当你保存或删除重复任务中的某一天时，应用会让你选择只影响这一天，还是影响整个系列。只针对一天的变更会记录为单次覆盖，不会破坏原来的系列。"
          },
          q10: {
            question: "浏览器提醒通知会一直占用越来越多的存储吗？",
            answer: "不会。页内通知兜底方案仍然只会把三天内的记录保存在一个浏览器键中，而新的后台推送调度器也会按设备清理通知历史，避免重复的每日提醒或任务提醒不断累积。"
          },
          q12: {
            question: "怎样才能在手机和电脑上都收到通知？",
            answer: "先在与应用交互后允许通知。桌面端可在受支持的浏览器中通过 Web Push 收到后台提醒；iPhone 和 iPad 需要先把应用加入主屏幕，再在安装后的网页应用中允许通知。之后，每日提醒和任务开始前 15 分钟提醒都会由后端发送，即使计划器页面没有打开。"
          },
          q11: {
            question: "ICS 导入功能支持什么？",
            answer: "你可以在 Today 页面导入 ICS，把日历事件转换成任务。导入会保留标题、备注、地点、跨天全天范围、定时事件，以及受支持的每天、每周、每月、每年重复规则。暂不支持的条目会被跳过，并在导入后提示。"
          }
        },
        ask: {
          title: "提交问题",
          field: "你的问题",
          submit: "发送问题"
        },
        community: {
          titleUser: "我的问题",
          titleAdmin: "所有用户问题",
          scopeUser: "这个列表中的问题只有你和管理员账号可以看到。",
          scopeAdmin: "管理员视图：你可以查看所有已登录用户提交的问题。",
          deleteSuccess: "该问题已删除。",
          deleteError: "无法删除该问题。",
          empty: "还没有问题。",
          meta: "{{username}} 提问于 {{createdAt}}"
        }
      },
      dialog: {
        doneMessage: "将“{{title}}”标记为完成？",
        deleteMessage: "删除“{{title}}”？",
        allDoneMessage: "将这一天的所有任务标记为完成？",
        allDoneAction: "全部完成",
        addTaskTitle: "添加任务",
        editTaskTitle: "编辑任务",
        taskName: "任务名称",
        endDateError: "结束日期必须等于或晚于开始日期。",
        endTimeError: "结束时间必须等于或晚于开始时间。",
        repeatTitle: "重复设置",
        editRepeat: "编辑",
        repeatEvery: "重复间隔",
        repeatIntervalValue: "每 {{value}} 个{{unit}}",
        onDays: "在这些星期",
        onMonthDays: "在每月这些日期",
        until: "结束方式",
        forever: "一直重复",
        endDate: "结束日期",
        editSeriesTitle: "更新重复任务",
        editSeriesMessage: "请选择这些修改是只影响这一天，还是影响整个重复系列。",
        editSeriesHint: "重复方式和开始日期的修改会在你选择整个系列时生效。",
        deleteSeriesTitle: "删除重复任务",
        deleteSeriesMessage: "请选择只删除这一天，还是删除整个重复系列。",
        deleteSeriesHint: "如果只删除这一天，系统会隐藏这一次出现，其他重复日期会保留。",
        editingOccurrence: "正在编辑 {{date}} 这一天",
        editEntireSeries: "正在编辑重复任务",
        thisDayOnly: "只改这一天",
        entireSeries: "整个系列",
        repeatOptions: {
          none: "不重复（一次）",
          daily: "每天",
          weekly: "每周",
          monthly: "每月",
          yearly: "每年"
        },
        repeatUnits: {
          daily: "天",
          weekly: "周",
          monthly: "个月",
          yearly: "年"
        },
        highest: "{{value}}（最高）",
        lowest: "{{value}}（最低）",
        weekdays: {
          monday: "星期一",
          tuesday: "星期二",
          wednesday: "星期三",
          thursday: "星期四",
          friday: "星期五",
          saturday: "星期六",
          sunday: "星期日"
        },
        mapProviders: {
          google: "谷歌地图",
          apple: "苹果地图",
          baidu: "百度地图"
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;

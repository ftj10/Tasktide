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
        next: "Next",
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
        switchLanguage: "Switch language",
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
        releasedOn: "Released {{date}}",
        sections: {
          features: "New Features",
          improvements: "Improvements",
          fixes: "Bug Fixes"
        }
      },
      help: {
        title: "Help Center",
        subtitleUser: "Learn how to use the planner, check common answers, and send a question to the admin review board.",
        subtitleAdmin: "Learn how to use the planner, check common answers, and review every submitted help question.",
        previous: "Back",
        walkthroughStep: "Step {{current}} / {{total}}",
        submitSuccess: "Your question has been saved.",
        submitError: "We couldn't post your question. Your draft is still here.",
        walkthroughs: {
          title: "Quick Walkthroughs",
          open: "Open",
          mediaPlaceholderTitle: "GIF placeholder",
          mediaPlaceholderBody: "Add your walkthrough GIF at this path to replace the placeholder.",
          addTaskBrowser: {
            question: "Add a task from Today on desktop",
            title: "how to add task in todaypage in browser.gif",
            text: "This GIF shows opening Today, clicking Add Task, and saving a new task."
          },
          quickAddWeekBrowser: {
            question: "Quick-add a task in Week on desktop",
            title: "how to quickly add task in weekpage browser.gif",
            text: "This GIF shows choosing a time in Week and creating a task faster."
          },
          addTaskWeekMobile: {
            question: "Add a task in Week on mobile",
            title: "how to add task in weekpage in mobile.gif",
            text: "This GIF shows pressing a time slot in mobile Week and adding a task."
          },
          taskMap: {
            question: "Open the map from a task",
            title: "how to enable map function for each task(both mobile and desktop browser).gif",
            text: "This GIF shows opening the map link from a task on desktop or mobile."
          },
          openWebAppPc: {
            question: "Open the planner as a desktop web app",
            title: "how to open a web app in pc.gif",
            text: "This GIF shows installing or opening the planner as a desktop web app."
          },
          resetNotificationsPc: {
            question: "Reset or enable desktop notifications",
            title: "how to reset:enable notification in pc.gif",
            text: "This GIF shows fixing desktop browser notification settings for the planner."
          }
        },
        guides: {
          title: "How To Use This Website",
          step0: "Use the language button on the login page or inside TaskTide if you want English or Chinese.",
          step1: "Use Today to add tasks, edit tasks, mark tasks done, and move tasks to another day.",
          step2: "Use Import ICS on Today if you want to turn calendar events into planner tasks.",
          step3: "Use Week and Month to see your schedule and jump to another date quickly.",
          step4: "Use Reminders for notes that should stay visible until you finish them.",
          step5Desktop: "On desktop, use the left sidebar to move between Today, Week, Month, Reminders, and Help.",
          step5Mobile: "On mobile, use the bottom navigation to move between Today, Week, Month, Reminders, and Help.",
          step6Desktop: "On desktop, task forms open as centered dialog windows.",
          step6Mobile: "On mobile, task forms open full screen so they are easier to use.",
          step7Desktop: "On desktop, allow notifications if you want daily reminders and task alerts from the browser.",
          step7Mobile: "On mobile, install the web app and allow notifications if you want daily reminders and task alerts."
        },
        faq: {
          title: "Common Q&A",
          q1: {
            question: "How does repeat work for tasks?",
            answer: "Choose a begin date, then choose how often the task repeats. You can keep it once, or repeat it daily, weekly, monthly, or yearly."
          },
          q2: {
            question: "How do reminders differ from tasks?",
            answer: "Tasks are planned by date. Reminders are simple notes that stay visible until you mark them done."
          },
          q3: {
            question: "Why does a task need a valid end time?",
            answer: "If you use an end time, it must be the same as or later than the start time."
          },
          q4: {
            question: "Who can see the submitted questions?",
            answer: "Normal users only see their own questions. Admin accounts can see all questions and delete them if needed."
          },
          q5: {
            question: "How does clicking in Week view work?",
            answer: "You can jump to a date, pick a time slot, and create a task from Week. On mobile, press and hold the time range you want."
          },
          q6: {
            question: "How does the layout change on mobile devices?",
            answer: "The app uses bottom navigation, a touch-friendly Week view, and full-screen forms on mobile."
          },
          q7: {
            question: "What happens if a save request fails?",
            answer: "The app reloads your saved data from the server. If a help question fails to post, your draft stays in the box."
          },
          q8: {
            question: "Can I change the language before logging in?",
            answer: "Yes. Use the EN / 中文 button on the login page to switch the authentication screen before you sign in or register."
          },
          q9: {
            question: "What happens when I edit one repeating task occurrence?",
            answer: "The app asks whether you want to change only that day or the whole repeating series."
          },
          q10: {
            question: "Do browser reminder notifications keep growing in storage?",
            answer: "No. Old notification records are cleaned up automatically."
          },
          q12: {
            question: "How do I get notifications on phone and computer?",
            answer: "Desktop:\n1. Open TaskTide.\n2. Allow notifications when the browser asks.\n\nIPhone or iPad:\n1. Add TaskTide to Home Screen.\n2. Open TaskTide from your Home Screen.\n3. Allow notifications.\n4. If needed, check Settings > Notifications > TaskTide.\n5. Make sure notifications are on.\n\nAndroid:\n1. Install TaskTide if your browser supports it.\n2. Open TaskTide.\n3. Allow notifications.\n4. If needed, check Settings > Apps > TaskTide or your browser > Notifications.\n5. Make sure notifications are on.\n\nAfter setup, daily prompts and 15-minute task alerts can arrive even when TaskTide is closed."
          },
          q13: {
            question: "How do I install the mobile web app?",
            answer: "IPhone or iPad:\n1. Open TaskTide in Safari.\n2. Tap Share.\n3. Tap Add to Home Screen.\n4. Confirm the TaskTide app name.\n5. Open TaskTide from your Home Screen.\n\nAndroid:\n1. Open TaskTide in Chrome, Edge, or another supported browser.\n2. Open the browser menu.\n3. Tap Install app or Add to Home screen.\n4. Confirm TaskTide.\n5. Open TaskTide from your Home Screen or app list."
          },
          q14: {
            question: "Do installed mobile web apps work the same on every browser?",
            answer: "No.\n\nIPhone and iPad:\n- Use Safari for the best install support.\n\nAndroid:\n- Chrome and Edge usually work best.\n- Other browsers can vary by device and version.\n\nIf install or notification options do not appear, try Safari on iPhone/iPad or Chrome/Edge on Android."
          },
          q15: {
            question: "How does sign-in stay active in this browser?",
            answer: "The planner keeps your sign-in in a secure browser session cookie. You usually stay signed in until you log out or the session expires."
          },
          q11: {
            question: "What does the ICS importer support?",
            answer: "Import ICS on Today to turn calendar events into tasks. It supports titles, notes, locations, timed events, multi-day events, and common repeat rules."
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
      },
      onboarding: {
        title: "Quick tour",
        skip: "Skip",
        done: "Done",
        steps: {
          languageSwitch: "Use this button to switch between English and Chinese.",
          addTask: "Tap here to add a task.",
          taskList: "Your tasks appear here after you save.",
          weekView: "Open Week to plan tasks by time."
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
        next: "下一步",
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
        switchLanguage: "切换语言",
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
        releasedOn: "发布时间 {{date}}",
        sections: {
          features: "新功能",
          improvements: "改进",
          fixes: "问题修复"
        }
      },
      help: {
        title: "帮助中心",
        subtitleUser: "了解如何使用这个计划工具、查看常见问答，并把问题提交到管理员审核列表。",
        subtitleAdmin: "了解如何使用这个计划工具、查看常见问答，并查看所有用户提交的问题。",
        previous: "上一步",
        walkthroughStep: "步骤 {{current}} / {{total}}",
        submitSuccess: "你的问题已保存。",
        submitError: "问题发布失败，草稿会保留在输入框中。",
        walkthroughs: {
          title: "快捷演示",
          open: "打开",
          mediaPlaceholderTitle: "GIF 占位区域",
          mediaPlaceholderBody: "把你的演示 GIF 放到这个路径后，就会替换当前占位区域。",
          addTaskBrowser: {
            question: "在桌面端从 Today 添加任务",
            title: "how to add task in todaypage in browser.gif",
            text: "这个 GIF 会演示在桌面浏览器中打开 Today、点击 Add Task，并保存新任务。"
          },
          quickAddWeekBrowser: {
            question: "在桌面端的 Week 快速添加任务",
            title: "how to quickly add task in weekpage browser.gif",
            text: "这个 GIF 会演示在桌面浏览器的 Week 页面快速选择时间并创建任务。"
          },
          addTaskWeekMobile: {
            question: "在手机端的 Week 添加任务",
            title: "how to add task in weekpage in mobile.gif",
            text: "这个 GIF 会演示在手机端的 Week 页面按住时间格并添加任务。"
          },
          taskMap: {
            question: "从任务中打开地图",
            title: "how to enable map function for each task(both mobile and desktop browser).gif",
            text: "这个 GIF 会演示在手机端或桌面端从任务里打开地图链接。"
          },
          openWebAppPc: {
            question: "在桌面端把计划器作为网页应用打开",
            title: "how to open a web app in pc.gif",
            text: "这个 GIF 会演示在桌面端安装或打开计划器网页应用。"
          },
          resetNotificationsPc: {
            question: "重置或开启桌面通知",
            title: "how to reset:enable notification in pc.gif",
            text: "这个 GIF 会演示在桌面浏览器中修复计划器通知设置。"
          }
        },
        guides: {
          title: "网站使用说明",
          step0: "如果你想切换英文或中文，可以使用登录页或 TaskTide 内的语言按钮。",
          step1: "Today 用来添加任务、编辑任务、完成任务，或把任务移动到别的日期。",
          step2: "如果你想把日历事件变成任务，可以在 Today 使用 Import ICS。",
          step3: "Week 和 Month 用来看安排，也可以快速跳到别的日期。",
          step4: "Reminders 适合记录会一直显示、直到你完成的提醒事项。",
          step5Desktop: "桌面端可以用左侧边栏切换 Today、Week、Month、Reminders 和 Help。",
          step5Mobile: "手机端可以用底部导航切换 Today、Week、Month、Reminders 和 Help。",
          step6Desktop: "桌面端的任务表单会以居中弹窗打开。",
          step6Mobile: "手机端的任务表单会全屏打开，操作更方便。",
          step7Desktop: "如果你想收到每日提醒和任务提醒，请在桌面端允许浏览器通知。",
          step7Mobile: "如果你想收到每日提醒和任务提醒，请先安装网页应用并允许通知。"
        },
        faq: {
          title: "常见问答",
          q1: {
            question: "任务的重复设置怎么用？",
            answer: "先选开始日期，再选择重复方式。你可以设为一次、每天、每周、每月或每年。"
          },
          q2: {
            question: "提醒和任务有什么不同？",
            answer: "任务按日期安排。提醒更像会一直显示的简短备忘。"
          },
          q3: {
            question: "为什么结束时间必须有效？",
            answer: "如果设置结束时间，它必须和开始时间一样晚或更晚。"
          },
          q4: {
            question: "谁可以看到提交的问题？",
            answer: "普通用户只会看到自己的问题。管理员可以看到所有问题，也可以删除问题。"
          },
          q5: {
            question: "Week 页面中的点击行为是什么？",
            answer: "你可以从 Week 跳到某一天，也可以直接选时间来创建任务。手机端可以长按时间范围来添加任务。"
          },
          q6: {
            question: "移动设备上的布局会怎样变化？",
            answer: "手机端会使用底部导航、触控更方便的 Week 视图，以及全屏表单。"
          },
          q7: {
            question: "如果保存请求失败会怎样？",
            answer: "应用会重新加载服务器里的数据。如果帮助问题发送失败，草稿会保留下来。"
          },
          q8: {
            question: "我可以在登录前切换语言吗？",
            answer: "可以。使用登录页上的 EN / 中文 按钮，就能在登录或注册前先切换认证界面的语言。"
          },
          q9: {
            question: "修改重复任务的一天时会发生什么？",
            answer: "应用会问你是只改这一天，还是改整个重复系列。"
          },
          q10: {
            question: "浏览器提醒通知会一直占用越来越多的存储吗？",
            answer: "不会。旧的通知记录会自动清理。"
          },
          q12: {
            question: "怎样才能在手机和电脑上都收到通知？",
            answer: "桌面端：\n1. 打开 TaskTide。\n2. 在浏览器请求时允许通知。\n\nIPhone 或 iPad：\n1. 先把 TaskTide 加入主屏幕。\n2. 从主屏幕打开 TaskTide。\n3. 允许通知。\n4. 如果需要，到 设置 > 通知 > TaskTide 检查。\n5. 确认通知已开启。\n\nAndroid：\n1. 如果浏览器支持，先安装 TaskTide。\n2. 打开 TaskTide。\n3. 允许通知。\n4. 如果需要，到 设置 > 应用 > TaskTide 或你的浏览器 > 通知 检查。\n5. 确认通知已开启。\n\n完成后，即使 TaskTide 关闭，也能收到每日提醒和任务开始前 15 分钟提醒。"
          },
          q13: {
            question: "怎么安装移动端网页应用？",
            answer: "IPhone 或 iPad：\n1. 用 Safari 打开 TaskTide。\n2. 点分享。\n3. 点“添加到主屏幕”。\n4. 确认 TaskTide 应用名称。\n5. 从主屏幕打开 TaskTide。\n\nAndroid：\n1. 用 Chrome、Edge 或其他支持的浏览器打开 TaskTide。\n2. 打开浏览器菜单。\n3. 点“安装应用”或“添加到主屏幕”。\n4. 确认 TaskTide。\n5. 从主屏幕或应用列表打开 TaskTide。"
          },
          q14: {
            question: "不同浏览器安装后的移动网页应用效果一样吗？",
            answer: "不完全一样。\n\nIPhone 和 iPad：\n- Safari 的支持最好。\n\nAndroid：\n- Chrome 和 Edge 通常最完整。\n- 其他浏览器会因设备和版本不同而有差异。\n\n如果没有看到安装或通知选项，iPhone/iPad 请优先试 Safari，Android 请优先试 Chrome 或 Edge。"
          },
          q15: {
            question: "这个浏览器里的登录状态会怎样保持？",
            answer: "计划器会用更安全的浏览器会话 Cookie 保持登录。一般情况下，除非你主动退出或会话过期，否则会继续保持登录。"
          },
          q11: {
            question: "ICS 导入功能支持什么？",
            answer: "你可以在 Today 导入 ICS，把日历事件变成任务。支持标题、备注、地点、定时事件、跨天事件和常见重复规则。"
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
      },
      onboarding: {
        title: "快速引导",
        skip: "跳过",
        done: "完成",
        steps: {
          languageSwitch: "用这个按钮在英文和中文之间切换。",
          addTask: "点这里添加任务。",
          taskList: "保存后，任务会显示在这里。",
          weekView: "打开 Week 按时间安排任务。"
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

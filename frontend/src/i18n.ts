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
        save: "Save",
        add: "Add",
        edit: "Edit",
        moveToToday: "Move to Today",
        moveOccurrenceToToday: "Move occurrence to Today",
        repeat: "Repeat",
        beginDate: "Begin date",
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
        markAllDone: "Mark All Done",
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
        todayButton: "Today"
      },
      month: {
        jumpToCurrentMonth: "Jump to Current Month",
        moreTasks: "+{{count}} more",
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
        subtitle: "Learn how to use the planner, check common answers, and post a question that everyone can see.",
        submitSuccess: "Your question is now visible to everyone.",
        guides: {
          title: "How To Use This Website",
          step0: "Use the EN / 中文 button on the login page whenever you want to switch the sign-in flow between English and Chinese before entering the app.",
          step1: "Use Today to add, edit, complete, or move tasks for the current day. Task forms now start from a begin date and a repeat window.",
          step2: "Use Week and Month to review your schedule and jump between dates quickly.",
          step3: "Use Reminders for ongoing notes that should stay visible until you mark them done.",
          step4: "On phones, use the bottom navigation to switch between planner sections, while larger screens keep the sidebar visible.",
          step5: "Task, Reminder, and repeat-option forms open full-screen on mobile for easier editing, and stay centered as dialogs on larger screens."
        },
        faq: {
          title: "Common Q&A",
          q1: {
            question: "How does repeat work for tasks?",
            answer: "Each task starts with a begin date and a repeat setting. You can keep it as Once, or repeat it daily, weekly, monthly, or yearly with interval and end-date controls."
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
            answer: "All signed-in users can see the shared question list, and new questions appear there after submission."
          },
          q5: {
            question: "How does clicking in Week view work?",
            answer: "Click a day header to jump to that date in Today, click an empty spot so the next new task uses that date by default, and on mobile keep swiping through 4-day then 3-day week pages across each week."
          },
          q6: {
            question: "How does the layout change on mobile devices?",
            answer: "The planner switches to a bottom navigation layout, narrows typography, uses a swipeable Week view that rolls from 4 days to 3 days and into the next week, and expands Task and Reminder forms to full-screen for easier touch use."
          },
          q7: {
            question: "What happens if a save request fails?",
            answer: "The app reloads tasks or reminders from the server after a failed save so unsaved local changes do not replace your stored data."
          },
          q8: {
            question: "Can I change the language before logging in?",
            answer: "Yes. Use the EN / 中文 button on the login page to switch the authentication screen before you sign in or register."
          },
          q9: {
            question: "What happens when I edit one repeating task occurrence?",
            answer: "After you save changes to a repeating task, the app asks whether to update only that day or the entire series. Single-day edits are stored as occurrence overrides so the original series stays intact."
          }
        },
        ask: {
          title: "Ask A Question",
          field: "Your question",
          submit: "Send Question"
        },
        community: {
          title: "Shared Questions",
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
        save: "保存",
        add: "添加",
        edit: "编辑",
        moveToToday: "移到今天",
        moveOccurrenceToToday: "将本次移到今天",
        repeat: "重复",
        beginDate: "开始日期",
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
        markAllDone: "全部完成",
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
        todayButton: "今天"
      },
      month: {
        jumpToCurrentMonth: "跳到当前月份",
        moreTasks: "+{{count}} 个更多",
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
        subtitle: "了解如何使用这个计划工具、查看常见问答，并提交所有人都能看到的问题。",
        submitSuccess: "你的问题现在已经对所有人可见。",
        guides: {
          title: "网站使用说明",
          step0: "如果你想在登录前切换语言，可以先使用登录页上的 EN / 中文 按钮，在英文和中文之间切换认证界面。",
          step1: "在 Today 页面中添加、编辑、完成或移动当天任务。任务表单现在会先设置开始日期，再进入重复设置窗口。",
          step2: "在 Week 和 Month 页面快速查看整体安排并跳转日期。",
          step3: "使用 Reminders 记录持续存在、直到你手动完成的提醒事项。",
          step4: "在手机上可使用底部导航切换页面；在较大屏幕上会显示侧边栏导航。",
          step5: "Task、Reminder 和重复设置表单在手机上会全屏打开，较大屏幕上则保持居中弹窗。"
        },
        faq: {
          title: "常见问答",
          q1: {
            question: "任务的重复设置怎么用？",
            answer: "每个任务都会先设置开始日期，再选择重复方式。你可以保持为一次，也可以设置为每天、每周、每月或每年，并配置间隔和结束日期。"
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
            answer: "所有已登录用户都可以看到共享问题列表，新问题提交后会立即显示在那里。"
          },
          q5: {
            question: "Week 页面中的点击行为是什么？",
            answer: "点击某一天的日期标题会跳转到对应的 Today 页面；点击周历中的空白区域后，再新增任务时会默认带入该日期；在手机上还可以持续左右滑动，在每周的 4 天页与 3 天页之间切换并进入下一周。"
          },
          q6: {
            question: "移动设备上的布局会怎样变化？",
            answer: "应用会切换到底部导航、缩小排版字号，并让 Week 页面改为可持续左右滑动的布局，按每周先 4 天再 3 天的顺序切换，同时让 Task 与 Reminder 表单改为全屏显示，方便触控操作。"
          },
          q7: {
            question: "如果保存请求失败会怎样？",
            answer: "当保存失败时，应用会从服务器重新加载任务或提醒，避免未保存的本地变更覆盖你已经存储的数据。"
          },
          q8: {
            question: "我可以在登录前切换语言吗？",
            answer: "可以。使用登录页上的 EN / 中文 按钮，就能在登录或注册前先切换认证界面的语言。"
          },
          q9: {
            question: "修改重复任务的一天时会发生什么？",
            answer: "保存重复任务时，应用会让你选择只修改这一天，还是修改整个系列。只修改这一天时会记录为单次覆盖，不会破坏原来的系列。"
          }
        },
        ask: {
          title: "提交问题",
          field: "你的问题",
          submit: "发送问题"
        },
        community: {
          title: "共享问题",
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

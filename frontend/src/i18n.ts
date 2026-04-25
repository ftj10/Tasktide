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
        type: "Type",
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
          temporary: "Temporary",
          permanent: "Permanent"
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
          step1: "Use Today to add, edit, complete, or move tasks for the current day.",
          step2: "Use Week and Month to review your schedule and jump between dates quickly.",
          step3: "Use Reminders for ongoing notes that should stay visible until you mark them done.",
          step4: "On phones, use the bottom navigation to switch between planner sections, while larger screens keep the sidebar visible.",
          step5: "Task and Reminder forms open full-screen on mobile for easier editing, and stay centered as dialogs on larger screens."
        },
        faq: {
          title: "Common Q&A",
          q1: {
            question: "What is the difference between temporary and permanent tasks?",
            answer: "Temporary tasks belong to a specific date, while permanent tasks repeat on a weekday until you mark that occurrence done."
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
            answer: "Click a day header to jump to that date in Today, or click an empty spot in the week calendar so the next new task uses that date by default."
          },
          q6: {
            question: "How does the layout change on mobile devices?",
            answer: "The planner switches to a bottom navigation layout, narrows typography, and expands Task and Reminder forms to full-screen for easier touch use."
          },
          q7: {
            question: "What happens if a save request fails?",
            answer: "The app reloads tasks or reminders from the server after a failed save so unsaved local changes do not replace your stored data."
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
        repeatWeekly: "Repeat every week",
        oneTime: "One-time",
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
        type: "类型",
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
          temporary: "临时任务",
          permanent: "固定任务"
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
          step1: "在 Today 页面中添加、编辑、完成或移动当天任务。",
          step2: "在 Week 和 Month 页面快速查看整体安排并跳转日期。",
          step3: "使用 Reminders 记录持续存在、直到你手动完成的提醒事项。",
          step4: "在手机上可使用底部导航切换页面；在较大屏幕上会显示侧边栏导航。",
          step5: "Task 和 Reminder 表单在手机上会全屏打开，较大屏幕上则保持居中弹窗。"
        },
        faq: {
          title: "常见问答",
          q1: {
            question: "临时任务和固定任务有什么区别？",
            answer: "临时任务属于某一个具体日期，而固定任务会按星期重复，直到你将当天那次标记为完成。"
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
            answer: "点击某一天的日期标题会跳转到对应的 Today 页面；点击周历中的空白区域后，再新增任务时会默认带入该日期。"
          },
          q6: {
            question: "移动设备上的布局会怎样变化？",
            answer: "应用会切换到底部导航、缩小排版字号，并让 Task 与 Reminder 表单改为全屏显示，方便触控操作。"
          },
          q7: {
            question: "如果保存请求失败会怎样？",
            answer: "当保存失败时，应用会从服务器重新加载任务或提醒，避免未保存的本地变更覆盖你已经存储的数据。"
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
        repeatWeekly: "每周重复",
        oneTime: "一次性任务",
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

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
      dialog: {
        doneMessage: "Mark \"{{title}}\" as done?",
        deleteMessage: "Delete \"{{title}}\"?",
        allDoneMessage: "Mark all tasks for this day as done?",
        allDoneAction: "All done",
        addTaskTitle: "Add task",
        editTaskTitle: "Edit task",
        taskName: "Task name",
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
        title: "提醒",
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
      dialog: {
        doneMessage: "将“{{title}}”标记为完成？",
        deleteMessage: "删除“{{title}}”？",
        allDoneMessage: "将这一天的所有任务标记为完成？",
        allDoneAction: "全部完成",
        addTaskTitle: "添加任务",
        editTaskTitle: "编辑任务",
        taskName: "任务名称",
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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        reminders: "Reminders",
        today: "Today",
        week: "Week",
        month: "Month",
        logout: "Logout",
        hi: "Hi"
      },
      today: {
        allDay: "All-Day Tasks",
        scheduled: "Scheduled Tasks",
        noTasks: "No tasks scheduled for this date.",
        addTask: "Add Task",
        goToToday: "Go to Today",
        markAllDone: "Mark All Done"
      }
    }
  },
  zh: {
    translation: {
      nav: {
        reminders: "提醒",
        today: "今天",
        week: "周视图",
        month: "月视图",
        logout: "退出登录",
        hi: "你好"
      },
      today: {
        allDay: "全天任务",
        scheduled: "日程安排",
        noTasks: "当日没有安排任务。",
        addTask: "添加任务",
        goToToday: "回到今天",
        markAllDone: "全部完成"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
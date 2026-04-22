// INPUT: authenticated session state plus persisted tasks and reminders
// OUTPUT: Routed planner shell with navigation, release notes, and page-level task/reminder flows
// EFFECT: Coordinates login state, initial data hydration, autosave, localization, and browser notification features
import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import type { Task, Reminder } from "./types";
import { createReminder, createTask, deleteReminder, deleteTask, getToken, getUsername, loadReminders, loadTasks, logoutUser, rolloverIfNeeded, updateReminder, updateTask } from "./app/storage";
import { tasksForDate } from "./app/taskLogic";
import { loadCompletions } from "./app/completions";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";
import { LoginPage } from "./pages/LoginPage";
import { ReminderPage } from "./pages/ReminderPage";
import { MonthPage } from "./pages/MonthPage";
import { ReleaseNotesCenter } from "./components/ReleaseNotesCenter";
import { HelpPage } from "./pages/HelpPage";

export default function App() {
  const { t, i18n } = useTranslation();
  const username = getUsername() || "";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const remindersRef = useRef<Reminder[]>([]);
  const taskSyncQueue = useRef(Promise.resolve());
  const reminderSyncQueue = useRef(Promise.resolve());
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // INPUT: authenticated user session
    // OUTPUT: hydrated task and reminder state
    // EFFECT: Loads planner data from the backend, which owns stale-record cleanup
    async function fetchInitialData() {
      try {
        const [serverTasks, serverReminders] = await Promise.all([
          loadTasks(),
          loadReminders()
        ]);
        setTasks(rolloverIfNeeded(serverTasks));
        setReminders(serverReminders);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchInitialData();
  }, [isAuthenticated]);

  function queueTaskSync(prevTasks: Task[], nextTasks: Task[]) {
    const prevById = new Map(prevTasks.map((task) => [task.id, task]));
    const nextById = new Map(nextTasks.map((task) => [task.id, task]));

    const createdTasks = nextTasks.filter((task) => !prevById.has(task.id));
    const updatedTasks = nextTasks.filter((task) => {
      const previousTask = prevById.get(task.id);
      return previousTask && JSON.stringify(previousTask) !== JSON.stringify(task);
    });
    const deletedTaskIds = prevTasks.filter((task) => !nextById.has(task.id)).map((task) => task.id);

    taskSyncQueue.current = taskSyncQueue.current.then(async () => {
      await Promise.all([
        ...createdTasks.map((task) => createTask(task)),
        ...updatedTasks.map((task) => updateTask(task)),
        ...deletedTaskIds.map((taskId) => deleteTask(taskId)),
      ]);
    }).catch((error) => {
      console.error(error);
    });
  }

  function queueReminderSync(prevReminders: Reminder[], nextReminders: Reminder[]) {
    const prevById = new Map(prevReminders.map((reminder) => [reminder.id, reminder]));
    const nextById = new Map(nextReminders.map((reminder) => [reminder.id, reminder]));

    const createdReminders = nextReminders.filter((reminder) => !prevById.has(reminder.id));
    const updatedReminders = nextReminders.filter((reminder) => {
      const previousReminder = prevById.get(reminder.id);
      return previousReminder && JSON.stringify(previousReminder) !== JSON.stringify(reminder);
    });
    const deletedReminderIds = prevReminders.filter((reminder) => !nextById.has(reminder.id)).map((reminder) => reminder.id);

    reminderSyncQueue.current = reminderSyncQueue.current.then(async () => {
      await Promise.all([
        ...createdReminders.map((reminder) => createReminder(reminder)),
        ...updatedReminders.map((reminder) => updateReminder(reminder)),
        ...deletedReminderIds.map((reminderId) => deleteReminder(reminderId)),
      ]);
    }).catch((error) => {
      console.error(error);
    });
  }

  function handleSetTasks(nextTasks: Task[]) {
    const previousTasks = tasksRef.current;
    tasksRef.current = nextTasks;
    setTasks(nextTasks);
    queueTaskSync(previousTasks, nextTasks);
  }

  function handleSetReminders(nextReminders: Reminder[]) {
    const previousReminders = remindersRef.current;
    remindersRef.current = nextReminders;
    setReminders(nextReminders);
    queueReminderSync(previousReminders, nextReminders);
  }

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const intervalId = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      if ((hours === 10 || hours === 21) && minutes === 0) {
        const firedKey = `notified-${now.toDateString()}-${hours}`;
        
        if (!localStorage.getItem(firedKey)) {
          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(t("notifications.dailyReminderTitle"), {
              body: t("notifications.dailyReminderBody"),
              icon: "/todo.svg"
            });

            notification.onclick = () => {
              window.focus(); 
              notification.close();
            };

            localStorage.setItem(firedKey, "true"); 
          }
        }
      }

      const todayYmd = dayjs(now).format("YYYY-MM-DD");
      const currentCompletions = loadCompletions();
      const todayTasks = tasksForDate(tasksRef.current, todayYmd, currentCompletions);

      todayTasks.forEach(task => {
        if (task.startTime && !task.done) {
          const [startHour, startMinute] = task.startTime.split(':').map(Number);
          const taskTimeInMinutes = startHour * 60 + startMinute;
          const nowInMinutes = hours * 60 + minutes;

          if (taskTimeInMinutes - nowInMinutes === 15) {
            const firedKey = `task-notified-${task.id}-${todayYmd}`;
            
            if (!localStorage.getItem(firedKey)) {
              if ("Notification" in window && Notification.permission === "granted") {
                const notification = new Notification(t("notifications.taskStartingSoonTitle", { title: task.title }), {
                  body: t("notifications.taskStartingSoonBody", {
                    time: new Intl.DateTimeFormat(currentLanguage, {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(`2000-01-01T${task.startTime}`))
                  }),
                  icon: "/todo.svg"
                });
                
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
                
                localStorage.setItem(firedKey, "true");
              }
            }
          }
        }
      });

    }, 60000);

    return () => clearInterval(intervalId);
  }, [currentLanguage, t]);

  // INPUT: logout button click
  // OUTPUT: cleared in-memory planner state
  // EFFECT: Ends the current session and returns the app to the login feature
  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setTasks([]);
    setReminders([]);
    setIsLoaded(false);
  };

  function handleLanguageToggle() {
    void i18n.changeLanguage(currentLanguage === "en" ? "zh" : "en");
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      </Container>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">{t("app.loading")}</Typography>
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/reminders">
            {t("nav.reminders")}
          </Button>
          <Button color="inherit" component={Link} to="/">
            {t("nav.today")}
          </Button>
          <Button color="inherit" component={Link} to="/week">
            {t("nav.week")}
          </Button>
          <Button color="inherit" component={Link} to="/month">
            {t("nav.month")}
          </Button>
          <Button color="inherit" component={Link} to="/help">
            {t("nav.help")}
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          {username ? <ReleaseNotesCenter username={username} /> : null}
          <Button color="inherit" onClick={handleLanguageToggle} sx={{ mr: 1 }}>
            {currentLanguage === "en" ? "中文" : "EN"}
          </Button>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {t("nav.greeting", { name: username })}
          </Typography>
          <Button color="inherit" onClick={handleLogout} variant="outlined" size="small">
            {t("nav.logout")}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false}>
        <Box sx={{ py: 2 }}>
          <Routes>
            <Route path="/reminders" element={<ReminderPage reminders={reminders} setReminders={handleSetReminders} />} />
            <Route path="/" element={<TodayPage tasks={tasks} setTasks={handleSetTasks} />} />
            <Route path="/week" element={<WeekPage tasks={tasks} setTasks={handleSetTasks} completionsRev={0} />} />
            <Route path="/month" element={<MonthPage tasks={tasks} setTasks={handleSetTasks} />} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        </Box>
      </Container>
    </>
  );
}

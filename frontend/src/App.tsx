// INPUT: authenticated session state plus persisted tasks and reminders
// OUTPUT: Routed planner shell with navigation, release notes, and page-level task/reminder flows
// EFFECT: Coordinates login state, initial data hydration, autosave, localization, and browser notification features
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import type { Task, Reminder } from "./types";
import { createReminder, createTask, deleteReminder, deleteTask, getToken, getUsername, loadReminders, loadTasks, logoutUser, rolloverIfNeeded, updateReminder, updateTask } from "./app/storage";
import { tasksForDate } from "./app/taskLogic";
import { loadCompletions } from "./app/completions";
import { hasNotificationFired, pruneStoredNotificationHistory, recordNotificationFired } from "./app/notificationHistory";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";
import { LoginPage } from "./pages/LoginPage";
import { ReminderPage } from "./pages/ReminderPage";
import { MonthPage } from "./pages/MonthPage";
import { ReleaseNotesCenter } from "./components/ReleaseNotesCenter";
import { HelpPage } from "./pages/HelpPage";

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const username = getUsername() || "";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const remindersRef = useRef<Reminder[]>([]);
  const taskSyncQueue = useRef(Promise.resolve());
  const reminderSyncQueue = useRef(Promise.resolve());
  const lastNotificationCheckRef = useRef<number | null>(null);
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const mobileNavZIndex = 1700;

  async function reloadTasksFromServer() {
    const serverTasks = rolloverIfNeeded(await loadTasks());
    tasksRef.current = serverTasks;
    setTasks(serverTasks);
  }

  async function reloadRemindersFromServer() {
    const serverReminders = await loadReminders();
    remindersRef.current = serverReminders;
    setReminders(serverReminders);
  }

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
        const [serverTasks, serverReminders] = await Promise.all([loadTasks(), loadReminders()]);
        const nextTasks = rolloverIfNeeded(serverTasks);
        tasksRef.current = nextTasks;
        remindersRef.current = serverReminders;
        setTasks(nextTasks);
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
      void reloadTasksFromServer().catch((reloadError) => {
        console.error(reloadError);
      });
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
      void reloadRemindersFromServer().catch((reloadError) => {
        console.error(reloadError);
      });
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
    if (!("Notification" in window) || Notification.permission !== "default") {
      return;
    }

    const requestPermission = () => {
      void Notification.requestPermission();
      window.removeEventListener("pointerdown", requestPermission);
      window.removeEventListener("keydown", requestPermission);
    };

    window.addEventListener("pointerdown", requestPermission, { once: true });
    window.addEventListener("keydown", requestPermission, { once: true });

    return () => {
      window.removeEventListener("pointerdown", requestPermission);
      window.removeEventListener("keydown", requestPermission);
    };
  }, []);

  useEffect(() => {
    function maybeShowNotification(title: string, body: string, firedKey: string, now: Date) {
      if (!("Notification" in window) || Notification.permission !== "granted" || hasNotificationFired(firedKey, now)) {
        return;
      }

      const notification = new Notification(title, {
        body,
        icon: "/todo.svg"
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      recordNotificationFired(firedKey, now);
    }

    function checkNotifications() {
      const now = new Date();
      const nowTime = now.getTime();
      const previousCheckTime = lastNotificationCheckRef.current ?? (nowTime - 60 * 1000);
      const windowStart = Math.min(previousCheckTime, nowTime);
      lastNotificationCheckRef.current = nowTime;

      pruneStoredNotificationHistory(now);

      [10, 21].forEach((hour) => {
        const scheduledTime = dayjs(now).hour(hour).minute(0).second(0).millisecond(0).valueOf();

        if (scheduledTime > windowStart && scheduledTime <= nowTime) {
          maybeShowNotification(
            t("notifications.dailyReminderTitle"),
            t("notifications.dailyReminderBody"),
            `daily:${dayjs(now).format("YYYY-MM-DD")}:${hour}`,
            now,
          );
        }
      });

      const todayYmd = dayjs(now).format("YYYY-MM-DD");
      const currentCompletions = loadCompletions();
      const todayTasks = tasksForDate(tasksRef.current, todayYmd, currentCompletions);

      todayTasks.forEach((task) => {
        if (!task.startTime || task.done) {
          return;
        }

        const [startHour, startMinute] = task.startTime.split(":").map(Number);
        const reminderTime = dayjs(now)
          .hour(startHour)
          .minute(startMinute)
          .second(0)
          .millisecond(0)
          .subtract(15, "minute")
          .valueOf();

        if (reminderTime > windowStart && reminderTime <= nowTime) {
          maybeShowNotification(
            t("notifications.taskStartingSoonTitle", { title: task.title }),
            t("notifications.taskStartingSoonBody", {
              time: new Intl.DateTimeFormat(currentLanguage, {
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(`2000-01-01T${task.startTime}`))
            }),
            `task:${task.id}:${todayYmd}`,
            now,
          );
          }
      });
    }

    checkNotifications();

    const intervalId = setInterval(checkNotifications, 60000);

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

  const navigationItems = [
    { to: "/reminders", label: t("nav.reminders"), icon: <NotificationsActiveOutlinedIcon /> },
    { to: "/", label: t("nav.today"), icon: <TodayOutlinedIcon /> },
    { to: "/week", label: t("nav.week"), icon: <ViewWeekOutlinedIcon /> },
    { to: "/month", label: t("nav.month"), icon: <CalendarMonthOutlinedIcon /> },
    { to: "/help", label: t("nav.help"), icon: <HelpOutlineIcon /> },
  ];

  const activePath = navigationItems.some((item) => item.to === location.pathname) ? location.pathname : "/";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar position="sticky" sx={{ display: { xs: "flex", md: "none" } }}>
        <Toolbar sx={{ minHeight: 64, px: 2, gap: 1.5 }}>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
              Weekly To-Do
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.75rem", opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {t("nav.greeting", { name: username })}
            </Typography>
          </Box>
          {username ? <ReleaseNotesCenter username={username} /> : null}
          <Button color="inherit" onClick={handleLanguageToggle} sx={{ minWidth: 52, px: 1 }}>
            {currentLanguage === "en" ? "中文" : "EN"}
          </Button>
          <Button color="inherit" onClick={handleLogout} sx={{ minWidth: 0, px: 1 }}>
            {t("nav.logout")}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ width: "100%", px: { xs: 0, sm: 2, lg: 3 }, py: { xs: 0, md: 3 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
            gap: { xs: 0, md: 3 },
            alignItems: "start",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", md: "block" },
              position: "sticky",
              top: 24,
              borderRadius: 3,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Weekly To-Do
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("nav.greeting", { name: username })}
                </Typography>
              </Box>

              <Stack spacing={1}>
                {navigationItems.map((item) => (
                  <Button
                    key={item.to}
                    component={Link}
                    to={item.to}
                    variant={activePath === item.to ? "contained" : "text"}
                    color={activePath === item.to ? "primary" : "inherit"}
                    startIcon={item.icon}
                    sx={{ justifyContent: "flex-start", py: 1.1, borderRadius: 2 }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>

              <Stack spacing={1}>
                {username ? <ReleaseNotesCenter username={username} /> : null}
                <Button variant="outlined" onClick={handleLanguageToggle}>
                  {currentLanguage === "en" ? "中文" : "EN"}
                </Button>
                <Button variant="outlined" color="inherit" onClick={handleLogout}>
                  {t("nav.logout")}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Box sx={{ width: "100%", minWidth: 0, pb: { xs: 12, md: 0 } }}>
            <Container maxWidth={false} disableGutters>
              <Box sx={{ py: { xs: 2, md: 0 } }}>
                <Routes>
                  <Route path="/reminders" element={<ReminderPage reminders={reminders} setReminders={handleSetReminders} />} />
                  <Route path="/" element={<TodayPage tasks={tasks} setTasks={handleSetTasks} />} />
                  <Route path="/week" element={<WeekPage tasks={tasks} setTasks={handleSetTasks} completionsRev={0} />} />
                  <Route path="/month" element={<MonthPage tasks={tasks} setTasks={handleSetTasks} />} />
                  <Route path="/help" element={<HelpPage />} />
                </Routes>
              </Box>
            </Container>
          </Box>
        </Box>
      </Box>

      <Paper
        elevation={8}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: mobileNavZIndex,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        <BottomNavigation
          showLabels
          value={activePath}
          aria-label={t("nav.mobileNavigation")}
          sx={{
            position: "relative",
            zIndex: mobileNavZIndex,
            pointerEvents: "auto",
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.to}
              component={Link}
              to={item.to}
              value={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

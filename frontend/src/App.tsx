// INPUT: authenticated session state plus persisted tasks and reminders
// OUTPUT: Routed planner shell with navigation, release notes, and page-level task/reminder flows
// EFFECT: Coordinates login state, initial data hydration, autosave, localization, and browser notification features
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  Alert,
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { lazy, Suspense, useCallback, useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

import type { Task, Reminder } from "./types";
import {
  createReminder,
  createTask,
  deleteReminder,
  deleteTask,
  flushPendingTaskSync,
  getUsername,
  loadSession,
  loadReminders,
  loadTasks,
  logoutUser,
  rolloverIfNeeded,
  saveCachedTasks,
  updateReminder,
  updateTask,
} from "./app/storage";
import { tasksForDate } from "./app/taskLogic";
import {
  hasNotificationFired,
  pruneStoredNotificationHistory,
  recordNotificationFired,
} from "./app/notificationHistory";
import {
  disablePushNotifications,
  supportsPushNotifications,
  syncPushSubscription,
} from "./app/pushNotifications";
import { areTasksEqual } from "./app/tasks";

import { ChunkErrorBoundary } from "./components/ChunkErrorBoundary";
import { TodayPage } from "./pages/TodayPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingTooltip } from "./components/OnboardingTooltip";
import { getOnboardingSteps, ONBOARDING_STORAGE_KEY } from "./app/helpCenter";

const ReminderPage = lazy(() =>
  import("./pages/ReminderPage").then((module) => ({ default: module.ReminderPage }))
);
const WeekPage = lazy(() =>
  import("./pages/WeekPage").then((module) => ({ default: module.WeekPage }))
);
const MonthPage = lazy(() =>
  import("./pages/MonthPage").then((module) => ({ default: module.MonthPage }))
);
const HelpPage = lazy(() =>
  import("./pages/HelpPage").then((module) => ({ default: module.HelpPage }))
);
const StatsPage = lazy(() =>
  import("./pages/StatsPage").then((module) => ({ default: module.StatsPage }))
);
const ReleaseNotesCenter = lazy(() =>
  import("./components/ReleaseNotesCenter").then((module) => ({ default: module.ReleaseNotesCenter }))
);
const SyllabusImportDialog = lazy(() =>
  import("./pages/SyllabusImportDialog").then((module) => ({ default: module.SyllabusImportDialog }))
);

function areRemindersEqual(source: Reminder, target: Reminder) {
  return (
    source.id === target.id &&
    source.title === target.title &&
    source.content === target.content &&
    source.emergency === target.emergency &&
    source.done === target.done &&
    source.createdAt === target.createdAt &&
    source.updatedAt === target.updatedAt
  );
}

function PageLoadingFallback() {
  const { t } = useTranslation();

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
      <Avatar
        sx={{
          width: 44,
          height: 44,
          background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
          boxShadow: "0 10px 24px rgba(79, 70, 229, 0.24)",
        }}
      >
        <TaskAltRoundedIcon fontSize="small" />
      </Avatar>
      <Typography variant="body1" color="text.secondary">
        {t("app.loading")}
      </Typography>
    </Stack>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const username = getUsername() || "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [syllabusImportOpen, setSyllabusImportOpen] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const remindersRef = useRef<Reminder[]>([]);
  const taskSyncQueue = useRef(Promise.resolve());
  const reminderSyncQueue = useRef(Promise.resolve());
  const lastNotificationCheckRef = useRef<number | null>(null);
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const mobileNavZIndex = 1700;
  const [onboardingForceSignal, setOnboardingForceSignal] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  const showToast = useCallback(
    (message: string, severity: "success" | "error" | "info" | "warning" = "success") => {
      setToast({ open: true, message, severity });
    },
    [setToast]
  );
  const canUseBackgroundPush = supportsPushNotifications();
  const onboardingSteps = getOnboardingSteps(t);
  const shouldSuppressReleaseNotes = !localStorage.getItem(ONBOARDING_STORAGE_KEY);

  useEffect(() => {
    if (location.pathname === "/week") {
      setOnboardingForceSignal("open-week-page");
    } else if (location.pathname === "/help") {
      setOnboardingForceSignal("open-help-center");
    } else {
      setOnboardingForceSignal(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const session = await loadSession();
      if (cancelled) return;
      setIsAuthenticated(Boolean(session));
      setAuthResolved(true);
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

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

    async function fetchInitialData() {
      try {
        const [serverTasks, serverReminders] = await Promise.all([
          loadTasks(),
          loadReminders(),
        ]);
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
      return previousTask && !areTasksEqual(previousTask, task);
    });
    const deletedTaskIds = prevTasks
      .filter((task) => !nextById.has(task.id))
      .map((task) => task.id);

    taskSyncQueue.current = taskSyncQueue.current
      .then(async () => {
        await Promise.all([
          ...createdTasks.map((task) => createTask(task)),
          ...updatedTasks.map((task) => updateTask(task, prevById.get(task.id))),
          ...deletedTaskIds.map((taskId) => deleteTask(taskId, prevById.get(taskId))),
        ]);
      })
      .catch((error) => {
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
      return previousReminder && !areRemindersEqual(previousReminder, reminder);
    });
    const deletedReminderIds = prevReminders
      .filter((reminder) => !nextById.has(reminder.id))
      .map((reminder) => reminder.id);

    reminderSyncQueue.current = reminderSyncQueue.current
      .then(async () => {
        await Promise.all([
          ...createdReminders.map((reminder) => createReminder(reminder)),
          ...updatedReminders.map((reminder) => updateReminder(reminder)),
          ...deletedReminderIds.map((reminderId) => deleteReminder(reminderId)),
        ]);
      })
      .catch((error) => {
        console.error(error);
        void reloadRemindersFromServer().catch((reloadError) => {
          console.error(reloadError);
        });
      });
  }

  function handleSetTasks(nextTasks: Task[]) {
    const previousTasks = tasksRef.current;
    tasksRef.current = nextTasks;
    saveCachedTasks(nextTasks);
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
    if (!isAuthenticated) return;

    function syncOfflineTaskChanges() {
      void flushPendingTaskSync()
        .then(() => reloadTasksFromServer())
        .catch((error) => {
          console.error(error);
        });
    }

    window.addEventListener("online", syncOfflineTaskChanges);

    return () => {
      window.removeEventListener("online", syncOfflineTaskChanges);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !canUseBackgroundPush || Notification.permission !== "granted") {
      return;
    }

    void syncPushSubscription(currentLanguage).catch((error) => {
      console.error(error);
    });
  }, [canUseBackgroundPush, currentLanguage, isAuthenticated]);

  useEffect(() => {
    if (canUseBackgroundPush) {
      return;
    }

    function maybeShowNotification(title: string, body: string, firedKey: string, now: Date) {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted" ||
        hasNotificationFired(firedKey, now)
      ) {
        return;
      }

      const notification = new Notification(title, {
        body,
        icon: "/tasktide.svg",
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
      const previousCheckTime = lastNotificationCheckRef.current ?? nowTime - 60 * 1000;
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
            now
          );
        }
      });

      const todayYmd = dayjs(now).format("YYYY-MM-DD");
      const todayTasks = tasksForDate(tasksRef.current, todayYmd);

      todayTasks.forEach((task) => {
        if (!task.startTime) {
          return;
        }

        if (task.recurrence?.frequency === "NONE" && task.beginDate !== todayYmd) {
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
              }).format(new Date(`2000-01-01T${task.startTime}`)),
            }),
            `task:${task.id}:${todayYmd}`,
            now
          );
        }
      });
    }

    checkNotifications();

    const intervalId = setInterval(checkNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [canUseBackgroundPush, currentLanguage, t]);

  const handleLogout = () => {
    void disablePushNotifications().catch((error) => {
      console.error(error);
    });
    void logoutUser();
    setIsAuthenticated(false);
    setTasks([]);
    setReminders([]);
    setIsLoaded(false);
  };

  function handleLanguageToggle() {
    void i18n.changeLanguage(currentLanguage === "en" ? "zh" : "en");
  }

  function handleTaskDialogVisibilityChange(open: boolean) {
    setTaskDialogOpen(open);
  }

  if (!authResolved) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
            boxShadow: "0 10px 30px rgba(79, 70, 229, 0.35)",
          }}
        >
          <TaskAltRoundedIcon />
        </Avatar>
        <Typography variant="h6" color="text.secondary">
          {t("app.loading")}
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <LoginPage onLoginSuccess={() => {
          setIsAuthenticated(true);
          setIsLoaded(false);
        }} />
      </Container>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
            boxShadow: "0 10px 30px rgba(79, 70, 229, 0.35)",
          }}
        >
          <TaskAltRoundedIcon />
        </Avatar>
        <Typography variant="h6" color="text.secondary">
          {t("app.loading")}
        </Typography>
      </Box>
    );
  }

  const navigationItems = [
    { to: "/reminders", label: t("nav.reminders"), icon: <NotificationsActiveOutlinedIcon />, id: "nav-reminders", dataOnboarding: undefined as string | undefined },
    { to: "/", label: t("nav.today"), icon: <TodayOutlinedIcon />, id: "nav-today", dataOnboarding: undefined as string | undefined },
    { to: "/week", label: t("nav.week"), icon: <ViewWeekOutlinedIcon />, id: "nav-week", dataOnboarding: "week-page-button" },
    { to: "/month", label: t("nav.month"), icon: <CalendarMonthOutlinedIcon />, id: "nav-month", dataOnboarding: undefined as string | undefined },
    { to: "/stats", label: t("nav.stats"), icon: <BarChartRoundedIcon />, id: "nav-stats", dataOnboarding: undefined as string | undefined },
    { to: "/help", label: t("nav.help"), icon: <HelpOutlineIcon />, id: "nav-help", dataOnboarding: "help-center-button" },
  ];

  const activePath = navigationItems.some((item) => item.to === location.pathname)
    ? location.pathname
    : "/";

  const userInitial = (username || "?").trim().charAt(0).toUpperCase();

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky" sx={{ display: { xs: "flex", md: "none" } }}>
        <Toolbar sx={{ minHeight: 64, px: 2, gap: 1 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {userInitial}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
              TaskTide
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.75rem",
                opacity: 0.9,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {t("nav.greeting", { name: username })}
            </Typography>
          </Box>
          {username ? (
            <Suspense fallback={null}>
              <ReleaseNotesCenter username={username} suppressAutoOpen={shouldSuppressReleaseNotes} />
            </Suspense>
          ) : null}
          <Tooltip title={t("nav.switchLanguage")} placement="bottom">
            <IconButton id="language-switch-mobile" data-onboarding="language-switch-button" color="inherit" onClick={handleLanguageToggle} size="small">
              <LanguageRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("syllabus.importButton")} placement="bottom">
            <IconButton id="import-syllabus-mobile" color="inherit" onClick={() => setSyllabusImportOpen(true)} size="small">
              <MenuBookRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("nav.installApp")} placement="bottom">
            <IconButton id="install-web-app-mobile" data-onboarding="download-app-button" component={Link} to="/help?topic=open-web-app-pc" color="inherit" size="small">
              <DownloadRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("nav.logout")} placement="bottom">
            <IconButton color="inherit" onClick={handleLogout} size="small">
              <LogoutRoundedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ width: "100%", px: { xs: 0, sm: 2, lg: 3 }, py: { xs: 0, md: 3 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1240,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "260px minmax(0, 1fr)" },
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
              borderRadius: 4,
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))",
              backdropFilter: "blur(10px)",
              boxShadow: "0 12px 40px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                    boxShadow: "0 10px 24px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  <TaskAltRoundedIcon fontSize="small" />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                    TaskTide
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t("nav.greeting", { name: username })}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={0.5}>
                {navigationItems.map((item) => {
                  const isActive = activePath === item.to;
                  return (
                    <Button
                      key={item.to}
                      id={`${item.id}-desktop`}
                      data-onboarding={item.dataOnboarding}
                      component={Link}
                      to={item.to}
                      startIcon={item.icon}
                      disableElevation
                      sx={{
                        justifyContent: "flex-start",
                        py: 1.15,
                        px: 1.5,
                        borderRadius: 2.5,
                        fontWeight: 600,
                        color: isActive ? "primary.main" : "text.primary",
                        background: isActive
                          ? (theme) =>
                              `linear-gradient(135deg, ${alpha(
                                theme.palette.primary.main,
                                0.12
                              )}, ${alpha(theme.palette.secondary.main, 0.1)})`
                          : "transparent",
                        border: "1px solid",
                        borderColor: isActive ? alpha("#4f46e5", 0.25) : "transparent",
                        "&:hover": {
                          background: isActive
                            ? (theme) =>
                                `linear-gradient(135deg, ${alpha(
                                  theme.palette.primary.main,
                                  0.18
                                )}, ${alpha(theme.palette.secondary.main, 0.14)})`
                            : "rgba(15, 23, 42, 0.04)",
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>

              <Box sx={{ height: 1, bgcolor: "divider" }} />

              <Stack spacing={1}>
                <Button
                  id="import-syllabus-desktop"
                  variant="outlined"
                  startIcon={<MenuBookRoundedIcon />}
                  onClick={() => setSyllabusImportOpen(true)}
                  sx={{ borderRadius: 2.5 }}
                >
                  {t("syllabus.importButton")}
                </Button>
                {username ? (
                  <Suspense fallback={null}>
                    <ReleaseNotesCenter username={username} suppressAutoOpen={shouldSuppressReleaseNotes} />
                  </Suspense>
                ) : null}
                <Button
                  id="install-web-app-desktop"
                  data-onboarding="download-app-button"
                  component={Link}
                  to="/help?topic=open-web-app-pc"
                  variant="outlined"
                  startIcon={<DownloadRoundedIcon />}
                  sx={{ borderRadius: 2.5 }}
                >
                  {t("nav.installApp")}
                </Button>
                <Tooltip title={t("nav.switchLanguage")}>
                  <Button
                    id="language-switch-desktop"
                    data-onboarding="language-switch-button"
                    variant="outlined"
                    startIcon={<LanguageRoundedIcon />}
                    onClick={handleLanguageToggle}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {currentLanguage === "en" ? "中文" : "English"}
                  </Button>
                </Tooltip>
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={handleLogout}
                  sx={{ borderRadius: 2.5, color: "text.secondary" }}
                >
                  {t("nav.logout")}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Box sx={{ width: "100%", minWidth: 0, pb: { xs: taskDialogOpen ? 0 : 12, md: 0 } }}>
            <Container maxWidth={false} disableGutters>
              <Box sx={{ py: { xs: 2, md: 0 } }}>
                <ChunkErrorBoundary resetKey={location.pathname}>
                  <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route
                      path="/reminders"
                      element={
                        <ReminderPage reminders={reminders} setReminders={handleSetReminders} showToast={showToast} />
                      }
                    />
                    <Route
                      path="/"
                      element={
                        <TodayPage
                          tasks={tasks}
                          setTasks={handleSetTasks}
                          onTaskDialogVisibilityChange={handleTaskDialogVisibilityChange}
                          showToast={showToast}
                          reloadTasks={reloadTasksFromServer}
                        />
                      }
                    />
                    <Route
                      path="/week"
                      element={
                        <WeekPage
                          tasks={tasks}
                          setTasks={handleSetTasks}
                          onTaskDialogVisibilityChange={handleTaskDialogVisibilityChange}
                          showToast={showToast}
                          reloadTasks={reloadTasksFromServer}
                        />
                      }
                    />
                    <Route
                      path="/month"
                      element={<MonthPage tasks={tasks} />}
                    />
                    <Route path="/stats" element={<StatsPage tasks={tasks} />} />
                    <Route path="/help" element={<HelpPage />} />
                  </Routes>
                  </Suspense>
                </ChunkErrorBoundary>
              </Box>
            </Container>
          </Box>
        </Box>
      </Box>

      <Paper
        className="mobile-bottom-navigation"
        style={taskDialogOpen ? { display: "none" } : undefined}
        elevation={8}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: mobileNavZIndex,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          pointerEvents: "auto",
          boxShadow: "0 -10px 30px rgba(15, 23, 42, 0.12)",
        }}
      >
        <BottomNavigation
          className="mobile-bottom-navigation-bar"
          showLabels
          value={activePath}
          aria-label={t("nav.mobileNavigation")}
          sx={{
            position: "relative",
            zIndex: mobileNavZIndex,
            pointerEvents: "auto",
            height: 68,
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.to}
              id={`${item.id}-mobile`}
              data-onboarding={item.dataOnboarding}
              component={Link}
              to={item.to}
              value={item.to}
              label={item.label}
              icon={item.icon}
              sx={{
                "&.Mui-selected": {
                  "& .MuiBottomNavigationAction-label": { fontWeight: 700 },
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
      <OnboardingTooltip steps={onboardingSteps} storageKey={ONBOARDING_STORAGE_KEY} forceAdvanceSignal={onboardingForceSignal} />
      <Suspense fallback={null}>
        <SyllabusImportDialog
          open={syllabusImportOpen}
          onClose={() => setSyllabusImportOpen(false)}
          onImportSuccess={() => void reloadTasksFromServer()}
          showToast={showToast}
        />
      </Suspense>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: { xs: 9, md: 2 } }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%", borderRadius: 2.5, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.14)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";

import type { Task, Reminder } from "./types";
import { loadTasks, rolloverIfNeeded, saveTasks, getToken, logoutUser, getUsername, loadReminders, saveReminders } from "./app/storage";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";
import { LoginPage } from "./pages/LoginPage";
import { ReminderPage } from "./pages/ReminderPage";
import { MonthPage } from "./pages/MonthPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFetchSuccessful, setIsFetchSuccessful] = useState(false);
  const isFirstTaskLoad = useRef(true);
  const isFirstReminderLoad = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchInitialData() {
      try {
        const [serverTasks, serverReminders] = await Promise.all([
          loadTasks(),
          loadReminders()
        ]);
        
        const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        
        const cleanedTasks = serverTasks.filter((task: Task) => {
          if (task.date) return task.date >= thirtyDaysAgo;
          return true; 
        });

        const cleanedReminders = serverReminders.filter((r: Reminder) => {
          if (r.done && r.updatedAt) {
             const doneDate = dayjs(r.updatedAt).format('YYYY-MM-DD');
             return doneDate >= thirtyDaysAgo;
          }
          return true;
        });

        setTasks(rolloverIfNeeded(cleanedTasks));
        setReminders(cleanedReminders);
        
        setIsFetchSuccessful(true); 
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchInitialData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isFetchSuccessful || !isAuthenticated) return;
    
    if (isFirstTaskLoad.current) {
      isFirstTaskLoad.current = false;
      return; 
    }

    saveTasks(tasks);
  }, [tasks, isFetchSuccessful, isAuthenticated]);

  useEffect(() => {
    if (!isFetchSuccessful || !isAuthenticated) return;

    if (isFirstReminderLoad.current) {
      isFirstReminderLoad.current = false;
      return;
    }

    saveReminders(reminders);
  }, [reminders, isFetchSuccessful, isAuthenticated]);

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
        if (localStorage.getItem(firedKey)) return; 

        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification("Daily Reminder", {
            body: "Don't forget your tasks for today.",
            icon: "/todo.svg"
          });

          notification.onclick = () => {
            window.focus(); 
            notification.close();
          };

          localStorage.setItem(firedKey, "true"); 
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setTasks([]);
    setReminders([]);
    setIsLoaded(false);
    setIsFetchSuccessful(false);
    isFirstTaskLoad.current = true;
    isFirstReminderLoad.current = true;
  };

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
        <Typography variant="h6">Loading your data...</Typography>
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/reminders">
            Reminders
          </Button>
          <Button color="inherit" component={Link} to="/">
            Today
          </Button>
          <Button color="inherit" component={Link} to="/week">
            Week
          </Button>
          <Button color="inherit" component={Link} to="/month">
            Month
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            Hi, {getUsername()}!
          </Typography>
          <Button color="inherit" onClick={handleLogout} variant="outlined" size="small">
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false}>
        <Box sx={{ py: 2 }}>
          <Routes>
            <Route path="/reminders" element={<ReminderPage reminders={reminders} setReminders={setReminders} />} />
            <Route path="/" element={<TodayPage tasks={tasks} setTasks={setTasks} />} />
            <Route path="/week" element={<WeekPage tasks={tasks} setTasks={setTasks} completionsRev={0} />} />
            <Route path="/month" element={<MonthPage tasks={tasks} setTasks={setTasks} />} />
          </Routes>
        </Box>
      </Container>
    </>
  );
}
import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import type { Task, Reminder } from "./types"; // <-- Import Reminder
import { loadTasks, rolloverIfNeeded, saveTasks, getToken, logoutUser, getUsername, loadReminders, saveReminders } from "./app/storage";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";
import { LoginPage } from "./pages/LoginPage";
import { ReminderPage } from "./pages/ReminderDialog";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  
  // State for both lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchInitialData() {
      try {
        const [serverTasks, serverReminders] = await Promise.all([
          loadTasks(),
          loadReminders()
        ]);
        
        const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        
        // 1. Clean Tasks
        const cleanedTasks = serverTasks.filter((task: Task) => {
          if (task.date) return task.date >= thirtyDaysAgo;
          return true; 
        });

        // 2. Clean Reminders (Delete if marked 'done' over 30 days ago)
        const cleanedReminders = serverReminders.filter((r: Reminder) => {
          if (r.done && r.updatedAt) {
             const doneDate = dayjs(r.updatedAt).format('YYYY-MM-DD');
             return doneDate >= thirtyDaysAgo;
          }
          return true;
        });

        setTasks(rolloverIfNeeded(cleanedTasks));
        setReminders(cleanedReminders);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setIsLoaded(true);
      }
    }

    fetchInitialData();
  }, [isAuthenticated]);

  // Save changes to server
  useEffect(() => {
    if (isLoaded && isAuthenticated) saveTasks(tasks);
  }, [tasks, isLoaded, isAuthenticated]);

  useEffect(() => {
    if (isLoaded && isAuthenticated) saveReminders(reminders);
  }, [reminders, isLoaded, isAuthenticated]);

  // --- DAILY NOTIFICATIONS ---
  useEffect(() => {
    // Ask the user for permission to send notifications
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Set up a timer to check the clock every 60 seconds
    const intervalId = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Check if it is EXACTLY 10:00 AM (10) or 9:00 PM (21)
      if (hours === 14 && minutes === 5) {
        
        // We use localStorage to ensure we only send ONE notification per hour,
        // otherwise it might trigger 60 times during that single minute!
        const firedKey = `notified-${now.toDateString()}-${hours}`;
        if (localStorage.getItem(firedKey)) return; 

        // Send the notification!
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification("Daily Reminder", {
            body: "Don't forget your tasks for today.",
            icon: "/todo.svg"
          });

          // 3. Make the tab jump to the front when clicked
          notification.onclick = () => {
            window.focus(); 
            notification.close();
          };

          // Mark this notification as sent so it doesn't repeat
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
          <Button color="inherit" component={Link} to="/">
            Reminders
          </Button>
          <Button color="inherit" component={Link} to="/today">
            Today
          </Button>
          <Button color="inherit" component={Link} to="/week">
            Week
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
            <Route path="/" element={<ReminderPage reminders={reminders} setReminders={setReminders} />} />
            <Route path="/today" element={<TodayPage tasks={tasks} setTasks={setTasks} />} />
            <Route path="/week" element={<WeekPage tasks={tasks} setTasks={setTasks} completionsRev={0} />} />
          </Routes>
        </Box>
      </Container>
    </>
  );
}
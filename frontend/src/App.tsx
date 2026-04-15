import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import type { Task } from "./types";
import { loadTasks, rolloverIfNeeded, saveTasks, getToken, logoutUser, getUsername } from "./app/storage";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";
import { LoginPage } from "./pages/LoginPage";
import { ReminderPage } from "./pages/ReminderPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tasks only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchInitialTasks() {
      try {
        const serverTasks = await loadTasks();
        
        // 30-Day Cleanup Filter
        const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        const cleanedTasks = serverTasks.filter(task => {
          if (task.date) return task.date >= thirtyDaysAgo;
          return true; 
        });

        const processedTasks = rolloverIfNeeded(cleanedTasks);
        setTasks(processedTasks);
      } catch (error) {
        console.error("Failed to fetch initial tasks", error);
      } finally {
        setIsLoaded(true);
      }
    }

    fetchInitialTasks();
  }, [isAuthenticated]);

  // Save tasks on change
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded, isAuthenticated]);

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setTasks([]);
    setIsLoaded(false);
  };

  // If not logged in, just show the Login Page
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      </Container>
    );
  }

  // Prevent rendering main app while downloading tasks
  if (!isLoaded) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading your tasks...</Typography>
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* Add Reminder as the first button pointing to / */}
          <Button color="inherit" component={Link} to="/">
            Reminders
          </Button>
          {/* Change Today to point to /today */}
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
            {/* Reminder is the home page now */}
            <Route path="/" element={< ReminderPage tasks={tasks} setTasks={setTasks} />} />
            {/* Today moves to /today */}
            <Route path="/today" element={<TodayPage tasks={tasks} setTasks={setTasks} />} />
            <Route path="/week" element={<WeekPage tasks={tasks} setTasks={setTasks} completionsRev={0} />} />
          </Routes>
        </Box>
      </Container>
    </>
  );
}
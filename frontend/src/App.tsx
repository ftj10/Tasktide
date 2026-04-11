import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import type { Task } from "./types";
import { loadTasks, rolloverIfNeeded, saveTasks } from "./app/storage";
import { COMPLETIONS_KEY } from "./app/completions";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";

import dayjs from "dayjs";

export default function App() {
  // 1. Initialize tasks as an empty array, and track if we are loading
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // bump this when completions change in another tab
  const [completionsRev, setCompletionsRev] = useState(0);

  // 2. Fetch tasks from the server when the app first loads
  // 2. Fetch tasks from the server when the app first loads
  useEffect(() => {
    async function fetchInitialTasks() {
      try {
        const serverTasks = await loadTasks();
        
        // --- NEW CLEANUP LOGIC ---
        // Calculate the date 30 days ago in YYYY-MM-DD format
        const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        
        // Keep tasks if they don't have a date (Habits/Weekly), 
        // OR if their date is strictly newer than 30 days ago.
        const cleanedTasks = serverTasks.filter(task => {
          if (task.date) {
            return task.date >= thirtyDaysAgo;
          }
          return true; 
        });
        // -------------------------

        const processedTasks = rolloverIfNeeded(cleanedTasks);
        setTasks(processedTasks);
      } catch (error) {
        console.error("Failed to fetch initial tasks", error);
      } finally {
        setIsLoaded(true); // Mark loading as finished!
      }
    }

    fetchInitialTasks();
  }, []);

  // 3. Save tasks to the server ONLY AFTER they have been initially loaded
  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  // 4. Listen for completion changes across tabs (Tasks sync removed as they are on the server now)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === COMPLETIONS_KEY) {
        setCompletionsRev((x) => x + 1);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Prevent rendering the app while tasks are downloading
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
          <Button color="inherit" component={Link} to="/">
            Today
          </Button>
          <Button color="inherit" component={Link} to="/week">
            Week
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false}>
        <Box sx={{ py: 2 }}>
          <Routes>
            <Route
              path="/"
              element={<TodayPage tasks={tasks} setTasks={setTasks} />}
            />
            <Route
              path="/week"
              element={
                <WeekPage
                  tasks={tasks}
                  setTasks={setTasks}
                  completionsRev={completionsRev}
                />
              }
            />
          </Routes>
        </Box>
      </Container>
    </>
  );
}
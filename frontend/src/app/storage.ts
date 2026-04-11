import type { Task } from "../types";
import dayjs from "dayjs";
import { weekStartMonday } from "./date";

// The tasks key is removed because we no longer save tasks to local storage
const WEEK_KEY = "weekly_todo_lastWeekStart_v1";

// This will use your Render URL when deployed, or localhost when running on your machine
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function loadTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to load tasks from server, falling back to empty array", error);
    return []; // Return empty array if server is down or unreachable
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
  } catch (error) {
    console.error("Failed to save tasks to server", error);
  }
}

export function rolloverIfNeeded(tasks: Task[]): Task[] {
  const now = dayjs();
  const currentWeekStart = weekStartMonday(now);

  // It is perfectly fine to leave WEEK_KEY in localStorage! 
  // It just tracks the last time this specific browser opened the app during a new week.
  const lastWeekStart = localStorage.getItem(WEEK_KEY);
  if (!lastWeekStart || lastWeekStart !== currentWeekStart) {
    localStorage.setItem(WEEK_KEY, currentWeekStart);
  }

  // No deletion
  return tasks;
}
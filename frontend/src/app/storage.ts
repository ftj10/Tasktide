import type { Task } from "../types";
import dayjs from "dayjs";
import { weekStartMonday } from "./date";

// The tasks key is removed because we no longer save tasks to local storage
const WEEK_KEY = "weekly_todo_lastWeekStart_v1";

// This will use your Render URL when deployed, or localhost when running on your machine
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Add a console log to prove exactly which URL the frontend is using
console.log("Current API Target:", API_URL);

export async function loadTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    
    if (!response.ok) {
      throw new Error(`Server responded with Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Data successfully received from backend:", data);
    return data;
    
  } catch (error: any) {
    console.error("Fetch failed:", error);
    // This alert will pop up on your screen and tell you EXACTLY why it failed!
    alert(`Failed to load tasks!\nAttempted URL: ${API_URL}/tasks\nError: ${error.message}`);
    return [];
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
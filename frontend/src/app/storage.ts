import type { Task } from "../types";
import dayjs from "dayjs";
import { weekStartMonday } from "./date";

const WEEK_KEY = "weekly_todo_lastWeekStart_v1";
const TOKEN_KEY = "todo_jwt_token";
const USERNAME_KEY = "todo_username";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- AUTHENTICATION HELPERS ---
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUsername() { return localStorage.getItem(USERNAME_KEY); }

export function setAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

// --- TASK FETCHING ---
export async function loadTasks(): Promise<Task[]> {
  const token = getToken();
  if (!token) return []; // Don't try to load if not logged in

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}` // Show our secure ticket!
      }
    });

    if (response.status === 401 || response.status === 403) {
      logoutUser(); // Token expired or invalid, log them out
      window.location.reload();
      return [];
    }

    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to load from server", error);
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const token = getToken();
  if (!token) return; 

  try {
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tasks),
    });
  } catch (error) {
    console.error("Failed to save tasks to server", error);
  }
}

export function rolloverIfNeeded(tasks: Task[]): Task[] {
  const now = dayjs();
  const currentWeekStart = weekStartMonday(now);

  const lastWeekStart = localStorage.getItem(WEEK_KEY);
  if (!lastWeekStart || lastWeekStart !== currentWeekStart) {
    localStorage.setItem(WEEK_KEY, currentWeekStart);
  }
  return tasks;
}
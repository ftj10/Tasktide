// INPUT: localStorage credentials and frontend payloads
// OUTPUT: auth helpers plus backend persistence functions for tasks, reminders, and help questions
// EFFECT: Connects browser state to the authenticated planner API and keeps week rollover metadata current
import type { HelpQuestion, Task } from "../types";
import dayjs from "dayjs";
import { weekStartMonday } from "./date";

const WEEK_KEY = "weekly_todo_lastWeekStart_v1";
const TOKEN_KEY = "todo_jwt_token";
const USERNAME_KEY = "todo_username";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:2676';

// INPUT: none
// OUTPUT: saved JWT token
// EFFECT: Supplies the auth feature with the current session token
export function getToken() { return localStorage.getItem(TOKEN_KEY); }

// INPUT: none
// OUTPUT: saved username
// EFFECT: Supplies the shell and release-notes features with the signed-in display name
export function getUsername() { return localStorage.getItem(USERNAME_KEY); }

// INPUT: backend login response fields
// OUTPUT: persisted auth keys
// EFFECT: Starts a signed-in browser session for the planner features
export function setAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

// INPUT: none
// OUTPUT: cleared auth keys
// EFFECT: Ends the browser session used by protected API features
export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

// INPUT: none
// OUTPUT: task list from the backend
// EFFECT: Hydrates the signed-in planner with the user's saved tasks
export async function loadTasks(): Promise<Task[]> {
  const token = getToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      logoutUser();
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

// INPUT: current task collection
// OUTPUT: persisted backend task snapshot
// EFFECT: Saves the latest task state for the signed-in user
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

// INPUT: none
// OUTPUT: reminder list from the backend
// EFFECT: Hydrates the reminder feature for the signed-in user
export async function loadReminders(): Promise<any[]> {
  const token = getToken();
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/reminders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to load reminders", error);
    return [];
  }
}

// INPUT: current reminder collection
// OUTPUT: persisted backend reminder snapshot
// EFFECT: Saves the latest reminder state for the signed-in user
export async function saveReminders(reminders: any[]): Promise<void> {
  const token = getToken();
  if (!token) return; 
  try {
    await fetch(`${API_URL}/reminders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reminders),
    });
  } catch (error) {
    console.error("Failed to save reminders", error);
  }
}

// INPUT: none
// OUTPUT: shared help-question list
// EFFECT: Loads the public help board visible to authenticated users
export async function loadHelpQuestions(): Promise<HelpQuestion[]> {
  const token = getToken();
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/help-questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to load help questions", error);
    return [];
  }
}

// INPUT: new help question payload
// OUTPUT: persisted help question record
// EFFECT: Publishes a signed-in user's question to the shared help board
export async function createHelpQuestion(question: { id: string; question: string; createdAt: string }): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    const response = await fetch(`${API_URL}/help-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to save help question", error);
  }
}

// INPUT: loaded task list
// OUTPUT: same task list with refreshed week marker
// EFFECT: Keeps the current week reference aligned with the recurrence feature
export function rolloverIfNeeded(tasks: Task[]): Task[] {
  const now = dayjs();
  const currentWeekStart = weekStartMonday(now);

  const lastWeekStart = localStorage.getItem(WEEK_KEY);
  if (!lastWeekStart || lastWeekStart !== currentWeekStart) {
    localStorage.setItem(WEEK_KEY, currentWeekStart);
  }
  return tasks;
}

// INPUT: localStorage credentials and frontend payloads
// OUTPUT: auth helpers plus backend persistence functions for tasks, reminders, and help questions
// EFFECT: Connects browser state to the authenticated planner API and keeps week rollover metadata current
import type { HelpQuestion, Reminder, Task } from "../types";
import dayjs from "dayjs";
import { weekStartMonday } from "./date";
import { normalizeTasks } from "./tasks";

const WEEK_KEY = "weekly_todo_lastWeekStart_v1";
const TOKEN_KEY = "todo_jwt_token";
const USERNAME_KEY = "todo_username";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:2676';

async function authorizedRequest(path: string, options: RequestInit = {}): Promise<Response | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    logoutUser();
    window.location.reload();
    return null;
  }

  return response;
}

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
  try {
    const response = await authorizedRequest('/tasks');
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
    return normalizeTasks(await response.json());
  } catch (error) {
    console.error("Failed to load from server", error);
    throw error;
  }
}

// INPUT: one task
// OUTPUT: persisted task record
// EFFECT: Creates a task via the task CRUD API
export async function createTask(task: Task): Promise<void> {
  try {
    const response = await authorizedRequest('/tasks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to create task", error);
    throw error;
  }
}

// INPUT: one task
// OUTPUT: updated task record
// EFFECT: Updates a task via the task CRUD API
export async function updateTask(task: Task): Promise<void> {
  try {
    const response = await authorizedRequest(`/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to update task", error);
    throw error;
  }
}

// INPUT: task id
// OUTPUT: delete completion
// EFFECT: Deletes a task via the task CRUD API
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const response = await authorizedRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to delete task", error);
    throw error;
  }
}

// INPUT: none
// OUTPUT: reminder list from the backend
// EFFECT: Hydrates the reminder feature for the signed-in user
export async function loadReminders(): Promise<Reminder[]> {
  try {
    const response = await authorizedRequest('/reminders');
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to load reminders", error);
    throw error;
  }
}

// INPUT: one reminder
// OUTPUT: persisted reminder record
// EFFECT: Creates a reminder via the reminder CRUD API
export async function createReminder(reminder: Reminder): Promise<void> {
  try {
    const response = await authorizedRequest('/reminders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reminder),
    });
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to create reminder", error);
    throw error;
  }
}

// INPUT: one reminder
// OUTPUT: updated reminder record
// EFFECT: Updates a reminder via the reminder CRUD API
export async function updateReminder(reminder: Reminder): Promise<void> {
  try {
    const response = await authorizedRequest(`/reminders/${reminder.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reminder),
    });
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to update reminder", error);
    throw error;
  }
}

// INPUT: reminder id
// OUTPUT: delete completion
// EFFECT: Deletes a reminder via the reminder CRUD API
export async function deleteReminder(reminderId: string): Promise<void> {
  try {
    const response = await authorizedRequest(`/reminders/${reminderId}`, {
      method: 'DELETE',
    });
    if (!response) throw new Error("Authorized request unavailable");
    if (!response.ok) throw new Error("Network response was not ok");
  } catch (error) {
    console.error("Failed to delete reminder", error);
    throw error;
  }
}

// INPUT: none
// OUTPUT: shared help-question list
// EFFECT: Loads the public help board visible to authenticated users
export async function loadHelpQuestions(): Promise<HelpQuestion[]> {
  try {
    const response = await authorizedRequest('/help-questions');
    if (!response) return [];
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
  try {
    const response = await authorizedRequest('/help-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(question),
    });
    if (!response) return;
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

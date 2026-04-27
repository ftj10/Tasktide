// INPUT: shared planner domain requirements
// OUTPUT: frontend task, reminder, and help-question types
// EFFECT: Defines the data contracts exchanged across pages, dialogs, storage helpers, and tests
export type TaskType = "PERMANENT" | "TEMPORARY" | "ONCE" | "RECURRING";
export type RepeatFrequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type AuthRole = "USER" | "ADMIN";

export type TaskRecurrence = {
  frequency: RepeatFrequency;
  interval?: number;
  weekdays?: number[];
  monthDays?: number[];
  until?: string | null;
};

export type TaskOccurrenceOverride = {
  title?: string;
  emergency?: number;
  location?: string;
  mapProvider?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};

export type Task = {
  id: string;
  title: string;
  type: TaskType;

  weekday?: number;
  date?: string;
  beginDate?: string;
  recurrence?: TaskRecurrence;
  occurrenceOverrides?: Record<string, TaskOccurrenceOverride>;
  emergency?: number;
  done?: boolean;

  createdAt: string;
  updatedAt: string;
  location?: string;
  mapProvider?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};
export type Reminder = {
  id: string;
  title: string;
  content: string;
  emergency: number;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HelpQuestion = {
  id: string;
  username: string;
  question: string;
  createdAt: string;
};

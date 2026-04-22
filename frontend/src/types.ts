// INPUT: shared planner domain requirements
// OUTPUT: frontend task, reminder, and help-question types
// EFFECT: Defines the data contracts exchanged across pages, dialogs, storage helpers, and tests
export type TaskType = "PERMANENT" | "TEMPORARY";
export type Task = {
  id: string;
  title: string;
  type: TaskType;

  weekday?: number;
  date?: string;
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

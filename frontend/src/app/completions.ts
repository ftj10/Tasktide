// INPUT: permanent-task ids and calendar dates
// OUTPUT: completion keys and localStorage helpers
// EFFECT: Persists per-date completion state for recurring tasks across planner views
export const COMPLETIONS_KEY = "weekly_todo_completions_v1";
export type CompletionMap = Record<string, true>;

// INPUT: task id and date
// OUTPUT: completion lookup key
// EFFECT: Creates the shared identifier used by recurring-task completion storage
export function completionKey(taskId: string, dateYmd: string) {
  return `${taskId}::${dateYmd}`;
}

// INPUT: none
// OUTPUT: saved completion map
// EFFECT: Hydrates recurring-task completion state from browser storage
export function loadCompletions(): CompletionMap {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    return raw ? (JSON.parse(raw) as CompletionMap) : {};
  } catch {
    return {};
  }
}

// INPUT: completion map
// OUTPUT: persisted completion map
// EFFECT: Saves recurring-task completion state for reuse across views
export function saveCompletions(map: CompletionMap) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(map));
}

// INPUT: completion map, task id, and date
// OUTPUT: completion status for that occurrence
// EFFECT: Lets planner views decide whether a recurring task should still render
export function isDoneForDate(map: CompletionMap, taskId: string, dateYmd: string) {
  return Boolean(map[completionKey(taskId, dateYmd)]);
}

// INPUT: completion map, task id, and date
// OUTPUT: updated completion map
// EFFECT: Marks one recurring-task occurrence as done
export function markDoneForDate(map: CompletionMap, taskId: string, dateYmd: string): CompletionMap {
  return { ...map, [completionKey(taskId, dateYmd)]: true };
}

// INPUT: completion map, task id, and date
// OUTPUT: updated completion map
// EFFECT: Reopens one recurring-task occurrence by removing its done marker
export function unmarkDoneForDate(map: CompletionMap, taskId: string, dateYmd: string): CompletionMap {
  const next = { ...map };
  delete next[completionKey(taskId, dateYmd)];
  return next;
}

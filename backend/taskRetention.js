// INPUT: task datasets plus retention scheduler options
// OUTPUT: retention cutoff helpers, cleanup routines, and a background scheduler
// EFFECT: Keeps completed task records recoverable for 30 days, then prunes expired task history
const Task = require('./models/Task');

const TASK_RETENTION_DAYS = 30;
const DEFAULT_TASK_RETENTION_INTERVAL_MS = 6 * 60 * 60 * 1000;

// INPUT: current execution time
// OUTPUT: retention cutoff date
// EFFECT: Produces the shared 30-day threshold used by task cleanup flows
function getTaskRetentionCutoff(now = new Date()) {
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - TASK_RETENTION_DAYS);
  return cutoffDate;
}

function normalizeOccurrenceOverrides(occurrenceOverrides) {
  if (occurrenceOverrides instanceof Map) {
    return Object.fromEntries(occurrenceOverrides.entries());
  }

  if (!occurrenceOverrides || typeof occurrenceOverrides !== 'object') {
    return {};
  }

  return { ...occurrenceOverrides };
}

function hasOverrideFields(override) {
  return Object.values(override).some((value) => value !== undefined && value !== null);
}

// INPUT: occurrence override map plus retention cutoff
// OUTPUT: pruned occurrence override map plus change flag
// EFFECT: Removes expired recurring-task completion markers while preserving non-completion overrides
function pruneExpiredOccurrenceCompletions(occurrenceOverrides, cutoffDate) {
  const sourceOverrides = normalizeOccurrenceOverrides(occurrenceOverrides);
  const nextOverrides = {};

  for (const [dateYmd, overrideValue] of Object.entries(sourceOverrides)) {
    const override = overrideValue && typeof overrideValue === 'object'
      ? { ...overrideValue }
      : {};

    if (override.completedAt) {
      const completedAtDate = new Date(override.completedAt);
      if (!Number.isNaN(completedAtDate.getTime()) && completedAtDate < cutoffDate) {
        delete override.completedAt;
      }
    }

    if (hasOverrideFields(override)) {
      nextOverrides[dateYmd] = override;
    }
  }

  return {
    occurrenceOverrides: nextOverrides,
    changed: JSON.stringify(sourceOverrides) !== JSON.stringify(nextOverrides),
  };
}

// INPUT: optional task-model and clock overrides
// OUTPUT: cleanup summary
// EFFECT: Deletes expired completed tasks and prunes expired recurring occurrence completion markers
async function cleanupTaskRetention({
  taskModel = Task,
  now = new Date(),
} = {}) {
  const executionDate = new Date(now);
  const cutoffDate = getTaskRetentionCutoff(executionDate);
  const deleteResult = await taskModel.deleteMany({
    completedAt: { $lt: cutoffDate },
  });

  const recurringTasks = await taskModel.find({
    occurrenceOverrides: { $exists: true, $ne: {} },
  });

  let updatedTaskCount = 0;

  for (const task of recurringTasks) {
    const { occurrenceOverrides, changed } = pruneExpiredOccurrenceCompletions(
      task.occurrenceOverrides,
      cutoffDate
    );

    if (!changed) {
      continue;
    }

    await taskModel.updateOne(
      { _id: task._id },
      {
        $set: {
          occurrenceOverrides,
          updatedAt: executionDate,
        },
      }
    );
    updatedTaskCount += 1;
  }

  return {
    deletedTaskCount: deleteResult?.deletedCount ?? 0,
    updatedTaskCount,
  };
}

// INPUT: cleanup runner, timer functions, and interval options
// OUTPUT: scheduler controller with stop method
// EFFECT: Runs retention cleanup in the background so expired task history is purged without user interaction
function startTaskRetentionScheduler({
  intervalMs = DEFAULT_TASK_RETENTION_INTERVAL_MS,
  runCleanup = cleanupTaskRetention,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  logger = console,
} = {}) {
  const runSafely = () => {
    void Promise.resolve(runCleanup()).catch((error) => {
      logger.error('Task retention cleanup failed:', error);
    });
  };

  runSafely();
  const timerId = setIntervalFn(runSafely, intervalMs);

  return {
    stop() {
      clearIntervalFn(timerId);
    },
  };
}

module.exports = {
  DEFAULT_TASK_RETENTION_INTERVAL_MS,
  TASK_RETENTION_DAYS,
  cleanupTaskRetention,
  getTaskRetentionCutoff,
  pruneExpiredOccurrenceCompletions,
  startTaskRetentionScheduler,
};

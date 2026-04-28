// INPUT: task-retention helpers plus mocked task-model methods
// OUTPUT: behavior coverage for soft-delete retention cleanup
// EFFECT: Verifies completed tasks expire after 30 days and recurring completion markers are pruned in the background
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_TASK_RETENTION_INTERVAL_MS,
  TASK_RETENTION_DAYS,
  cleanupTaskRetention,
  getTaskRetentionCutoff,
  pruneExpiredOccurrenceCompletions,
  startTaskRetentionScheduler,
} = require('../taskRetention');

test('behavior: getTaskRetentionCutoff returns a 30-day retention threshold', () => {
  const cutoffDate = getTaskRetentionCutoff(new Date('2026-04-27T12:00:00.000Z'));

  assert.equal(TASK_RETENTION_DAYS, 30);
  assert.equal(cutoffDate.toISOString(), '2026-03-28T12:00:00.000Z');
});

test('behavior: pruneExpiredOccurrenceCompletions removes only expired completion markers', () => {
  const cutoffDate = new Date('2026-03-28T12:00:00.000Z');

  const result = pruneExpiredOccurrenceCompletions({
    '2026-03-01': {
      completedAt: '2026-03-01T09:00:00.000Z',
    },
    '2026-03-05': {
      title: 'Edited title',
      completedAt: '2026-03-05T09:00:00.000Z',
    },
    '2026-04-20': {
      completedAt: '2026-04-20T09:00:00.000Z',
    },
  }, cutoffDate);

  assert.equal(result.changed, true);
  assert.deepEqual(result.occurrenceOverrides, {
    '2026-03-05': {
      title: 'Edited title',
    },
    '2026-04-20': {
      completedAt: '2026-04-20T09:00:00.000Z',
    },
  });
});

test('behavior: cleanupTaskRetention deletes expired completed tasks and updates recurring overrides', async () => {
  let deleteFilter;
  let updateFilter;
  let updatePayload;

  const taskModel = {
    deleteMany: async (filter) => {
      deleteFilter = filter;
      return { deletedCount: 2 };
    },
    find: async () => ([
      {
        _id: 'task-1',
        occurrenceOverrides: {
          '2026-03-01': {
            completedAt: '2026-03-01T09:00:00.000Z',
          },
          '2026-03-05': {
            title: 'Edited title',
            completedAt: '2026-03-05T09:00:00.000Z',
          },
          '2026-04-20': {
            completedAt: '2026-04-20T09:00:00.000Z',
          },
        },
      },
      {
        _id: 'task-2',
        occurrenceOverrides: {
          '2026-04-22': {
            completedAt: '2026-04-22T09:00:00.000Z',
          },
        },
      },
    ]),
    updateOne: async (filter, payload) => {
      updateFilter = filter;
      updatePayload = payload;
      return { matchedCount: 1 };
    },
  };

  const result = await cleanupTaskRetention({
    taskModel,
    now: new Date('2026-04-27T12:00:00.000Z'),
  });

  assert.deepEqual(deleteFilter, {
    completedAt: { $lt: new Date('2026-03-28T12:00:00.000Z') },
  });
  assert.deepEqual(updateFilter, { _id: 'task-1' });
  assert.deepEqual(updatePayload, {
    $set: {
      occurrenceOverrides: {
        '2026-03-05': {
          title: 'Edited title',
        },
        '2026-04-20': {
          completedAt: '2026-04-20T09:00:00.000Z',
        },
      },
      updatedAt: new Date('2026-04-27T12:00:00.000Z'),
    },
  });
  assert.deepEqual(result, {
    deletedTaskCount: 2,
    updatedTaskCount: 1,
  });
});

test('behavior: startTaskRetentionScheduler runs immediately and clears its interval on stop', async () => {
  let intervalDelay;
  let intervalCallback;
  let clearedTimerId = null;
  let cleanupCallCount = 0;

  const scheduler = startTaskRetentionScheduler({
    runCleanup: async () => {
      cleanupCallCount += 1;
    },
    setIntervalFn: (callback, delay) => {
      intervalCallback = callback;
      intervalDelay = delay;
      return 'timer-1';
    },
    clearIntervalFn: (timerId) => {
      clearedTimerId = timerId;
    },
  });

  await Promise.resolve();
  await intervalCallback();

  assert.equal(intervalDelay, DEFAULT_TASK_RETENTION_INTERVAL_MS);
  assert.equal(cleanupCallCount, 2);

  scheduler.stop();

  assert.equal(clearedTimerId, 'timer-1');
});

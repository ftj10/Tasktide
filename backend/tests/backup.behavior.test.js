// INPUT: backup helpers, temporary filesystem paths, and stubbed planner models
// OUTPUT: behavior coverage for local dataset exports, full restores, and daily backup scheduling
// EFFECT: Verifies backups write planner data to local JSON files, restores overwrite MongoDB collections, and scheduling targets the next 1:00 AM run
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const Task = require('../models/Task');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const HelpQuestion = require('../models/HelpQuestion');
const { backupDataset, getNextBackupDate, restoreDataset, startDailyBackupScheduler } = require('../backup');

const originals = {
  userFind: User.find,
  userDeleteMany: User.deleteMany,
  userInsertMany: User.insertMany,
  taskFind: Task.find,
  taskDeleteMany: Task.deleteMany,
  taskInsertMany: Task.insertMany,
  reminderFind: Reminder.find,
  reminderDeleteMany: Reminder.deleteMany,
  reminderInsertMany: Reminder.insertMany,
  helpQuestionFind: HelpQuestion.find,
  helpQuestionDeleteMany: HelpQuestion.deleteMany,
  helpQuestionInsertMany: HelpQuestion.insertMany,
  mongodbUri: process.env.MONGODB_URI,
};

// INPUT: current test doubles
// OUTPUT: restored model methods and environment values
// EFFECT: Prevents backup tests from leaking stubs into unrelated backend tests
function resetStubs() {
  User.find = originals.userFind;
  User.deleteMany = originals.userDeleteMany;
  User.insertMany = originals.userInsertMany;
  Task.find = originals.taskFind;
  Task.deleteMany = originals.taskDeleteMany;
  Task.insertMany = originals.taskInsertMany;
  Reminder.find = originals.reminderFind;
  Reminder.deleteMany = originals.reminderDeleteMany;
  Reminder.insertMany = originals.reminderInsertMany;
  HelpQuestion.find = originals.helpQuestionFind;
  HelpQuestion.deleteMany = originals.helpQuestionDeleteMany;
  HelpQuestion.insertMany = originals.helpQuestionInsertMany;

  if (originals.mongodbUri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = originals.mongodbUri;
  }
}

test.afterEach(() => {
  resetStubs();
});

test('behavior: backupDataset stores all collections in one local JSON file', async () => {
  process.env.MONGODB_URI = 'mongodb://example.local/weekly-todo';

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weekly-todo-backup-'));
  const now = new Date('2026-04-25T08:15:30.000Z');
  const connection = { readyState: 0, name: 'weekly-todo-test' };

  let connectedUri = '';
  let disconnected = false;

  User.find = () => ({ lean: async () => ([{ username: 'tom' }]) });
  Task.find = () => ({ lean: async () => ([{ id: 'task-1', title: 'Review backup flow' }]) });
  Reminder.find = () => ({ lean: async () => ([{ id: 'reminder-1', title: 'Run backup' }]) });
  HelpQuestion.find = () => ({ lean: async () => ([{ id: 'help-1', question: 'How do backups work?' }]) });

  const result = await backupDataset({
    now,
    backupDir: tempDir,
    connection,
    connectFn: async (uri) => {
      connectedUri = uri;
      connection.readyState = 1;
    },
    disconnectFn: async () => {
      disconnected = true;
      connection.readyState = 0;
    },
    logger: { log() {} },
  });

  const writtenFile = await fs.readFile(result.filePath, 'utf8');
  const parsedPayload = JSON.parse(writtenFile);

  assert.equal(connectedUri, 'mongodb://example.local/weekly-todo');
  assert.equal(disconnected, true);
  assert.equal(parsedPayload.generatedAt, '2026-04-25T08:15:30.000Z');
  assert.equal(parsedPayload.databaseName, 'weekly-todo-test');
  assert.deepEqual(parsedPayload.collections, {
    users: [{ username: 'tom' }],
    tasks: [{ id: 'task-1', title: 'Review backup flow' }],
    reminders: [{ id: 'reminder-1', title: 'Run backup' }],
    helpQuestions: [{ id: 'help-1', question: 'How do backups work?' }],
  });
});

test('behavior: getNextBackupDate targets the next local 1:00 AM run', () => {
  const beforeTarget = new Date(2026, 3, 25, 0, 30, 0, 0);
  const afterTarget = new Date(2026, 3, 25, 1, 5, 0, 0);

  const nextSameDay = getNextBackupDate(beforeTarget);
  const nextFollowingDay = getNextBackupDate(afterTarget);

  assert.equal(nextSameDay.getFullYear(), 2026);
  assert.equal(nextSameDay.getMonth(), 3);
  assert.equal(nextSameDay.getDate(), 25);
  assert.equal(nextSameDay.getHours(), 1);
  assert.equal(nextSameDay.getMinutes(), 0);

  assert.equal(nextFollowingDay.getFullYear(), 2026);
  assert.equal(nextFollowingDay.getMonth(), 3);
  assert.equal(nextFollowingDay.getDate(), 26);
  assert.equal(nextFollowingDay.getHours(), 1);
  assert.equal(nextFollowingDay.getMinutes(), 0);
});

test('behavior: restoreDataset overwrites all collections from a backup JSON file', async () => {
  process.env.MONGODB_URI = 'mongodb://example.local/weekly-todo';

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weekly-todo-restore-'));
  const backupFilePath = path.join(tempDir, 'dataset-backup.json');
  const connection = { readyState: 0, name: 'weekly-todo-test' };
  const operations = [];

  let connectedUri = '';
  let disconnected = false;

  await fs.writeFile(backupFilePath, JSON.stringify({
    app: 'weekly-todo',
    generatedAt: '2026-04-25T12:29:11.000Z',
    collections: {
      users: [{ username: 'tom', password: 'hashed' }],
      tasks: [{ id: 'task-1', title: 'Restored task' }],
      reminders: [{ id: 'reminder-1', title: 'Restored reminder' }],
      helpQuestions: [{ id: 'help-1', question: 'Restored help question' }],
    },
  }), 'utf8');

  User.deleteMany = async (filter) => {
    operations.push(['users:deleteMany', filter]);
  };
  User.insertMany = async (docs, options) => {
    operations.push(['users:insertMany', docs, options]);
  };
  Task.deleteMany = async (filter) => {
    operations.push(['tasks:deleteMany', filter]);
  };
  Task.insertMany = async (docs, options) => {
    operations.push(['tasks:insertMany', docs, options]);
  };
  Reminder.deleteMany = async (filter) => {
    operations.push(['reminders:deleteMany', filter]);
  };
  Reminder.insertMany = async (docs, options) => {
    operations.push(['reminders:insertMany', docs, options]);
  };
  HelpQuestion.deleteMany = async (filter) => {
    operations.push(['helpQuestions:deleteMany', filter]);
  };
  HelpQuestion.insertMany = async (docs, options) => {
    operations.push(['helpQuestions:insertMany', docs, options]);
  };

  const result = await restoreDataset({
    filePath: backupFilePath,
    connection,
    connectFn: async (uri) => {
      connectedUri = uri;
      connection.readyState = 1;
    },
    disconnectFn: async () => {
      disconnected = true;
      connection.readyState = 0;
    },
    logger: { log() {} },
  });

  assert.equal(connectedUri, 'mongodb://example.local/weekly-todo');
  assert.equal(disconnected, true);
  assert.deepEqual(result.collections, {
    users: [{ username: 'tom', password: 'hashed' }],
    tasks: [{ id: 'task-1', title: 'Restored task' }],
    reminders: [{ id: 'reminder-1', title: 'Restored reminder' }],
    helpQuestions: [{ id: 'help-1', question: 'Restored help question' }],
  });
  assert.deepEqual(operations, [
    ['users:deleteMany', {}],
    ['users:insertMany', [{ username: 'tom', password: 'hashed' }], { ordered: true }],
    ['tasks:deleteMany', {}],
    ['tasks:insertMany', [{ id: 'task-1', title: 'Restored task' }], { ordered: true }],
    ['reminders:deleteMany', {}],
    ['reminders:insertMany', [{ id: 'reminder-1', title: 'Restored reminder' }], { ordered: true }],
    ['helpQuestions:deleteMany', {}],
    ['helpQuestions:insertMany', [{ id: 'help-1', question: 'Restored help question' }], { ordered: true }],
  ]);
});

test('behavior: startDailyBackupScheduler schedules the next run and reschedules after completion', async () => {
  const nowValues = [
    new Date(2026, 3, 25, 0, 30, 0, 0),
    new Date(2026, 3, 25, 1, 0, 5, 0),
  ];
  const scheduledTimers = [];
  const clearedTimers = [];
  let currentNowIndex = 0;
  let runCount = 0;

  const scheduler = startDailyBackupScheduler({
    nowFn: () => nowValues[currentNowIndex],
    runBackup: async () => {
      runCount += 1;
    },
    setTimeoutFn: (callback, delay) => {
      const timer = { callback, delay };
      scheduledTimers.push(timer);
      return scheduledTimers.length;
    },
    clearTimeoutFn: (timerId) => {
      clearedTimers.push(timerId);
    },
    logger: { log() {}, error() {} },
  });

  assert.equal(scheduledTimers[0].delay, 30 * 60 * 1000);

  currentNowIndex = 1;
  await scheduledTimers[0].callback();

  assert.equal(runCount, 1);
  assert.equal(scheduledTimers[1].delay, (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (55 * 1000));

  scheduler.stop();

  assert.deepEqual(clearedTimers, [2]);
});

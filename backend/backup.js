// INPUT: MongoDB connection settings, planner models, and backup scheduler options
// OUTPUT: dataset backup files plus local-only backup and restore helpers
// EFFECT: Exports planner data to local JSON files, restores full datasets from backup files, and supports a daily 1:00 AM backup loop
require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');

const Task = require('./models/Task');
const User = require('./models/User');
const Reminder = require('./models/Reminder');
const HelpQuestion = require('./models/HelpQuestion');

const DEFAULT_BACKUP_HOUR = 1;
const DEFAULT_BACKUP_MINUTE = 0;
const DEFAULT_BACKUP_DIR = path.join(__dirname, 'backups');

// INPUT: optional environment override
// OUTPUT: absolute directory path for dataset backup files
// EFFECT: Keeps local dataset exports in one predictable folder unless the user overrides it
function getBackupDirectory() {
  return path.resolve(process.env.DATASET_BACKUP_DIR || DEFAULT_BACKUP_DIR);
}

// INPUT: backup timestamp
// OUTPUT: filesystem-safe timestamp string
// EFFECT: Produces readable backup filenames without locale-specific characters
function formatBackupTimestamp(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

// INPUT: current local time plus the target backup hour and minute
// OUTPUT: next local backup time
// EFFECT: Calculates the next daily 1:00 AM run without relying on external schedulers
function getNextBackupDate(now = new Date(), hour = DEFAULT_BACKUP_HOUR, minute = DEFAULT_BACKUP_MINUTE) {
  const nextBackup = new Date(now);
  nextBackup.setHours(hour, minute, 0, 0);

  if (nextBackup <= now) {
    nextBackup.setDate(nextBackup.getDate() + 1);
  }

  return nextBackup;
}

// INPUT: planner model
// OUTPUT: plain JSON-safe documents from that collection
// EFFECT: Loads one collection without Mongoose document wrappers before writing the backup file
async function fetchCollection(model) {
  return model.find({}).lean();
}

// INPUT: planner models, timestamp, and active MongoDB connection
// OUTPUT: full dataset snapshot payload
// EFFECT: Aggregates every persisted planner collection into one export structure
async function createBackupPayload({
  now = new Date(),
  connection = mongoose.connection,
  models = { User, Task, Reminder, HelpQuestion },
} = {}) {
  const [users, tasks, reminders, helpQuestions] = await Promise.all([
    fetchCollection(models.User),
    fetchCollection(models.Task),
    fetchCollection(models.Reminder),
    fetchCollection(models.HelpQuestion),
  ]);

  return {
    app: 'tasktide',
    generatedAt: now.toISOString(),
    databaseName: connection.name || '',
    collections: {
      users,
      tasks,
      reminders,
      helpQuestions,
    },
  };
}

// INPUT: payload, timestamp, and target directory
// OUTPUT: saved backup file path
// EFFECT: Writes a human-readable JSON export to the local filesystem
async function writeBackupFile({
  payload,
  now = new Date(),
  backupDir = getBackupDirectory(),
  fsModule = fs,
} = {}) {
  const fileName = `dataset-backup-${formatBackupTimestamp(now)}.json`;
  const filePath = path.join(backupDir, fileName);

  await fsModule.mkdir(backupDir, { recursive: true });
  await fsModule.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return filePath;
}

// INPUT: active MongoDB connection state plus optional connector overrides
// OUTPUT: connection ownership flag
// EFFECT: Opens a database connection when the backup command is launched outside the web server
async function ensureDatabaseConnection({
  connection = mongoose.connection,
  connectFn = mongoose.connect,
} = {}) {
  if (connection.readyState === 1) {
    return false;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to back up the dataset.');
  }

  await connectFn(process.env.MONGODB_URI);
  return true;
}

// INPUT: backup JSON file path and optional filesystem overrides
// OUTPUT: parsed dataset backup payload
// EFFECT: Loads a local backup file before replacing MongoDB data with its contents
async function readBackupFile({
  filePath,
  fsModule = fs,
} = {}) {
  if (!filePath) {
    throw new Error('A backup JSON file path is required.');
  }

  const fileContents = await fsModule.readFile(path.resolve(filePath), 'utf8');
  const payload = JSON.parse(fileContents);

  if (!payload || typeof payload !== 'object' || !payload.collections || typeof payload.collections !== 'object') {
    throw new Error('Backup file is missing the collections payload.');
  }

  return payload;
}

// INPUT: parsed backup payload and planner models
// OUTPUT: restore completion
// EFFECT: Replaces every planner collection so the dataset exactly matches the backup file
async function restoreCollectionsFromPayload({
  payload,
  models = { User, Task, Reminder, HelpQuestion },
} = {}) {
  const collections = {
    users: Array.isArray(payload.collections.users) ? payload.collections.users : [],
    tasks: Array.isArray(payload.collections.tasks) ? payload.collections.tasks : [],
    reminders: Array.isArray(payload.collections.reminders) ? payload.collections.reminders : [],
    helpQuestions: Array.isArray(payload.collections.helpQuestions) ? payload.collections.helpQuestions : [],
  };

  await models.User.deleteMany({});
  if (collections.users.length > 0) {
    await models.User.insertMany(collections.users, { ordered: true });
  }

  await models.Task.deleteMany({});
  if (collections.tasks.length > 0) {
    await models.Task.insertMany(collections.tasks, { ordered: true });
  }

  await models.Reminder.deleteMany({});
  if (collections.reminders.length > 0) {
    await models.Reminder.insertMany(collections.reminders, { ordered: true });
  }

  await models.HelpQuestion.deleteMany({});
  if (collections.helpQuestions.length > 0) {
    await models.HelpQuestion.insertMany(collections.helpQuestions, { ordered: true });
  }

  return collections;
}

// INPUT: optional connection, filesystem, timestamp, and logger overrides
// OUTPUT: saved backup metadata
// EFFECT: Connects to MongoDB if needed, exports all dataset collections, and stores the result locally
async function backupDataset({
  now = new Date(),
  backupDir = getBackupDirectory(),
  connection = mongoose.connection,
  connectFn = mongoose.connect,
  disconnectFn = () => mongoose.disconnect(),
  models = { User, Task, Reminder, HelpQuestion },
  fsModule = fs,
  logger = console,
} = {}) {
  const shouldDisconnect = await ensureDatabaseConnection({ connection, connectFn });

  try {
    const payload = await createBackupPayload({ now, connection, models });
    const filePath = await writeBackupFile({ payload, now, backupDir, fsModule });

    logger.log(`Dataset backup saved to ${filePath}`);

    return { filePath, payload };
  } finally {
    if (shouldDisconnect) {
      await disconnectFn();
    }
  }
}

// INPUT: local backup JSON path plus optional connection, filesystem, and logger overrides
// OUTPUT: restored dataset metadata
// EFFECT: Replaces MongoDB planner data so it exactly matches the provided local backup file
async function restoreDataset({
  filePath,
  connection = mongoose.connection,
  connectFn = mongoose.connect,
  disconnectFn = () => mongoose.disconnect(),
  models = { User, Task, Reminder, HelpQuestion },
  fsModule = fs,
  logger = console,
} = {}) {
  const shouldDisconnect = await ensureDatabaseConnection({ connection, connectFn });

  try {
    const payload = await readBackupFile({ filePath, fsModule });
    const collections = await restoreCollectionsFromPayload({ payload, models });

    logger.log(`Dataset restored from ${path.resolve(filePath)}`);

    return { payload, collections };
  } finally {
    if (shouldDisconnect) {
      await disconnectFn();
    }
  }
}

// INPUT: backup runner plus timer, clock, and logger overrides
// OUTPUT: scheduler controller with stop method
// EFFECT: Keeps a local process alive and runs the dataset backup every day at 1:00 AM
function startDailyBackupScheduler({
  hour = DEFAULT_BACKUP_HOUR,
  minute = DEFAULT_BACKUP_MINUTE,
  runBackup = backupDataset,
  nowFn = () => new Date(),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  logger = console,
} = {}) {
  let timerId = null;
  let stopped = false;

  const scheduleNextRun = () => {
    if (stopped) {
      return;
    }

    const now = nowFn();
    const nextBackup = getNextBackupDate(now, hour, minute);
    const delay = nextBackup.getTime() - now.getTime();

    logger.log(`Next dataset backup scheduled for ${nextBackup.toString()}`);

    timerId = setTimeoutFn(async () => {
      try {
        await runBackup();
      } catch (error) {
        logger.error('Dataset backup failed:', error);
      } finally {
        scheduleNextRun();
      }
    }, delay);
  };

  scheduleNextRun();

  return {
    stop() {
      stopped = true;
      if (timerId !== null) {
        clearTimeoutFn(timerId);
      }
    },
  };
}

module.exports = {
  DEFAULT_BACKUP_HOUR,
  DEFAULT_BACKUP_MINUTE,
  backupDataset,
  createBackupPayload,
  formatBackupTimestamp,
  getBackupDirectory,
  getNextBackupDate,
  readBackupFile,
  restoreCollectionsFromPayload,
  restoreDataset,
  startDailyBackupScheduler,
  writeBackupFile,
};

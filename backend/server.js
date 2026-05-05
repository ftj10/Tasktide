// INPUT: HTTP requests for auth, tasks, reminders, and help questions
// OUTPUT: Express application plus startup helpers
// EFFECT: Exposes the backend API used by the weekly planner features and persists data through MongoDB models
require('dotenv').config();
const { randomUUID } = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('./models/Task');
const User = require('./models/User');
const Reminder = require('./models/Reminder');
const HelpQuestion = require('./models/HelpQuestion');
const { getTaskRetentionCutoff, startTaskRetentionScheduler } = require('./taskRetention');
const { getPushPublicKey } = require('./pushNotifications');
const { startNotificationScheduler } = require('./notificationScheduler');
const syllabusAnalysis = require('./syllabusAnalysis');

const app = express();
const SESSION_COOKIE_NAME = 'tasktide_session';
const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

app.set('trust proxy', 1);

function getConfiguredOrigins() {
  return String(process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function getRequestOrigin(req) {
  const requestHost = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '')
    .split(',')[0]
    .trim();
  if (!requestHost) return null;

  const requestProtocol = String(req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http')
    .split(',')[0]
    .trim();

  return `${requestProtocol}://${requestHost}`;
}

function getHeaderOrigin(value) {
  const headerValue = String(value ?? '').trim();
  if (!headerValue) return null;

  try {
    const parsedUrl = new URL(headerValue);
    return parsedUrl.origin;
  } catch {
    return null;
  }
}

function isTrustedRequestOrigin(req, origin) {
  if (!origin) return false;
  return origin === getRequestOrigin(req) || getConfiguredOrigins().includes(origin);
}

app.use(cors({
  origin(origin, callback) {
    const configuredOrigins = getConfiguredOrigins();
    if (!origin || configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

function verifyCsrfOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const cookieToken = readCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);
  const origin = getHeaderOrigin(req.headers.origin);
  const refererOrigin = getHeaderOrigin(req.headers.referer);
  const requestOrigin = origin || refererOrigin;

  if (requestOrigin && !isTrustedRequestOrigin(req, requestOrigin)) {
    return res.status(403).json({ error: "CSRF check failed" });
  }

  if (cookieToken && !requestOrigin) {
    return res.status(403).json({ error: "CSRF check failed" });
  }

  next();
}

app.use(verifyCsrfOrigin);

// Keep-Alive Endpoint for Render Free Tier
app.get('/ping', (req, res) => {
  console.log('Keep-alive ping received at:', new Date().toISOString());
  res.status(200).send('hi,afausbeweufhqweuofbajksbfweq');
});

function parseConfiguredAdminUsernames() {
  return new Set(
    String(process.env.ADMIN_USERNAMES ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function normalizeRole(role) {
  return role === 'ADMIN' || role === 'USER' ? role : null;
}

function normalizeAuthUsername(username) {
  return String(username ?? '').trim();
}

function normalizeStoredUsername(username) {
  return normalizeAuthUsername(username).toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildUsernameLookup(username) {
  const normalizedUsername = normalizeAuthUsername(username);
  return {
    username: new RegExp(`^${escapeRegExp(normalizedUsername)}$`, 'i'),
  };
}

function validateRegistrationPayload(username, password) {
  const normalizedUsername = normalizeStoredUsername(username);
  const normalizedPassword = String(password ?? '');

  if (normalizedUsername.length < MIN_USERNAME_LENGTH) {
    return { error: "Username must be at least 3 characters" };
  }

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: "Password must be at least 8 characters" };
  }

  return {
    username: normalizedUsername,
    password: normalizedPassword,
  };
}

function validateLoginPayload(username, password) {
  const normalizedUsername = normalizeAuthUsername(username);
  const normalizedPassword = String(password ?? '');

  if (!normalizedUsername || !normalizedPassword) {
    return { error: "Username and password are required" };
  }

  return {
    username: normalizedUsername,
    password: normalizedPassword,
  };
}

function resolveUserRole(user) {
  if (parseConfiguredAdminUsernames().has(String(user?.username ?? '').trim().toLowerCase())) {
    return 'ADMIN';
  }
  const storedRole = normalizeRole(user?.role);
  if (storedRole) return storedRole;
  return 'USER';
}

function toSessionUser(user) {
  return {
    userId: user.userId ?? user._id,
    username: user.username,
    role: resolveUserRole(user),
  };
}

function buildHelpQuestionFilter(user) {
  if (user.role === 'ADMIN') return {};

  const username = String(user.username ?? '').trim();
  if (!username) return null;

  const legacyOwnershipFilters = [
    { userId: { $exists: false }, username },
    { userId: null, username },
  ];

  if (mongoose.Types.ObjectId.isValid(user.userId)) {
    return {
      $or: [
        { userId: user.userId },
        ...legacyOwnershipFilters,
      ],
    };
  }

  return { $or: legacyOwnershipFilters };
}

async function persistResolvedUserRole(user) {
  const storedRole = normalizeRole(user?.role);
  if (storedRole) return storedRole;

  const resolvedRole = resolveUserRole(user);
  await User.updateOne(
    { _id: user._id },
    { $set: { role: resolvedRole } },
    { runValidators: true }
  );
  return resolvedRole;
}

function readCookieValue(cookieHeader, name) {
  const cookieText = String(cookieHeader ?? '');
  if (!cookieText) return null;

  const match = cookieText.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function isCrossHostnameRequest(req) {
  const origin = String(req.headers.origin ?? '').trim();
  const requestHost = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '')
    .split(',')[0]
    .trim();

  if (!origin || !requestHost) return false;

  try {
    return new URL(origin).hostname !== requestHost.split(':')[0];
  } catch {
    return false;
  }
}

function getSessionCookieSettings(req) {
  const configuredSameSite = String(process.env.SESSION_COOKIE_SAME_SITE ?? '').trim().toLowerCase();
  const sameSite =
    configuredSameSite === 'none'
      ? 'none'
      : configuredSameSite === 'strict'
      ? 'strict'
      : configuredSameSite === 'lax'
      ? 'lax'
      : isCrossHostnameRequest(req)
      ? 'none'
      : 'lax';
  const secure =
    String(process.env.SESSION_COOKIE_SECURE ?? '').trim().toLowerCase() === 'true' ||
    sameSite === 'none';

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function setSessionCookie(req, res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieSettings(req));
}

function clearSessionCookie(req, res) {
  const { sameSite, secure, path } = getSessionCookieSettings(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    sameSite,
    secure,
    path,
    httpOnly: true,
  });
}

// INPUT: raw push subscription payload
// OUTPUT: validated subscription row or null
// EFFECT: Normalizes browser subscription metadata before it is persisted for background push delivery
function normalizePushSubscription(payload) {
  const endpoint = String(payload?.endpoint ?? '').trim();
  const p256dh = String(payload?.keys?.p256dh ?? '').trim();
  const auth = String(payload?.keys?.auth ?? '').trim();
  const timezone = String(payload?.timezone ?? 'UTC').trim() || 'UTC';
  const locale = String(payload?.locale ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const userAgent = String(payload?.userAgent ?? '').trim();
  const expirationTime =
    payload?.expirationTime === null || payload?.expirationTime === undefined || payload?.expirationTime === ''
      ? null
      : Number(payload.expirationTime);

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    expirationTime: Number.isFinite(expirationTime) ? expirationTime : null,
    keys: {
      p256dh,
      auth,
    },
    timezone,
    locale,
    userAgent,
  };
}

// INPUT: existing subscription rows plus one new subscription
// OUTPUT: updated subscription array
// EFFECT: Replaces one endpoint in place or appends a new endpoint for the signed-in user
function upsertPushSubscription(existingSubscriptions, nextSubscription, now = new Date()) {
  const nextTimestamp = now.toISOString();
  const previousSubscriptions = Array.isArray(existingSubscriptions) ? existingSubscriptions : [];
  const existingIndex = previousSubscriptions.findIndex(
    (subscription) => subscription.endpoint === nextSubscription.endpoint
  );

  if (existingIndex === -1) {
    return [
      ...previousSubscriptions,
      {
        ...nextSubscription,
        createdAt: nextTimestamp,
        updatedAt: nextTimestamp,
        notificationHistory: [],
      },
    ];
  }

  return previousSubscriptions.map((subscription, index) =>
    index === existingIndex
      ? {
          ...subscription,
          ...nextSubscription,
          createdAt: subscription.createdAt ?? nextTimestamp,
          updatedAt: nextTimestamp,
          notificationHistory: Array.isArray(subscription.notificationHistory)
            ? subscription.notificationHistory
            : [],
        }
      : subscription
  );
}

// INPUT: existing subscription rows plus one endpoint
// OUTPUT: filtered subscription array
// EFFECT: Removes one browser endpoint so logged-out or revoked devices stop receiving pushes
function removePushSubscription(existingSubscriptions, endpoint) {
  return (existingSubscriptions ?? []).filter((subscription) => subscription.endpoint !== endpoint);
}

// INPUT: userId
// OUTPUT: cleanup completion
// EFFECT: Removes completed task records older than 30 days for the signed-in user
function cleanupTasksForUser(userId) {
  const cutoffDate = getTaskRetentionCutoff();

  return Task.deleteMany({
    userId,
    $or: [
      {
        completedAt: { $lt: cutoffDate }
      },
      {
        done: true,
        completedAt: null,
        updatedAt: { $lt: cutoffDate }
      }
    ]
  });
}

// INPUT: raw task request payload plus authenticated user id
// OUTPUT: normalized task persistence payload
// EFFECT: Keeps task completion state anchored to completedAt instead of the legacy done flag
function normalizeTaskWritePayload(taskPayload, userId) {
  const { done, ...nextTaskPayload } = taskPayload ?? {};
  const isRecurringTask =
    nextTaskPayload?.recurrence?.frequency
      ? nextTaskPayload.recurrence.frequency !== 'NONE'
      : nextTaskPayload?.type === 'RECURRING' || nextTaskPayload?.type === 'PERMANENT';
  const nextCompletedAt = isRecurringTask
    ? null
    : nextTaskPayload.completedAt === ''
    ? null
    : nextTaskPayload.completedAt ?? (done ? nextTaskPayload.updatedAt ?? nextTaskPayload.createdAt ?? new Date().toISOString() : null);

  return {
    ...nextTaskPayload,
    userId,
    completedAt: nextCompletedAt,
  };
}

// INPUT: userId
// OUTPUT: cleanup completion
// EFFECT: Removes completed reminders older than 30 days for the signed-in user
function cleanupRemindersForUser(userId) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  return Reminder.deleteMany({
    userId,
    done: true,
    updatedAt: { $lt: cutoffDate.toISOString() }
  });
}

// INPUT: session cookie or bearer token request header
// OUTPUT: decoded user on req.user or an auth error response
// EFFECT: Protects planner routes so each request is tied to a signed-in user
const authenticateToken = (req, res, next) => {
  const cookieToken = readCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = toSessionUser(decodedUser);
    next();
  });
};

// INPUT: username and password
// OUTPUT: registration success or validation failure
// EFFECT: Creates a new account for the planner authentication feature
app.post('/register', async (req, res) => {
  try {
    const validatedPayload = validateRegistrationPayload(req.body?.username, req.body?.password);
    if (validatedPayload.error) {
      return res.status(400).json({ error: validatedPayload.error });
    }
    
    const existingUser = await User.findOne(buildUsernameLookup(validatedPayload.username));
    if (existingUser) return res.status(400).json({ error: "Username taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedPayload.password, salt);
    
    const newUser = new User({
      username: validatedPayload.username,
      password: hashedPassword,
      role: resolveUserRole({ username: validatedPayload.username }),
    });
    await newUser.save();

    res.status(201).json({ message: "Registered" });
  } catch (err) {
    res.status(500).json({ error: "Failed to register" });
  }
});

// INPUT: username and password
// OUTPUT: session profile for the frontend session
// EFFECT: Starts an authenticated planner session for an existing user
app.post('/login', async (req, res) => {
  try {
    const validatedPayload = validateLoginPayload(req.body?.username, req.body?.password);
    if (validatedPayload.error) {
      return res.status(400).json({ error: validatedPayload.error });
    }

    const user = await User.findOne(buildUsernameLookup(validatedPayload.username));
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(validatedPayload.password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const role = await persistResolvedUserRole(user);
    const sessionUser = toSessionUser({ userId: user._id, username: user.username, role });
    const token = jwt.sign(sessionUser, process.env.JWT_SECRET, { expiresIn: '7d' });

    setSessionCookie(req, res, token);
    res.status(200).json({ username: user.username, role: sessionUser.role });
  } catch (err) {
    res.status(500).json({ error: "Failed to log in" });
  }
});

// INPUT: authenticated session cookie
// OUTPUT: signed-in session profile
// EFFECT: Lets the frontend restore the current browser session without reading the JWT in JavaScript
app.get('/session', authenticateToken, async (req, res) => {
  res.status(200).json({
    username: req.user.username,
    role: req.user.role,
  });
});

// INPUT: current browser session
// OUTPUT: logout confirmation
// EFFECT: Clears the authenticated planner session cookie from the browser
app.post('/logout', (req, res) => {
  clearSessionCookie(req, res);
  res.status(200).json({ message: 'Logged out' });
});

// INPUT: authenticated user id
// OUTPUT: saved task records for that user
// EFFECT: Loads the current planner task state
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    await cleanupTasksForUser(req.user.userId);
    const tasks = await Task.find({ userId: req.user.userId }, { _id: 0, __v: 0, userId: 0 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// INPUT: authenticated user id plus a new task
// OUTPUT: create confirmation
// EFFECT: Persists one task record for the signed-in user
app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    await cleanupTasksForUser(req.user.userId);
    const taskPayload = normalizeTaskWritePayload(req.body, req.user.userId);
    const result = await Task.updateOne(
      { id: taskPayload.id, userId: req.user.userId },
      {
        $set: taskPayload,
        $unset: { done: 1 },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(result.upsertedCount > 0 ? 201 : 200).json({ message: result.upsertedCount > 0 ? "Created" : "Already saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

// INPUT: authenticated user id plus an array of tasks
// OUTPUT: { created: number }
// EFFECT: Persists multiple task records for the signed-in user in a single request
const BATCH_IMPORT_MAX = 200;

app.post('/tasks/batch', authenticateToken, async (req, res) => {
  try {
    const tasks = Array.isArray(req.body?.tasks) ? req.body.tasks : [];
    if (tasks.length === 0) return res.status(400).json({ error: 'tasks array is required' });
    if (tasks.length > BATCH_IMPORT_MAX) return res.status(400).json({ error: `Batch size exceeds maximum of ${BATCH_IMPORT_MAX}` });
    await cleanupTasksForUser(req.user.userId);
    await Promise.all(
      tasks.map((task) => {
        const taskPayload = normalizeTaskWritePayload(task, req.user.userId);
        return Task.updateOne(
          { id: taskPayload.id, userId: req.user.userId },
          { $set: taskPayload, $unset: { done: 1 } },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
      })
    );
    res.status(201).json({ created: tasks.length });
  } catch (err) {
    res.status(500).json({ error: 'Batch import failed' });
  }
});

// INPUT: authenticated user id, task id, and replacement task payload
// OUTPUT: update confirmation or not-found error
// EFFECT: Updates one persisted task record for the signed-in user
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await cleanupTasksForUser(req.user.userId);
    const taskPayload = normalizeTaskWritePayload(req.body, req.user.userId);
    const updatedTask = await Task.findOneAndUpdate(
      { id: req.params.id, userId: req.user.userId },
      taskPayload,
      { overwrite: true, returnDocument: 'after', runValidators: true }
    );

    if (!updatedTask) return res.status(404).json({ error: "Task not found" });

    res.status(200).json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// INPUT: authenticated user id and syllabus batch id
// OUTPUT: { deleted: number }
// EFFECT: Removes all tasks belonging to one syllabus import batch for the signed-in user
app.delete('/tasks/batch/:batchId', authenticateToken, async (req, res) => {
  try {
    const result = await Task.deleteMany({
      userId: req.user.userId,
      syllabusImportBatchId: req.params.batchId,
    });
    res.status(200).json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Batch delete failed' });
  }
});

// INPUT: authenticated user id and task id
// OUTPUT: delete confirmation or not-found error
// EFFECT: Deletes one persisted task record for the signed-in user
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ id: req.params.id, userId: req.user.userId });

    if (!deletedTask) return res.status(404).json({ error: "Task not found" });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// INPUT: authenticated user id
// OUTPUT: saved reminder records for that user
// EFFECT: Loads the reminder list for the signed-in planner session
app.get('/reminders', authenticateToken, async (req, res) => {
  try {
    await cleanupRemindersForUser(req.user.userId);
    const reminders = await Reminder.find({ userId: req.user.userId }, { _id: 0, __v: 0, userId: 0 });
    res.status(200).json(reminders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// INPUT: authenticated user id plus a new reminder
// OUTPUT: create confirmation
// EFFECT: Persists one reminder record for the signed-in user
app.post('/reminders', authenticateToken, async (req, res) => {
  try {
    await cleanupRemindersForUser(req.user.userId);
    const reminderPayload = { ...req.body, userId: req.user.userId };
    const result = await Reminder.updateOne(
      { id: reminderPayload.id, userId: req.user.userId },
      { $set: reminderPayload },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(result.upsertedCount > 0 ? 201 : 200).json({ message: result.upsertedCount > 0 ? "Created" : "Already saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

// INPUT: authenticated user id, reminder id, and replacement reminder payload
// OUTPUT: update confirmation or not-found error
// EFFECT: Updates one persisted reminder record for the signed-in user
app.put('/reminders/:id', authenticateToken, async (req, res) => {
  try {
    await cleanupRemindersForUser(req.user.userId);
    const updatedReminder = await Reminder.findOneAndUpdate(
      { id: req.params.id, userId: req.user.userId },
      { ...req.body, userId: req.user.userId },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedReminder) return res.status(404).json({ error: "Reminder not found" });

    res.status(200).json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// INPUT: authenticated user id and reminder id
// OUTPUT: delete confirmation or not-found error
// EFFECT: Deletes one persisted reminder record for the signed-in user
app.delete('/reminders/:id', authenticateToken, async (req, res) => {
  try {
    const deletedReminder = await Reminder.findOneAndDelete({ id: req.params.id, userId: req.user.userId });

    if (!deletedReminder) return res.status(404).json({ error: "Reminder not found" });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// INPUT: authenticated push bootstrap request
// OUTPUT: public VAPID key
// EFFECT: Gives the signed-in frontend the application server key needed to create a PushManager subscription
app.get('/notifications/public-key', authenticateToken, async (req, res) => {
  try {
    res.status(200).json({ publicKey: getPushPublicKey() });
  } catch (err) {
    res.status(500).json({ error: "Failed to load notification settings" });
  }
});

// INPUT: authenticated user id plus one browser push subscription
// OUTPUT: save confirmation or validation error
// EFFECT: Persists one desktop or mobile browser endpoint for background planner notifications
app.post('/notifications/subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscription = normalizePushSubscription(req.body);
    if (!subscription) {
      return res.status(400).json({ error: "Invalid push subscription" });
    }

    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const nextSubscriptions = upsertPushSubscription(user.pushSubscriptions, subscription);
    await User.updateOne(
      { _id: req.user.userId },
      { $set: { pushSubscriptions: nextSubscriptions } },
      { runValidators: true }
    );

    res.status(200).json({ message: "Saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save notification subscription" });
  }
});

// INPUT: authenticated user id plus one browser endpoint
// OUTPUT: delete confirmation or validation error
// EFFECT: Stops background pushes for one browser when the user logs out or disables notifications there
app.delete('/notifications/subscriptions', authenticateToken, async (req, res) => {
  try {
    const endpoint = String(req.body?.endpoint ?? '').trim();
    if (!endpoint) {
      return res.status(400).json({ error: "Subscription endpoint is required" });
    }

    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const nextSubscriptions = removePushSubscription(user.pushSubscriptions, endpoint);
    await User.updateOne(
      { _id: req.user.userId },
      { $set: { pushSubscriptions: nextSubscriptions } },
      { runValidators: true }
    );

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notification subscription" });
  }
});

// INPUT: authenticated help-board request
// OUTPUT: role-scoped help questions ordered by recency
// EFFECT: Supplies admins with all help posts and standard users with only their own posts
app.get('/help-questions', authenticateToken, async (req, res) => {
  try {
    const filter = buildHelpQuestionFilter(req.user);
    if (!filter) {
      return res.status(403).json({ error: "Invalid session" });
    }
    const questions = await HelpQuestion.find(filter, { _id: 0, __v: 0, userId: 0 }).sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// INPUT: authenticated username plus help question payload
// OUTPUT: saved help question or validation error
// EFFECT: Adds one new help post that stays owned by the signed-in user and visible to admins
app.post('/help-questions', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: "Question is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(403).json({ error: "Invalid session" });
    }

    const questionPayload = {
      id: randomUUID(),
      userId: req.user.userId,
      username: req.user.username,
      question: String(question).trim(),
      createdAt: new Date().toISOString(),
    };

    await HelpQuestion.create(questionPayload);

    res.status(201).json({
      id: questionPayload.id,
      username: questionPayload.username,
      question: questionPayload.question,
      createdAt: questionPayload.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

// INPUT: authenticated admin session plus help question id
// OUTPUT: delete confirmation or access error
// EFFECT: Lets admins remove help questions from the review board
app.delete('/help-questions/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const deletedQuestion = await HelpQuestion.findOneAndDelete({ id: req.params.id });
    if (!deletedQuestion) {
      return res.status(404).json({ error: "Help question not found" });
    }

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// INPUT: authenticated request with syllabus text / OUTPUT: SyllabusTaskDraft[] / EFFECT: calls Claude API to extract schedule events
app.post('/syllabus/analyze', authenticateToken, async (req, res) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'text is required' });
    const drafts = await syllabusAnalysis.analyzeSyllabus(text);
    res.json(drafts);
  } catch {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// INPUT: authenticated request with extractedText + optional studyPreferences / OUTPUT: validated SyllabusTaskDraft[] / EFFECT: calls Claude API; requires ANTHROPIC_API_KEY in .env
app.post('/syllabus/generate-drafts', authenticateToken, async (req, res) => {
  try {
    const extractedText = String(req.body?.extractedText ?? '').trim();
    if (!extractedText) return res.status(400).json({ error: 'extractedText is required' });
    const studyPreferences = String(req.body?.studyPreferences ?? '').trim();
    const drafts = await syllabusAnalysis.generateDrafts(extractedText, studyPreferences);
    res.json(drafts);
  } catch (err) {
    if (err.validationError) return res.status(422).json({ error: 'Claude response did not match the expected schema' });
    if (err.claudeError) return res.status(502).json({ error: 'Claude API is unavailable. Please try the manual path.' });
    res.status(502).json({ error: 'Draft generation failed' });
  }
});

const PORT = process.env.PORT || 2676;

// INPUT: environment database connection string
// OUTPUT: Mongoose connection promise
// EFFECT: Connects the backend API to the configured MongoDB instance
function connectDatabase() {
  return mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      await Task.init();
      console.log("Connected to MongoDB Atlas");
    })
    .catch(err => console.error("Database connection error:", err));
}

// INPUT: configured port
// OUTPUT: active HTTP server instance
// EFFECT: Starts the planner API process for local or deployed use
function startServer() {
  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  connectDatabase().then(() => {
    startTaskRetentionScheduler();
    startNotificationScheduler();
    startServer();
  });
}

module.exports = {
  app,
  authenticateToken,
  connectDatabase,
  normalizeTaskWritePayload,
  normalizePushSubscription,
  removePushSubscription,
  resolveUserRole,
  startServer,
  upsertPushSubscription,
};

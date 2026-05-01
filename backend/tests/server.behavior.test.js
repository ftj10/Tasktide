// INPUT: backend models, crypto helpers, and Express app
// OUTPUT: behavior coverage for auth, task, reminder, and help-question routes
// EFFECT: Verifies core backend feature flows without reaching external services
const test = require('node:test');
const assert = require('node:assert/strict');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('../models/Task');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const HelpQuestion = require('../models/HelpQuestion');
const { app, normalizeTaskWritePayload } = require('../server');
const { invokeApp } = require('./helpers/http');

const originals = {
  env: {
    adminUsernames: process.env.ADMIN_USERNAMES,
    sessionCookieSameSite: process.env.SESSION_COOKIE_SAME_SITE,
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  },
  bcrypt: {
    genSalt: bcrypt.genSalt,
    hash: bcrypt.hash,
    compare: bcrypt.compare,
  },
  jwt: {
    sign: jwt.sign,
    verify: jwt.verify,
  },
  user: {
    findOne: User.findOne,
    save: User.prototype.save,
    updateOne: User.updateOne,
  },
  task: {
    find: Task.find,
    deleteMany: Task.deleteMany,
    updateOne: Task.updateOne,
    findOneAndUpdate: Task.findOneAndUpdate,
    findOneAndDelete: Task.findOneAndDelete,
  },
  reminder: {
    find: Reminder.find,
    deleteMany: Reminder.deleteMany,
    updateOne: Reminder.updateOne,
    findOneAndUpdate: Reminder.findOneAndUpdate,
    findOneAndDelete: Reminder.findOneAndDelete,
  },
  helpQuestion: {
    find: HelpQuestion.find,
    create: HelpQuestion.create,
    findOneAndDelete: HelpQuestion.findOneAndDelete,
  },
};

// INPUT: captured original module methods
// OUTPUT: restored test doubles
// EFFECT: Resets backend feature stubs between behavior tests
function resetStubs() {
  if (typeof originals.env.adminUsernames === 'string') {
    process.env.ADMIN_USERNAMES = originals.env.adminUsernames;
  } else {
    delete process.env.ADMIN_USERNAMES;
  }
  if (typeof originals.env.sessionCookieSameSite === 'string') {
    process.env.SESSION_COOKIE_SAME_SITE = originals.env.sessionCookieSameSite;
  } else {
    delete process.env.SESSION_COOKIE_SAME_SITE;
  }
  if (typeof originals.env.sessionCookieSecure === 'string') {
    process.env.SESSION_COOKIE_SECURE = originals.env.sessionCookieSecure;
  } else {
    delete process.env.SESSION_COOKIE_SECURE;
  }
  if (typeof originals.env.vapidPublicKey === 'string') {
    process.env.VAPID_PUBLIC_KEY = originals.env.vapidPublicKey;
  } else {
    delete process.env.VAPID_PUBLIC_KEY;
  }
  if (typeof originals.env.vapidPrivateKey === 'string') {
    process.env.VAPID_PRIVATE_KEY = originals.env.vapidPrivateKey;
  } else {
    delete process.env.VAPID_PRIVATE_KEY;
  }
  bcrypt.genSalt = originals.bcrypt.genSalt;
  bcrypt.hash = originals.bcrypt.hash;
  bcrypt.compare = originals.bcrypt.compare;
  jwt.sign = originals.jwt.sign;
  jwt.verify = originals.jwt.verify;
  User.findOne = originals.user.findOne;
  User.prototype.save = originals.user.save;
  User.updateOne = originals.user.updateOne;
  Task.find = originals.task.find;
  Task.deleteMany = originals.task.deleteMany;
  Task.updateOne = originals.task.updateOne;
  Task.findOneAndUpdate = originals.task.findOneAndUpdate;
  Task.findOneAndDelete = originals.task.findOneAndDelete;
  Reminder.find = originals.reminder.find;
  Reminder.deleteMany = originals.reminder.deleteMany;
  Reminder.updateOne = originals.reminder.updateOne;
  Reminder.findOneAndUpdate = originals.reminder.findOneAndUpdate;
  Reminder.findOneAndDelete = originals.reminder.findOneAndDelete;
  HelpQuestion.find = originals.helpQuestion.find;
  HelpQuestion.create = originals.helpQuestion.create;
  HelpQuestion.findOneAndDelete = originals.helpQuestion.findOneAndDelete;
}

test.afterEach(() => {
  resetStubs();
});

test('behavior: register hashes the password and saves the user', async () => {
  bcrypt.genSalt = async () => 'salt';
  bcrypt.hash = async (password) => `hashed:${password}`;
  User.findOne = async () => null;

  let savedUser;
  User.prototype.save = async function save() {
    savedUser = { username: this.username, password: this.password, role: this.role };
  };

  const result = await invokeApp(app, '/register', {
    method: 'POST',
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.json, { message: 'Registered' });
  assert.deepEqual(savedUser, { username: 'tom', password: 'hashed:secret', role: 'USER' });
});

test('behavior: login sets a session cookie for valid credentials', async () => {
  process.env.ADMIN_USERNAMES = 'tom';
  User.findOne = async () => ({ _id: 'user-1', username: 'tom', password: 'hashed', role: 'USER' });
  User.updateOne = async () => ({ matchedCount: 0 });
  bcrypt.compare = async () => true;
  jwt.sign = () => 'signed-token';

  const result = await invokeApp(app, '/login', {
    method: 'POST',
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { username: 'tom', role: 'ADMIN' });
  assert.match(result.headers['set-cookie'], /tasktide_session=signed-token/);
  assert.match(result.headers['set-cookie'], /HttpOnly/);
});

test('behavior: login uses a cross-site session cookie for hosted frontend origins', async () => {
  delete process.env.SESSION_COOKIE_SAME_SITE;
  delete process.env.SESSION_COOKIE_SECURE;
  User.findOne = async () => ({ _id: 'user-1', username: 'tom', password: 'hashed', role: 'USER' });
  bcrypt.compare = async () => true;
  jwt.sign = () => 'signed-token';

  const result = await invokeApp(app, '/login', {
    method: 'POST',
    headers: {
      Host: 'tasktide-api.onrender.com',
      Origin: 'https://tasktide.vercel.app',
    },
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 200);
  assert.match(result.headers['set-cookie'], /SameSite=None/);
  assert.match(result.headers['set-cookie'], /Secure/);
});

test('behavior: login backfills a missing stored role for legacy users', async () => {
  User.findOne = async () => ({ _id: 'user-1', username: 'tom', password: 'hashed' });
  bcrypt.compare = async () => true;
  jwt.sign = () => 'signed-token';

  let updateFilter;
  let updatePayload;
  let updateOptions;
  User.updateOne = async (filter, payload, options) => {
    updateFilter = filter;
    updatePayload = payload;
    updateOptions = options;
    return { matchedCount: 1 };
  };

  const result = await invokeApp(app, '/login', {
    method: 'POST',
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { username: 'tom', role: 'USER' });
  assert.deepEqual(updateFilter, { _id: 'user-1' });
  assert.deepEqual(updatePayload, { $set: { role: 'USER' } });
  assert.deepEqual(updateOptions, { runValidators: true });
});

test('behavior: session endpoint returns the authenticated user from the session cookie', async () => {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: 'user-1', username: 'tom', role: 'ADMIN' });

  const result = await invokeApp(app, '/session', {
    headers: { Cookie: 'tasktide_session=signed-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { username: 'tom', role: 'ADMIN' });
});

test('behavior: logout clears the session cookie', async () => {
  const result = await invokeApp(app, '/logout', {
    method: 'POST',
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Logged out' });
  assert.match(result.headers['set-cookie'], /tasktide_session=/);
  assert.match(result.headers['set-cookie'], /Expires=Thu, 01 Jan 1970/);
});

test('behavior: authenticated help question fetch returns only the current user questions for standard users', async () => {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });

  let capturedFilter;
  let capturedProjection;
  let capturedSort;
  HelpQuestion.find = (filter, projection) => {
    capturedFilter = filter;
    capturedProjection = projection;
    return {
      sort: async (sortSpec) => {
        capturedSort = sortSpec;
        return [
          {
            id: 'q1',
            username: 'tom',
            question: 'How do I use week view?',
            createdAt: '2026-04-21T10:00:00.000Z',
          },
        ];
      },
    };
  };

  const result = await invokeApp(app, '/help-questions', {
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(capturedFilter, {
    $or: [
      { userId: '507f1f77bcf86cd799439011' },
      { userId: { $exists: false }, username: 'tom' },
      { userId: null, username: 'tom' },
    ],
  });
  assert.deepEqual(capturedProjection, { _id: 0, __v: 0, userId: 0 });
  assert.deepEqual(capturedSort, { createdAt: -1 });
  assert.deepEqual(result.json, [
    {
      id: 'q1',
      username: 'tom',
      question: 'How do I use week view?',
      createdAt: '2026-04-21T10:00:00.000Z',
    },
  ]);
});

test('behavior: authenticated help question fetch falls back to username for legacy rows when the session user id is missing', async () => {
  jwt.verify = (token, secret, callback) =>
    callback(null, { username: 'tom', role: 'USER' });

  let capturedFilter;
  HelpQuestion.find = (filter) => {
    capturedFilter = filter;
    return {
      sort: async () => [],
    };
  };

  const result = await invokeApp(app, '/help-questions', {
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(capturedFilter, {
    $or: [
      { userId: { $exists: false }, username: 'tom' },
      { userId: null, username: 'tom' },
    ],
  });
});

test('behavior: authenticated help question fetch returns all questions for admins', async () => {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: 'user-1', username: 'tom', role: 'ADMIN' });

  let capturedFilter;
  HelpQuestion.find = (filter) => {
    capturedFilter = filter;
    return {
      sort: async () => [
        {
          id: 'q1',
          username: 'tom',
          question: 'How do I use week view?',
          createdAt: '2026-04-21T10:00:00.000Z',
        },
        {
          id: 'q2',
          username: 'alice',
          question: 'Can admins review everything?',
          createdAt: '2026-04-20T10:00:00.000Z',
        },
      ],
    };
  };

  const result = await invokeApp(app, '/help-questions', {
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(capturedFilter, {});
  assert.deepEqual(result.json, [
    {
      id: 'q1',
      username: 'tom',
      question: 'How do I use week view?',
      createdAt: '2026-04-21T10:00:00.000Z',
    },
    {
      id: 'q2',
      username: 'alice',
      question: 'Can admins review everything?',
      createdAt: '2026-04-20T10:00:00.000Z',
    },
  ]);
});

test('behavior: authenticated help question submission stores a new help question with the username', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });

  let createdPayload;
  HelpQuestion.create = async (payload) => {
    createdPayload = payload;
    return payload;
  };

  const result = await invokeApp(app, '/help-questions', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: {
      id: 'q1',
      question: 'How do I use week view?',
      createdAt: '2026-04-21T10:00:00.000Z',
    },
  });

  assert.equal(result.statusCode, 201);
  assert.equal(createdPayload.userId, '507f1f77bcf86cd799439011');
  assert.equal(createdPayload.username, 'tom');
  assert.equal(createdPayload.question, 'How do I use week view?');
  assert.notEqual(createdPayload.id, 'q1');
  assert.notEqual(createdPayload.createdAt, '2026-04-21T10:00:00.000Z');
  assert.match(createdPayload.id, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(result.json, {
    id: createdPayload.id,
    username: 'tom',
    question: 'How do I use week view?',
    createdAt: createdPayload.createdAt,
  });
});

test('behavior: help question submission rejects sessions without a valid owner id', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { username: 'tom', role: 'USER' });

  const result = await invokeApp(app, '/help-questions', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: {
      question: 'How do I use week view?',
    },
  });

  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.json, { error: 'Invalid session' });
});

test('behavior: non-admin help question delete is rejected', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom', role: 'USER' });

  const result = await invokeApp(app, '/help-questions/q1', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.json, { error: 'Admin access required' });
});

test('behavior: admin help question delete removes the selected question', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'admin-1', username: 'root', role: 'ADMIN' });

  let deleteFilter;
  HelpQuestion.findOneAndDelete = async (filter) => {
    deleteFilter = filter;
    return { id: 'q1' };
  };

  const result = await invokeApp(app, '/help-questions/q1', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Deleted' });
  assert.deepEqual(deleteFilter, { id: 'q1' });
});

test('behavior: authenticated task fetch returns the current user tasks', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  let cleanupFilter;
  Task.deleteMany = async (filter) => {
    cleanupFilter = filter;
    return { deletedCount: 1 };
  };
  Task.find = async () => ([
    {
      id: 'task-1',
      title: 'Review sprint',
      type: 'TEMPORARY',
      date: '2026-04-21',
    },
  ]);

  const result = await invokeApp(app, '/tasks', {
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(cleanupFilter, {
    userId: 'user-1',
    $or: [
      {
        completedAt: { $lt: cleanupFilter.$or[0].completedAt.$lt },
      },
      {
        done: true,
        completedAt: null,
        updatedAt: { $lt: cleanupFilter.$or[1].updatedAt.$lt },
      },
    ],
  });
  assert.deepEqual(result.json, [
    {
      id: 'task-1',
      title: 'Review sprint',
      type: 'TEMPORARY',
      date: '2026-04-21',
    },
  ]);
});

test('behavior: task create stores one task for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  Task.deleteMany = async () => ({ deletedCount: 0 });

  let updateFilter;
  let updatePayload;
  let updateOptions;
  Task.updateOne = async (filter, payload, options) => {
    updateFilter = filter;
    updatePayload = payload;
    updateOptions = options;
    return { upsertedCount: 1 };
  };

  const result = await invokeApp(app, '/tasks', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: {
      id: 'task-2',
      title: 'Write release notes',
      type: 'ONCE',
      beginDate: '2026-04-22',
      date: '2026-04-22',
    },
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.json, { message: 'Created' });
  assert.deepEqual(updateFilter, { id: 'task-2', userId: 'user-1' });
  assert.deepEqual(updatePayload, {
    $set: {
      id: 'task-2',
      title: 'Write release notes',
      type: 'ONCE',
      beginDate: '2026-04-22',
      date: '2026-04-22',
      userId: 'user-1',
      completedAt: null,
    },
    $unset: { done: 1 },
  });
  assert.deepEqual(updateOptions, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
});

test('behavior: repeated task create keeps one saved task for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  Task.deleteMany = async () => ({ deletedCount: 0 });
  Task.updateOne = async () => ({ upsertedCount: 0 });

  const result = await invokeApp(app, '/tasks', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: {
      id: 'task-2',
      title: 'Write release notes',
      type: 'ONCE',
      beginDate: '2026-04-22',
      date: '2026-04-22',
    },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Already saved' });
});

test('behavior: task update rewrites one task for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  Task.deleteMany = async () => ({ deletedCount: 0 });

  let updateFilter;
  let updatePayload;
  let updateOptions;
  Task.findOneAndUpdate = async (filter, payload, options) => {
    updateFilter = filter;
    updatePayload = payload;
    updateOptions = options;
    return { ...payload };
  };

  const result = await invokeApp(app, '/tasks/task-2', {
    method: 'PUT',
    headers: { Authorization: 'Bearer token' },
    body: {
      id: 'task-2',
      title: 'Write more release notes',
      type: 'RECURRING',
      beginDate: '2026-04-22',
      recurrence: {
        frequency: 'WEEKLY',
        interval: 1,
        weekdays: [3],
        until: null,
      },
    },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Updated' });
  assert.deepEqual(updateFilter, { id: 'task-2', userId: 'user-1' });
  assert.deepEqual(updatePayload, {
    id: 'task-2',
    title: 'Write more release notes',
    type: 'RECURRING',
    beginDate: '2026-04-22',
    recurrence: {
      frequency: 'WEEKLY',
      interval: 1,
      weekdays: [3],
      until: null,
    },
    userId: 'user-1',
    completedAt: null,
  });
  assert.deepEqual(updateOptions, { overwrite: true, returnDocument: 'after', runValidators: true });
});

test('behavior: normalizeTaskWritePayload maps legacy done state to completedAt for one-time tasks', () => {
  const taskPayload = normalizeTaskWritePayload({
    id: 'task-legacy',
    title: 'Legacy completed task',
    type: 'ONCE',
    done: true,
    createdAt: '2026-04-20T09:00:00.000Z',
    updatedAt: '2026-04-22T10:00:00.000Z',
  }, 'user-1');

  assert.deepEqual(taskPayload, {
    id: 'task-legacy',
    title: 'Legacy completed task',
    type: 'ONCE',
    createdAt: '2026-04-20T09:00:00.000Z',
    updatedAt: '2026-04-22T10:00:00.000Z',
    userId: 'user-1',
    completedAt: '2026-04-22T10:00:00.000Z',
  });
});

test('behavior: normalizeTaskWritePayload keeps one-time multi-day endDate values', () => {
  const taskPayload = normalizeTaskWritePayload({
    id: 'task-range',
    title: 'Conference',
    type: 'ONCE',
    beginDate: '2026-05-01',
    endDate: '2026-05-03',
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-05-01T09:00:00.000Z',
  }, 'user-1');

  assert.deepEqual(taskPayload, {
    id: 'task-range',
    title: 'Conference',
    type: 'ONCE',
    beginDate: '2026-05-01',
    endDate: '2026-05-03',
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-05-01T09:00:00.000Z',
    userId: 'user-1',
    completedAt: null,
  });
});

test('behavior: task delete removes one task for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });

  let deleteFilter;
  Task.findOneAndDelete = async (filter) => {
    deleteFilter = filter;
    return { id: 'task-2' };
  };

  const result = await invokeApp(app, '/tasks/task-2', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Deleted' });
  assert.deepEqual(deleteFilter, { id: 'task-2', userId: 'user-1' });
});

test('behavior: authenticated reminder fetch returns the current user reminders', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  let cleanupFilter;
  Reminder.deleteMany = async (filter) => {
    cleanupFilter = filter;
    return { deletedCount: 1 };
  };
  Reminder.find = async () => ([
    {
      id: 'reminder-1',
      title: 'Follow up',
      done: false,
    },
  ]);

  const result = await invokeApp(app, '/reminders', {
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(cleanupFilter, {
    userId: 'user-1',
    done: true,
    updatedAt: { $lt: cleanupFilter.updatedAt.$lt },
  });
  assert.deepEqual(result.json, [
    {
      id: 'reminder-1',
      title: 'Follow up',
      done: false,
    },
  ]);
});

test('behavior: authenticated notification public-key fetch returns the configured VAPID public key', async () => {
  process.env.VAPID_PUBLIC_KEY = 'public-test-key';
  process.env.VAPID_PRIVATE_KEY = 'private-test-key';
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: 'user-1', username: 'tom', role: 'USER' });

  const result = await invokeApp(app, '/notifications/public-key', {
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { publicKey: 'public-test-key' });
});

test('behavior: notification subscription save stores one browser endpoint for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: 'user-1', username: 'tom', role: 'USER' });
  User.findOne = async () => ({ _id: 'user-1', pushSubscriptions: [] });

  let updateFilter;
  let updatePayload;
  let updateOptions;
  User.updateOne = async (filter, payload, options) => {
    updateFilter = filter;
    updatePayload = payload;
    updateOptions = options;
    return { matchedCount: 1 };
  };

  const result = await invokeApp(app, '/notifications/subscriptions', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: {
      endpoint: 'https://push.example/sub-1',
      expirationTime: null,
      keys: {
        p256dh: 'p256dh-key',
        auth: 'auth-key',
      },
      timezone: 'America/Los_Angeles',
      locale: 'en',
      userAgent: 'Desktop Browser',
    },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Saved' });
  assert.deepEqual(updateFilter, { _id: 'user-1' });
  assert.equal(updatePayload.$set.pushSubscriptions.length, 1);
  assert.deepEqual(updatePayload.$set.pushSubscriptions[0], {
    endpoint: 'https://push.example/sub-1',
    expirationTime: null,
    keys: {
      p256dh: 'p256dh-key',
      auth: 'auth-key',
    },
    timezone: 'America/Los_Angeles',
    locale: 'en',
    userAgent: 'Desktop Browser',
    createdAt: updatePayload.$set.pushSubscriptions[0].createdAt,
    updatedAt: updatePayload.$set.pushSubscriptions[0].updatedAt,
    notificationHistory: [],
  });
  assert.deepEqual(updateOptions, { runValidators: true });
});

test('behavior: notification subscription delete removes one browser endpoint for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: 'user-1', username: 'tom', role: 'USER' });
  User.findOne = async () => ({
    _id: 'user-1',
    pushSubscriptions: [
      {
        endpoint: 'https://push.example/sub-1',
        expirationTime: null,
        keys: {
          p256dh: 'p256dh-key',
          auth: 'auth-key',
        },
        timezone: 'America/Los_Angeles',
        locale: 'en',
        userAgent: 'Desktop Browser',
        createdAt: '2026-04-28T16:00:00.000Z',
        updatedAt: '2026-04-28T16:00:00.000Z',
        notificationHistory: [],
      },
      {
        endpoint: 'https://push.example/sub-2',
        expirationTime: null,
        keys: {
          p256dh: 'p256dh-key-2',
          auth: 'auth-key-2',
        },
        timezone: 'America/Los_Angeles',
        locale: 'en',
        userAgent: 'Phone Browser',
        createdAt: '2026-04-28T16:05:00.000Z',
        updatedAt: '2026-04-28T16:05:00.000Z',
        notificationHistory: [],
      },
    ],
  });

  let updatePayload;
  User.updateOne = async (filter, payload) => {
    updatePayload = payload;
    return { matchedCount: 1 };
  };

  const result = await invokeApp(app, '/notifications/subscriptions', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer token' },
    body: {
      endpoint: 'https://push.example/sub-1',
    },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Deleted' });
  assert.deepEqual(updatePayload, {
    $set: {
      pushSubscriptions: [
        {
          endpoint: 'https://push.example/sub-2',
          expirationTime: null,
          keys: {
            p256dh: 'p256dh-key-2',
            auth: 'auth-key-2',
          },
          timezone: 'America/Los_Angeles',
          locale: 'en',
          userAgent: 'Phone Browser',
          createdAt: '2026-04-28T16:05:00.000Z',
          updatedAt: '2026-04-28T16:05:00.000Z',
          notificationHistory: [],
        },
      ],
    },
  });
});

test('behavior: reminder create stores one reminder for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  Reminder.deleteMany = async () => ({ deletedCount: 0 });

  let updateFilter;
  let updatePayload;
  let updateOptions;
  Reminder.updateOne = async (filter, payload, options) => {
    updateFilter = filter;
    updatePayload = payload;
    updateOptions = options;
    return { upsertedCount: 1 };
  };

  const result = await invokeApp(app, '/reminders', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: {
      id: 'reminder-2',
      title: 'Write summary',
      content: 'Send the weekly recap',
      emergency: 2,
      done: false,
    },
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.json, { message: 'Created' });
  assert.deepEqual(updateFilter, { id: 'reminder-2', userId: 'user-1' });
  assert.deepEqual(updatePayload, {
    $set: {
      id: 'reminder-2',
      title: 'Write summary',
      content: 'Send the weekly recap',
      emergency: 2,
      done: false,
      userId: 'user-1',
    },
  });
  assert.deepEqual(updateOptions, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
});

test('behavior: reminder update rewrites one reminder for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
  Reminder.deleteMany = async () => ({ deletedCount: 0 });

  let updateFilter;
  let updatePayload;
  let updateOptions;
  Reminder.findOneAndUpdate = async (filter, payload, options) => {
    updateFilter = filter;
    updatePayload = payload;
    updateOptions = options;
    return { ...payload };
  };

  const result = await invokeApp(app, '/reminders/reminder-2', {
    method: 'PUT',
    headers: { Authorization: 'Bearer token' },
    body: {
      id: 'reminder-2',
      title: 'Write summary',
      content: 'Send the updated weekly recap',
      emergency: 1,
      done: true,
    },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Updated' });
  assert.deepEqual(updateFilter, { id: 'reminder-2', userId: 'user-1' });
  assert.deepEqual(updatePayload, {
    id: 'reminder-2',
    title: 'Write summary',
    content: 'Send the updated weekly recap',
    emergency: 1,
    done: true,
    userId: 'user-1',
  });
  assert.deepEqual(updateOptions, { returnDocument: 'after', runValidators: true });
});

test('behavior: reminder delete removes one reminder for the authenticated user', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });

  let deleteFilter;
  Reminder.findOneAndDelete = async (filter) => {
    deleteFilter = filter;
    return { id: 'reminder-2' };
  };

  const result = await invokeApp(app, '/reminders/reminder-2', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Deleted' });
  assert.deepEqual(deleteFilter, { id: 'reminder-2', userId: 'user-1' });
});

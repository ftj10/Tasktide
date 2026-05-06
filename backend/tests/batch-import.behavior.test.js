// INPUT: /tasks/batch route and Task model
// OUTPUT: behavior coverage for batch task creation
// EFFECT: Verifies authentication, empty-array validation, happy path, and server-error handling
const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { app } = require('../server');
const Task = require('../models/Task');
const { invokeApp } = require('./helpers/http');

const originals = {
  jwtVerify: jwt.verify,
  taskUpdateOne: Task.updateOne.bind(Task),
  taskDeleteMany: Task.deleteMany.bind(Task),
};

function resetStubs() {
  jwt.verify = originals.jwtVerify;
  Task.updateOne = originals.taskUpdateOne;
  Task.deleteMany = originals.taskDeleteMany;
}

test.afterEach(() => {
  resetStubs();
});

function stubAuth() {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });
}

const SAMPLE_TASK = {
  id: 'task-abc-1',
  title: 'Midterm',
  type: 'ONCE',
  beginDate: '2026-10-15',
  date: '2026-10-15',
  emergency: 1,
  completedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test('behavior: tasks/batch - unauthenticated request returns 401', async () => {
  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: { tasks: [SAMPLE_TASK] },
  });

  assert.equal(result.statusCode, 401);
});

test('behavior: tasks/batch - empty tasks array returns 400', async () => {
  stubAuth();

  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: { tasks: [] },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'tasks array is required' });
});

test('behavior: tasks/batch - missing tasks field returns 400', async () => {
  stubAuth();

  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: {},
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 400);
});

test('behavior: tasks/batch - batch exceeding 200 tasks returns 400', async () => {
  stubAuth();

  const oversizedBatch = Array.from({ length: 201 }, (_, i) => ({ ...SAMPLE_TASK, id: `task-${i}` }));
  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: { tasks: oversizedBatch },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 400);
  assert.ok(result.json.error.includes('200'));
});

test('behavior: tasks/batch - valid tasks returns 201 with created count', async () => {
  stubAuth();
  Task.deleteMany = async () => ({ deletedCount: 0 });
  Task.updateOne = async () => ({ upsertedCount: 1, modifiedCount: 0 });

  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: { tasks: [SAMPLE_TASK, { ...SAMPLE_TASK, id: 'task-abc-2', title: 'Final' }] },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.json, { created: 2 });
});

test('behavior: tasks/batch - syllabusImportBatchId is forwarded to each task payload', async () => {
  stubAuth();
  Task.deleteMany = async () => ({ deletedCount: 0 });

  const capturedPayloads = [];
  Task.updateOne = async (filter, update) => {
    capturedPayloads.push(update.$set);
    return { upsertedCount: 1, modifiedCount: 0 };
  };

  const batchId = 'batch-uuid-test-1';
  const taskWithBatch = { ...SAMPLE_TASK, syllabusImportBatchId: batchId };

  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: { tasks: [taskWithBatch] },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 201);
  assert.equal(capturedPayloads[0].syllabusImportBatchId, batchId);
});

test('behavior: tasks/batch - database error returns 500', async () => {
  stubAuth();
  Task.deleteMany = async () => ({ deletedCount: 0 });
  Task.updateOne = async () => { throw new Error('DB connection lost'); };

  const result = await invokeApp(app, '/tasks/batch', {
    method: 'POST',
    body: { tasks: [SAMPLE_TASK] },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 500);
  assert.deepEqual(result.json, { error: 'Batch import failed' });
});

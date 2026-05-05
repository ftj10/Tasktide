// INPUT: DELETE /tasks/batch/:batchId route
// OUTPUT: behavior coverage for syllabus batch deletion
// EFFECT: Verifies authentication, happy path, and server-error handling
const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const { app } = require('../server');
const Task = require('../models/Task');
const { invokeApp } = require('./helpers/http');

const originals = {
  jwtVerify: jwt.verify,
  taskDeleteMany: Task.deleteMany.bind(Task),
};

function resetStubs() {
  jwt.verify = originals.jwtVerify;
  Task.deleteMany = originals.taskDeleteMany;
}

test.afterEach(() => {
  resetStubs();
});

function stubAuth() {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });
}

test('behavior: tasks/batch/:batchId DELETE - unauthenticated returns 401', async () => {
  const result = await invokeApp(app, '/tasks/batch/some-batch-id', {
    method: 'DELETE',
  });

  assert.equal(result.statusCode, 401);
});

test('behavior: tasks/batch/:batchId DELETE - deletes matching tasks and returns count', async () => {
  stubAuth();

  let capturedFilter;
  Task.deleteMany = async (filter) => {
    capturedFilter = filter;
    return { deletedCount: 5 };
  };

  const result = await invokeApp(app, '/tasks/batch/my-batch-uuid', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { deleted: 5 });
  assert.equal(capturedFilter.syllabusImportBatchId, 'my-batch-uuid');
});

test('behavior: tasks/batch/:batchId DELETE - returns 0 deleted when batch id not found', async () => {
  stubAuth();
  Task.deleteMany = async () => ({ deletedCount: 0 });

  const result = await invokeApp(app, '/tasks/batch/nonexistent-batch', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { deleted: 0 });
});

test('behavior: tasks/batch/:batchId DELETE - database error returns 500', async () => {
  stubAuth();
  Task.deleteMany = async () => { throw new Error('DB error'); };

  const result = await invokeApp(app, '/tasks/batch/some-batch', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 500);
  assert.deepEqual(result.json, { error: 'Batch delete failed' });
});

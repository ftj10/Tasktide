// INPUT: backend Express app
// OUTPUT: smoke coverage for protected routes
// EFFECT: Verifies auth guards stay active on key planner API endpoints
const test = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../server');
const { invokeApp } = require('./helpers/http');

test('smoke: protected task route rejects missing session', async () => {
  const result = await invokeApp(app, '/tasks');
  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.json, { error: 'Access denied' });
});

test('smoke: help questions route rejects missing session', async () => {
  const result = await invokeApp(app, '/help-questions');
  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.json, { error: 'Access denied' });
});

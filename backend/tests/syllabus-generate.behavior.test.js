// INPUT: /syllabus/generate-drafts route and syllabusAnalysis.generateDrafts
// OUTPUT: behavior coverage for JWT auth, body validation, Claude success/failure, schema validation
// EFFECT: stubs jwt.verify and syllabusAnalysis.generateDrafts to avoid real network calls
const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const { app } = require('../server');
const syllabusAnalysis = require('../syllabusAnalysis');
const { invokeApp } = require('./helpers/http');

const originals = {
  jwtVerify: jwt.verify,
  generateDrafts: syllabusAnalysis.generateDrafts.bind(syllabusAnalysis),
};

function resetStubs() {
  jwt.verify = originals.jwtVerify;
  syllabusAnalysis.generateDrafts = originals.generateDrafts;
}

test.afterEach(() => {
  resetStubs();
});

function stubAuth() {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });
}

const SAMPLE_DRAFT = {
  title: 'Midterm',
  sourceType: 'midterm',
  type: 'once',
  confidence: 'high',
  sourceText: 'Midterm exam on October 15',
  date: '2026-10-15',
};

test('behavior: syllabus/generate-drafts - unauthenticated request returns 401', async () => {
  const result = await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: { extractedText: 'CSCI 101 syllabus' },
  });

  assert.equal(result.statusCode, 401);
});

test('behavior: syllabus/generate-drafts - missing extractedText returns 400', async () => {
  stubAuth();

  const result = await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: {},
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'extractedText is required' });
});

test('behavior: syllabus/generate-drafts - successful Claude response returns 200 with drafts', async () => {
  stubAuth();
  syllabusAnalysis.generateDrafts = async () => [SAMPLE_DRAFT];

  const result = await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: { extractedText: 'Course syllabus content', studyPreferences: 'study 2h before exams' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.json.length, 1);
  assert.equal(result.json[0].title, 'Midterm');
});

test('behavior: syllabus/generate-drafts - Claude API failure returns 502', async () => {
  stubAuth();
  syllabusAnalysis.generateDrafts = async () => {
    const err = new Error('Claude API call failed');
    err.claudeError = true;
    throw err;
  };

  const result = await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: { extractedText: 'some syllabus' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 502);
  assert.ok(result.json.error.toLowerCase().includes('claude'));
});

test('behavior: syllabus/generate-drafts - schema validation failure returns 422', async () => {
  stubAuth();
  syllabusAnalysis.generateDrafts = async () => {
    const err = new Error('Claude response failed schema validation');
    err.validationError = true;
    throw err;
  };

  const result = await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: { extractedText: 'some syllabus' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 422);
});

test('behavior: syllabus/generate-drafts - route forwards studyPreferences as second arg to generateDrafts', async () => {
  stubAuth();

  let capturedArgs;
  syllabusAnalysis.generateDrafts = async (...args) => {
    capturedArgs = args;
    return [SAMPLE_DRAFT];
  };

  await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: { extractedText: 'CSCI 101 syllabus', studyPreferences: 'remind me 3 days before exams' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(capturedArgs[0], 'CSCI 101 syllabus');
  assert.equal(capturedArgs[1], 'remind me 3 days before exams');
});

test('behavior: syllabus/generate-drafts - omitting studyPreferences passes empty string and returns 200', async () => {
  stubAuth();

  let capturedPreferences;
  syllabusAnalysis.generateDrafts = async (_text, prefs) => {
    capturedPreferences = prefs;
    return [];
  };

  const result = await invokeApp(app, '/syllabus/generate-drafts', {
    method: 'POST',
    body: { extractedText: 'CSCI 101 syllabus' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(capturedPreferences, '');
});

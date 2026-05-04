// INPUT: syllabus analysis route and analyzeSyllabus function
// OUTPUT: behavior coverage for /syllabus/analyze and draft filtering
// EFFECT: Verifies authentication, validation, happy path, and invalid-field filtering without hitting the Anthropic API
const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const { app } = require('../server');
const syllabusAnalysis = require('../syllabusAnalysis');
const { invokeApp } = require('./helpers/http');

const originals = {
  jwtVerify: jwt.verify,
  analyzeSyllabus: syllabusAnalysis.analyzeSyllabus,
};

function resetStubs() {
  jwt.verify = originals.jwtVerify;
  syllabusAnalysis.analyzeSyllabus = originals.analyzeSyllabus;
}

test.afterEach(() => {
  resetStubs();
});

function stubAuth() {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });
}

test('behavior: syllabus/analyze - unauthenticated request returns 401', async () => {
  const result = await invokeApp(app, '/syllabus/analyze', {
    method: 'POST',
    body: { text: 'Midterm exam on October 15' },
  });

  assert.equal(result.statusCode, 401);
});

test('behavior: syllabus/analyze - missing text body returns 400', async () => {
  stubAuth();

  const result = await invokeApp(app, '/syllabus/analyze', {
    method: 'POST',
    body: {},
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'text is required' });
});

test('behavior: syllabus/analyze - empty string text returns 400', async () => {
  stubAuth();

  const result = await invokeApp(app, '/syllabus/analyze', {
    method: 'POST',
    body: { text: '   ' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'text is required' });
});

test('behavior: syllabus/analyze - happy path returns drafts as JSON with status 200', async () => {
  stubAuth();

  const mockDrafts = [
    {
      title: 'Midterm Exam',
      sourceType: 'midterm',
      type: 'once',
      date: '2026-10-15',
      confidence: 'high',
      sourceText: 'Midterm exam on October 15',
    },
  ];

  syllabusAnalysis.analyzeSyllabus = async () => mockDrafts;

  const result = await invokeApp(app, '/syllabus/analyze', {
    method: 'POST',
    body: { text: 'Midterm exam on October 15' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, mockDrafts);
});

test('behavior: syllabus/analyze - API failure returns 500', async () => {
  stubAuth();

  syllabusAnalysis.analyzeSyllabus = async () => {
    throw new Error('API error');
  };

  const result = await invokeApp(app, '/syllabus/analyze', {
    method: 'POST',
    body: { text: 'Some syllabus text' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 500);
  assert.deepEqual(result.json, { error: 'Analysis failed' });
});

test('behavior: analyzeSyllabus - filters out drafts missing required fields', async () => {
  const validDraft = {
    title: 'Final Exam',
    sourceType: 'final',
    type: 'once',
    date: '2026-12-10',
    confidence: 'high',
    sourceText: 'Final exam December 10',
  };

  const missingTitle = {
    sourceType: 'assignment',
    type: 'once',
    confidence: 'medium',
    sourceText: 'Assignment due',
  };

  const missingSourceType = {
    title: 'Lab Session',
    type: 'recurring',
    confidence: 'high',
    sourceText: 'Weekly lab',
  };

  const missingConfidence = {
    title: 'Quiz 1',
    sourceType: 'quiz',
    type: 'once',
    sourceText: 'Quiz on Friday',
  };

  const missingSourceText = {
    title: 'Lecture',
    sourceType: 'lecture',
    type: 'recurring',
    confidence: 'low',
  };

  const mockClient = {
    messages: {
      create: async () => ({
        content: [
          {
            type: 'tool_use',
            input: {
              tasks: [
                validDraft,
                missingTitle,
                missingSourceType,
                missingConfidence,
                missingSourceText,
              ],
            },
          },
        ],
      }),
    },
  };

  const result = await syllabusAnalysis.analyzeSyllabus('some text', mockClient);

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], validDraft);
});

test('behavior: analyzeSyllabus - returns empty array when no tool_use block in response', async () => {
  const mockClient = {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: 'I cannot parse this.' }],
      }),
    },
  };

  const result = await syllabusAnalysis.analyzeSyllabus('unrecognizable text', mockClient);

  assert.deepEqual(result, []);
});

// INPUT: ambiguity detector and authenticated route
// OUTPUT: behavior coverage for parsing, fallback, and HTTP validation
// EFFECT: Verifies syllabus ambiguity questions without calling Anthropic
const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const { app } = require('../server');
const syllabusAnalysis = require('../syllabusAnalysis');
const { invokeApp } = require('./helpers/http');

const originals = {
  jwtVerify: jwt.verify,
  detectAmbiguities: syllabusAnalysis.detectAmbiguities,
};

function resetStubs() {
  jwt.verify = originals.jwtVerify;
  syllabusAnalysis.detectAmbiguities = originals.detectAmbiguities;
}

test.afterEach(() => {
  resetStubs();
});

function stubAuth() {
  jwt.verify = (token, secret, callback) =>
    callback(null, { userId: '507f1f77bcf86cd799439011', username: 'tom', role: 'USER' });
}

function makeClient(text) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text }],
      }),
    },
  };
}

test('behavior: detectAmbiguities - returns parsed question array', async () => {
  const result = await syllabusAnalysis.detectAmbiguities(
    'Midterm date TBA',
    makeClient('["What is the midterm date?"]'),
  );

  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0], 'What is the midterm date?');
});

test('behavior: detectAmbiguities - returns empty array on parse failure', async () => {
  const result = await syllabusAnalysis.detectAmbiguities(
    'Midterm date TBA',
    makeClient('not json at all'),
  );

  assert.deepEqual(result, []);
});

test('behavior: detectAmbiguities - asks which section applies when syllabus has multiple sections', async () => {
  const text = [
    'MATH 101 Course Outline',
    'Section A01: Monday Wednesday 09:00-10:20',
    'Section B02: Tuesday Thursday 13:00-14:20',
    'Final exam date TBA',
  ].join('\n');

  const result = await syllabusAnalysis.detectAmbiguities(text, makeClient('[]'));

  assert.ok(result.some((question) => /which section/i.test(question)));
});

test('behavior: detectAmbiguities - prompt explicitly prioritizes section selection', async () => {
  let capturedPrompt;
  const client = {
    messages: {
      create: async (params) => {
        capturedPrompt = params.messages[0].content;
        return { content: [{ type: 'text', text: '[]' }] };
      },
    },
  };

  await syllabusAnalysis.detectAmbiguities('Section A01 and Section B02 meet at different times', client);

  assert.match(capturedPrompt, /multiple sections/i);
  assert.match(capturedPrompt, /which section/i);
});

test('behavior: api/syllabus/detect-ambiguities - returns questions and validates text', async () => {
  stubAuth();
  syllabusAnalysis.detectAmbiguities = async () => ['What is the midterm date?'];

  const okResult = await invokeApp(app, '/api/syllabus/detect-ambiguities', {
    method: 'POST',
    body: { extractedText: 'Midterm date TBA' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(okResult.statusCode, 200);
  assert.deepEqual(okResult.json, { questions: ['What is the midterm date?'] });

  const missingResult = await invokeApp(app, '/api/syllabus/detect-ambiguities', {
    method: 'POST',
    body: {},
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(missingResult.statusCode, 400);
});

test('behavior: syllabus/detect-ambiguities - proxy-stripped path returns questions', async () => {
  stubAuth();
  syllabusAnalysis.detectAmbiguities = async () => ['Which Fridays have labs?'];

  const result = await invokeApp(app, '/syllabus/detect-ambiguities', {
    method: 'POST',
    body: { extractedText: 'Labs on selected Fridays' },
    headers: { Authorization: 'Bearer valid-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { questions: ['Which Fridays have labs?'] });
});

// INPUT: backend models, crypto helpers, and Express app
// OUTPUT: behavior coverage for auth and help-question routes
// EFFECT: Verifies core backend feature flows without reaching external services
const test = require('node:test');
const assert = require('node:assert/strict');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('../models/Task');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const HelpQuestion = require('../models/HelpQuestion');
const { app } = require('../server');
const { invokeApp } = require('./helpers/http');

const originals = {
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
  },
  task: {
    find: Task.find,
    deleteMany: Task.deleteMany,
    insertMany: Task.insertMany,
  },
  reminder: {
    find: Reminder.find,
    deleteMany: Reminder.deleteMany,
    insertMany: Reminder.insertMany,
  },
  helpQuestion: {
    find: HelpQuestion.find,
    save: HelpQuestion.prototype.save,
  },
};

// INPUT: captured original module methods
// OUTPUT: restored test doubles
// EFFECT: Resets backend feature stubs between behavior tests
function resetStubs() {
  bcrypt.genSalt = originals.bcrypt.genSalt;
  bcrypt.hash = originals.bcrypt.hash;
  bcrypt.compare = originals.bcrypt.compare;
  jwt.sign = originals.jwt.sign;
  jwt.verify = originals.jwt.verify;
  User.findOne = originals.user.findOne;
  User.prototype.save = originals.user.save;
  Task.find = originals.task.find;
  Task.deleteMany = originals.task.deleteMany;
  Task.insertMany = originals.task.insertMany;
  Reminder.find = originals.reminder.find;
  Reminder.deleteMany = originals.reminder.deleteMany;
  Reminder.insertMany = originals.reminder.insertMany;
  HelpQuestion.find = originals.helpQuestion.find;
  HelpQuestion.prototype.save = originals.helpQuestion.save;
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
    savedUser = { username: this.username, password: this.password };
  };

  const result = await invokeApp(app, '/register', {
    method: 'POST',
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.json, { message: 'Registered' });
  assert.deepEqual(savedUser, { username: 'tom', password: 'hashed:secret' });
});

test('behavior: login returns a token for valid credentials', async () => {
  User.findOne = async () => ({ _id: 'user-1', username: 'tom', password: 'hashed' });
  bcrypt.compare = async () => true;
  jwt.sign = () => 'signed-token';

  const result = await invokeApp(app, '/login', {
    method: 'POST',
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { token: 'signed-token', username: 'tom' });
});

test('behavior: authenticated help question submission stores the public question with the username', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });

  let savedQuestion;
  HelpQuestion.prototype.save = async function save() {
    savedQuestion = {
      id: this.id,
      username: this.username,
      question: this.question,
      createdAt: this.createdAt,
    };
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
  assert.deepEqual(result.json, { message: 'Saved' });
  assert.deepEqual(savedQuestion, {
    id: 'q1',
    username: 'tom',
    question: 'How do I use week view?',
    createdAt: '2026-04-21T10:00:00.000Z',
  });
});

test('behavior: authenticated task fetch returns the current user tasks', async () => {
  jwt.verify = (token, secret, callback) => callback(null, { userId: 'user-1', username: 'tom' });
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
  assert.deepEqual(result.json, [
    {
      id: 'task-1',
      title: 'Review sprint',
      type: 'TEMPORARY',
      date: '2026-04-21',
    },
  ]);
});

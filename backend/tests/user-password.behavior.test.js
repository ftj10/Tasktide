// INPUT: account API requests and mocked user persistence
// OUTPUT: behavior coverage for password updates and current user profile
// EFFECT: Verifies authenticated account management routes without a database
const test = require('node:test');
const assert = require('node:assert/strict');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { app } = require('../server');
const { invokeApp } = require('./helpers/http');

const originals = {
  bcrypt: {
    genSalt: bcrypt.genSalt,
    hash: bcrypt.hash,
    compare: bcrypt.compare,
  },
  jwt: {
    verify: jwt.verify,
  },
  user: {
    findOne: User.findOne,
  },
};

function authHeaders() {
  return { authorization: 'Bearer test-token' };
}

function resetStubs() {
  bcrypt.genSalt = originals.bcrypt.genSalt;
  bcrypt.hash = originals.bcrypt.hash;
  bcrypt.compare = originals.bcrypt.compare;
  jwt.verify = originals.jwt.verify;
  User.findOne = originals.user.findOne;
}

test.beforeEach(() => {
  jwt.verify = (token, secret, callback) => callback(null, {
    userId: 'user-1',
    username: 'tom',
    role: 'USER',
  });
});

test.afterEach(() => {
  resetStubs();
});

test('behavior: PUT /user/password with valid credentials returns 200', async () => {
  let savedPassword;
  User.findOne = async () => ({
    _id: 'user-1',
    username: 'tom',
    password: 'hashed-old',
    role: 'USER',
    save: async function save() {
      savedPassword = this.password;
    },
  });
  bcrypt.compare = async () => true;
  bcrypt.genSalt = async () => 'salt';
  bcrypt.hash = async () => 'hashed-new';

  const result = await invokeApp(app, '/user/password', {
    method: 'PUT',
    headers: authHeaders(),
    body: { currentPassword: 'old-password', newPassword: 'new-password' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Password updated' });
  assert.equal(savedPassword, 'hashed-new');
});

test('behavior: PUT /user/password with wrong current password returns 401', async () => {
  User.findOne = async () => ({
    _id: 'user-1',
    username: 'tom',
    password: 'hashed-old',
    role: 'USER',
  });
  bcrypt.compare = async () => false;

  const result = await invokeApp(app, '/user/password', {
    method: 'PUT',
    headers: authHeaders(),
    body: { currentPassword: 'wrong-password', newPassword: 'new-password' },
  });

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.json, { error: 'Invalid current password' });
});

test('behavior: PUT /user/password with short new password returns 400', async () => {
  let findOneCalls = 0;
  User.findOne = async () => {
    findOneCalls += 1;
    return null;
  };

  const result = await invokeApp(app, '/user/password', {
    method: 'PUT',
    headers: authHeaders(),
    body: { currentPassword: 'old-password', newPassword: 'short' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'Password must be at least 8 characters' });
  assert.equal(findOneCalls, 0);
});

test('behavior: GET /user/me returns username and role', async () => {
  User.findOne = async () => ({
    _id: 'user-1',
    username: 'tom',
    role: 'ADMIN',
    email: null,
    emailNotifications: false,
  });

  const result = await invokeApp(app, '/user/me', {
    headers: authHeaders(),
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, {
    username: 'tom',
    role: 'ADMIN',
    email: null,
    emailNotifications: false,
  });
});

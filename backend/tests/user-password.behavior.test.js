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
    sign: jwt.sign,
    verify: jwt.verify,
  },
  user: {
    findOne: User.findOne,
    updateOne: User.updateOne,
  },
};

function authHeaders() {
  return { authorization: 'Bearer test-token' };
}

function resetStubs() {
  bcrypt.genSalt = originals.bcrypt.genSalt;
  bcrypt.hash = originals.bcrypt.hash;
  bcrypt.compare = originals.bcrypt.compare;
  jwt.sign = originals.jwt.sign;
  jwt.verify = originals.jwt.verify;
  User.findOne = originals.user.findOne;
  User.updateOne = originals.user.updateOne;
}

function createTestUser(username, overrides = {}) {
  return {
    _id: `${username}-id`,
    username,
    password: 'hashed-password',
    role: 'USER',
    savedAccounts: [],
    ...overrides,
  };
}

function usernameFromFilter(filter) {
  return String(filter?.username ?? '').replace(/^\/\^/, '').replace(/\$\/i$/, '');
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
    avatar: null,
  });
});

test('behavior: POST /account-token propagates A to B and B to A connections in DB', async () => {
  const users = new Map([
    ['tom', createTestUser('tom')],
    ['sam', createTestUser('sam')],
  ]);
  bcrypt.compare = async () => true;
  jwt.sign = (payload) => `tok-${payload.username}`;
  User.findOne = async (filter) => users.get(usernameFromFilter(filter).toLowerCase()) ?? null;
  User.updateOne = async (filter, payload) => {
    const user = users.get(usernameFromFilter(filter).toLowerCase());
    if (user) user.savedAccounts = payload.$set.savedAccounts;
    return { matchedCount: user ? 1 : 0 };
  };

  const result = await invokeApp(app, '/account-token', {
    method: 'POST',
    headers: authHeaders(),
    body: { username: 'sam', password: 'password1' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(users.get('tom').savedAccounts, [{ username: 'sam', switchToken: 'tok-sam' }]);
  assert.deepEqual(users.get('sam').savedAccounts, [{ username: 'tom', switchToken: 'tok-tom' }]);
});

test('behavior: POST /account-token when B already has C gives A C and C A', async () => {
  const users = new Map([
    ['tom', createTestUser('tom')],
    ['sam', createTestUser('sam', {
      savedAccounts: [{ username: 'carol', switchToken: 'old-carol' }],
    })],
    ['carol', createTestUser('carol')],
  ]);
  bcrypt.compare = async () => true;
  jwt.sign = (payload) => `tok-${payload.username}`;
  User.findOne = async (filter) => users.get(usernameFromFilter(filter).toLowerCase()) ?? null;
  User.updateOne = async (filter, payload) => {
    const user = users.get(usernameFromFilter(filter).toLowerCase());
    if (user) user.savedAccounts = payload.$set.savedAccounts;
    return { matchedCount: user ? 1 : 0 };
  };

  const result = await invokeApp(app, '/account-token', {
    method: 'POST',
    headers: authHeaders(),
    body: { username: 'sam', password: 'password1' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json.newConnections, [{ username: 'carol', switchToken: 'tok-carol' }]);
  assert.deepEqual(users.get('tom').savedAccounts, [
    { username: 'sam', switchToken: 'tok-sam' },
    { username: 'carol', switchToken: 'tok-carol' },
  ]);
  assert.deepEqual(users.get('carol').savedAccounts, [{ username: 'tom', switchToken: 'tok-tom' }]);
});

test('behavior: GET /account-connections returns current user DB connections', async () => {
  User.findOne = async () => ({
    _id: 'user-1',
    username: 'tom',
    role: 'USER',
    savedAccounts: [{ username: 'sam', switchToken: 'tok-sam' }],
  });

  const result = await invokeApp(app, '/account-connections', {
    headers: authHeaders(),
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, {
    connections: [{ username: 'sam', switchToken: 'tok-sam' }],
  });
});

test('behavior: GET /account-connections without auth returns 401', async () => {
  const result = await invokeApp(app, '/account-connections');

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.json, { error: 'Access denied' });
});

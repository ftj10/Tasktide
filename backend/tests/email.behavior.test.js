// INPUT: email preference, reset, and broadcast API requests
// OUTPUT: behavior coverage for email-related account routes
// EFFECT: Verifies validation, privacy-preserving reset behavior, and admin authorization
const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');

const User = require('../models/User');
const emailService = require('../emailService');
const { app } = require('../server');
const { invokeApp } = require('./helpers/http');

const originals = {
  env: {
    emailHost: process.env.EMAIL_HOST,
  },
  jwt: {
    verify: jwt.verify,
  },
  user: {
    updateOne: User.updateOne,
    findOne: User.findOne,
    find: User.find,
  },
  emailService: {
    isEmailConfigured: emailService.isEmailConfigured,
    sendEmail: emailService.sendEmail,
  },
};

function authHeaders(role = 'USER') {
  jwt.verify = (token, secret, callback) => callback(null, {
    userId: 'user-1',
    username: 'tom',
    role,
  });
  return { authorization: 'Bearer test-token' };
}

function resetStubs() {
  if (typeof originals.env.emailHost === 'string') {
    process.env.EMAIL_HOST = originals.env.emailHost;
  } else {
    delete process.env.EMAIL_HOST;
  }
  jwt.verify = originals.jwt.verify;
  User.updateOne = originals.user.updateOne;
  User.findOne = originals.user.findOne;
  User.find = originals.user.find;
  emailService.isEmailConfigured = originals.emailService.isEmailConfigured;
  emailService.sendEmail = originals.emailService.sendEmail;
}

test.afterEach(() => {
  resetStubs();
});

test('behavior: PUT /user/email with valid email returns 200', async () => {
  let update;
  User.updateOne = async (filter, payload) => {
    update = { filter, payload };
    return { matchedCount: 1 };
  };

  const result = await invokeApp(app, '/user/email', {
    method: 'PUT',
    headers: authHeaders(),
    body: { email: 'tom@example.com', emailNotifications: true },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'Email preferences updated' });
  assert.deepEqual(update.payload.$set, { email: 'tom@example.com', emailNotifications: true });
});

test('behavior: PUT /user/email with invalid format returns 400', async () => {
  const result = await invokeApp(app, '/user/email', {
    method: 'PUT',
    headers: authHeaders(),
    body: { email: 'bad-email', emailNotifications: true },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'Invalid email' });
});

test('behavior: PUT /user/email with empty string sets email to null', async () => {
  let update;
  User.updateOne = async (filter, payload) => {
    update = payload.$set;
    return { matchedCount: 1 };
  };

  const result = await invokeApp(app, '/user/email', {
    method: 'PUT',
    headers: authHeaders(),
    body: { email: '', emailNotifications: true },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(update, { email: null, emailNotifications: false });
});

test('behavior: POST /auth/forgot-password always returns 200 when user is not found', async () => {
  process.env.EMAIL_HOST = 'smtp.example.com';
  User.findOne = async () => null;

  const result = await invokeApp(app, '/auth/forgot-password', {
    method: 'POST',
    body: { email: 'missing@example.com' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { message: 'If that email is registered, a reset link has been sent.' });
});

test('behavior: POST /auth/reset-password with expired token returns 400', async () => {
  User.findOne = async () => ({
    email: 'tom@example.com',
    passwordResetToken: 'hashed-token',
    passwordResetExpiry: new Date(Date.now() - 1000),
  });

  const result = await invokeApp(app, '/auth/reset-password', {
    method: 'POST',
    body: { email: 'tom@example.com', token: 'token', newPassword: 'new-password' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'Invalid or expired reset token' });
});

test('behavior: POST /admin/email-broadcast as non-admin returns 403', async () => {
  const result = await invokeApp(app, '/admin/email-broadcast', {
    method: 'POST',
    headers: authHeaders('USER'),
    body: { subject: 'Update', html: '<p>Hello</p>' },
  });

  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.json, { error: 'Admin access required' });
});

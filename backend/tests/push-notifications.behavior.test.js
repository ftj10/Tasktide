// INPUT: VAPID configuration sources, stored push subscriptions, and notification payloads
// OUTPUT: behavior coverage for Web Push helper configuration and payload mapping
// EFFECT: Verifies push notifications can be configured and sent without real filesystem or web-push calls
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_PUSH_SUBJECT,
  configureWebPush,
  getPushPublicKey,
  loadVapidKeys,
  sendWebPushNotification,
  toWebPushSubscription,
} = require('../pushNotifications');

test('behavior: loadVapidKeys returns keys from environment when both keys are set', () => {
  const keys = loadVapidKeys({
    env: {
      VAPID_PUBLIC_KEY: 'env-public',
      VAPID_PRIVATE_KEY: 'env-private',
    },
    fsModule: {
      existsSync: () => {
        throw new Error('filesystem should not be read');
      },
    },
  });

  assert.deepEqual(keys, {
    publicKey: 'env-public',
    privateKey: 'env-private',
  });
});

test('behavior: loadVapidKeys reads keys from file when environment keys are absent', () => {
  const keys = loadVapidKeys({
    env: {},
    vapidFilePath: '/tmp/vapid.json',
    fsModule: {
      existsSync: () => true,
      readFileSync: (filePath, encoding) => {
        assert.equal(filePath, '/tmp/vapid.json');
        assert.equal(encoding, 'utf8');
        return JSON.stringify({ publicKey: 'file-public', privateKey: 'file-private' });
      },
    },
  });

  assert.deepEqual(keys, {
    publicKey: 'file-public',
    privateKey: 'file-private',
  });
});

test('behavior: loadVapidKeys generates and writes keys when no source exists', () => {
  let writtenFilePath;
  let writtenContents;

  const keys = loadVapidKeys({
    env: {},
    vapidFilePath: '/tmp/vapid.json',
    fsModule: {
      existsSync: () => false,
      writeFileSync: (filePath, contents) => {
        writtenFilePath = filePath;
        writtenContents = contents;
      },
    },
    generateKeys: () => ({ publicKey: 'generated-public', privateKey: 'generated-private' }),
  });

  assert.deepEqual(keys, {
    publicKey: 'generated-public',
    privateKey: 'generated-private',
  });
  assert.equal(writtenFilePath, '/tmp/vapid.json');
  assert.equal(writtenContents, JSON.stringify(keys, null, 2));
});

test('behavior: getPushPublicKey returns the public VAPID key', () => {
  const publicKey = getPushPublicKey({
    env: {
      VAPID_PUBLIC_KEY: 'env-public',
      VAPID_PRIVATE_KEY: 'env-private',
    },
  });

  assert.equal(publicKey, 'env-public');
});

test('behavior: configureWebPush applies subject and loaded VAPID keys', () => {
  const calls = [];
  const webPushClient = {
    setVapidDetails: (...args) => {
      calls.push(args);
    },
  };

  const result = configureWebPush({
    env: { WEB_PUSH_SUBJECT: 'mailto:test@example.com' },
    webPushClient,
    loadKeys: () => ({ publicKey: 'public', privateKey: 'private' }),
  });

  assert.equal(result, webPushClient);
  assert.deepEqual(calls, [['mailto:test@example.com', 'public', 'private']]);
});

test('behavior: configureWebPush uses the default subject when none is configured', () => {
  const calls = [];

  configureWebPush({
    env: {},
    webPushClient: {
      setVapidDetails: (...args) => {
        calls.push(args);
      },
    },
    loadKeys: () => ({ publicKey: 'public', privateKey: 'private' }),
  });

  assert.deepEqual(calls, [[DEFAULT_PUSH_SUBJECT, 'public', 'private']]);
});

test('behavior: toWebPushSubscription maps stored subscriptions to Web Push payload format', () => {
  assert.deepEqual(toWebPushSubscription({
    endpoint: 'https://push.example/subscription',
    expirationTime: 123,
    keys: {
      p256dh: 'p256dh-value',
      auth: 'auth-value',
    },
  }), {
    endpoint: 'https://push.example/subscription',
    expirationTime: 123,
    keys: {
      p256dh: 'p256dh-value',
      auth: 'auth-value',
    },
  });
});

test('behavior: toWebPushSubscription uses empty key strings when stored keys are missing', () => {
  assert.deepEqual(toWebPushSubscription({
    endpoint: 'https://push.example/subscription',
  }), {
    endpoint: 'https://push.example/subscription',
    expirationTime: null,
    keys: {
      p256dh: '',
      auth: '',
    },
  });
});

test('behavior: sendWebPushNotification sends a JSON payload through web-push', async () => {
  const calls = [];
  const webPushClient = {
    setVapidDetails: () => {},
    sendNotification: async (...args) => {
      calls.push(args);
      return { statusCode: 201 };
    },
  };

  const result = await sendWebPushNotification(
    {
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
    },
    { title: 'Task soon', body: 'Start at 10:00' },
    {
      webPushClient,
      loadKeys: () => ({ publicKey: 'public', privateKey: 'private' }),
    }
  );

  assert.deepEqual(calls, [[
    {
      endpoint: 'https://push.example/subscription',
      expirationTime: null,
      keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
    },
    JSON.stringify({ title: 'Task soon', body: 'Start at 10:00' }),
  ]]);
  assert.deepEqual(result, { statusCode: 201 });
});

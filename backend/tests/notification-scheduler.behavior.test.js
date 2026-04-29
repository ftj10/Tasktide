// INPUT: notification scheduler helpers plus mocked users and tasks
// OUTPUT: behavior coverage for push notification scheduling and cleanup
// EFFECT: Verifies backend push delivery reaches due desktop and mobile subscriptions without duplicating or retaining expired endpoints
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  collectDueNotificationsForSubscription,
  dispatchDueNotifications,
} = require('../notificationScheduler');

test('behavior: collectDueNotificationsForSubscription returns daily and task notifications when the local minute is crossed', () => {
  const results = collectDueNotificationsForSubscription({
    subscription: {
      timezone: 'America/Los_Angeles',
      locale: 'en',
      notificationHistory: [],
    },
    tasks: [
      {
        id: 'task-1',
        title: 'Standup',
        type: 'ONCE',
        date: '2026-04-28',
        beginDate: '2026-04-28',
        startTime: '10:15',
        createdAt: '2026-04-28T08:00:00.000Z',
        updatedAt: '2026-04-28T08:00:00.000Z',
      },
    ],
    previousRunAt: new Date('2026-04-28T16:59:20.000Z'),
    now: new Date('2026-04-28T17:00:20.000Z'),
  });

  assert.deepEqual(results, [
    {
      id: 'daily:2026-04-28:10',
      payload: {
        title: 'Daily Reminder',
        body: "Don't forget your tasks for today.",
        tag: 'daily-2026-04-28',
        url: '/',
      },
    },
    {
      id: 'task:task-1:2026-04-28',
      payload: {
        title: 'Task Starting Soon: Standup',
        body: 'Starts at 10:15 AM',
        tag: 'task-Standup-10:15',
        url: '/',
      },
    },
  ]);
});

test('behavior: dispatchDueNotifications records sent history after pruning stale entries', async () => {
  let updatePayload;
  const sendCalls = [];

  const result = await dispatchDueNotifications({
    now: new Date('2026-04-28T17:00:20.000Z'),
    previousRunAt: new Date('2026-04-28T16:59:20.000Z'),
    userModel: {
      find: async () => ([
        {
          _id: 'user-1',
          pushSubscriptions: [
            {
              endpoint: 'https://push.example/sub-1',
              expirationTime: null,
              keys: {
                p256dh: 'p256dh-key',
                auth: 'auth-key',
              },
              timezone: 'America/Los_Angeles',
              locale: 'en',
              userAgent: 'Desktop Browser',
              createdAt: '2026-04-20T10:00:00.000Z',
              updatedAt: '2026-04-20T10:00:00.000Z',
              notificationHistory: [
                {
                  id: 'daily:2026-04-24:10',
                  firedAt: '2026-04-24T17:00:00.000Z',
                },
              ],
            },
          ],
        },
      ]),
      updateOne: async (filter, payload) => {
        updatePayload = payload;
        return { matchedCount: 1 };
      },
    },
    taskModel: {
      find: async () => ([]),
    },
    sendNotification: async (subscription, payload) => {
      sendCalls.push({ subscription, payload });
    },
  });

  assert.deepEqual(result, {
    sentCount: 1,
    removedSubscriptionCount: 0,
  });
  assert.equal(sendCalls.length, 1);
  assert.deepEqual(updatePayload, {
    $set: {
      pushSubscriptions: [
        {
          endpoint: 'https://push.example/sub-1',
          expirationTime: null,
          keys: {
            p256dh: 'p256dh-key',
            auth: 'auth-key',
          },
          timezone: 'America/Los_Angeles',
          locale: 'en',
          userAgent: 'Desktop Browser',
          createdAt: '2026-04-20T10:00:00.000Z',
          updatedAt: '2026-04-20T10:00:00.000Z',
          notificationHistory: [
            {
              id: 'daily:2026-04-28:10',
              firedAt: '2026-04-28T17:00:20.000Z',
            },
          ],
        },
      ],
    },
  });
});

test('behavior: dispatchDueNotifications removes expired subscriptions after a gone response', async () => {
  let updatePayload;

  const result = await dispatchDueNotifications({
    now: new Date('2026-04-28T17:00:20.000Z'),
    previousRunAt: new Date('2026-04-28T16:59:20.000Z'),
    userModel: {
      find: async () => ([
        {
          _id: 'user-1',
          pushSubscriptions: [
            {
              endpoint: 'https://push.example/sub-1',
              expirationTime: null,
              keys: {
                p256dh: 'p256dh-key',
                auth: 'auth-key',
              },
              timezone: 'America/Los_Angeles',
              locale: 'en',
              userAgent: 'Desktop Browser',
              createdAt: '2026-04-20T10:00:00.000Z',
              updatedAt: '2026-04-20T10:00:00.000Z',
              notificationHistory: [],
            },
          ],
        },
      ]),
      updateOne: async (filter, payload) => {
        updatePayload = payload;
        return { matchedCount: 1 };
      },
    },
    taskModel: {
      find: async () => ([]),
    },
    sendNotification: async () => {
      const error = new Error('gone');
      error.statusCode = 410;
      throw error;
    },
  });

  assert.deepEqual(result, {
    sentCount: 0,
    removedSubscriptionCount: 1,
  });
  assert.deepEqual(updatePayload, {
    $set: {
      pushSubscriptions: [],
    },
  });
});

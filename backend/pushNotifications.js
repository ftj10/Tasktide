// INPUT: push subscription payloads plus VAPID configuration sources
// OUTPUT: configured web-push helpers and subscription payload transforms
// EFFECT: Enables standards-based Web Push delivery for desktop browsers and installed mobile web apps
const fs = require('node:fs');
const path = require('node:path');
const webPush = require('web-push');

const DEFAULT_PUSH_SUBJECT = 'mailto:notifications@tasktide.local';
const DEFAULT_VAPID_FILE_PATH = path.join(__dirname, '.push-vapid.json');

// INPUT: optional environment and filesystem overrides
// OUTPUT: resolved VAPID key pair
// EFFECT: Loads persistent keys from environment or a local cache file so push subscriptions survive restarts
function loadVapidKeys({
  env = process.env,
  fsModule = fs,
  vapidFilePath = DEFAULT_VAPID_FILE_PATH,
  generateKeys = () => webPush.generateVAPIDKeys(),
} = {}) {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    };
  }

  if (fsModule.existsSync(vapidFilePath)) {
    return JSON.parse(fsModule.readFileSync(vapidFilePath, 'utf8'));
  }

  const generatedKeys = generateKeys();
  fsModule.writeFileSync(vapidFilePath, JSON.stringify(generatedKeys, null, 2));
  return generatedKeys;
}

// INPUT: optional environment and filesystem overrides
// OUTPUT: public VAPID key string
// EFFECT: Supplies frontend clients with the application server key needed for PushManager subscriptions
function getPushPublicKey(options = {}) {
  return loadVapidKeys(options).publicKey;
}

// INPUT: optional environment and filesystem overrides
// OUTPUT: configured web-push client
// EFFECT: Applies VAPID details before notification delivery attempts
function configureWebPush({
  env = process.env,
  webPushClient = webPush,
  loadKeys = () => loadVapidKeys({ env }),
} = {}) {
  const keys = loadKeys();
  webPushClient.setVapidDetails(
    env.WEB_PUSH_SUBJECT || DEFAULT_PUSH_SUBJECT,
    keys.publicKey,
    keys.privateKey
  );
  return webPushClient;
}

// INPUT: stored subscription document
// OUTPUT: Web Push subscription payload
// EFFECT: Converts persisted subscription rows into the structure expected by the web-push client
function toWebPushSubscription(subscription) {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys?.p256dh ?? '',
      auth: subscription.keys?.auth ?? '',
    },
  };
}

// INPUT: stored subscription document plus notification payload
// OUTPUT: Web Push delivery promise
// EFFECT: Sends one push notification to one subscribed browser endpoint
function sendWebPushNotification(subscription, payload, options = {}) {
  const webPushClient = configureWebPush(options);
  return webPushClient.sendNotification(
    toWebPushSubscription(subscription),
    JSON.stringify(payload)
  );
}

module.exports = {
  DEFAULT_PUSH_SUBJECT,
  DEFAULT_VAPID_FILE_PATH,
  configureWebPush,
  getPushPublicKey,
  loadVapidKeys,
  sendWebPushNotification,
  toWebPushSubscription,
};

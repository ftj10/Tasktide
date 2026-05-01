// INPUT: browser notification APIs plus authenticated backend endpoints
// OUTPUT: service-worker registration and push-subscription helpers
// EFFECT: Connects the signed-in planner session to background push notifications on desktop browsers and supported mobile installs
const API_URL = import.meta.env.VITE_API_URL || "/api";
const PUSH_SW_PATH = "/push-sw.js";

function shouldRegisterPushServiceWorker() {
  return (
    import.meta.env.PROD ||
    import.meta.env.MODE === "test" ||
    import.meta.env.VITE_ENABLE_DEV_SERVICE_WORKER === "true"
  );
}

// INPUT: none
// OUTPUT: push support flag
// EFFECT: Detects whether the current browser can receive background Web Push through a service worker
export function supportsPushNotifications() {
  return (
    typeof window !== "undefined" &&
    shouldRegisterPushServiceWorker() &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// INPUT: current app language
// OUTPUT: registration completion flag
// EFFECT: Requests browser permission and subscribes the current device for backend push delivery
export async function enablePushNotifications(locale: string) {
  if (!supportsPushNotifications()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  await syncPushSubscription(locale);
  return true;
}

// INPUT: current app language
// OUTPUT: sync completion
// EFFECT: Ensures the current device has a live service-worker push subscription saved to the backend
export async function syncPushSubscription(locale: string) {
  if (!supportsPushNotifications() || Notification.permission !== "granted") {
    return;
  }

  const registration = await navigator.serviceWorker.register(PUSH_SW_PATH);
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(await loadPushPublicKey()),
    }));

  await requestOk("/notifications/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: subscription.toJSON().keys,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      locale: locale.startsWith("zh") ? "zh" : "en",
      userAgent: navigator.userAgent,
    }),
  });
}

// INPUT: none
// OUTPUT: unsubscribe completion
// EFFECT: Removes the current browser endpoint from the backend and local PushManager state
export async function disablePushNotifications() {
  if (!supportsPushNotifications()) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_PATH);
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  await requestOk("/notifications/subscriptions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  });

  await subscription.unsubscribe();
}

async function loadPushPublicKey() {
  const response = await authorizedRequest("/notifications/public-key");
  if (!response) throw new Error("Authorized request unavailable");
  if (!response.ok) throw new Error("Network response was not ok");
  const payload = (await response.json()) as { publicKey: string };
  return payload.publicKey;
}

async function authorizedRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  return response;
}

async function requestOk(path: string, options: RequestInit = {}) {
  const response = await authorizedRequest(path, options);
  if (!response) throw new Error("Authorized request unavailable");
  if (!response.ok) throw new Error("Network response was not ok");
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const safeBase64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(safeBase64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

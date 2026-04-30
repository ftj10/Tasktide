// INPUT: push notification helpers plus mocked browser APIs
// OUTPUT: behavior coverage for service-worker registration and backend subscription sync
// EFFECT: Verifies the planner can register and remove browser push subscriptions for desktop and mobile clients
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  disablePushNotifications,
  enablePushNotifications,
  supportsPushNotifications,
  syncPushSubscription,
} from "../src/app/pushNotifications";

describe("pushNotifications behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "PushManager");
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("detects push support only when notification, service worker, and push manager APIs exist", () => {
    expect(supportsPushNotifications()).toBe(false);

    vi.stubGlobal("Notification", function Notification() {});
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });

    expect(supportsPushNotifications()).toBe(true);
  });

  it("syncs a granted subscription to the backend through the service worker", async () => {
    const subscribe = vi.fn().mockResolvedValue({
      endpoint: "https://push.example/sub-1",
      expirationTime: null,
      toJSON: () => ({
        keys: {
          p256dh: "p256dh-key",
          auth: "auth-key",
        },
      }),
    });
    const getSubscription = vi.fn().mockResolvedValue(null);
    const register = vi.fn().mockResolvedValue({
      pushManager: {
        getSubscription,
        subscribe,
      },
    });
    const fetchMock = vi.mocked(fetch);

    vi.stubGlobal("Notification", Object.assign(function Notification() {}, {
      permission: "granted",
      requestPermission: vi.fn(),
    }));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register,
      },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey: "BElx9y8Pmw4" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await syncPushSubscription("en");

    expect(register).toHaveBeenCalledWith("/push-sw.js");
    expect(getSubscription).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/notifications/public-key", expect.objectContaining({
      credentials: "include",
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/notifications/subscriptions", expect.objectContaining({
      credentials: "include",
      method: "POST",
    }));
  });

  it("requests permission before subscribing a new device", async () => {
    const notificationApi = Object.assign(function Notification() {}, {
      permission: "default",
      requestPermission: vi.fn().mockImplementation(async () => {
        notificationApi.permission = "granted";
        return "granted";
      }),
    });
    const subscribe = vi.fn().mockResolvedValue({
      endpoint: "https://push.example/sub-1",
      expirationTime: null,
      toJSON: () => ({
        keys: {
          p256dh: "p256dh-key",
          auth: "auth-key",
        },
      }),
    });
    const fetchMock = vi.mocked(fetch);

    vi.stubGlobal("Notification", notificationApi);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe,
          },
        }),
      },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey: "BElx9y8Pmw4" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await enablePushNotifications("en");

    expect(notificationApi.requestPermission).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/notifications/public-key", expect.objectContaining({
      credentials: "include",
    }));
  });

  it("removes the current subscription from the backend and unsubscribes locally", async () => {
    const unsubscribe = vi.fn().mockResolvedValue(true);
    const fetchMock = vi.mocked(fetch);

    vi.stubGlobal("Notification", Object.assign(function Notification() {}, {
      permission: "granted",
      requestPermission: vi.fn(),
    }));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue({
              endpoint: "https://push.example/sub-1",
              unsubscribe,
            }),
          },
        }),
      },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    await disablePushNotifications();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/subscriptions", expect.objectContaining({
      credentials: "include",
      method: "DELETE",
    }));
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

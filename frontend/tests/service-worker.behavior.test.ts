// INPUT: mocked browser service-worker APIs
// OUTPUT: development cleanup coverage for stale app-shell workers
// EFFECT: Verifies Vite development does not keep serving cached module graphs
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerTaskTideServiceWorker } from "../src/app/serviceWorker";

describe("service worker behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("unregisters the app service worker during development builds", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistration = vi.fn().mockResolvedValue({ unregister });

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration,
      },
    });

    registerTaskTideServiceWorker();
    await Promise.resolve();
    await Promise.resolve();

    expect(getRegistration).toHaveBeenCalledWith("/push-sw.js");
    expect(unregister).toHaveBeenCalledTimes(1);
  });
});

// INPUT: browser service-worker support
// OUTPUT: app service-worker registration
// EFFECT: Enables installed TaskTide sessions to cache the app shell for offline startup
const SERVICE_WORKER_PATH = "/push-sw.js";

// INPUT: none
// OUTPUT: registration completion
// EFFECT: Registers the shared offline and push service worker when the browser supports it
export function registerTaskTideServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch((error) => {
      console.error(error);
    });
  });
}

// INPUT: app shell requests, push payloads, and notification clicks from the browser service worker
// OUTPUT: cached offline shell, displayed system notifications, and window focus behavior
// EFFECT: Delivers offline app startup and backend Web Push alerts for desktop browsers and installed mobile web apps
const CACHE_NAME = "tasktide-app-shell-v1.19.0";
const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/tasktide.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/") || caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "TaskTide";
  const options = {
    body: payload.body || "",
    icon: "/tasktide.svg",
    badge: "/tasktide.svg",
    tag: payload.tag || "tasktide",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const nextUrl = event.notification.data?.url || "/";
      const matchedClient = clients.find((client) => "focus" in client);

      if (matchedClient) {
        matchedClient.focus();
        if ("navigate" in matchedClient) {
          return matchedClient.navigate(nextUrl);
        }
        return undefined;
      }

      return self.clients.openWindow(nextUrl);
    })
  );
});

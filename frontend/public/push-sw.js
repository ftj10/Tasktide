// INPUT: push payloads and notification clicks from the browser service worker
// OUTPUT: displayed system notifications plus window focus behavior
// EFFECT: Delivers backend Web Push alerts for desktop browsers and installed mobile web apps
self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "Weekly To-Do";
  const options = {
    body: payload.body || "",
    icon: "/todo.svg",
    badge: "/todo.svg",
    tag: payload.tag || "weekly-todo",
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

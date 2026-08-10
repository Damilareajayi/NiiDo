// Service worker — two jobs:
// 1. Installability (Add to Home Screen on mobile, Install on desktop
//    Chrome/Edge). Deliberately does NOT cache anything: this app just
//    recovered from a severe stale-content bug (a CDN serving old JS
//    chunks after every deploy — see layout.tsx's dynamic-rendering fix),
//    so an aggressive service worker cache is the last thing it needs
//    right now. Every request just passes straight through to the network.
// 2. Displaying push notifications (standard Web Push, not Firebase
//    Cloud Messaging — see backend/services/webpush.ts for why) and
//    focusing/opening the app when one is tapped.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = { title: "NiiDo", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // Non-JSON payload — fall back to the default above rather than fail.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "NiiDo", {
      body: data.body || "",
      icon: "/niido-icon-192.png",
      badge: "/niido-icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Minimal service worker — exists only to satisfy "installable as an app"
// criteria (Add to Home Screen on mobile, Install on desktop Chrome/Edge).
// Deliberately does NOT cache anything: this app just recovered from a
// severe stale-content bug (a CDN serving old JS chunks after every
// deploy — see the layout.tsx dynamic-rendering fix), so an aggressive
// service worker cache is the last thing it needs right now. Every
// request just passes straight through to the network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

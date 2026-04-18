/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.href.includes("docs.opencv.org"),
  new CacheFirst({
    cacheName: "opencv-cdn",
    plugins: [
      new ExpirationPlugin({ maxEntries: 2, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

const MINI_APP_CACHE = "mini-app-bundles";

registerRoute(
  ({ url }) => url.searchParams.has("miniapp"),
  new NetworkFirst({
    cacheName: MINI_APP_CACHE,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  }),
);

self.addEventListener("message", (event) => {
  const { type, url } = event.data ?? {};

  if (type === "CACHE_MINI_APP" && url) {
    caches.open(MINI_APP_CACHE).then((cache) => cache.add(url));
  }

  if (type === "EVICT_MINI_APP" && url) {
    caches.open(MINI_APP_CACHE).then((cache) => cache.delete(url));
  }
});

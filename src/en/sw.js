const CACHE_NAME = "2023-11-01 00:00";
const urlsToCache = [
  "/number-kanji/",
  "/number-kanji/en/",
  "/number-kanji/index.js",
  "/number-kanji/mp3/boyon1.mp3",
  "/number-kanji/mp3/pa1.mp3",
  "/number-kanji/mp3/papa1.mp3",
  "/number-kanji/mp3/levelup1.mp3",
  "/number-kanji/favicon/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("dive-app").then(cache => {
      return cache.addAll(["./", "./index.html"]);
    })
  );
});
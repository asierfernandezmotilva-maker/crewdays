/* Sin conexión: guarda las páginas visitadas y los archivos. Páginas: primero la red; archivos: primero la copia. */
var C = "cd-v2";
self.addEventListener("install", function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(["/", "/styles.css", "/lib/patterns.js", "/js/engine.js", "/js/app.js", "/favicon.svg", "/fonts/barlow-condensed-700.woff2", "/fonts/source-sans-3.woff2"]); })); self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== C; }).map(function (x) { return caches.delete(x); })); })); self.clients.claim(); });
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  var save = function (res) { if (res.ok) { var copy = res.clone(); caches.open(C).then(function (c) { c.put(r, copy); }); } return res; };
  if (r.mode === "navigate") e.respondWith(fetch(r).then(save).catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match("/"); }); }));
  else e.respondWith(caches.match(r).then(function (m) { return m || fetch(r).then(save); }));
});

// Pozwala aplikacji działać bez internetu. Zmień numer wersji przy każdej aktualizacji plików.
const CACHE = "iwonka-liczy-v2";
const APP = ["./", "index.html", "manifest.webmanifest", "zxing.min.js",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // baza produktów zawsze z internetu
  if (url.hostname.endsWith("openfoodfacts.org")) return;
  // czcionki: z pamięci, a jak nie ma, to pobierz i zapamiętaj
  if (url.hostname.includes("fonts.g")) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // pliki aplikacji: najpierw świeże z sieci, bez sieci z pamięci
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});

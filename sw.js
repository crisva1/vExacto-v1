// 🔄 ACTUALIZAR ESTE NÚMERO CADA VEZ QUE HAGAS CAMBIOS
// Formato: vexacto-v1-AAAAMMDD-1 (ejemplo: vexacto-v1-20260523-1)
const CACHE_NAME = 'vexacto-v1-20260524-2';
const urlsToCache = ['./', './index.html', './styles.css', './app.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(names => Promise.all(
    names.map(n => n !== CACHE_NAME && caches.delete(n))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

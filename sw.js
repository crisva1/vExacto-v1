// 🔄 ACTUALIZAR ESTE NÚMERO CADA VEZ QUE HAGAS CAMBIOS
// Formato: vexacto-v1-AAAAMMDD-1 (ejemplo: vexacto-v1-20260523-1)
const CACHE_NAME = 'vexacto-v1-20260524-13';

const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(names => 
            Promise.all(names.map(n => n !== CACHE_NAME && caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

// CORREGIDO: Estrategia Network First (Primero Internet, si falla usa Caché)
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Si la respuesta es válida, guardamos una copia fresca en la caché
                if (response && response.status === 200 && e.request.method === 'GET') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si no hay internet (falla el fetch), buscamos en la caché local
                return caches.match(e.request);
            })
    );
});

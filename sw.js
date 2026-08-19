const CACHE = 'registrador-v3';
const ARCHIVOS = [
  '/registrador-boletas/',
  '/registrador-boletas/index.html',
  '/registrador-boletas/manifest.json',
  '/registrador-boletas/icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // No interceptar peticiones que no sean GET (evita duplicar el envío al Apps Script)
  if (e.request.method !== 'GET') return;
  // No cachear ni interceptar llamadas a otros dominios (Apps Script, Drive, etc.)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

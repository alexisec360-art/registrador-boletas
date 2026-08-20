const CACHE = 'registrador-v4';
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
      Promise.all(keys.filter(k => k !== CACHE && k !== 'registrador-compartido').map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ===== Recepción de "Compartir" desde WhatsApp (texto + foto) =====
  if (e.request.method === 'POST' && url.pathname === '/registrador-boletas/') {
    e.respondWith(manejarCompartido(e.request));
    return;
  }

  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

async function manejarCompartido(request) {
  try {
    const formData = await request.formData();
    const texto = formData.get('text') || formData.get('title') || '';
    const archivo = formData.get('foto');

    let imagenBase64 = '', imagenMime = '';
    if (archivo && archivo.size > 0) {
      const buffer = await archivo.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binario = '';
      for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
      imagenBase64 = btoa(binario);
      imagenMime = archivo.type;
    }

    const cache = await caches.open('registrador-compartido');
    await cache.put('/pendiente', new Response(JSON.stringify({ texto, imagenBase64, imagenMime })));
  } catch (err) {
    // si algo falla igual redirigimos, para no dejar a WhatsApp colgado
  }
  return Response.redirect('./?compartido=1', 303);
}

// Tai Chi — para que la app abra aunque no haya señal.
// Primero la red: con señal se baja siempre la versión recién subida (sin pasar por la caché del navegador).
// Si no hay señal, o la red tarda más de 4 segundos, se muestra la última versión que abrió bien.
// Solo toca la página; la planilla (script.google.com) y la fuente no pasan por acá.
//
// Para apagarlo (si algún día hiciera falta): subir un sw.js que diga solo
//   self.addEventListener('install', function () { self.skipWaiting(); });
//   self.addEventListener('activate', function () { self.registration.unregister(); });

var CACHE = 'taichi-pagina';
var ESPERA = 4000;

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(primeroLaRed(r));
});

function primeroLaRed(req) {
  // Se guarda una sola copia, con la dirección de la app, entre con / o con /index.html.
  var clave = self.registration.scope;
  return new Promise(function (listo) {
    var respondido = false;
    function responder(res) { if (!respondido) { respondido = true; listo(res); } }
    function guardada() { return caches.open(CACHE).then(function (c) { return c.match(clave); }); }
    var reloj = setTimeout(function () { guardada().then(function (c) { if (c) responder(c); }); }, ESPERA);
    fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(function (res) {
      clearTimeout(reloj);
      if (res.ok) { var copia = res.clone(); caches.open(CACHE).then(function (c) { return c.put(clave, copia); }); }
      responder(res);
    }).catch(function () {
      clearTimeout(reloj);
      guardada().then(function (c) { responder(c || Response.error()); });
    });
  });
}

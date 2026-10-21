// Grimorio: guarda la app en el teléfono para que abra sin internet.
// La app busca primero la versión nueva; si no hay conexión, usa la guardada.
// Las ilustraciones de las cartas se toman del teléfono si ya están guardadas.
const CACHE = "grimorio-v1";
const FILES = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function saveCopy(req, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Ilustraciones: primero del teléfono, si no están, de internet.
  if (url.pathname.includes("/cartas/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => saveCopy(req, res)))
    );
    return;
  }

  // La app: primero de internet (para recibir actualizaciones), si no hay conexión, del teléfono.
  event.respondWith(
    fetch(req)
      .then((res) => saveCopy(req, res))
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))
      )
  );
});

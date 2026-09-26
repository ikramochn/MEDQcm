/* =====================================================================
   MedQCM — service-worker.js  (fonctionnement hors ligne)
   ---------------------------------------------------------------------
   • À la première visite, tous les fichiers de l'application sont mis
     en cache sur le téléphone.
   • Ensuite, l'application s'ouvre même sans Internet.
   • Quand Internet est disponible, les fichiers sont mis à jour en
     arrière-plan : vous n'avez rien à faire après avoir ajouté des
     questions, elles arrivent à la visite suivante.
   • Pour forcer une mise à jour complète chez tout le monde, changez
     simplement le numéro de CACHE_NAME (ex. v2, v3…).
   ===================================================================== */
const CACHE_NAME = 'medqcm-cache-v2';

// Chemins relatifs : fonctionne à la racine d'un site ET dans un sous-dossier (GitHub Pages).
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './questions.js',
  './i18n.js',
  './activation.js',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// Installation : on télécharge et on garde tous les fichiers essentiels.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        // cache: 'reload' = toujours la version la plus récente du serveur
        return cache.addAll(CORE_ASSETS.map(function (url) { return new Request(url, { cache: 'reload' }); }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

// Activation : on supprime les anciennes versions du cache.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (key) { return key.indexOf('medqcm-cache-') === 0 && key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Chaque demande de fichier : on répond avec le cache (rapide, hors ligne),
// et on rafraîchit le cache en arrière-plan si Internet est disponible.
self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // on ne touche pas aux autres sites

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (cached) {
      const refresh = fetch(request)
        .then(function (response) {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(request.url, copy); });
          }
          return response;
        })
        .catch(function () { return null; }); // hors ligne : pas grave

      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }
      return refresh.then(function (response) {
        if (response) return response;
        // Rien en cache et pas d'Internet : pour une page, on ouvre l'application.
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});

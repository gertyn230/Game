const CACHE_NAME = 'kuznya-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Network-first for navigation/HTML so players always get game updates when online,
// falling back to cache when offline. Cache-first for static assets.
self.addEventListener('fetch', function(event){
  const req = event.request;
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(function(res){
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return res;
      }).catch(function(){ return caches.match('./index.html'); })
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(res){
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return res;
      });
    })
  );
});

self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open('observacions').then(function(cache) {
        return cache.addAll([
          '/',
          'index.html',
          'css/index.css',
          'js/index.js',
          'manifest.json',
          'img/favicon.ico',
          'img/edumet.png',
          'img/launcher-icon-4x.png',
          'img/marker-icon-green.png',
          'css/weather-icons.min.css',
          'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css',
          'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js',
          'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png',
          'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon-2x.png',
          'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png',
          'https://cdn.jsdelivr.net/npm/exif-js',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
          'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js'
        ]);
      })
    );
   });

self.addEventListener('fetch', function(event) {
 //console.log(event.request.url);
 event.respondWith(
   caches.match(event.request).then(function(response) {
     return response || fetch(event.request);
   })
 );
});

   
   
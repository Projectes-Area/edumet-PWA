self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open('observacions').then(function(cache) {
        return cache.addAll([
          '/',
          'index.html',
          'css/index.css',
          'js/index.js',
          'manifest.json',
          'img/launcher-icon-1x.png',
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
          'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js',
          'https://edumet.cat/edumet/app/json/municipis.geojson'
        ]);
      })
    );
   });

self.addEventListener('fetch', function(event) {
 event.respondWith(
   caches.match(event.request).then(function(response) {
     console.log("Served: " + event.request.url);
     return response || fetch(event.request);
   })
 );
});

   
   
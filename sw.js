self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('assets').then(function(cache) {
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
        'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon-2x.png',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png',
        'https://cdn.jsdelivr.net/npm/exif-js',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
        'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js',
        'https://edumet.cat/edumet/app/json/municipis.geojson',
        'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/css/weather-icons.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/font/weathericons-regular-webfont.woff2'
      ]);
    })
  );
  });

self.addEventListener('fetch', function(event) {
  if(event.request.url.includes("dades_recarregar")) {
    event.respondWith(
      fetch(event.request)
      .then(console.log("Fetched: " + event.request.url))
      .catch(function() {
        console.log("From cache (offline): " + event.request.url)
        return caches.match(event.request);
      })
    );  
  } else {
    event.respondWith(
      caches.match(event.request)
      .then(function(response) {
        console.log("From cache: " + event.request.url);
        return response || fetch(event.request);
      })
      .catch(
        // resposta segons url
        console.log("No està en caché")
      )
    );
  }
});  
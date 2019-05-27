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
          'img/launcher-icon-512.png',
          'img/marker-icon-green.png',
          'css/weather-icons.min.css',
          'font/MaterialIcons-Regular.ttf',
          'font/MaterialIcons-Regular.woff',
          'font/MaterialIcons-Regular.woff2',
          'font/weathericons-regular-webfont.woff2',
          'leaflet/leaflet.css',
          'leaflet/leaflet.js',
          'json/municipis.geojson'
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

   
   
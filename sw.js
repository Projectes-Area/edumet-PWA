self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open('observacions').then(function(cache) {
        return cache.addAll([
          'index.html',
          'css/index.css',
          'js/index.js',
        ]);
      })
    );
   });

self.addEventListener('fetch', function(event) {
 console.log(event.request.url);

 event.respondWith(
   caches.match(event.request).then(function(response) {
     return response || fetch(event.request);
   })
 );
});

   
   
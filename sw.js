self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('assets').then(function(cache) {
      return cache.addAll([
        '/',
        'index.html',
        'css/index.css',
        'js/index.js',
        'manifest.json',
        'img/launcher-icon-2x.png',
        'img/edumet.png',
        'img/launcher-icon-4x.png',
        'img/marker-icon-green.png',
        'img/default@2x.png',
        'https://edumet.cat/edumet/app/json/municipis.geojson',
        'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon-2x.png',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png',
        'https://cdn.jsdelivr.net/npm/exif-js',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
        'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/css/weather-icons.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/font/weathericons-regular-webfont.woff2'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  setInterval(escombra,10000);
});

function escombra() {
  var url_servidor = 'https://edumet.cat/edumet/meteo_proves/dades_recarregar.php';
  indexedDB.open("eduMET").onsuccess = function(event) {
    var obsObjStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    obsObjStore.getAll().onsuccess = function(e) {
      for(i=0;i<e.target.result.length;i++) {        
        if(e.target.result[i]["En_cua"] == "penjar") {
          var observacio = e.target.result[i]["GUID"];
          if(e.target.result[i]["Penjada"] == 0) {  
            var imatge64 =  e.target.result[i]["Imatge"].replace(/^data:image\/[a-z]+;base64,/, "");                    
            var envio = { 
                tab: "salvarFenoApp",
                usuari: e.target.result[i]["Observador"],
                dia: e.target.result[i]["Data_observacio"],
                hora: e.target.result[i]["Hora_observacio"],
                lat: e.target.result[i]["Latitud"],
                lon: e.target.result[i]["Longitud"],
                id_feno: e.target.result[i]["Id_feno"],
                descripcio: e.target.result[i]["Descripcio_observacio"],
                fitxer: imatge64
            }
            var JSONenvio = JSON.stringify(envio);
            fetch(url_servidor,{
              method:'POST',
              headers:{
                'Content-Type': 'application/json; charset=UTF-8'
                },
              body: JSONenvio
            })
            .then(response => response.text())
            .then(response => {  
                var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
                var request = objStore.get(observacio);
                request.onsuccess = function() {
                  var data = request.result;
                  data.ID =  response.trim();
                  data.En_cua = "";
                  data.Penjada = 1;
                  objStore.put(data);
                  console.log("S'ha penjat l'observació ID " + data.ID);
                }                   
            })
            .catch(error => {
              console.log("Service worker: offline");
            });
          } else {
            var envio = { 
              tab: "modificarFenoApp",
              id: e.target.result[i]["ID"],
              id_feno: e.target.result[i]["Id_feno"],
              descripcio: e.target.result[i]["Descripcio_observacio"]
            }
            var JSONenvio = JSON.stringify(envio);
            var url = url_servidor + '?observacio=' + e.target.result[i]["GUID"];
            fetch(url,{
              method:'POST',
              headers:{
                'Content-Type': 'application/json; charset=UTF-8'
                },
              body: JSONenvio
            })
            .then(response => {
              var url = new URL(response.url);
              observacio = url.searchParams.get("observacio");
              var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
              var request = objStore.get(observacio);
              request.onsuccess = function() {
                var data = request.result;
                data.En_cua = "";
                objStore.put(data);
                console.log("S'ha actualitzat l'observació GUID " + observacio);
              }
            })
            .catch(error => {
              console.log("Service worker: offline");
            });
          }
        }
        if(e.target.result[i]["En_cua"] == "eliminar") {
          var url = url_servidor + "?usuari=" + e.target.result[i]["Observador"] + "&id=" + e.target.result[i]["ID"] + "&tab=eliminarFenUsu&observacio=" + e.target.result[i]["GUID"];
          fetch(url)
          .then(response => {
            var url = new URL(response.url);
            observacio = url.searchParams.get("observacio");
            indexedDB.open("eduMET").onsuccess = function(event) {
              event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions").delete(observacio);   
              console.log("Service worker: observació eliminada");
            }
          })
          .catch(error => {
            console.log("Service worker: offline");
          });
        }
      }
    }
  }
}

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
      return response || fetch(event.request);
    })
    .catch(function() {
      var resolt = false;
      if (event.request.url.includes("fotocentre")) {
        resolt = true;
        return caches.match('img/launcher-icon-2x.png');
      } 
      if (event.request.url.includes("@2x")) {
        resolt = true;
        return caches.match('img/default@2x.png');
      } 
      if(!resolt) {
        console.log("No està en cache: " + event.request.url);
        return;
      }
    })
  ); 
});  
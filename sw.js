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
        'img/launcher-icon-2x.png',
        'img/launcher-icon-4x.png',
        'img/edumet.png',
        'img/marker-icon-green.png',
        'img/default@2x.png',
        'img/NO.png',
        'img/N.png',
        'img/NE.png',
        'img/O.png',
        'img/C.png',
        'img/E.png',
        'img/SO.png',
        'img/S.png',
        'img/SE.png',
        'img/lluna/lluna0.png',
        'img/lluna/lluna5.png',
        'img/lluna/lluna8.png',
        'img/lluna/lluna11.png',
        'img/lluna/lluna15.png',
        'img/lluna/lluna19.png',
        'img/lluna/lluna22.png',
        'img/lluna/lluna25.png',
        'img/lluna/lluna29.png',
        'img/beaufort/1.png',
        'img/beaufort/2.png',
        'img/beaufort/3.png',
        'img/beaufort/4.png',
        'img/beaufort/5.png',
        'img/beaufort/6.png',
        'img/beaufort/7.png',
        'img/beaufort/8.png',
        'img/beaufort/9.png',
        'img/beaufort/10.png',
        'img/beaufort/11.png',
        'img/beaufort/12.png',
        'img/0.png',
        'img/25.png',
        'img/50.png',
        'img/75.png',
        'img/100.png',
        'img/fen_atm/BIG_459395615022712_00.jpg',
        'img/fen_atm/BIG_006495615022712_00.jpg',
        'img/fen_atm/BIG_177515615022712_00.jpg',
        'img/fen_atm/BIG_459315615022712_00.jpg',
        'img/fen_atm/BIG_584325615022712_00.jpg',
        'img/fen_atm/BIG_146335615022712_00.jpg',
        'img/fen_atm/BIG_396255615022712_00.jpg',
        'img/fen_atm/BIG_552435615022712_00.jpg',
        'img/nuvols/BIG_521555615022712_00.jpg',
        'img/nuvols/BIG_568565615022712_00.jpg',
        'img/nuvols/BIG_037575615022712_00.jpg',
        'img/nuvols/BIG_490575615022712_00.jpg',
        'img/nuvols/BIG_005585615022712_00.jpg',
        'img/nuvols/BIG_693585615022712_00.jpg',
        'img/nuvols/BIG_115595615022712_00.jpg',
        'img/nuvols/BIG_630595615022712_00.jpg',
        'json/municipis.geojson',
        'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon-2x.png',
        'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png',
        'https://cdn.jsdelivr.net/npm/exif-js',
        'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
        'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/css/weather-icons.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/font/weathericons-regular-webfont.woff2',
        'https://cdn.jsdelivr.net/npm/flatpickr'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  setInterval(escombra,30000);
});

function escombra() {

  // OBSERVACIONS

  console.log("Service Worker: escombrant ...");
  var url_servidor = 'https://edumet.cat/meteo/dades_recarregar.php';
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
              observacio = parseInt(url.searchParams.get("observacio"));
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
            observacio = parseInt(url.searchParams.get("observacio"));
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

    // REGISTRES MANUALS

    var regObjStore = event.target.result.transaction(["Registres"], "readwrite").objectStore("Registres");
    regObjStore.getAll().onsuccess = function(e) {
      for(i=0;i<e.target.result.length;i++) {   
        var JSONenvio = JSON.stringify(e.target.result[i]);
        var url = url_servidor  + '?registre=' + e.target.result[i]["GUID"];
        fetch(url, {
          method:'POST',
          headers:{
            'Content-Type': 'application/json; charset=UTF-8'
            },
          body: JSONenvio
        })
        .then(response => {
          console.log("Registre penjat");
          var url = new URL(response.url);
          registre = parseInt(url.searchParams.get("registre"));
          indexedDB.open("eduMET").onsuccess = function(event) {
            event.target.result.transaction(["Registres"], "readwrite").objectStore("Registres").delete(registre);   
            console.log("Service worker: registre intern eliminat");
          }
        })
        .catch(error => {
          console.log("Error (SW): penjar " + error);
        });
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
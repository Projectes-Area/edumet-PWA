var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  onDeviceReady: function() {
    //if (usuari == "") {
      usuari = storage.getItem("user");
    //}
    var online;
    var stringDatabase = storage.getItem("database");
    map = L.map('map');
    if (checkConnection() == 'No network connection') {
      online = false;
      if(stringDatabase == null) {
        alert("La configuració inicial de l'App precisa una connexió a Internet. Si us plau, reinicia l'App quan en tinguis.");        
      } else {
        alert("No es pot connectar a Internet. Algunes característiques de l'App no estaran disponibles.");
        map.setView([41.7292826, 1.8225154], 10);
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'json/municipis.geojson');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'json';
        xhr.onload = function() {
            return L.geoJSON(xhr.response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(map);
        };
        xhr.send();
      }
    } else {
      online = true;
      map.setView([41.7292826, 1.8225154], 15);
      L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
        minZoom: 1,
        maxZoom: 19,
        attribution: 'Wikimedia'
      }).addTo(map);

    };   
    var ara = new Date();
    var dies = (ara - new Date(stringDatabase)) / 36000000;
    if((stringDatabase == null || dies > 30) && online) {
      indexedDB.open("eduMET").onupgradeneeded = function(event) { 
        var db = event.target.result;    
        db.createObjectStore("Fenomens", {keyPath: "Id_feno"});
        db.createObjectStore("Estacions", {keyPath: "Codi_estacio"});
        db.createObjectStore("Observacions", {keyPath: "Data_registre"});
        baixaFenomens();
        baixaEstacions();
      }
    } else {
      mostraEstacions();
      getFenomens();
    }

    /*document.addEventListener("backbutton", function(e){
      switch(vistaActual) {
        case 'fitxa':
          activa('observacions');
          break;
        case 'observacions':
          activa('fenologia');
          break
        case 'fotografia':
          activa(vistaOrigen);
          break;
        default:
          navigator.notification.confirm("Vols sortir de l'App eduMET?", sortir, "Sortir", ["Sortir","Cancel·lar"]);
      }
   }, false);*/

    var input = document.getElementById('password');
    input.addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        valida();
      }
    });

    document.getElementById('fitxer_galeria').addEventListener("change", function(event) {
      readURL(this);
    });
    document.getElementById('fitxer').addEventListener("change", function(event) {
      readURL(this);
    });
    
    window.addEventListener("orientationchange", function(){
      ajustaOrientacio(screen.orientation.type);
    });
    ajustaOrientacio(screen.orientation.type);
  
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.enumerateDevices = function(callback) {
          navigator.mediaDevices.enumerateDevices().then(callback);
      };
    } 
    if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
        canEnumerate = true;
    } else if (navigator.mediaDevices && !! navigator.mediaDevices.enumerateDevices) {
        canEnumerate = true;
    } 
    checkDeviceSupport();  
  }  
};

var storage = window.localStorage;
var usuari = "";
var contrasenya;
var estacioActual;
var estacioPreferida;
var fenomens = [];
var latitudActual;
var longitudActual;
var url_servidor = 'https://edumet.cat/edumet/meteo_proves/dades_recarregar.php';
var url_imatges = 'https://edumet.cat/edumet/meteo_proves/imatges/fenologia/';
var INEinicial = "081234";
var codiInicial = "08903085";
var mobilLocalitzat = false;
var fotoLocalitzada = false;
var ExifData;
var ExifHora;
var ExifLongitud;
var ExifLongitud;
var observacioActual = "";
var observacioFitxa;
var mapaFitxa;
var marcadorFitxa;
var vistaActual;
var vistaOrigen;
var obsActualitzades = false;
var marcador = [];
var watchID;
var estacioDesada = false;
var colorEdumet = "#418ac8";
var map;
var slideIndex;
var flagRadar = false;
var timeOut;
var midaFoto = 800;

var MediaDevices = [];
var isHTTPs = location.protocol === 'https:';
var canEnumerate = false;
var hasWebcam = false;
var isWebcamAlreadyCaptured = false;
var origen;

app.initialize();

function empty() {  
}

function ajustaOrientacio(orientacio) {
  console.log(orientacio);
  var textBoto = '<i class="material-icons icona-24">';
  if(orientacio == "landscape" || orientacio == "landscape-primary" || orientacio == "landscape-secondary") {
    document.getElementById("boto_observacions").innerHTML = textBoto + 'camera_alt</i>';
    document.getElementById("boto_estacions").innerHTML = textBoto + 'router</i>';
    document.getElementById("boto_registra").innerHTML = textBoto + 'bookmark</i>';
    document.getElementById("boto_prediccio").innerHTML = textBoto + 'cloud</i>';
    document.getElementById("boto_radar").innerHTML = textBoto + 'wifi_tethering</i>';
    document.getElementById("radar").style.flexDirection = "row";
    document.getElementById("puntets").style.flexDirection = "column";
    document.getElementById('slideshow-container').style.height = "80vh"; 
    document.getElementById('slideshow-container').style.width = "auto"; 
    document.getElementById('contingutFitxa').style.flexDirection = "row"; 
    document.getElementById('edicio_fitxa').style.width = "50%"; 
    document.getElementById('edicio_fitxa').style.height = "100%"; 
    document.getElementById('desc_map_fitxa').style.width = "50%"; 
    document.getElementById('desc_map_fitxa').style.height = "100%"; 
    document.getElementById('registra').style.flexDirection = "row"; 
    document.getElementById('nou_registre').style.width = "50%"; 
    document.getElementById('nou_registre').style.height = "100%"; 
    document.getElementById('entrada_dades').style.width = "50%"; 
    document.getElementById('entrada_dades').style.height = "100%"; 
  } else {
    document.getElementById("boto_observacions").innerHTML = textBoto + 'camera_alt</i><br>Observa';
    document.getElementById("boto_estacions").innerHTML = textBoto + 'router</i><br>Estació';
    document.getElementById("boto_registra").innerHTML = textBoto + 'bookmark</i><br>Registra';
    document.getElementById("boto_prediccio").innerHTML = textBoto + 'cloud</i><br>Predicció';
    document.getElementById("boto_radar").innerHTML = textBoto + 'wifi_tethering</i><br>Radar';
    document.getElementById("radar").style.flexDirection = "column";
    document.getElementById("puntets").style.flexDirection = "row";
    document.getElementById('slideshow-container').style.width = "100%";
    document.getElementById('slideshow-container').style.height = "auto";    
    document.getElementById('contingutFitxa').style.flexDirection = "column"; 
    document.getElementById('edicio_fitxa').style.width = "100%"; 
    document.getElementById('edicio_fitxa').style.height = "50%"; 
    document.getElementById('desc_map_fitxa').style.width = "100%"; 
    document.getElementById('desc_map_fitxa').style.height = "50%"; 
    document.getElementById('registra').style.flexDirection = "column"; 
    document.getElementById('nou_registre').style.width = "100%"; 
    document.getElementById('nou_registre').style.height = "50%"; 
    document.getElementById('entrada_dades').style.width = "100%"; 
    document.getElementById('entrada_dades').style.height = "50%"; 
  }
  if (vistaActual == 'radar'){
    flagRadar= false;
    clearTimeout(timeOut);
    radar();
  }
}

/*function sortir(buttonIndex) {
  if(buttonIndex == 1) {
    tancar();
  }
}*/
function tancar() {
  navigator.geolocation.clearWatch(watchID);
  navigator.app.exitApp();
}

// FENOMENS FENOLOGICS

function baixaFenomens() {
  var url = url_servidor + "?tab=llistaFenoFenologics";
  fetch(url)
  .then(response => response.text())
  .then(response =>  JSON.parse(response))
  .then(response => {
    console.log("Fenomens: Baixats");
    var x = document.getElementById("fenomen");
    var option = document.createElement("option");
    option.text = "Tria el tipus de fenomen";
    option.value = "0";    
    x.add(option);
    for(i=0;i<response.length;i++){
      fenomens[i+1] = response[i];
      option = document.createElement("option");
      option.text = response[i]["Bloc_feno"] + ': ' + response[i]["Titol_feno"];
      option.value = response[i]["Id_feno"];
      x.add(option);
    }
    indexedDB.open("eduMET").onsuccess = function(event) { 
      var db = event.target.result;    
      var fenObjStore = db.transaction("Fenomens", "readwrite").objectStore("Fenomens");
      for(i=0;i<response.length;i++){
        fenObjStore.add(response[i]);
      }
    }
  });
}

function getFenomens() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Fenomens"], "readonly").objectStore("Fenomens").getAll().onsuccess = function(event) {
      assignaFenomens(event.target.result);
    };
  }
}
function assignaFenomens(response) {
  fenomens = [];
  var x = document.getElementById("fenomen");
  var option = document.createElement("option");
  option.text = "Tria el tipus de fenomen";
  option.value = "0";
  x.add(option);  
  for(i=0;i<response.length;i++){
    fenomens[i+1] = response[i];
    option = document.createElement("option");
    option.text = response[i]["Bloc_feno"] + ': ' + response[i]["Titol_feno"];;
    option.value = response[i]["Id_feno"];
    x.add(option);
  }
}

// ESTACIONS METEOROLÒGIQUES

function baixaEstacions() {
  var url = url_servidor + "?tab=cnjEstApp&xarxaEst=D";
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {
    console.log("Estacions: Baixades");  
    indexedDB.open("eduMET").onsuccess = function(event) { 
      var db = event.target.result;    
      var estObjStore = db.transaction("Estacions", "readwrite").objectStore("Estacions");
      for(i=0;i<response.length;i++){
        estObjStore.add(response[i]);
      }
    };
    storage.setItem("database", new Date());  
    mostraEstacions();
  });
}

function mostraEstacions() {
  watchID = navigator.geolocation.watchPosition(geoSuccess, geoFail);
  var x = document.getElementById("est_nom");
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").getAll().onsuccess = function(event) {
      for(i=0;i<event.target.result.length;i++){
        marcador[i] = L.marker(new L.LatLng(event.target.result[i]["Latitud"], event.target.result[i]["Longitud"])).addTo(map);   
        marcador[i].i = i
        marcador[i].Codi_estacio = event.target.result[i]["Codi_estacio"];
        marcador[i].on('click',function(e) {
          var x = document.getElementById("est_nom");
          x.value = this.Codi_estacio;
          mostra(this.Codi_estacio);
        });   
        var option = document.createElement("option");
        option.text = event.target.result[i]["Nom_centre"];
        option.value = event.target.result[i]["Codi_estacio"];
        x.add(option);
      }
      preferida = storage.getItem("estacio");
      if (preferida == null) {
        estacioActual = codiInicial;
        estacioPreferida = codiInicial;
        console.log("Preferida (Per defecte): " + estacioPreferida);
      } else {
        estacioActual = preferida;
        estacioPreferida = preferida;
        console.log("Preferida (Desada): " + estacioPreferida);
        document.getElementById("est_nom").value = estacioPreferida;
      }
      mostraEstacio();
    };
  };
}
function mostra(Codi_estacio) {
  estacioActual = Codi_estacio;
  mostraEstacio();
}

function selectEstacio() {  
  estacioActual = document.getElementById("est_nom").value;
  mostraEstacio();
}

function mostraEstacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioActual).onsuccess = function(e) {
      document.getElementById('est_poblacio').innerHTML = e.target.result["Poblacio"];
      document.getElementById('est_altitud').innerHTML = "Altitud: " + e.target.result["Altitud"] + " m";
      var URLlogo = "https://edumet.cat/edumet-data/" + e.target.result["Codi_estacio"] + "/estacio/profile1/imatges/fotocentre.jpg";
      if(checkConnection() != 'No network connection'){
        document.getElementById('est_logo').src = URLlogo;
        getMesures();
      }
      map.setView(new L.LatLng(e.target.result["Latitud"], e.target.result["Longitud"]));
    }
  }
  var estrella = document.getElementById('star');
  if(estacioActual == estacioPreferida) {
    estrella.innerHTML = "star";
    estrella.style.color = "yellow";
  } else {
    estrella.innerHTML = "star_border";
    estrella.style.color = "lightgray";
  }
}

function desaPreferida() {
  estacioPreferida = document.getElementById("est_nom").value;
  console.log("Preferida (Triada): " + estacioPreferida);
  storage.setItem("estacio", estacioPreferida);  
  var estrella = document.getElementById('star');
  estrella.innerHTML = "star";
  estrella.style.color = "yellow";
}

function getMesures() {
  var url = url_servidor + "?tab=mobilApp&codEst=" + estacioActual;
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {     
    document.getElementById('temperatura').innerHTML = response[0]["Temp_ext_actual"]+ " ºC <label style='color:red'>" + response[0]["Temp_ext_max_avui"] + " ºC <label style='color:cyan'>" + response[0]["Temp_ext_min_avui"] + " ºC</label>";
    document.getElementById('humitat').innerHTML = response[0]["Hum_ext_actual"] + "%";
    document.getElementById('pressio').innerHTML = response[0]["Pres_actual"] + " HPa";
    document.getElementById('sunrise').innerHTML = response[0]["Sortida_sol"].slice(0,5);
    document.getElementById('sunset').innerHTML = response[0]["Posta_sol"].slice(0,5);
    document.getElementById('pluja').innerHTML = response[0]["Precip_acum_avui"] + " mm";
    document.getElementById('vent').innerHTML = response[0]["Vent_vel_actual"] + " Km/h";    
    INEinicial = response[0]["codi_INE"];
    var stringDataFoto = response[0]["Data_UTC"] + 'T' + response[0]["Hora_UTC"];
    var interval = (new Date() - new Date(stringDataFoto)) / 3600000;
    var textDataMesura = document.getElementById('data_mesura');
    textDataMesura.innerHTML = "Actualitzat a les " + response[0]["Hora_UTC"] + " del " + formatDate(response[0]["Data_UTC"]);
    if(interval < 2) {
      textDataMesura.style.color = "#006633";
    } else {
      textDataMesura.style.color = "#FF0000";
    }
  })
  .catch(reason => {
    textDataMesura.style.color = "#FF0000";
    textDataMesura.innerHTML = "L'estació no proporciona les dades ...";
    console.log("error:" + reason);
  });
}

// REGISTRA

function registra() {
  activa('registra');
}
function registra_mesures() {
}
function registra_cel() {
}
function registra_nuvols() {
}
function registra_fenomens() {
}

// OBSERVACIONS

function usuaris() {
  if (usuari == "" || usuari == null) {
    login();
  } else {
    if (confirm("Vols tancar la sessió ?")) {
      tancar_sessio();
    }
  }
}
function tancar_sessio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    var db = event.target.result;
    var obsObjStore = db.transaction("Observacions", "readwrite").objectStore("Observacions");
    obsObjStore.clear();    
  } 
  localStorage.removeItem("user");
  usuari = "";
  estacio();
}

function fesFoto() {
  if(hasWebcam) {
    origen = "camera"
    document.getElementById('fitxer').click();
    //} else {
      //navigator.notification.alert("No es coneix la ubicació. Si us plau, activa primer GPS.", empty, "GPS", "D'acord");
    //}
  } else {
    origen = "galeria"
    document.getElementById('fitxer_galeria').click();
  }
}

function readURL(input) {   
  fitxerImg = input.files[0].name;
  var extn = fitxerImg.substring(fitxerImg.lastIndexOf('.') + 1).toLowerCase();
  if (extn == "jpg" || extn == "jpeg") { 
    ExifData = ""; 
    ExifHora = ""
    ExifLatitud = "";
    ExifLongitud = "";
    EXIF.getData(input.files[0], function() {
      if(this.exifdata.DateTimeOriginal != undefined) {
        var splitData = this.exifdata.DateTimeOriginal.split(" ");
        ExifData = formatDate(splitData[0]);
        ExifHora = splitData[1];
        console.log("EXIF Data: " + ExifData + ", " + ExifHora);
      }
      if(this.exifdata.GPSLatitude != undefined) {     
        var latDegree = this.exifdata.GPSLatitude[0].numerator/this.exifdata.GPSLatitude[0].denominator;
        var latMinute = this.exifdata.GPSLatitude[1].numerator/this.exifdata.GPSLatitude[1].denominator;
        var latSecond = this.exifdata.GPSLatitude[2].numerator/this.exifdata.GPSLatitude[2].denominator;
        var latDirection = this.exifdata.GPSLatitudeRef;
        ExifLatitud = ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection);        
        var lonDegree = this.exifdata.GPSLongitude[0].numerator/this.exifdata.GPSLongitude[0].denominator;
        var lonMinute = this.exifdata.GPSLongitude[1].numerator;this.exifdata.GPSLongitude[1].denominator;
        var lonSecond = this.exifdata.GPSLongitude[2].numerator/this.exifdata.GPSLongitude[2].denominator;
        var lonDirection = this.exifdata.GPSLongitudeRef;
        ExifLongitud = ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);
        console.log("EXIF GPS: "+ ExifLatitud + ", "+ ExifLongitud);        
      }    
      var canvas = document.getElementById("canvas");
      var ctx = canvas.getContext("2d");
      var img = new Image;
      img.src = URL.createObjectURL(input.files[0]);
      img.onload = function() {
        var iw=img.width;
        var ih=img.height;
        var scale=Math.min((midaFoto/iw),(midaFoto/ih));
        var iwScaled=iw*scale;
        var ihScaled=ih*scale;
        canvas.width=iwScaled;
        canvas.height=ihScaled;
        ctx.drawImage(img,0,0,iwScaled,ihScaled);
        canvas.style.display = "none";
        document.getElementById('foto').src = canvas.toDataURL("image/jpeg",0.5);
        document.getElementById("fenomen").value = "0";
        document.getElementById("descripcio").value = "";
        var string64 = canvas.toDataURL("image/jpeg",0.5);
        desaObservacio(string64);
      }
    });
  } else {
    alert("La foto de l'observació ha de tenir el format JPEG.");
  }
}

function baixaObsInicial() {
  var url = url_servidor + "?usuari=" + usuari + "&tab=visuFenoApp";
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {
    indexedDB.open("eduMET").onsuccess = function(event) { 
      var db = event.target.result;    
      var obsObjStore = db.transaction("Observacions", "readwrite").objectStore("Observacions");
      for(i=0;i<response.length;i++){
        response[i]["Enviat"] = 1;
        obsObjStore.add(response[i]);
        console.log("Observació inicial: " + response[i]["ID"]);
      }
    }
  });  
}

function baixaObsAfegides() {
  var url = url_servidor + "?usuari=" + usuari + "&tab=visuFenoApp";
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {
    indexedDB.open("eduMET").onsuccess = function(event) {
      var obsObjStore = event.target.result.transaction("Observacions", "readwrite").objectStore("Observacions");
      obsObjStore.getAll().onsuccess = function(event) {        
        if(!(response === null)){
          for(var i=0;i<response.length;i++){
            var nova = true;
            for(var j=0;j<event.target.result.length;j++){
              if(event.target.result[j]["ID"] == response[i]["ID"]){
                nova = false;
              }
            }
            if(nova){
              response[i]["Enviat"] = 1;
              console.log("Nova observació: " + response[i]["ID"]);
              obsObjStore.add(response[i]);              
            }
          }     
        }
      }
    }
  });
}

function enviaActual() {
  if(checkConnection() != 'No network connection'){
    enviaObservacio(observacioActual);
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function enviaFitxa() {
  if(checkConnection() != 'No network connection'){
    enviaObservacio(observacioFitxa);
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}

function enviaObservacio(observacioEnvia) {
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions").get(observacioEnvia).onsuccess = function(e) {
      if(e.target.result["Enviat"] == undefined) {
        alert("Si us plau, fes primer la foto corresponent a l'observació.");
      } else {
        if(e.target.result["Id_feno"] == 0 || e.target.result["Descripcio_observacio"] == "") {
          alert("Si us plau, desa primer l'observació indicant el tipus de fenomen i escrivint una breu descripció.");
        } else {
          if (e.target.result["Data_observacio"] == "") {
            alert("Si us plau, Indica primer la data en què es va realitzar l'observació");
          } else {      
            if (e.target.result["Latitud"] == "") {
              alert("Si us plau, Indica primer el lloc on es va realitzar l'observació");
            } else {  
              if(e.target.result["Enviat"] == "0") {  
                var imatge64 =  e.target.result["Imatge"].replace(/^data:image\/[a-z]+;base64,/, "");                    
                var envio = { 
                    tab: "salvarFenoApp",
                    usuari: usuari,
                    dia: e.target.result["Data_observacio"],
                    hora: e.target.result["Hora_observacio"],
                    lat: e.target.result["Latitud"],
                    lon: e.target.result["Longitud"],
                    id_feno: e.target.result["Id_feno"],
                    descripcio: e.target.result["Descripcio_observacio"],
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
                  indexedDB.open("eduMET").onsuccess = function(event) {
                    var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
                    var request = objStore.get(observacioEnvia);
                    request.onsuccess = function() {
                      var data = request.result;
                      data.ID =  response.trim();
                      data.Enviat = 1;
                      objStore.put(data);
                      alert("S'ha penjat l'observació al servidor eduMET.");
                      if(vistaActual == 'fitxa') {
                        //document.getElementById('edita_obs').disabled = true;
                        //document.getElementById('envia_obs').disabled = true;
                        var checkVerd = document.getElementById(e.target.result["Data_registre"]);
                        checkVerd.style.color = "limegreen";
                      }
                    }
                  }                       
                });
              } else {
                //navigator.notification.alert("Aquesta observació ja està penjada al servidor eduMET. Si us plau, fes una nova observació.", empty, 'Penjar observació', "D'acord");
                var url = url_servidor + '?tab=modificarFenoApp&id=' + fitxaObs["ID"] + '&Id_feno=' + fitxaObs["Id_feno"] +'&descripcio="' + fitxaObs["Descripcio_observacio"] + '"';
                console.log(url);
                fetch(url)
                  .then(response => response.text())
                  .then(text => {
                    console.log(text);
                    alert("S'ha actualitzat l'observació penjada al servidor eduMET.");
                });
              }
            }
          }
        }
      }
    }
  }
}

function editaObservacio() {
  observacioActual = observacioFitxa;
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
      var obs = document.getElementById('foto');
      var foto = e.target.result["Fotografia_observacio"];
      if(foto == 0) {
        obs.src = e.target.result["Imatge"];
      } else {
        obs.src = url_imatges + foto;
      }
      var Id_feno = document.getElementById('fenomen');
      Id_feno.value = e.target.result["Id_feno"];
      var Descripcio_observacio = document.getElementById('descripcio');
      if(e.target.result["Descripcio_observacio"] == "Sense descriure"){
        Descripcio_observacio.value = "";
      } else {
        Descripcio_observacio.value = e.target.result["Descripcio_observacio"];
      }
      activa('fenologia');
    }
  }      
}

function eliminaObservacio() {
  if (confirm("Vols eliminar aquesta observació?")) {
    elimina();
  }
}
function elimina() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    var db = event.target.result.transaction(["Observacions"], "readwrite");
    obsObjStore = db.objectStore("Observacions");
    obsObjStore.get(observacioFitxa).onsuccess = function(e) {
      var eliminarLocal = true;
      if(e.target.result["Enviat"] == "1") {
        if (checkConnection() == 'No network connection') {
          alert("Les observacions que ja s'han penjat al servidor eduMET no es poden eliminar sense connexió a Internet.");
          eliminarLocal = false;
        } else {           
          var url = url_servidor + "?usuari=" + usuari + "&id=" + e.target.result["ID"] + "&tab=eliminarFenUsu";
          fetch(url);
        }
      }
      if(eliminarLocal) {
        obsObjStore.delete(observacioFitxa);
        if(observacioActual == observacioFitxa) {
          document.getElementById("foto").src = "img/launcher-icon-4x.png";
          document.getElementById("descripcio").value = "";
          document.getElementById("fenomen").value = "0";
          observacioActual = "";
        }
        activa('observacions');
        llistaObservacions(); 
        alert("S'ha eliminat l'observació.");          
      }
    }
  }
}

function actualitzaObservacio() {
  if(observacioActual == ""){
    alert("Si us plau, fes primer la foto corresponent a l'observació.");
  } else {
    var Id_feno = document.getElementById('fenomen').value;
    var Descripcio_observacio = document.getElementById('descripcio').value;
    if(Id_feno == "0" || Descripcio_observacio == "") {
      alert("Si us plau, tria primer el tipus de fenomen i escriu una breu descripció.");
    } else {
      indexedDB.open("eduMET").onsuccess = function(event) {
        var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
        var request = objStore.get(observacioActual);
        request.onsuccess = function() {
          var data = request.result;
          data.Id_feno =  Id_feno;
          data.Descripcio_observacio = Descripcio_observacio;
          objStore.put(data);
          alert("S'ha desat el tipus d'observació i la descripció del fenomen.");
        }
      }
    }
  }
}

function llistaObservacions() {  
  var llista = '';
  indexedDB.open("eduMET").onsuccess = function(event) { 
    event.target.result.transaction("Observacions", "readonly").objectStore("Observacions").openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        llista+= '<div style="display:flex; align-items:center;" onClick="fitxa(\'' + cursor.value.Data_registre +'\')"><div style="width:25%"><img src="';
        var foto = cursor.value.Fotografia_observacio;
        if(foto == 0) {
          llista+= cursor.value.Imatge;
        } else {
          llista+= url_imatges + foto;
        }
        llista+= '" style="width:10vh; height:10vh" /></div><label style="width:25%">' + formatDate(cursor.value.Data_observacio) + '<br>' + cursor.value.Hora_observacio +'</label><label style="width:25%">';
        if(cursor.value.Id_feno != "0") {
          llista+= fenomens[parseInt(cursor.value.Id_feno)]["Titol_feno"];
        } else {
          llista+= 'Sense identificar';
        }
        llista+= '</label><div style="width:25%"><i id="' + cursor.value.Data_registre + '" class="material-icons icona-36" style="color:';
        if(cursor.value.Enviat == "1") {
          llista+= 'limegreen';
        } else {
          llista+= 'lightgray';
        }
        llista+= '">check</i></div></div>';   
        cursor.continue();     
      }
      document.getElementById('llistat').innerHTML = llista;
    }
  }
}

function desaObservacio(string64){  
  var ara = new Date(Date.now());
  var any = ara.getFullYear();
  var mes = ara.getMonth() + 1;
  var dia = ara.getDate();
  var hora = ara.getHours();
  var minut = ara.getMinutes();
  var segon = ara.getSeconds();
  mes = mes.toString();
  dia = dia.toString();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  var Data_actual = any + '-' + mes + '-' + dia;
  var Hora_actual = hora + ':' + minut + ':' + segon;

  observacioActual = Data_actual + " " + Hora_actual;

  var fotoData = "";
  var fotoHora = "";
  var fotoLatitud = "";
  var fotoLongitud = "";

  if (origen == "camera") {
    fotoData = Data_actual;
    fotoHora = Hora_actual;
    if(mobilLocalitzat) {
      fotoLatitud = latitudActual;
      fotoLongitud = longitudActual;
    }
    else {
      fotoLatitud = ExifLatitud;
      fotoLongitud = ExifLongitud;
    }
  } else {
    fotoData = ExifData;
    fotoHora = ExifHora;
    fotoLatitud = ExifLatitud;
    fotoLongitud = ExifLongitud;
  }

  var nou_registre = [];
  nou_registre["Data_registre"] = observacioActual;
  nou_registre["Enviat"] = 0;
  nou_registre["Data_observacio"] = fotoData;
  nou_registre["Hora_observacio"] = fotoHora;
  nou_registre["Latitud"] = fotoLatitud;
  nou_registre["Longitud"] = fotoLongitud;
  nou_registre["Imatge"] = string64;
  nou_registre["ID"] = 0;
  nou_registre["Id_feno"] = 0;
  nou_registre["Descripcio_observacio"] = "";
  nou_registre["Fotografia_observacio"] = "0";

  indexedDB.open("eduMET").onsuccess = function(event) { 
    event.target.result.transaction("Observacions", "readwrite").objectStore("Observacions").add(nou_registre);
  }
}

function activa(fragment) {
  flagRadar = false;
  document.getElementById('fenologia').style.display='none';
  document.getElementById('estacions').style.display='none';
  document.getElementById('radar').style.display='none';
  document.getElementById('prediccio').style.display='none';
  document.getElementById('observacions').style.display='none';
  document.getElementById('fitxa').style.display='none';
  document.getElementById('login').style.display='none';
  document.getElementById('fotografia').style.display='none';
  document.getElementById('registra').style.display='none';
  document.getElementById(fragment).style.display='flex';
  var boto = document.getElementById("boto_estacions");
  boto.style.color = "graytext";
  var boto = document.getElementById("boto_observacions");
  boto.style.color = "graytext";
  var boto = document.getElementById("boto_registra");
  boto.style.color = "graytext";
  var boto = document.getElementById("boto_prediccio");
  boto.style.color = "graytext";
  var boto = document.getElementById("boto_radar");
  boto.style.color = "graytext";
  switch (fragment) {
    case "estacions":
      boto = document.getElementById("boto_estacions");
      break;
    case "login":
    case "fenologia":
    case "observacions":
    case "fitxa":
    case "fotografia":
      boto = document.getElementById("boto_observacions");
      break;
    case "registra":
      boto = document.getElementById("boto_registra");
      break;
    case "prediccio":
      boto = document.getElementById("boto_prediccio");
      break;
    case "radar":
      boto = document.getElementById("boto_radar");
      break;
    default:
      break;
  }
boto.style.color = colorEdumet;  
vistaActual = fragment;
}

function login() {
  if (usuari == "" || usuari == null) {
    document.getElementById("usuari").value = "";
    document.getElementById("password").value = "";
    if (checkConnection() != 'No network connection') {
      activa('login');
    } else {
      alert("Per iniciar sessió al servidor eduMET, veure les teves observacions o penjar-ne de noves, has d'estar connectat a Internet.");          
    }
  }
  else {
    fenologia();
  }
}
function fenologia() {
  activa('fenologia');
  if(!obsActualitzades && (checkConnection() != 'No network connection')) {
    baixaObsAfegides();
    obsActualitzades =  true;
  }
}
function estacio() {
  activa('estacions');
  map.invalidateSize();
}
function radar() {
  if(checkConnection() != 'No network connection') {
    activa('radar');
    //document.getElementById('frameRadar').src = "https://edumet.cat/edumet/meteo_proves/00_radar_app.php";
    //document.getElementById('frameRadar').src = "http://m.meteo.cat/temps-actual";
    var url = url_servidor + "?tab=radar";
    fetch(url)
    .then(response => response.text())
    .then(response =>  JSON.parse(response))
    .then(response => {
      var stringDiv ='';
      for(i=0;i<response.length;i++) {
        if(screen.orientation.type == "landscape" || screen.orientation.type == "landscape-primary" || screen.orientation.type == "landscape-secondary") {
          stringDiv+='<div class="mySlidesLandscape"><img class="imgSlidesLandscape" src="https://edumet.cat/edumet-data/meteocat/radar/';
        } else {
          stringDiv+='<div class="mySlidesPortrait"><img class="imgSlidesPortrait" src="https://edumet.cat/edumet-data/meteocat/radar/';
        }
        stringDiv+= response[i];
        stringDiv+='"></div>';
      }
      document.getElementById('slideshow-container').innerHTML = stringDiv;
      stringDiv ='';
      for(i=0;i<response.length;i++) {
        stringDiv+='<span class="dot"></span>';
      }
      document.getElementById('puntets').innerHTML = stringDiv;
      slideIndex = 0;
      flagRadar = true;
      showSlides();    
    });
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function showSlides() {
  if(screen.orientation.type == "landscape" || screen.orientation.type == "landscape-primary" || screen.orientation.type == "landscape-secondary") {
    var slides = document.getElementsByClassName("mySlidesLandscape");
  } else {
    var slides = document.getElementsByClassName("mySlidesPortrait");
  }
  var dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}    
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
  if(flagRadar) {
    timeOut = setTimeout(showSlides, 1000); // Change image every second
  }
}

function prediccio() {
  if(checkConnection() != 'No network connection') {
    activa('prediccio');
    var frame = document.getElementById('frame');
    var loader = document.getElementById('loaderPrediccio');
    loader.style.animationPlayState = "running";
    frame.onload = function() {
      loader.style.animationPlayState = "paused";
      loader.style.display = "none";
      frame.style.display = "flex";      
    }
    frame.src = 'https://static-m.meteo.cat/ginys/municipal8d?language=ca&color=2c3e50&tempFormat=ºC&location=' + INEinicial;
    console.log(frame.src);
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function observa() {
  activa('observacions');
  llistaObservacions();
}
function fotografia() {
  var veureFoto = true;
  if((vistaActual == 'fenologia') && (observacioActual == "")) {
    veureFoto = false;
    fesFoto();
  } 
  if(veureFoto) {  
    vistaOrigen = vistaActual;
    activa('fotografia');
    if(vistaOrigen == 'fenologia') {
      document.getElementById('fotoGran').src = document.getElementById('foto').src;
    } else {
      document.getElementById('fotoGran').src = document.getElementById('fotoFitxa').src;
    }
  }
}

function fitxa(observacio) {
  observacioFitxa = observacio;
  activa('fitxa');
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioFitxa).onsuccess = function(e) {
      var nomFenomen = document.getElementById('nomFenomen');
      if(e.target.result["Id_feno"] != "0") {
        nomFenomen.innerHTML = fenomens[e.target.result["Id_feno"]]["Bloc_feno"] + ': ' + fenomens[e.target.result["Id_feno"]]["Titol_feno"];
      } else {
        nomFenomen.innerHTML = "Sense identificar";
      }
      var dataHora = document.getElementById('dataHora');
      dataHora.innerHTML = formatDate(e.target.result["Data_observacio"]) + '  -  ' + e.target.result["Hora_observacio"];
      var fotoFitxa = document.getElementById('fotoFitxa');
      var foto = e.target.result["Fotografia_observacio"];
        if(foto == 0) {
          fotoFitxa.src = e.target.result["Imatge"];
        } else {
          fotoFitxa.src = url_imatges + foto;
        }
      var descripcioFitxaFitxa = document.getElementById('descripcioFitxa');
      descripcioFitxaFitxa.innerHTML = e.target.result["Descripcio_observacio"];
      if(checkConnection() != 'No network connection') {
        var online = true;
      } else {
        var online = false;
      }
      try {
        mapaFitxa = L.map('mapaFitxa');
        if(online){
          mapaFitxa.setView(new L.LatLng(e.target.result["Latitud"], e.target.result["Longitud"]), 15);
          L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            minZoom: 1,
            maxZoom: 19,
            attribution: 'Wikimedia'
          }).addTo(mapaFitxa);
        } else{
          mapaFitxa.setView(new L.LatLng(e.target.result["Latitud"], e.target.result["Longitud"]), 10);
          const xhr = new XMLHttpRequest();
          xhr.open('GET', 'json/municipis.geojson');
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.responseType = 'json';
          xhr.onload = function() {
              return L.geoJSON(xhr.response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(mapaFitxa);
          };
          xhr.send();
        }
      } catch {
        if(online){
          var zoom = 15;
        } else {
          var zoom = 10;
        }
        mapaFitxa.invalidateSize();
        mapaFitxa.setView(new L.LatLng(e.target.result["Latitud"],e.target.result["Longitud"]), zoom);
        mapaFitxa.removeLayer(marcadorFitxa);
      }
      marcadorFitxa = L.marker(new L.LatLng(e.target.result["Latitud"],e.target.result["Longitud"]));
      marcadorFitxa.addTo(mapaFitxa);    
    }
  }
}

function valida() {
  usuari = document.getElementById('usuari').value;
  contrasenya = document.getElementById('password').value;
  var url = url_servidor + "?ident=" + usuari + "&psw=" + contrasenya + "&tab=registrar_se"
  fetch(url)
  .then(response => response.text())
  .then(response => response.trim())
  .then(response => {
    if (response == "") {
      console.log("No Auth");
      usuari = "";
      alert("Usuari i/o contrasenya incorrectes. Si us plau, torna-ho a provar.");
    } else {
      console.log("Auth OK " + usuari);
      storage.setItem("user", usuari);
      baixaObsInicial();
      activa('fenologia');
    }
  });
}

function geoFail() {
  console.log("GeoFail");
}

function geoSuccess(position){
  latitudActual = position.coords.latitude;
  longitudActual = position.coords.longitude;

  if(!estacioDesada) {
    var estPreferida = storage.getItem("estacio");
    if (estPreferida == null) {
      var distanciaPropera = 1000;
      var distanciaProva;
      var estacioPropera = 0;
      indexedDB.open("eduMET").onsuccess = function(event) {
        event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").getAll().onsuccess = function(event) {
          console.log("numEstacions:" + event.target.result.length);
          for(i=0;i<event.target.result.length;i++){
            distanciaProva = getDistanceFromLatLonInKm(latitudActual, longitudActual, event.target.result[i]["Latitud"], event.target.result[i]["Longitud"]);
            if(distanciaProva < distanciaPropera) {
              distanciaPropera = distanciaProva;
              estacioPropera = i;
            }
          }
          console.log("Preferida (Propera): " + event.target.result[estacioPropera]["Codi_estacio"] + " : " + event.target.result[estacioPropera]["Nom_centre"]);
          estacioActual = event.target.result[estacioPropera]["Codi_estacio"];
          estacioPreferida = estacioActual;
          storage.setItem("estacio", estacioPreferida);
          estacioDesada = true;
          document.getElementById("est_nom").value = estacioPreferida;
          mostraEstacio();
        };
      };
    }
  }

  if(!mobilLocalitzat) {
    mobilLocalitzat = true; 
    console.log("GeoSuccess: " + latitudActual + ", " + longitudActual);
    var greenIcon = L.icon({
      iconUrl: 'img/marker-icon-green.png',
      iconAnchor: [12, 41],
      shadowUrl: 'leaflet/images/marker-shadow.png',
    });
    L.marker(new L.LatLng(latitudActual, longitudActual),{icon: greenIcon}).addTo(map);
  }
} 

function checkConnection() {
  var networkState = navigator.connection.type;
  var states = {};
  states[Connection.UNKNOWN]  = 'Unknown connection';
  states[Connection.ETHERNET] = 'Ethernet connection';
  states[Connection.WIFI]     = 'WiFi connection';
  states[Connection.CELL_2G]  = 'Cell 2G connection';
  states[Connection.CELL_3G]  = 'Cell 3G connection';
  states[Connection.CELL_4G]  = 'Cell 4G connection';
  states[Connection.CELL]     = 'Cell generic connection';
  states[Connection.NONE]     = 'No network connection';
  return states[networkState];
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function formatDate(dia) {
  if(dia.indexOf(":") == -1) {
    var parts = dia.split('-');
  } else {
    var parts = dia.split(':');
  }
  var d = new Date(parts[0], parts[1] - 1, parts[2]); 
  month = '' + (d.getMonth() + 1);
  day = '' + d.getDate();
  year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [day, month, year].join('-');
}

function checkDeviceSupport(callback) {
  if (!canEnumerate) {
      return;
  }
  if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
      navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
  }
  if (!navigator.enumerateDevices && navigator.enumerateDevices) {
      navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
  }
  if (!navigator.enumerateDevices) {
      if (callback) {
          callback();
      }
      return;
  }
  MediaDevices = [];
  navigator.enumerateDevices(function(devices) {
      devices.forEach(function(_device) {
          var device = {};
          for (var d in _device) {
              device[d] = _device[d];
          }
          /*if (device.kind === 'audio') {
              device.kind = 'audioinput';
          }*/
          if (device.kind === 'video') {
              device.kind = 'videoinput';
          }
          var skip;
          MediaDevices.forEach(function(d) {
              if (d.id === device.id && d.kind === device.kind) {
                  skip = true;
              }
          });
          if (skip) {
              return;
          }
          if (!device.deviceId) {
              device.deviceId = device.id;
          }
          if (!device.id) {
              device.id = device.deviceId;
          }
          if (!device.label) {
              device.label = 'Please invoke getUserMedia once.';
              if (!isHTTPs) {
                  device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
              }
          } else {
              if (device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
                  isWebcamAlreadyCaptured = true;
              }
              /*if (device.kind === 'audioinput' && !isMicrophoneAlreadyCaptured) {
                  isMicrophoneAlreadyCaptured = true;
              }*/
          }
          /*if (device.kind === 'audioinput') {
              hasMicrophone = true;
          }
          if (device.kind === 'audiooutput') {
              hasSpeakers = true;
          }*/
          if (device.kind === 'videoinput') {
              hasWebcam = true;
          }
          // there is no 'videoouput' in the spec.
          MediaDevices.push(device);
      });
      if (callback) {
          callback();
      }
  });
}

function ConvertDMSToDD(degrees, minutes, seconds, direction) {    
  var dd = degrees + (minutes/60) + (seconds/3600);    
  if (direction == "S" || direction == "W") {
      dd = dd * -1; 
  }    
  return dd;
}
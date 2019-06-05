window.onload = function() {
  usuari = storage.getItem("user");
  var online;
  var stringDatabase = storage.getItem("database");
  map = L.map('map');
  if (!(navigator.onLine)) {
    online = false;
    if(stringDatabase == null) {
      alert("La configuració inicial de l'App precisa una connexió a Internet. Si us plau, reinicia l'App quan en tinguis.");        
    } else {
      alert("No es pot connectar a Internet. Algunes característiques de l'App no estaran disponibles.");
      map.setView([41.7292826, 1.8225154], 10);
      fetch("https://edumet.cat/edumet/app/json/municipis.geojson")
      .then(response => response.json())
      .then(response => {
        L.geoJSON(response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(map);
      });
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
  //var ara = new Date();
  //var dies = (ara - new Date(stringDatabase)) / 36000000;
  if(stringDatabase == null && online) {
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
 
  window.addEventListener("orientationchange", function(){
    console.log("event triggered");
    ajustaOrientacio();
  });
  ajustaOrientacio();   
  
  document.getElementById('fitxer_galeria').addEventListener("change", function(event) {
    readURL(this);
  });
  document.getElementById('fitxer').addEventListener("change", function(event) {
    readURL(this);
  });
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
var orientacio;

var MediaDevices = [];
var isHTTPs = location.protocol === 'https:';
var canEnumerate = false;

if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
  // Firefox 38+ seems having support of enumerateDevicesx
  navigator.enumerateDevices = function(callback) {
      navigator.mediaDevices.enumerateDevices().then(callback);
  };
}

if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
    canEnumerate = true;
} else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
    canEnumerate = true;
}

var hasWebcam = false;
var isWebcamAlreadyCaptured = false;

checkDeviceSupport();

var origen;

//app.initialize();

function empty() {  
}
function back() {
  switch(vistaActual) {
    case 'fitxa':
      window.history.pushState({}, '');
      activa('observacions');
      break;
    case 'observacions':
      window.history.pushState({}, '');
      activa('fenologia');
      break
    case 'fotografia':
      window.history.pushState({}, '');
      activa(vistaOrigen);
      break;
    default:
      alert("Per sortir de l'App eduMET has de prémer el botó Tornar o Inici del teu mòbil.")
      /*if (confirm("Vols sortir de l'App eduMET?")) {
        window.history.back();
        window.history.back();
      }*/
  }
}

function ajustaOrientacio() {
  console.log("window.orientation: " + window.orientation);
  if(window.orientation == 0 || window.orientation == 180) {
    orientacio = "portrait";
  } else {
    orientacio = "landscape";
  }
  console.log("Orientació: " + orientacio);
  var textBoto = '<i class="material-icons icona-24">';
  if(orientacio == "landscape" || orientacio == "landscape-primary" || orientacio == "landscape-secondary") {
    $("#boto_observacions").html(textBoto + 'camera_alt</i>');
    $("#boto_estacions").html(textBoto + 'router</i>');
    $("#boto_registra").html(textBoto + 'bookmark</i>');
    $("#boto_prediccio").html(textBoto + 'cloud</i>');
    $("#boto_radar").html(textBoto + 'wifi_tethering</i>');
    $("#radar").css("flexDirection","row");
    $("#puntets").css("flexDirection","column");
    $("#slideshow-container").css("height","80vh"); 
    $("#slideshow-container").css("width","auto"); 
    $("#contingutFitxa").css("flexDirection","row"); 
    $("#edicio_fitxa").css("width","50%"); 
    $("#edicio_fitxa").css("height","100%"); 
    $("#desc_map_fitxa").css("width","50%"); 
    $("#desc_map_fitxa").css("height","100%"); 
    $("#registra").css("flexDirection","row"); 
    $("#nou_registre").css("width","50%"); 
    $("#nou_registre").css("height","100%"); 
    $("#entrada_dades").css("width","50%"); 
    $("#entrada_dades").css("height","100%"); 
  } else {
    $("#boto_observacions").html(textBoto + 'camera_alt</i><br>Observa');
    $("#boto_estacions").html(textBoto + 'router</i><br>Estació');
    $("#boto_registra").html(textBoto + 'bookmark</i><br>Registra');
    $("#boto_prediccio").html(textBoto + 'cloud</i><br>Predicció');
    $("#boto_radar").html(textBoto + 'wifi_tethering</i><br>Radar');
    $("#radar").css("flexDirection","column");
    $("#puntets").css("flexDirection","row");
    $("#slideshow-container").css("width","100%");
    $("#slideshow-container").css("height","auto");    
    $("#contingutFitxa").css("flexDirection","column"); 
    $("#edicio_fitxa").css("width","100%"); 
    $("#edicio_fitxa").css("height","50%"); 
    $("#desc_map_fitxa").css("width","100%"); 
    $("#desc_map_fitxa").css("height","50%"); 
    $("#registra").css("flexDirection","column"); 
    $("#nou_registre").css("width","100%"); 
    $("#nou_registre").css("height","50%"); 
    $("#entrada_dades").css("width","100%"); 
    $("#entrada_dades").css("height","50%"); 
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
      //fenomens[i+1] = response[i];
      fenomens[response[i]["Id_feno"]] = response[i];
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
    //fenomens[i+1] = response[i];
    fenomens[response[i]["Id_feno"]] = response[i];
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
          //var x = document.getElementById("est_nom");
          $("#est_nom").val(this.Codi_estacio);
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
        $("#est_nom").val(estacioPreferida);
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
  estacioActual = $("#est_nom").val();
  mostraEstacio();
}

function mostraEstacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioActual).onsuccess = function(e) {
      $("#est_poblacio").html(e.target.result["Poblacio"]);
      $("#est_altitud").html("Altitud: " + e.target.result["Altitud"] + " m");
      var URLlogo = "https://edumet.cat/edumet-data/" + e.target.result["Codi_estacio"] + "/estacio/profile1/imatges/fotocentre.jpg";
      $("#est_logo").attr("src", URLlogo);
      if(navigator.onLine){
        getMesures();
      } else {
        $("#data_mesura").css("color","#FF0000");
        $("#data_mesura").html("Sense connexió a Internet");
        $("#temperatura").html("");
        $("#humitat").html("");
        $("#pressio").html("");
        $("#sunrise").html("");
        $("#sunset").html("");
        $("#pluja").html("");
        $("#vent").html(""); 
      }
      map.setView(new L.LatLng(e.target.result["Latitud"], e.target.result["Longitud"]));
    }
  }
  if(estacioActual == estacioPreferida) {
    $("#star").html("star");
    $("#star").css("color","yellow");
  } else {
    $("#star").html("star_border");
    $("#star").css("color","lightgray");
  }
}

function desaPreferida() {
  estacioPreferida = $("#est_nom").val();
  console.log("Preferida (Triada): " + estacioPreferida);
  storage.setItem("estacio", estacioPreferida);  
  $("#star").html("star");
  $("#star").css("color","yellow");
}

function getMesures() {
  var url = url_servidor + "?tab=mobilApp&codEst=" + estacioActual;
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {     
    $("#temperatura").html(response[0]["Temp_ext_actual"]+ " ºC <label style='color:red'>" + response[0]["Temp_ext_max_avui"] + " ºC <label style='color:cyan'>" + response[0]["Temp_ext_min_avui"] + " ºC</label>");
    $("#humitat").html(response[0]["Hum_ext_actual"] + "%");
    $("#pressio").html(response[0]["Pres_actual"] + " HPa");
    $("#sunrise").html(response[0]["Sortida_sol"].slice(0,5));
    $("#sunset").html(response[0]["Posta_sol"].slice(0,5));
    $("#pluja").html(response[0]["Precip_acum_avui"] + " mm");
    $("#vent").html(response[0]["Vent_vel_actual"] + " Km/h");    
    INEinicial = response[0]["codi_INE"];
    var stringDataFoto = response[0]["Data_UTC"] + 'T' + response[0]["Hora_UTC"];
    var interval = (new Date() - new Date(stringDataFoto)) / 3600000;
    $("#data_mesura").html("Actualitzat a les " + response[0]["Hora_UTC"] + " del " + formatDate(response[0]["Data_UTC"]));
    if(interval < 2) {
      $("#data_mesura").css("color","#006633");
    } else {
      $("#data_mesura").css("color","#FF0000");
    }
  })
  .catch(reason => {
    $("#data_mesura").css("color","#FF0000");
    $("#data_mesura").html("L'estació no proporciona les dades ...");
    $("#temperatura").html("");
    $("#humitat").html("");
    $("#pressio").html("");
    $("#sunrise").html("");
    $("#sunset").html("");
    $("#pluja").html("");
    $("#vent").html("");  
    console.log("Error:" + reason);
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
  $("#foto").attr("src","img/launcher-icon-4x.png");
  $("#descripcio").val("");
  $("#fenomen").val("0");
  estacio();
}

function fesFoto() {
  console.log("webcam: " + hasWebcam);
  if(hasWebcam) {
    origen = "camera";
    $("#fitxer").click();
  } else {
    origen = "galeria";
    $("#fitxer_galeria").click();
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
        ExifData = formatDateGPS(splitData[0]);
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
        $("#foto").attr("src", canvas.toDataURL("image/jpeg",0.5));
        $("#descripcio").val("");
        $("#fenomen").val("0");
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
        fetch(url_imatges + response[i]["Fotografia_observacio"]);
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
              fetch(url_imatges + response[i]["Fotografia_observacio"]);
              obsObjStore.add(response[i]);              
            }
          }     
        }
      }
    }
  });
}

function enviaActual() {
  if(navigator.onLine){
    enviaObservacio(observacioActual);
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function enviaFitxa() {
  if(navigator.onLine){
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
        if(e.target.result["Id_feno"] == "0" || e.target.result["Descripcio_observacio"] == "") {
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
                        //$("edita_obs').disabled = true;
                        //$("envia_obs').disabled = true;
                        //var checkVerd = document.getElementById(e.target.result["Data_registre"]);
                        //checkVerd.style.color = "limegreen";
                        $("#" + e.target.result["Data_registre"]).css("color","limegreen");
                      }
                    }
                  }                       
                });
              } else {
                //navigator.notification.alert("Aquesta observació ja està penjada al servidor eduMET. Si us plau, fes una nova observació.", empty, 'Penjar observació', "D'acord");
                var url = url_servidor + '?tab=modificarFenoApp&id=' + e.target.result["ID"] + '&Id_feno=' + e.target.result["Id_feno"] +'&descripcio="' + e.target.result["Descripcio_observacio"] + '"';
                fetch(url)
                  .then(response =>  {
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
      var foto = e.target.result["Fotografia_observacio"];
      if(foto == "0") {
        $("#foto").attr("src", e.target.result["Imatge"]);
      } else {
        $("#foto").attr("src", url_imatges + foto);
      }
      $("#fenomen").val(e.target.result["Id_feno"]);
      if(e.target.result["Descripcio_observacio"] == "Sense descriure"){
        $("#descripcio").val("");
      } else {
        $("#descripcio").val(e.target.result["Descripcio_observacio"]);
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
        if (!(navigator.onLine)) {
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
          $("#foto").attr("src","img/launcher-icon-4x.png");
          $("#descripcio").val("");
          $("#fenomen").val("0");
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
    if($("#fenomen").val() == 0 || $("#descripcio").val() == "") {
      alert("Si us plau, tria primer el tipus de fenomen i escriu una breu descripció.");
    } else {
      indexedDB.open("eduMET").onsuccess = function(event) {
        var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
        var request = objStore.get(observacioActual);
        request.onsuccess = function() {
          var data = request.result;
          data.Id_feno =  $("#fenomen").val();
          data.Descripcio_observacio = $("#descripcio").val();
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
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").getAll().onsuccess = function(event) {
      var obs = event.target.result;
      obs.sort(function(a,b){
          return new Date(b["Data_registre"]) - new Date(a["Data_registre"]);
      });
      for(i=0;i<obs.length;i++){
        llista+= '<div style="display:flex; align-items:center;" onClick="fitxa(\'' + obs[i]["Data_registre"] +'\')"><div style="width:25%"><img src="';
        var foto = obs[i]["Fotografia_observacio"];
        if(foto == 0) {
          llista+=  obs[i]["Imatge"];
        } else {
          llista+= url_imatges + foto;
        }
        llista+= '" style="width:10vh; height:10vh" /></div><label style="width:25%">'; 
        if(obs[i]["Data_observacio"] != "") {
          llista+= formatDate(obs[i]["Data_observacio"]) + '<br>' + obs[i]["Hora_observacio"];
        }
        llista+= '</label><label style="width:25%">';        
        if(obs[i]["Id_feno"] != "0") {
          llista+= fenomens[obs[i]["Id_feno"]]["Titol_feno"];
        } else {
          llista+= 'Sense identificar';
        }
        llista+= '</label><div style="width:25%"><i id="' + obs[i]["Data_registre"] + '" class="material-icons icona-36" style="color:';
        if(obs[i]["Enviat"] == "1") {
          llista+= 'limegreen';
        } else {
          llista+= 'lightgray';
        }
        llista+= '">check</i></div></div>'; 
      }
      $("#llistat").html(llista);
    };
  }
}

function desaObservacio(string64){  
  var ara = new Date(Date.now());
  var any = ara.getFullYear();
  var mes = (ara.getMonth() + 1).toString();
  var dia = ara.getDate().toString();
  var hora = ara.getHours().toString();
  var minut = ara.getMinutes().toString();
  var segon = ara.getSeconds().toString();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  if (hora.length < 2) hora = '0' + hora;
  if (minut.length < 2) minut = '0' + minut;
  if (segon.length < 2) segon = '0' + segon;
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
  nou_registre["Id_feno"] = "0";
  nou_registre["Descripcio_observacio"] = "";
  nou_registre["Fotografia_observacio"] = "0";

  indexedDB.open("eduMET").onsuccess = function(event) { 
    event.target.result.transaction("Observacions", "readwrite").objectStore("Observacions").add(nou_registre);
  }
}

function activa(fragment) {
  flagRadar = false;
  $("#fenologia").css("display","none");
  $("#estacions").css("display","none");
  $("#radar").css("display","none");
  $("#prediccio").css("display","none");
  $("#observacions").css("display","none");
  $("#fitxa").css("display","none");
  $("#login").css("display","none");
  $("#fotografia").css("display","none");
  $("#registra").css("display","none");
  $("#" + fragment).css("display","flex");
  $("#boto_estacions").css("color","graytext");
  $("#boto_observacions").css("color","graytext");
  $("#boto_registra").css("color","graytext");
  $("#boto_prediccio").css("color","graytext");
  $("#boto_radar").css("color","graytext");
  switch (fragment) {
    case "estacions":
      boto = $("#boto_estacions");
      break;
    case "login":
    case "fenologia":
    case "observacions":
    case "fitxa":
    case "fotografia":
      boto = $("#boto_observacions");
      break;
    case "registra":
      boto = $("#boto_registra");
      break;
    case "prediccio":
      boto = $("#boto_prediccio");
      break;
    case "radar":
      boto = $("#boto_radar");
      break;
    default:
      break;
  }
boto.css("color", colorEdumet);  
vistaActual = fragment;
}

function login() {
  if (usuari == "" || usuari == null) {
    $("#password").keyup(function(event) {
      if (event.keyCode === 13) {
        valida();
      }
    });
    $("#usuari").val("");
    $("#password").val("");
    if (navigator.onLine) {
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
}
function estacio() {
  activa('estacions');
  map.invalidateSize();
}
function radar() {
  if(navigator.onLine) {
    activa('radar');
    //$("frameRadar').src = "https://edumet.cat/edumet/meteo_proves/00_radar_app.php";
    //$("frameRadar').src = "http://m.meteo.cat/temps-actual";
    var url = url_servidor + "?tab=radar";
    fetch(url)
    .then(response => response.text())
    .then(response =>  JSON.parse(response))
    .then(response => {
      var stringDiv ='';
      for(i=0;i<response.length;i++) {
        if(orientacio == "landscape" || orientacio == "landscape-primary" || orientacio == "landscape-secondary") {
          stringDiv+='<div class="mySlidesLandscape"><img class="imgSlidesLandscape" src="https://edumet.cat/edumet-data/meteocat/radar/';
        } else {
          stringDiv+='<div class="mySlidesPortrait"><img class="imgSlidesPortrait" src="https://edumet.cat/edumet-data/meteocat/radar/';
        }
        stringDiv+= response[i];
        stringDiv+='"></div>';
      }
      $("#slideshow-container").html(stringDiv);
      stringDiv ='';
      for(i=0;i<response.length;i++) {
        stringDiv+='<span class="dot"></span>';
      }
      $("#puntets").html(stringDiv);
      slideIndex = 0;
      flagRadar = true;
      showSlides();    
    });
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function showSlides() {
  if(orientacio == "landscape" || orientacio == "landscape-primary" || orientacio == "landscape-secondary") {
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
  if(navigator.onLine) {
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
      $("#fotoGran").attr("src", $("#foto").attr("src"));
    } else {
      $("#fotoGran").attr("src", $("#fotoFitxa").attr("src"));
    }
  }
}

function fitxa(observacio) {
  observacioFitxa = observacio;
  activa('fitxa');
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioFitxa).onsuccess = function(e) {
      if(e.target.result["Id_feno"] != "0") {
        $("#nomFenomen").html(fenomens[e.target.result["Id_feno"]]["Bloc_feno"] + ': ' + fenomens[e.target.result["Id_feno"]]["Titol_feno"]);
      } else {
        $("#nomFenomen").html("Sense identificar");
      }
      if(e.target.result["Data_observacio"] != "") {
        $("#dataHora").text(formatDate(e.target.result["Data_observacio"]) + '  -  ' + e.target.result["Hora_observacio"]);
      }
      var foto = e.target.result["Fotografia_observacio"];
        if(foto == 0) {
          $("#fotoFitxa").attr("src", e.target.result["Imatge"]);
        } else {
          $("#fotoFitxa").attr("src", url_imatges + foto);
        }
      $("#descripcioFitxa").text(e.target.result["Descripcio_observacio"]);
      if(navigator.onLine) {
        var online = true;
      } else {
        var online = false;
      }
      var laLatitud = e.target.result["Latitud"];
      var laLongitud = e.target.result["Longitud"];
      if(laLatitud == "") {
        if(mobilLocalitzat) {
          laLatitud = latitudActual;
          laLongitud = longitudActual;
        } else {
          laLatitud = 41.7292826;
          laLongitud = 1.8225154;      
        }
      }
      try {
        mapaFitxa = L.map('mapaFitxa');
        if(online){
          mapaFitxa.setView(new L.LatLng(laLatitud, laLongitud), 15);
          L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            minZoom: 1,
            maxZoom: 19,
            attribution: 'Wikimedia'
          }).addTo(mapaFitxa);
        } else{
          mapaFitxa.setView(new L.LatLng(laLatitud, laLongitud), 10);
          //const xhr = new XMLHttpRequest();
          fetch("https://edumet.cat/edumet/app/json/municipis.geojson")
          .then(response => response.json())
          .then(response => {
            L.geoJSON(response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(mapaFitxa);
          });
        }
      } catch (error) {
        if(online){
          var zoom = 15;
        } else {
          var zoom = 10;
        }
        mapaFitxa.invalidateSize();
        mapaFitxa.setView(new L.LatLng(laLatitud,laLongitud), zoom);
        mapaFitxa.removeLayer(marcadorFitxa);
      }      
      if(e.target.result["Latitud"] != "") {
        marcadorFitxa = L.marker(new L.LatLng(laLatitud,laLongitud));
        marcadorFitxa.addTo(mapaFitxa);  
      }  
    }
  }
}

function valida() {
  usuari = $("#usuari").val();
  contrasenya = $("#password").val();
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
      console.log("Auth OK: " + usuari);
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
          $("#est_nom").val(estacioPreferida);
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
      shadowUrl: 'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png',
    });
    L.marker(new L.LatLng(latitudActual, longitudActual),{icon: greenIcon}).addTo(map);
  }
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
  var parts = dia.split('-');
  var d = new Date(parts[0], parts[1] - 1, parts[2]); 
  month = '' + (d.getMonth() + 1);
  day = '' + d.getDate();
  year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [day, month, year].join('-');
}
function formatDateGPS(dia) {
  var parts = dia.split(':');
  var d = new Date(parts[0], parts[1] - 1, parts[2]); 
  month = '' + (d.getMonth() + 1);
  day = '' + d.getDate();
  year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
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
          }
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
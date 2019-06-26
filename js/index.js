window.onload = function() {
  usuari = storage.getItem("user");
  var stringDatabase = storage.getItem("database");
  var online;
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
      db.createObjectStore("Observacions", {keyPath: "GUID", autoIncrement:true});
      baixaFenomens();
      baixaEstacions();
    }
  } else {
    mostraEstacions();
    getFenomens();
  }
  var options = {
    singleDatePicker: true,
    startDate: moment(),
    showDropdowns: true,
    minYear: 2000,
    timePicker: true,
    timePicker24Hour: true,
    timePickerSeconds: true,
    locale: {
      "format": "DD/MM/YYYY HH:mm:ss",
      "separator": " - ",
      "applyLabel": "Desa la data i l'hora",
      "cancelLabel": "Cancel·la",
      "customRangeLabel": "Custom",
      "daysOfWeek": ["Di","Dl","Dm","Dc","Dj","Dv","Ds"],
      "monthNames": ["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"],
      "firstDay": 1
    }
  }
  
  document.getElementById('fitxer_galeria').addEventListener("change", function(event) {
    readURL(this);
  });
  document.getElementById('fitxer').addEventListener("change", function(event) {
    readURL(this);
  });
  $("#calendari").daterangepicker(options, function(start) {
    var dia = start.format('YYYY-MM-DD');
    var hora = start.format('HH:mm:ss'); 
    flagDataRegistre = true;
    //desaData(dia,hora);
  });
  $("#calendari").on('show.daterangepicker', function(ev, picker) {
    flagDataTriada = false;
  });
  $("#calendari").on('apply.daterangepicker', function(ev, picker) {
    if(!flagDataTriada) {
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
      desaData(Data_actual,Hora_actual);
    }
  });
  $("#data_registre").daterangepicker(options, function(start) {
    //start.format('YYYY-MM-DD HH:mm:ss');
    //var hora = start.format('HH:mm:ss'); 
    flagDataRegistre = true;
    //desaData(dia,hora);
  });
  $("#data_registre").on('show.daterangepicker', function(ev, picker) {
    flagDataRegistre = false;
  });
  $("#data_registre").on('apply.daterangepicker', function(ev, picker) {
    if(!flagDataRegistre) {
      /*var ara = new Date(Date.now());
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
      var Hora_actual = hora + ':' + minut + ':' + segon;*/
      //desaData(Data_actual,Hora_actual);
    }
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
var ExifData;
var ExifHora;
var ExifLongitud;
var ExifLongitud;
var observacioActual = 0;
var observacioFitxa;
var fitxaMapa;
var marcadorFitxa;
var marcadorUbica;
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
var flagDataTriada;
var flagDataRegistre;
var timeOut;
var midaFoto = 800;
var origen;
var hasWebcam = false;
var isWebcamAlreadyCaptured = false;

var MediaDevices = [];
var canEnumerate = false;

if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
  navigator.enumerateDevices = function(callback) {
      navigator.mediaDevices.enumerateDevices().then(callback);
  };
}
if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
    canEnumerate = true;
} else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
    canEnumerate = true;
}
checkDeviceSupport();

function back() {
  switch(vistaActual) {
    case 'fitxa':
      activa('observacions');
      break;
    case 'observacions':
    case 'tria_lloc':
      activa('fenologia');
      break
    case 'fotografia':
      activa(vistaOrigen);
      break;
    case 'fenomens':
    case 'vents':
    case 'beaufort':
    case 'nuvols':
    case 'nuvolositat':
    case 'lluna':
      activa('registra');
      break;
    default:
      alert("Per sortir de l'App eduMET has de prémer el botó Tornar o Inici del teu mòbil.")
  }
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
  var x = document.getElementById("estacio-nom");
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").getAll().onsuccess = function(event) {
      for(i=0;i<event.target.result.length;i++){
        marcador[i] = L.marker(new L.LatLng(event.target.result[i]["Latitud"], event.target.result[i]["Longitud"])).addTo(map);   
        marcador[i].i = i
        marcador[i].Codi_estacio = event.target.result[i]["Codi_estacio"];
        marcador[i].on('click',function(e) {
          $("#estacio-nom").val(this.Codi_estacio);
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
        $("#estacio-nom").val(estacioPreferida);
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
  estacioActual = $("#estacio-nom").val();
  mostraEstacio();
}

function mostraEstacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioActual).onsuccess = function(e) {
      $("#est_poblacio").html(e.target.result["Poblacio"]);
      $("#est_altitud").html("Altitud: " + e.target.result["Altitud"] + " m");
      var URLlogo = "https://edumet.cat/edumet-data/" + e.target.result["Codi_estacio"] + "/estacio/profile1/imatges/fotocentre.jpg";
      $("#estacio-logo-div").attr("src", URLlogo);
      if(navigator.onLine){
        getMesures();
      } else {
        $("#data_mesura").html("Sense connexió a Internet");
        buidaMesures();
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
  estacioPreferida = $("#estacio-nom").val();
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
    $("#data_mesura").html("L'estació no proporciona les dades ...");
    buidaMesures() ;
    console.log("Error:" + reason);
  });
}
function buidaMesures() {
  $("#data_mesura").css("color","#FF0000");
  $("#temperatura").html("");
  $("#humitat").html("");
  $("#pressio").html("");
  $("#sunrise").html("");
  $("#sunset").html("");
  $("#pluja").html("");
  $("#vent").html("");  
}

// REGISTRA

function registra() {
  activa('registra');
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
  //$("#data_registre").prop("placeholder", Data_actual + " " + Hora_actual);
}
function registra_lluna() {
  activa('lluna');
}
function registra_beaufort() {
  activa('beaufort');
}
function registra_vents() {
  activa('vents');
}
function registra_fenomens() {
  activa('fenomens');
}
function registra_nuvols() {
  activa('nuvols');
  if(hasWebcam) {
    mira();
  } else {
    alert("El teu dispositiu no té càmera frontal. Observa directament el núvol i toca la foto que més s'assembli a la forma observada.")
  }
}
function mira() {
  var video = document.getElementById('video');
  const videoConstraints = {
    facingMode: 'environment'
  };
  const constraints = {
    video: videoConstraints,
    audio: false
  };
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        video.srcObject = stream;
        video.play();
    })
    .catch(error => {
      console.log("No hi ha càmera frontal de video");
    });
  }
}
function registra_nuvolositat() {
  activa('nuvolositat');
}
function canvi_cobertura() {
  var cob = $("#cobertura").val();
  $("#img_cobertura").attr("src","img/" + cob + ".png");
}

function triaVent(vent){
  $("#dir_vent").text(vent);
  back();
}
function triaLluna(lluna){
  $("#fase_lunar").text(lluna);
  back();
}
function triaBeaufort(beaufort){
  $("#intensitat_vent").text(beaufort);
  back();
}
function triaNuvols(nuvols){
  $("#tipus_nuvols").text(nuvols);
  back();
}
function triaNuvolositat(){
  $("#cob_nuvols").text($("#cobertura").val() + " %");
  back();
}
function clicaFenomen(nom){
  var valor = $("#" + nom);
  if (valor.css("display") == "none") {
    valor.css("display","flex");
  } else {
    valor.css("display","none");
  }
}
function triaFenomens(){
  var numFenomens = 0;
  var llista = "";
  console.log($("#Pluja").css("display"));
  if($("#Pluja").css("display") == "flex") {
    numFenomens++;
    llista+= "Pluja, ";
  };
  if($("#Calamarsa").css("display") == "flex") {
    numFenomens++;
    llista+= "Calamarsa, "
  };
  if($("#Neu").css("display") == "flex") {
    numFenomens++;
    llista+= "Neu, "
  };
  if($("#Rosada").css("display") == "flex") {
    numFenomens++;
    llista+= "Rosada, "
  };
  if($("#Gebre").css("display") == "flex") {
    numFenomens++;
    llista+= "Gebre, "
  };
  if($("#Boira").css("display") == "flex") {
    numFenomens++;
    llista+= "Boira, "
  };
  if($("#Arc").css("display") == "flex") {
    numFenomens++;
    llista+= "Arc de Sant Martí, "
  };
  if($("#Llamp").css("display") == "flex") {
    numFenomens++;
    llista+= "Llamp, "
  };
  if (numFenomens>0) {
    llista = llista.slice(0, -2);
    llista+= ".";
    $("#llista_fenomens").text(llista);
  } else {
    $("#llista_fenomens").text("-");
  }
  back();
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
  resetObservacio();
  observacioActual = 0;
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
function triaFoto() {
  origen = "galeria";
  $("#fitxer_galeria").click();
}

function readURL(input) { 
  if(input.files[0] != undefined) {
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
  } else {
    console.log("Error: no s'ha obtingut cap fitxer.");
  }
}

function triaLloc() {
  if(observacioActual == 0){
    alert("Si us plau, primer fes o tria la foto corresponent a l'observació.");
  } else {
    indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
        activa("tria_lloc");
        var laLatitud;
        var laLongitud;
        if(e.target.result["Latitud"] != "") {
          $("#desc_mapa").text("Aquest és el lloc des d'on es va fer l'observació.");
          $("#boto_desa_mapa").text("D'acord").attr("onClick","activa('fenologia')");
          laLatitud = e.target.result["Latitud"];
          laLongitud = e.target.result["Longitud"];
        } else {
          $("#desc_mapa").text("Arrossega el marcador fins al lloc on vas fer la foto de l'observació i desa la ubicació.");
          $("#boto_desa_mapa").text("Desa la ubicació").attr("onClick","desaUbicacio()");
          if(mobilLocalitzat) {
            laLatitud = latitudActual;
            laLongitud = longitudActual;
          } else {
            laLatitud = 41.7292826;
            laLongitud = 1.8225154;      
          }
        }
        try {
          mapaUbica = L.map('mapaUbica');
          if(navigator.onLine){
            mapaUbica.setView(new L.LatLng(laLatitud, laLongitud), 15);
            L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
              minZoom: 1,
              maxZoom: 19,
              attribution: 'Wikimedia'
            }).addTo(mapaUbica);
          } else{
            mapaUbica.setView(new L.LatLng(laLatitud, laLongitud), 10);
            fetch("https://edumet.cat/edumet/app/json/municipis.geojson")
            .then(response => response.json())
            .then(response => {
              L.geoJSON(response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(mapaUbica);
            });
          }
        } catch (error) {
          if(navigator.onLine){
            var zoom = 15;
          } else {
            var zoom = 10;
          }
          mapaUbica.invalidateSize();
          mapaUbica.setView(new L.LatLng(laLatitud,laLongitud), zoom);
          mapaUbica.removeLayer(marcadorUbica);
        }  
        marcadorUbica = L.marker(new L.LatLng(laLatitud,laLongitud));
        marcadorUbica.addTo(mapaUbica);  
        if(e.target.result["Latitud"] != "") {
          marcadorUbica.dragging.disable();
        } else {
          marcadorUbica.dragging.enable();
        }
      }
    }
  }
}

function triaData(){
  if(observacioActual == 0){
    alert("Si us plau, primer fes o tria la foto corresponent a l'observació.");
  } else {
    indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
        if(e.target.result["Data_observacio"] != "") {
          alert("Aquesta observació es va realitzar el dia " + formatDate(e.target.result["Data_observacio"])+ " a les " + e.target.result["Hora_observacio"] +".");
        } else {
          $("#calendari").click();
        }
      }
    }
  }
}

function desaData(dia, hora) {
  indexedDB.open("eduMET").onsuccess = function(event) {
    var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    var request = objStore.get(observacioActual);
    request.onsuccess = function() {
      var data = request.result;
      data.Data_observacio =  dia;
      data.Hora_observacio =  hora;
      objStore.put(data);
      console.log("S'ha desat la data i l'hora de l'observació.");
    }
  }
}

function desaUbicacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    var request = objStore.get(observacioActual);
    request.onsuccess = function() {
      var data = request.result;
      data.Latitud =  marcadorUbica.getLatLng().lat;
      data.Longitud =  marcadorUbica.getLatLng().lng;
      objStore.put(data);
      activa('fenologia');
      console.log("S'ha desat la ubicació de l'observació.");
    }
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
        response[i]["En_cua"] = "";
        response[i]["Penjada"] = 1;
        obsObjStore.add(response[i]);
        console.log("Observació inicial ID " + response[i]["ID"]);
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
              response[i]["En_cua"] = "";
              response[i]["Penjada"] = 1;
              fetch(url_imatges + response[i]["Fotografia_observacio"]);
              obsObjStore.add(response[i]);              
            }
          }     
        }
      }
    }
  });
}

function enviaObservacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
      if(navigator.onLine) {
        if(e.target.result["Penjada"] == "0") {  
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
              var request = objStore.get(observacioActual);
              request.onsuccess = function() {
                var data = request.result;
                data.ID =  response.trim();
                data.En_cua = "";
                data.Penjada = 1;
                objStore.put(data);
                alert("S'ha penjat l'observació al servidor eduMET.");
              }
            }                       
          })
          .catch(error => {
            posaEnCua("penjar");
          });
        } else {
          var envio = { 
            tab: "modificarFenoApp",
            id: e.target.result["ID"],
            id_feno: e.target.result["Id_feno"],
            descripcio: e.target.result["Descripcio_observacio"]
          }
          var JSONenvio = JSON.stringify(envio);
          var url = url_servidor + '?observacio=' + e.target.result["GUID"];
          fetch(url,{
            method:'POST',
            headers:{
              'Content-Type': 'application/json; charset=UTF-8'
              },
            body: JSONenvio
          })
          .then(response => {
            alert("S'han actualitzat les dades de l'observació.");
          })      
          .catch(error => {
            posaEnCua("penjar");
          });
        }
      } else {
        posaEnCua("penjar");
      }
    } 
  }
}

function posaEnCua(motiu) {
  console.log("Offline: Posant l'observació en cua");
  indexedDB.open("eduMET").onsuccess = function(event) {
    var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    if(motiu == "penjar") {
      var request = objStore.get(observacioActual);
      alert("Sense connexió. L'observació es penjarà quan et connectis a Internet.");
    }
    if(motiu == "eliminar") {
      var request = objStore.get(observacioFitxa);
      alert("Sense connexió. L'observació s'eliminarà quan et connectis a Internet.");
      resetObservacio();
    }
    request.onsuccess = function() {
      var data = request.result;
      data.En_cua = motiu;
      objStore.put(data);
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
      if(e.target.result["Penjada"] == "1") {
        if (!(navigator.onLine)) {
          posaEnCua("eliminar");
        } else {           
          var url = url_servidor + "?usuari=" + usuari + "&id=" + e.target.result["ID"] + "&tab=eliminarFenUsu&observacio=" + e.target.result["GUID"];
          fetch(url)
          .then(response => {
            var url = new URL(response.url);
            observacio = parseInt(url.searchParams.get("observacio"));
            indexedDB.open("eduMET").onsuccess = function(event) {
              event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions").delete(observacio);
              alert("S'ha eliminat l'observació.");  
              resetObservacio(); 
            }
          })
          .catch(error => {
            console.log(error);
            posaEnCua("eliminar");
          });
        }
      } 
      else {
        obsObjStore.delete(observacioFitxa);
        alert("S'ha eliminat l'observació.");  
        resetObservacio();       
      }        
    }
  }
}

function resetObservacio() {
  activa('observacions');
  llistaObservacions();  
  if(observacioActual == observacioFitxa) {
    $("#foto").attr("src","img/launcher-icon-4x.png");
    $("#descripcio").val("");
    $("#fenomen").val("0");
    observacioActual = "";
  }
}

function actualitzaObservacio() {
  if(observacioActual == 0){
    alert("Si us plau, primer fes o tria la foto corresponent a l'observació.");
  } else {
    indexedDB.open("eduMET").onsuccess = function(event) {
      var objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
      var request = objStore.get(observacioActual);
      request.onsuccess = function() {
        var data = request.result;
        if($("#fenomen").val()!=0){
          data.Id_feno =  $("#fenomen").val();
        }
        if($("#descripcio").val()!=""){
          data.Descripcio_observacio = $("#descripcio").val();
        }
        objStore.put(data);
        indexedDB.open("eduMET").onsuccess = function(event) {
          event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
            var llistaMissing = "";
            if(e.target.result["Data_observacio"] == ""){
              llistaMissing+="• La data i l'hora de l'observació\n";
            }
            if(e.target.result["Latitud"] == ""){
              llistaMissing+="• El lloc des d'on es va fer l'observació\n";
            }
            if(e.target.result["Id_feno"] == 0){
              llistaMissing+="• El tipus de fenomen observat\n";
            }
            if(e.target.result["Descripcio_observacio"] == ""){
              llistaMissing+="• Una breu descripció del fenomen observat\n";
            }
            if(llistaMissing == ""){
              enviaObservacio();
            } else{
              llistaMissing = "Abans de penjar l'observació al servidor eduMET has d'indicar:\n\n" + llistaMissing;
              alert(llistaMissing);
            }
          }
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
        if (a["Data_observacio"] == "") {
          return -1;
        } else {
          return new Date(b["Data_observacio"] + " " + b["Hora_observacio"]) - new Date(a["Data_observacio"] + " " + b["Hora_observacio"]);
        }
      });
      for(i=0;i<obs.length;i++){
        llista+= '<div style="display:flex; align-items:center;" onClick="fitxa(' + obs[i]["GUID"] +')"><div style="width:25%"><img src="';
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
        llista+= '</label><div style="width:25%"><i id="' + obs[i]["GUID"] + '" class="material-icons font-36" style="color:';     
        if(obs[i]["Penjada"] == "1") {
          llista+= 'limegreen';
        } else {
          if(obs[i]["En_cua"] != "") {
            llista+= 'orange';
          } else {
            llista+= 'lightgray';
          }
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

  var nou_registre = [{
    En_cua:"",
    Penjada:0,
    Data_observacio:fotoData,
    Hora_observacio:fotoHora,
    Latitud:fotoLatitud,
    Longitud:fotoLongitud,
    Imatge:string64,
    ID:"0",
    Id_feno:"0",
    Descripcio_observacio:"",
    Fotografia_observacio:"0",
    Observador:usuari
  }];

  indexedDB.open("eduMET").onsuccess = function(event) { 
    var db = event.target.result;    
    var obsObjStore = db.transaction("Observacions", "readwrite").objectStore("Observacions");
    var request = obsObjStore.add(nou_registre[0]);
    request.onsuccess = function (e) {
        observacioActual = e.target.result;
    };
  };
}

function activa(fragment) {
  flagRadar = false;
  /*if (vistaActual == 'radar'){
    flagRadar= false;
    clearTimeout(timeOut);
    radar();
  }*/
  $("#fenologia").css("display","none");
  $("#estacions").css("display","none");
  $("#radar").css("display","none");
  $("#prediccio").css("display","none");
  $("#observacions").css("display","none");
  $("#fitxa").css("display","none");
  $("#login").css("display","none");
  $("#fotografia").css("display","none");
  $("#registra").css("display","none");
  $("#tria_lloc").css("display","none");
  $("#nuvols").css("display","none");
  $("#nuvolositat").css("display","none");
  $("#vents").css("display","none");
  $("#beaufort").css("display","none");
  $("#lluna").css("display","none");
  $("#fenomens").css("display","none");
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
    case "tria_lloc":
      boto = $("#boto_observacions");
      break;
    case "registra":
    case "nuvols":
    case "nuvolositat":
    case "vents":
    case "fenomens":
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
    var url = url_servidor + "?tab=radar";
    fetch(url)
    .then(response => response.text())
    .then(response =>  JSON.parse(response))
    .then(response => {
      var stringDiv ='';
      for(i=0;i<response.length;i++) {
        stringDiv+='<div class="mySlides"><img class="imgSlides" src="https://edumet.cat/edumet-data/meteocat/radar/';
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
  var slides = document.getElementsByClassName("mySlides");
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
      $("#fotoGran").attr("src", $("#fitxa-foto").attr("src"));
    }
  }
}

function fitxa(observacio) {
  observacioFitxa = observacio;
  activa('fitxa');
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioFitxa).onsuccess = function(e) {
      if(e.target.result["Id_feno"] != "0") {
        $("#fenomen-nom").html(fenomens[e.target.result["Id_feno"]]["Bloc_feno"] + ': ' + fenomens[e.target.result["Id_feno"]]["Titol_feno"]);
      } else {
        $("#fenomen-nom").html("Sense identificar");
      }
      if(e.target.result["Data_observacio"] != "") {
        $("#dataHora").text(formatDate(e.target.result["Data_observacio"]) + '  -  ' + e.target.result["Hora_observacio"]);
      }
      var foto = e.target.result["Fotografia_observacio"];
        if(foto == 0) {
          $("#fitxa-foto").attr("src", e.target.result["Imatge"]);
        } else {
          $("#fitxa-foto").attr("src", url_imatges + foto);
        }
      $("#fitxa-text").text(e.target.result["Descripcio_observacio"]);
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
        fitxaMapa = L.map('fitxaMapa');
        if(online){
          fitxaMapa.setView(new L.LatLng(laLatitud, laLongitud), 15);
          L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            minZoom: 1,
            maxZoom: 19,
            attribution: 'Wikimedia'
          }).addTo(fitxaMapa);
        } else{
          fitxaMapa.setView(new L.LatLng(laLatitud, laLongitud), 10);
          fetch("https://edumet.cat/edumet/app/json/municipis.geojson")
          .then(response => response.json())
          .then(response => {
            L.geoJSON(response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(fitxaMapa);
          });
        }
      } catch (error) {
        if(online){
          var zoom = 15;
        } else {
          var zoom = 10;
        }
        fitxaMapa.invalidateSize();
        fitxaMapa.setView(new L.LatLng(laLatitud,laLongitud), zoom);
        fitxaMapa.removeLayer(marcadorFitxa);
      }      
      if(e.target.result["Latitud"] != "") {
        marcadorFitxa = L.marker(new L.LatLng(laLatitud,laLongitud));
        marcadorFitxa.addTo(fitxaMapa);  
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
          $("#estacio-nom").val(estacioPreferida);
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
      } else {
        if (device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
          isWebcamAlreadyCaptured = true;
        }
      }
      if (device.kind === 'videoinput') {
        hasWebcam = true;
      }
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
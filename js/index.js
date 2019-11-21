window.onload = function() {
  usuari = storage.getItem("usuari");
  estacioAssignada = storage.getItem("usuari");
  let stringDatabase = storage.getItem("database");
  let online;
  map = L.map('map');
  if (!(navigator.onLine)) {
    online = false;
    if(stringDatabase == null) {
      alert("La configuració inicial de l'App precisa una connexió a Internet. Si us plau, reinicia l'App quan en tinguis.");        
    } else {
      alert("No es pot connectar a Internet. Algunes característiques de l'App no estaran disponibles.");
      map.setView([41.7292826, 1.8225154], 10);
      fetch("json/municipis.geojson", {credentials: 'same-origin'})
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
  //let ara = new Date();
  //let dies = (ara - new Date(stringDatabase)) / 36000000;
  if(stringDatabase == null && online) {
    indexedDB.open("eduMET").onupgradeneeded = function(event) { 
      let db = event.target.result;    
      db.createObjectStore("Fenomens", {keyPath: "Id_feno"});
      db.createObjectStore("Estacions", {keyPath: "Codi_estacio"});
      db.createObjectStore("Observacions", {keyPath: "GUID", autoIncrement:true});
      db.createObjectStore("Registres", {keyPath: "GUID", autoIncrement:true});
      baixaFenomens();
      baixaEstacions();
    }
  } else {
    mostraEstacions();
    getFenomens();
  }
  activa("estacions");
  if(usuari != "" && online) {
    baixaObsAfegides();
  }
 
  document.getElementById('fitxer_galeria').addEventListener("change", function(event) {
    readURL(this);
  });
  document.getElementById('fitxer').addEventListener("change", function(event) {
    readURL(this);
  });
  calendar = flatpickr("#calendari", {
    enableTime: true,
    time_24hr: true,
    defaultDate: Date.now(),
    onClose: function(dateObj, dateStr, instance){
      if(dateStr != "") {
        getTime(new Date(dateObj));
        desaData(Data_UTC,Hora_UTC);
      }
      document.querySelector("#calendari-div").style.display = "none";
    }
  });
  document.querySelector("#data_registre").flatpickr({
    enableTime: true,
    time_24hr: true,
    defaultDate: Date.now(),
  });
};

const url_servidor = 'https://edumet.cat/meteo/dades_recarregar.php';
const url_imatges = 'https://edumet.cat/meteo/imatges/fenologia/';
const codiInicial = "08903085";
const colorEdumet = "#418ac8";
const midaFoto = 800;
const fen_atm = ["Pluja","Calamarsa","Neu","Rosada","Gebre","Boira","Arc de Sant Martí","Llamp"];
let storage = window.localStorage;
let usuari = "";
let contrasenya;
let estacioActual;
let estacioPreferida;
let estacioAssignada = "";
let fenomens = [];
let latitudActual;
let longitudActual;
let INEinicial = "081234";
let mobilLocalitzat = false;
let ExifData;
let ExifHora;
let ExifLatitud;
let ExifLongitud;
let observacioActual = 0;
let observacioFitxa;
let fitxaMapa;
let marcadorFitxa;
let marcadorUbica;
let vistaActual;
let vistaOrigen;
let obsActualitzades = false;
let marcador = [];
let watchID;
let estacioDesada = false;
let map;
let slideIndex;
let flagRadar = false;
let flagDataTriada;
let flagDataRegistre;
let timeOut;
let origen;
let hasWebcam = false;
let isWebcamAlreadyCaptured = false;
let Vent_Beaufort = "";
let Vent_Dir_actual = "";
let Nuvulositat = "";
let Pres_tend_barometre = "";
let calendar;
let MediaDevices = [];
let canEnumerate = false;

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
    case 'lloc':
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
  let url = url_servidor + "?tab=llistaFenoFenologics";
  fetch(url)
  .then(response => response.text())
  .then(response =>  JSON.parse(response))
  .then(response => {
    console.log("Fenomens: Baixats");
    let x = document.getElementById("fenomen");
    for(i=0;i<response.length;i++){
      fenomens[response[i]["Id_feno"]] = response[i];
      option = document.createElement("option");
      option.text = `${response[i]["Bloc_feno"]}: ${response[i]["Titol_feno"]}`;
      option.value = response[i]["Id_feno"];
      x.add(option);
    }
    indexedDB.open("eduMET").onsuccess = function(event) { 
      let db = event.target.result;    
      let fenObjStore = db.transaction("Fenomens", "readwrite").objectStore("Fenomens");
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
  let x = document.getElementById("fenomen");

  for(i=0;i<response.length;i++){
    fenomens[response[i]["Id_feno"]] = response[i];
    option = document.createElement("option");
    option.text = `${response[i]["Bloc_feno"]}: ${response[i]["Titol_feno"]}`;
    option.value = response[i]["Id_feno"];
    x.add(option);
  }
}

// ESTACIONS METEOROLÒGIQUES

function baixaEstacions() {
  let url = url_servidor + "?tab=cnjEstApp&xarxaEst=auto&cnjEst=cat";
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {
    console.log("Estacions: Baixades");  
    indexedDB.open("eduMET").onsuccess = function(event) { 
      let db = event.target.result;    
      let estObjStore = db.transaction("Estacions", "readwrite").objectStore("Estacions");
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
  let x = document.getElementById("estacio-nom");
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").getAll().onsuccess = function(event) {
      for(i=0;i<event.target.result.length;i++){
        marcador[i] = L.marker(new L.LatLng(event.target.result[i]["Latitud"], event.target.result[i]["Longitud"])).addTo(map);   
        marcador[i].i = i
        marcador[i].Codi_estacio = event.target.result[i]["Codi_estacio"];
        marcador[i].on('click',function(e) {
          document.querySelector("#estacio-nom").value = this.Codi_estacio;
          mostra(this.Codi_estacio);
        });   
        let option = document.createElement("option");
        option.text = event.target.result[i]["Nom_centre"];
        option.value = event.target.result[i]["Codi_estacio"];
        x.add(option);
      }
      preferida = storage.getItem("preferida");
      if (preferida == null) {
        estacioActual = codiInicial;
        estacioPreferida = codiInicial;
        console.log(`Preferida (Per defecte): ${estacioPreferida}`);
      } else {
        estacioActual = preferida;
        estacioPreferida = preferida;
        console.log(`Preferida (Desada): ${estacioPreferida}`);
        document.querySelector("#estacio-nom").value = estacioPreferida;
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
  estacioActual = document.querySelector("#estacio-nom").value;
  mostraEstacio();
}

function mostraEstacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioActual).onsuccess = function(e) {
      document.querySelector("#est_poblacio").innerHTML = e.target.result["Poblacio"];
      document.querySelector("#est_altitud").innerHTML = "Altitud: " + e.target.result["Altitud"] + " m";
      let URLlogo = `https://edumet.cat/edumet-data/${e.target.result["Codi_estacio"]}/estacio/profile1/imatges/fotocentre.jpg`;
      document.querySelector("#estacio-logo-div").src = URLlogo;
      if(navigator.onLine){
        getMesures();
      } else {
        document.querySelector("#data_mesura").innerHTML = "Sense connexió a Internet";
        buidaMesures();
      }
      map.setView(new L.LatLng(e.target.result["Latitud"], e.target.result["Longitud"]));
    }
  }
  if(estacioActual == estacioPreferida) {
    document.querySelector("#star").innerHTML = "star";
    document.querySelector("#star").style.color = "firebrick";
  } else {
    document.querySelector("#star").innerHTML = "star_border";
    document.querySelector("#star").style.color = "lightgray";
  }
}

function desaPreferida() {
  estacioPreferida = document.querySelector("#estacio-nom").value;
  console.log(`Preferida (Triada): ${estacioPreferida}`);
  storage.setItem("preferida", estacioPreferida);  
  document.querySelector("#star").innerHTML = "star";
  document.querySelector("#star").style.color = "firebrick";
}

function getMesures() {
  let url = url_servidor + "?tab=mobilApp&codEst=" + estacioActual;
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {     
    document.querySelector("#temperatura").innerHTML = `<label>${response[0]["Temp_ext_actual"]} ºC</label><label style='color:firebrick;margin-left:10px'>${response[0]["Temp_ext_max_avui"]} ºC</label><label style='color:blue;margin-left:10px'>${response[0]["Temp_ext_min_avui"]} ºC</label>`;
    document.querySelector("#lHumitat").innerHTML = `${response[0]["Hum_ext_actual"]} %`;
    document.querySelector("#lPressio").innerHTML = `${response[0]["Pres_actual"]} HPa`;
    document.querySelector("#sunrise").innerHTML = response[0]["Sortida_sol"].slice(0,5);
    document.querySelector("#sunset").innerHTML = response[0]["Posta_sol"].slice(0,5);
    document.querySelector("#lPluja").innerHTML = `${response[0]["Precip_acum_avui"]} mm`;
    document.querySelector("#lVent").innerHTML = `${response[0]["Vent_vel_actual"]} Km/h`;    
    INEinicial = response[0]["codi_INE"];
    let stringDataFoto = `${response[0]["Data_UTC"]}T${response[0]["Hora_UTC"]}`;
    let interval = (new Date() - new Date(stringDataFoto)) / 3600000;
    document.querySelector("#data_mesura").innerHTML = `Actualitzat a les ${response[0]["Hora_UTC"]} del ${formatDate(response[0]["Data_UTC"])}`;
    if(interval < 2) {
      document.querySelector("#data_mesura").style.color = "#006633";
      document.querySelector("#data_mesura").style.background = "transparent";
      document.querySelector("#data_mesura").classList.remove('blink');
    } else {
      document.querySelector("#data_mesura").style.color = "white";
      document.querySelector("#data_mesura").style.background = "red";
      document.querySelector("#data_mesura").classList.add('blink');
    }
  })
  .catch(reason => {
    document.querySelector("#data_mesura").innerHTML = "L'estació no proporciona les dades ...";
    buidaMesures() ;
    //console.log(`Error: ${reason}`);
  });
}
function buidaMesures() {
  document.querySelector("#data_mesura").style.color = "red";
  document.querySelector("#data_mesura").style.background = "transparent";
  document.querySelector("#data_mesura").classList.remove('blink');
  document.querySelector("#temperatura").innerHTML = "";
  document.querySelector("#lHumitat").innerHTML = "";
  document.querySelector("#lPressio").innerHTML = "";
  document.querySelector("#sunrise").innerHTML = "";
  document.querySelector("#sunset").innerHTML = "";
  document.querySelector("#lPluja").innerHTML = "";
  document.querySelector("#lVent").innerHTML = "";  
}

// REGISTRA

function registra() {
  activa('registra');
  getTime(new Date(Date.now()));
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioAssignada).onsuccess = function(e) {
      document.querySelector("#nom_estacio").value = e.target.result["Nom_centre"];
      let url = url_servidor + "?tab=mobilApp&codEst=" + estacioAssignada;
      fetch(url)
      .then(response => response.text())
      .then(response => JSON.parse(response))
      .then(response => {     
        document.querySelector("#sun_rise").innerHTML = response[0]["Sortida_sol"].slice(0,5);
        document.querySelector("#sun_set").innerHTML = response[0]["Posta_sol"].slice(0,5);
      })
      .catch(reason => {
        console.log(`Error: ${reason}`);
      });
    }
  }
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
  let video = document.getElementById('video');
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
  cob = document.querySelector("#cobertura").value;
  document.querySelector("#img_cobertura").src = "img/" + cob + ".png";
}
function triaVent(vent, desc){
  Vent_Dir_actual = vent
  document.querySelector("#dir_vent").textContent = desc;
  back();
}
function triaLluna(lluna){
  document.querySelector("#fase_lunar").textContent = lluna;
  back();
}
function triaBeaufort(beaufort, desc){
  Vent_Beaufort =  beaufort;
  document.querySelector("#intensitat_vent").textContent = desc;
  back();
}
function triaNuvols(nuvols){
  document.querySelector("#tipus_nuvols").textContent = nuvols;
  back();
}
function triaNuvolositat(){
  Nuvulositat = document.querySelector("#cobertura").value;
  document.querySelector("#cob_nuvols").textContent = Nuvulositat + " %";
  back();
}
function clicaFenomen(num){
  let valor = document.querySelector("#f" + num);
  if (valor.style.display == "none") {
    valor.style.display = "flex";
  } else {
    valor.style.display = "none";
  }
}
function triaFenomens(){
  let numFenomens = 0;
  let llista = "";
  for(i=0;i<fen_atm.length;i++){
    if(document.querySelector("#f" + i).style.display == "flex") {
      numFenomens++;
      llista+= fen_atm[i] + ", ";
    };
  }
  if (numFenomens>0) {
    llista = llista.slice(0, -2);
    llista+= ".";
    document.querySelector("#llista_fenomens").textContent = llista;
  } else {
    document.querySelector("#llista_fenomens").textContent = "";
  }
  back();
}

function penja_registre() {
  let lluny = true;
  if(mobilLocalitzat) {
    indexedDB.open("eduMET").onsuccess = function(event) {
      event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioAssignada).onsuccess = function(e) {
        let distanciaActual = getDistanceFromLatLonInKm(latitudActual, longitudActual, e.target.result["Latitud"], e.target.result["Longitud"]);
        distanciaActual =  Math.floor(distanciaActual*10) / 10;
        if (distanciaActual < 1000) {
          lluny = false
        }
        let distanciaInformada = distanciaActual.toString();
        console.log(`Distància (Km): ${distanciaInformada}`);

        if(lluny) {
          alert(`Estàs a ${distanciaInformada} Km de l'estació meteorològica que tens assignada. Si us plau, registra les dades des de l'estació.`)
        } else {
          let tempCheck = true;
          if((document.querySelector("#temp_max").value != "") && (document.querySelector("#temp_actual").value != "") && (parseFloat(document.querySelector("#temp_max").value) < parseFloat(document.querySelector("#temp_actual").value))) {
            tempCheck = false;
            alert("La temperatura màxima no pot ser inferior a la temperatura actual.")
          }
          if((document.querySelector("#temp_min").value!= "") && (document.querySelector("#temp_actual").value != "") && (parseFloat(document.querySelector("#temp_min").value) > parseFloat(document.querySelector("#temp_actual").value))) {
            tempCheck = false;
            alert("La temperatura mínima no pot ser superior a la temperatura actual.")
          }
          if((document.querySelector("#temp_max").value != "") && (document.querySelector("#temp_min").value != "") && (parseFloat(document.querySelector("#temp_max").value) < parseFloat(document.querySelector("#temp_min").value))) {
            tempCheck = false;
            alert("La temperatura màxima no pot ser inferior a la temperatura mínima.")
          }
          if(tempCheck) {
            if(document.querySelector("#tend_bar").value == null) {
              Pres_tend_barometre = "";
            } else {
              Pres_tend_barometre = document.querySelector("#tend_bar").value;
            }
            let envio = { 
              tab: "salvarObservacio",
              Codi_estacio: estacioAssignada,
              Codi_grup: usuari,
              Observadors: document.querySelector("#autor").value,
              Data_UTC: Data_UTC,
              Hora_UTC: Hora_UTC,
              Sortida_sol: document.querySelector("#sun_rise").innerHTML,
              Posta_sol: document.querySelector("#sun_set").innerHTML,
              Fase_lluna: document.querySelector("#fase_lunar").innerHTML,
              Temp_Ext: document.querySelector("#temp_actual").value,
              Temp_Ext_Max: document.querySelector("#temp_max").value,
              Temp_Ext_Min: document.querySelector("#temp_min").value,
              Hum_Ext: document.querySelector("#humitat").value,
              Pressio: document.querySelector("#pressio").value,
              Pres_tend_barometre: Pres_tend_barometre,
              Vent_Vel: document.querySelector("#vent").value,
              Vent_Beaufort: Vent_Beaufort,
              Vent_Dir_actual: Vent_Dir_actual,
              Precip_acum_avui: document.querySelector("#precipitacio").value,
              Nuvulositat: Nuvulositat,
              Tipus_nuvols: document.querySelector("#tipus_nuvols").innerHTML,
              Fenomens_observats: document.querySelector("#llista_fenomens").innerHTML
            }
            let JSONenvio = JSON.stringify(envio);
            console.log(JSONenvio);
            alert("El registre de dades s'ha penjat al servidor eduMET.");     
            fetch(url_servidor,{
              method:'POST',
              headers:{
                'Content-Type': 'application/json; charset=UTF-8'
                },
              body: JSONenvio
            })
            .then()
            .catch(error => {
              console.log(`Error: ${error}`);
              indexedDB.open("eduMET").onsuccess = function(event) { 
                let db = event.target.result;    
                let regObjStore = db.transaction("Registres", "readwrite").objectStore("Registres");
                  regObjStore.add(envio);
              };
            });
          }
        }
      }
    }
  } else {
    alert("No tenim dades de la teva ubicació actual. Si us plau, activa GPS.");
  }
}

// OBSERVACIONS

function usuaris() {
  if (usuari == "" || usuari == null) {
    login('fenologia');
  } else {
    if (confirm(storage.getItem("nom") + ", vols tancar la sessió ?")) {
      tancar_sessio();
    }
  }
}
function tancar_sessio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    let db = event.target.result;
    let obsObjStore = db.transaction("Observacions", "readwrite").objectStore("Observacions");
    obsObjStore.clear();    
  } 
  storage.removeItem("usuari");
  usuari = "";
  storage.removeItem("assignada");
  estacioAssignada= "";
  storage.removeItem("nom");
  resetObservacio();
  observacioActual = 0;
  estacio();
}

function fesFoto() {
  console.log(`webcam: ${hasWebcam}`);
  if(hasWebcam) {
    origen = "camera";
    document.querySelector("#fitxer").click();
  } else {
    origen = "galeria";
    document.querySelector("#fitxer_galeria").click();
  }
}
function triaFoto() {
  origen = "galeria";
  document.querySelector("#fitxer_galeria").click();
}

function readURL(input) { 
  if(input.files[0] != undefined) {
    fitxerImg = input.files[0].name;
    let extn = fitxerImg.substring(fitxerImg.lastIndexOf('.') + 1).toLowerCase();
    if (extn == "jpg" || extn == "jpeg") { 
      ExifData = ""; 
      ExifHora = ""
      ExifLatitud = "";
      ExifLongitud = "";
      EXIF.getData(input.files[0], function() {
        if(this.exifdata.DateTimeOriginal != undefined) {
          let splitData = this.exifdata.DateTimeOriginal.split(" ");
          ExifData = formatDateGPS(splitData[0]);
          ExifHora = splitData[1];
          console.log(`EXIF Data: ${ExifData}, ${ExifHora}`);
        }
        if(this.exifdata.GPSLatitude != undefined) {     
          let latDegree = this.exifdata.GPSLatitude[0].numerator/this.exifdata.GPSLatitude[0].denominator;
          let latMinute = this.exifdata.GPSLatitude[1].numerator/this.exifdata.GPSLatitude[1].denominator;
          let latSecond = this.exifdata.GPSLatitude[2].numerator/this.exifdata.GPSLatitude[2].denominator;
          let latDirection = this.exifdata.GPSLatitudeRef;
          ExifLatitud = ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection);        
          let lonDegree = this.exifdata.GPSLongitude[0].numerator/this.exifdata.GPSLongitude[0].denominator;
          let lonMinute = this.exifdata.GPSLongitude[1].numerator;this.exifdata.GPSLongitude[1].denominator;
          let lonSecond = this.exifdata.GPSLongitude[2].numerator/this.exifdata.GPSLongitude[2].denominator;
          let lonDirection = this.exifdata.GPSLongitudeRef;
          ExifLongitud = ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);
          console.log("EXIF GPS: "+ ExifLatitud + ", "+ ExifLongitud);        
        }    
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        let img = new Image;
        img.src = URL.createObjectURL(input.files[0]);
        img.onload = function() {
          let iw=img.width;
          let ih=img.height;
          let scale=Math.min((midaFoto/iw),(midaFoto/ih));
          let iwScaled=iw*scale;
          let ihScaled=ih*scale;
          canvas.width=iwScaled;
          canvas.height=ihScaled;
          ctx.drawImage(img,0,0,iwScaled,ihScaled);
          canvas.style.display = "none";
          document.querySelector("#foto").src = canvas.toDataURL("image/jpeg",0.5);
          document.querySelector("#descripcio").value = "";
          document.querySelector("#fenomen").value = "0";
          let string64 = canvas.toDataURL("image/jpeg",0.5);            
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
        activa("lloc");
        let laLatitud;
        let laLongitud;
        if(e.target.result["Latitud"] != "") {
          document.querySelector("#desc_mapa").textContent = "Aquest és el lloc des d'on es va fer l'observació.";
          document.querySelector("#boto_desa_mapa").textContent = "D'acord";
          document.querySelector("#boto_desa_mapa").addEventListener('click', () => {
            activa('fenologia');
          });
          laLatitud = e.target.result["Latitud"];
          laLongitud = e.target.result["Longitud"];
        } else {
          document.querySelector("#desc_mapa").textContent = "Arrossega el marcador fins al lloc on vas fer la foto de l'observació i desa la ubicació.";
          document.querySelector("#boto_desa_mapa").textContent = "Desa la ubicació";
          document.querySelector("#boto_desa_mapa").addEventListener('click', () => {
            desaUbicacio();
          });
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
            fetch("json/municipis.geojson", {credentials: 'same-origin'})
            .then(response => response.json())
            .then(response => {
              L.geoJSON(response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(mapaUbica);
            });
          }
        } catch (error) {
          if(navigator.onLine){
            let zoom = 15;
          } else {
            let zoom = 10;
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
          alert(`Aquesta observació es va realitzar el dia ${formatDate(e.target.result["Data_observacio"])} a les ${e.target.result["Hora_observacio"]}.`);
        } else {
          document.querySelector("#calendari-div").style.display = "flex";
          calendar.open();
        }
      }
    }
  }
}

function desaData(dia, hora) {
  indexedDB.open("eduMET").onsuccess = function(event) {
    let objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    let request = objStore.get(observacioActual);
    request.onsuccess = function() {
      let data = request.result;
      data.Data_observacio =  dia;
      data.Hora_observacio =  hora;
      objStore.put(data);
      console.log("S'ha desat la data i l'hora de l'observació.");
    }
  }
}

function desaUbicacio() {
  indexedDB.open("eduMET").onsuccess = function(event) {
    let objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    let request = objStore.get(observacioActual);
    request.onsuccess = function() {
      let data = request.result;
      data.Latitud =  marcadorUbica.getLatLng().lat;
      data.Longitud =  marcadorUbica.getLatLng().lng;
      objStore.put(data);
      activa('fenologia');
      console.log("S'ha desat la ubicació de l'observació.");
    }
  }
}

function baixaObsInicial() {
  let url = url_servidor + "?usuari=" + usuari + "&tab=visuFenoApp";
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {
    indexedDB.open("eduMET").onsuccess = function(event) { 
      let obsObjStore = event.target.result.transaction("Observacions", "readwrite").objectStore("Observacions");
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
  let url = url_servidor + "?usuari=" + usuari + "&tab=visuFenoApp";
  fetch(url)
  .then(response => response.text())
  .then(response => JSON.parse(response))
  .then(response => {
    indexedDB.open("eduMET").onsuccess = function(event) {
      let obsObjStore = event.target.result.transaction("Observacions", "readwrite").objectStore("Observacions");
      obsObjStore.getAll().onsuccess = function(event) {        
        if(!(response === null)){
          let numNoves = 0;
          for(let i=0;i<response.length;i++){
            let nova = true;
            for(let j=0;j<event.target.result.length;j++){
              if(event.target.result[j]["ID"] == response[i]["ID"]){
                nova = false;
              }
            }
            if(nova){
              numNoves++;
              response[i]["En_cua"] = "";
              response[i]["Penjada"] = 1;
              obsObjStore.add(response[i]);
              console.log(`Observació nova ID ${response[i]["ID"]}`);
              fetch(url_imatges + response[i]["Fotografia_observacio"]);             
            }
          }
          console.log("Noves observacions: " + numNoves)     
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
          let imatge64 =  e.target.result["Imatge"].replace(/^data:image\/[a-z]+;base64,/, "");                    
          let envio = { 
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
          let JSONenvio = JSON.stringify(envio);
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
              let objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
              let request = objStore.get(observacioActual);
              request.onsuccess = function() {
                let data = request.result;
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
          let envio = { 
            tab: "modificarFenoApp",
            id: e.target.result["ID"],
            id_feno: e.target.result["Id_feno"],
            descripcio: e.target.result["Descripcio_observacio"]
          }
          let JSONenvio = JSON.stringify(envio);
          let url = url_servidor + '?observacio=' + e.target.result["GUID"];
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
    let objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
    if(motiu == "penjar") {
      let request = objStore.get(observacioActual);
      alert("Sense connexió. L'observació es penjarà quan et connectis a Internet.");
    }
    if(motiu == "eliminar") {
      let request = objStore.get(observacioFitxa);
      alert("Sense connexió. L'observació s'eliminarà quan et connectis a Internet.");
      resetObservacio();
    }
    request.onsuccess = function() {
      let data = request.result;
      data.En_cua = motiu;
      objStore.put(data);
    }
  }
}

function editaObservacio() {
  observacioActual = observacioFitxa;
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
      let foto = e.target.result["Fotografia_observacio"];
      if(foto == "0") {
        document.querySelector("#foto").src = e.target.result["Imatge"];
      } else {
        document.querySelector("#foto").src = url_imatges + foto;
      }
      document.querySelector("#fenomen").value = e.target.result["Id_feno"];
      if(e.target.result["Descripcio_observacio"] == "Sense descriure"){
        document.querySelector("#descripcio").value = "";
      } else {
        document.querySelector("#descripcio").value = e.target.result["Descripcio_observacio"];
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
    let db = event.target.result.transaction(["Observacions"], "readwrite");
    obsObjStore = db.objectStore("Observacions");
    obsObjStore.get(observacioFitxa).onsuccess = function(e) {
      if(e.target.result["Penjada"] == "1") {
        if (!(navigator.onLine)) {
          posaEnCua("eliminar");
        } else {           
          let url = url_servidor + "?usuari=" + usuari + "&id=" + e.target.result["ID"] + "&tab=eliminarFenUsu&observacio=" + e.target.result["GUID"];
          fetch(url)
          .then(response => {
            let url = new URL(response.url);
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
    document.querySelector("#foto").src = "img/launcher-icon-4x.png";
    document.querySelector("#descripcio").value = "";
    document.querySelector("#fenomen").value = "0";
    observacioActual = "";
  }
}

function actualitzaObservacio() {
  if(observacioActual == 0){
    alert("Si us plau, primer fes o tria la foto corresponent a l'observació.");
  } else {
    indexedDB.open("eduMET").onsuccess = function(event) {
      let objStore = event.target.result.transaction(["Observacions"], "readwrite").objectStore("Observacions");
      let request = objStore.get(observacioActual);
      request.onsuccess = function() {
        let data = request.result;
        if(document.querySelector("#fenomen").value != 0){
          data.Id_feno =  document.querySelector("#fenomen").value;
        }
        if(document.querySelector("#descripcio").value != ""){
          data.Descripcio_observacio = document.querySelector("#descripcio").value;
        }
        objStore.put(data);
        indexedDB.open("eduMET").onsuccess = function(event) {
          event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioActual).onsuccess = function(e) {
            let llistaMissing = "";
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
  let llista = '';
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").getAll().onsuccess = function(event) {
      let obs = event.target.result;
      obs.sort(function(a,b){
        if (a["Data_observacio"] == "") {
          return -1;
        } else {
          return new Date(b["Data_observacio"] + " " + b["Hora_observacio"]) - new Date(a["Data_observacio"] + " " + b["Hora_observacio"]);
        }
      });
      for(i=0;i<obs.length;i++){
        llista+= `<div style="display:flex; align-items:center;" onClick="fitxa(${obs[i]["GUID"]})"><div style="width:25%"><img src="`;
        let foto = obs[i]["Fotografia_observacio"];
        if(foto == 0) {
          llista+= obs[i]["Imatge"];
        } else {
          llista+= url_imatges + foto;
        }
        llista+= '" style="width:10vh; height:10vh" /></div><label style="width:25%">'; 
        if(obs[i]["Data_observacio"] != "") {
          llista+= `${formatDate(obs[i]["Data_observacio"])}<br>${obs[i]["Hora_observacio"]}`;
        }
        llista+= '</label><label style="width:25%">';        
        if(obs[i]["Id_feno"] != "0") {
          llista+= fenomens[obs[i]["Id_feno"]]["Titol_feno"];
        } else {
          llista+= 'Sense identificar';
        }
        llista+= `</label><div style="width:25%"><i id="${obs[i]["GUID"]}" class="material-icons font-4" style="color:`;     
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
      document.querySelector("#llistat").innerHTML = llista;
    };
  }
}

function desaObservacio(string64){  
  getTime(new Date(Date.now()));

  let fotoData = "";
  let fotoHora = "";
  let fotoLatitud = "";
  let fotoLongitud = "";

  if (origen == "camera") {
    fotoData = Data_UTC;
    fotoHora = Hora_UTC;
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

  let nou_registre = [{
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
    let db = event.target.result;    
    let obsObjStore = db.transaction("Observacions", "readwrite").objectStore("Observacions");
    let request = obsObjStore.add(nou_registre[0]);
    request.onsuccess = function (e) {
        observacioActual = e.target.result;
    };
  };
}

function activa(fragment) {
  flagRadar = false;
  document.querySelector("#fenologia").style.display = "none";
  document.querySelector("#estacions").style.display = "none";
  document.querySelector("#radar").style.display = "none";
  document.querySelector("#prediccio").style.display = "none";
  document.querySelector("#observacions").style.display = "none";
  document.querySelector("#fitxa").style.display = "none";
  document.querySelector("#login").style.display = "none";
  document.querySelector("#fotografia").style.display = "none";
  document.querySelector("#registra").style.display = "none";
  document.querySelector("#lloc").style.display = "none";
  document.querySelector("#nuvols").style.display = "none";
  document.querySelector("#nuvolositat").style.display = "none";
  document.querySelector("#vents").style.display = "none";
  document.querySelector("#beaufort").style.display = "none";
  document.querySelector("#lluna").style.display = "none";
  document.querySelector("#fenomens").style.display = "none";
  document.querySelector("#" + fragment).style.display = "flex";
  var elsBotons = document.querySelectorAll(".boto-inf");
  for(i=0;i<elsBotons.length;i++) {
    elsBotons[i].style.color = "graytext";
  }
  switch (fragment) {
    case "estacions":
      boto = document.querySelector("#boto_estacions");
      break;
    case "fenologia":
    case "observacions":
    case "fitxa":
    case "fotografia":
    case "lloc":
      boto = document.querySelector("#boto_observacions");
      break;
    case "registra":
    case "nuvols":
    case "nuvolositat":
    case "vents":
    case "fenomens":
      boto = document.querySelector("#boto_registra");
      break;
    case "prediccio":
      boto = document.querySelector("#boto_prediccio");
      break;
    case "radar":
      boto = document.querySelector("#boto_radar");
      break;
    default:
      break;
  }
  if (fragment != "login") {
    boto.style.color = colorEdumet; 
  }
  vistaActual = fragment;
}

function login(fragment) {
  if (usuari == "" || usuari == null) {
    document.querySelector("#password").addEventListener('keyup',(event) => {
      if (event.keyCode === 13) {
        valida(fragment);
      }
    });
    document.querySelector("#valida").addEventListener('click', () => {
        valida(fragment);
    });
    document.querySelector("#usuari").value = "";
    document.querySelector("#password").value = "";
    if (navigator.onLine) {
      activa('login');
    } else {
      alert("Per iniciar sessió al servidor eduMET, veure les teves observacions o penjar-ne de noves, has d'estar connectat a Internet.");          
    }
  }
  else {
    if(fragment == 'fenologia') {
      fenologia();
    }
    if(fragment == 'registra') {
      registra();
    }
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
    let url = url_servidor + "?tab=radar";
    fetch(url)
    .then(response => response.text())
    .then(response =>  JSON.parse(response))
    .then(response => {
      let stringDiv ='';
      for(i=0;i<response.length-2;i++) {
        stringDiv+='<div class="mySlides"><img class="imgSlides" src="https://edumet.cat/edumet-data/meteocat/radar/';
        stringDiv+= response[i];
        stringDiv+='"></div>';
      }
      document.querySelector("#slideshow-container").innerHTML = stringDiv;
      stringDiv ='';
      for(i=0;i<response.length-2;i++) {
        stringDiv+='<span class="dot"></span>';
      }
      document.querySelector("#puntets").innerHTML = stringDiv;
      slideIndex = 0;
      flagRadar = true;
      showSlides();    
    });
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function showSlides() {
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
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
    let frame = document.getElementById('frame');
    let loader = document.getElementById('loaderPrediccio');
    loader.style.animationPlayState = "running";
    frame.onload = function() {
      loader.style.animationPlayState = "paused";
      loader.style.display = "none";
      frame.style.display = "flex";      
    }
    frame.src = 'https://static-m.meteo.cat/ginys/municipal8d?language=ca&color=2c3e50&tempFormat=ºC&location=' + INEinicial;
    //frame.src = 'https://m.meteo.cat/?codi=' + INEinicial;
  } else {
    alert("Opció no disponible sense connexió a Internet.");
  }
}
function observa() {
  activa('observacions');
  llistaObservacions();
}
function fotografia() {
  let veureFoto = true;
  if((vistaActual == 'fenologia') && (observacioActual == "")) {
    veureFoto = false;
    fesFoto();
  } 
  if(veureFoto) {  
    vistaOrigen = vistaActual;
    activa('fotografia');
    if(vistaOrigen == 'fenologia') {
      document.querySelector("#fotoGran").src = document.querySelector("#foto").src;
    } else {
      document.querySelector("#fotoGran").src = document.querySelector("#fitxa-foto").src;
    }
  }
}

function fitxa(observacio) {
  observacioFitxa = observacio;
  activa('fitxa');
  indexedDB.open("eduMET").onsuccess = function(event) {
    event.target.result.transaction(["Observacions"], "readonly").objectStore("Observacions").get(observacioFitxa).onsuccess = function(e) {
      if(e.target.result["Id_feno"] != "0") {
        document.querySelector("#fenomen-nom").innerHTML = `${fenomens[e.target.result["Id_feno"]]["Bloc_feno"]}: ${fenomens[e.target.result["Id_feno"]]["Titol_feno"]}`;
      } else {
        document.querySelector("#fenomen-nom").innerHTML = "Sense identificar";
      }
      if(e.target.result["Data_observacio"] != "") {
        document.querySelector("#dataHora").textContent = `${formatDate(e.target.result["Data_observacio"])}  -  ${e.target.result["Hora_observacio"]}`;
      }
      let foto = e.target.result["Fotografia_observacio"];
        if(foto == 0) {
          document.querySelector("#fitxa-foto").src = e.target.result["Imatge"];
        } else {
          document.querySelector("#fitxa-foto").src = url_imatges + foto;
        }
      document.querySelector("#fitxa-text").textContent = e.target.result["Descripcio_observacio"];
      let online;
      if(navigator.onLine) {
        online = true;
      } else {
        online = false;
      }
      let laLatitud = e.target.result["Latitud"];
      let laLongitud = e.target.result["Longitud"];
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
        fitxaMapa = L.map('fitxa-mapa');
        if(online){
          fitxaMapa.setView(new L.LatLng(laLatitud, laLongitud), 15);
          L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            minZoom: 1,
            maxZoom: 19,
            attribution: 'Wikimedia'
          }).addTo(fitxaMapa);
        } else{
          fitxaMapa.setView(new L.LatLng(laLatitud, laLongitud), 10);
          fetch("json/municipis.geojson", {credentials: 'same-origin'})
          .then(response => response.json())
          .then(response => {
            L.geoJSON(response,{style:{"color": "#0000FF","weight": 1,"opacity": 0.5}}).addTo(fitxaMapa);
          });
        }
      } catch (error) {
        if(online){
          let zoom = 15;
        } else {
          let zoom = 10;
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

function valida(fragment) {
  usuari = document.querySelector("#usuari").value;
  contrasenya = document.querySelector("#password").value;
  let url = url_servidor + "?ident=" + usuari + "&psw=" + contrasenya + "&tab=registrar_se_app"
  fetch(url)
  .then(response => response.text())
  .then(response => response.trim())
  .then(response => {
    if (response == "") {
      console.log("No Auth");
      usuari = "";
      alert("Usuari i/o contrasenya incorrectes. Si us plau, torna-ho a provar.");
    } else {
      console.log(`Auth OK: ${usuari}`);
      console.log(`Assignada: ${response}`);
      estacioAssignada = response;
      indexedDB.open("eduMET").onsuccess = function(event) {
        event.target.result.transaction(["Estacions"], "readonly").objectStore("Estacions").get(estacioAssignada).onsuccess = function(e) {
          console.log(`Nom: ${e.target.result["Nom_centre"]}.`);
          localStorage.setItem("nom", e.target.result["Nom_centre"]);
          alert(`Benvingut/da, ${e.target.result["Nom_centre"]}.`);
        }
      }
      localStorage.setItem("usuari", usuari);
      localStorage.setItem("assignada", response);
      baixaObsInicial();
      if(fragment == 'fenologia') {
        activa('fenologia');
      }
      if(fragment == 'registra') {
        registra();
      }
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
    let estPreferida = storage.getItem("preferida");
    if (estPreferida == null) {
      let distanciaPropera = 1000;
      let distanciaProva;
      let estacioPropera = 0;
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
          console.log(`Preferida (Propera): ${event.target.result[estacioPropera]["Codi_estacio"]} : ${event.target.result[estacioPropera]["Nom_centre"]}`);
          estacioActual = event.target.result[estacioPropera]["Codi_estacio"];
          estacioPreferida = estacioActual;
          storage.setItem("preferida", estacioPreferida);
          estacioDesada = true;
          document.querySelector("#estacio-nom").value = estacioPreferida;
          mostraEstacio();
        };
      };
    }
  }

  if(!mobilLocalitzat) {
    mobilLocalitzat = true; 
    console.log(`GeoSuccess: ${latitudActual}, ${longitudActual}`);
    let greenIcon = L.icon({
      iconUrl: 'img/marker-icon-green.png',
      iconAnchor: [12, 41],
      shadowUrl: 'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png',
    });
    L.marker(new L.LatLng(latitudActual, longitudActual),{icon: greenIcon}).addTo(map);
  }
} 

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  let R = 6371; // Radius of the earth in km
  let dLat = deg2rad(lat2-lat1);
  let dLon = deg2rad(lon2-lon1); 
  let a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  let d = R * c; // Distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function formatDate(dia) {
  let parts = dia.split('-');
  let d = new Date(parts[0], parts[1] - 1, parts[2]); 
  month = '' + (d.getMonth() + 1);
  day = '' + d.getDate();
  year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [day, month, year].join('-');
}
function formatDateGPS(dia) {
  let parts = dia.split(':');
  let d = new Date(parts[0], parts[1] - 1, parts[2]); 
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
      let device = {};
      for (let d in _device) {
        device[d] = _device[d];
      }
      if (device.kind === 'video') {
          device.kind = 'videoinput';
      }
      let skip;
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
  let dd = degrees + (minutes/60) + (seconds/3600);    
  if (direction == "S" || direction == "W") {
      dd = dd * -1; 
  }    
  return dd;
}

function getTime(date) {
  let any = date.getFullYear();
  let mes = (date.getMonth() + 1).toString();
  let dia = date.getDate().toString();
  let hora = date.getHours().toString();
  let minut = date.getMinutes().toString();
  let segon = date.getSeconds().toString();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  if (hora.length < 2) hora = '0' + hora;
  if (minut.length < 2) minut = '0' + minut;
  if (segon.length < 2) segon = '0' + segon;
  Data_UTC = any + '-' + mes + '-' + dia;
  Hora_UTC = hora + ':' + minut + ':' + segon;
}
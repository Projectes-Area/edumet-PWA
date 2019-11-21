<?php
include "ewcfg6.php";
include "phpfn6.php";
global $Security;
global $conn;
$link = mysqli_connect(EW_CONN_HOST, EW_CONN_USER, EW_CONN_PASS,EW_CONN_DB);

/* verificar la conexión */
if (mysqli_connect_errno()) {
  printf("Conexión fallida: %s\n", mysqli_connect_error());
  exit();
}
mysqli_set_charset($link, "utf8");

/*
var_dump($_REQUEST);
$var=json_encode($_REQUEST);

$var2=json_decode($var);
var_dump($var2);
$data_back = json_decode($var);
//*/


if (isset($_REQUEST["tab"])){
  $tab=$_REQUEST["tab"];
} else {
  $data_back = json_decode(file_get_contents('php://input'));
  //$data_back = json_decode($_REQUEST);	
  $tab = $data_back->{"tab"};
}




if (isset($_REQUEST['codiEstacio'])) {
  $codiEstacio=$_REQUEST["codiEstacio"];
}
if (isset($_REQUEST['columnes'])) {
  $columnes=$_REQUEST["columnes"];
}
if (isset($_REQUEST['anys'])) {
  $anys=$_REQUEST["anys"];
} else {
  $anys=1;
}


//echo "<hr>".$var2->{"tab"};

//var_dump($_REQUEST);

//$columnes="Data_UTC,Hora_UTC,Temp_ext_min_avui,Temp_ext_max_avui,Temp_ext_actual,Hum_ext_actual,Pres_actual,Pres_tend_barometre,Vent_dir_sectors_actual,Vent_vel_actual,Vent_mitj_10min_avui,Vent_vel_max_avui,Precip_intensitat_actual,Precip_acum_avui,Pronostic,Sortida_sol,Posta_sol,Fase_lluna";


//$codiEstacio='25911027';
//Carrega les dades de l'estació si se li ha passa el codi si no no executa aquesta part per respondre més ràpidament


switch ($tab) {

case "radar":
  $carpeta="../edumet-data/meteocat/radar/";
  $row_img=scandir($carpeta,1);
  $llista=array_slice($row_img, 1, 10);
  $llista=array_reverse($llista);
  echo json_encode($llista);
  break;

case "cnjEst":
  //Carrega de les estacions
  $cnjEst=$_REQUEST["cnjEst"];
  if (isset($_REQUEST['xarxaEst'])) {
    $xarxaEst=$_REQUEST["xarxaEst"];  
  } else {
    $xarxaEst="t";      
  }

  if (isset($_REQUEST['tipusXarxa'])) {
    $tipusXarxa=$_REQUEST["tipusXarxa"];  
  } else {
    $tipusXarxa="auto";      
  }

  if ($xarxaEst=='Totes'){
    $xarxaEst="t";      
  }

  $sql="Select Id_estacio,Codi_estacio,Nom_centre,Poblacio, Latitud, Longitud, Altitud, Situacio_estacio, Codi_clima, concat('Est-',substr(concat('0',Id_estacio),-2)) as Abreviatura from meteo_estacions where Situacio_estacio='O' and mapes like '%".$cnjEst."%' and tipus_web like '%".$xarxaEst."%' and Xarxes_edumet like '%".$tipusXarxa."%'  order by Situacio_estacio,`Nom_Centre`,`Poblacio`";
  $result=mysqli_query($link, $sql);
  //echo "<br>".$sql."<br>";
    $l=0;
    while ($row = mysqli_fetch_assoc($result)) {
      $row_est[$l]=$row;
      $l++;
    }
    echo json_encode($row_est);
    break;

    case "cnjEstApp":
    //Carrega de les estacions
    $cnjEst=$_REQUEST["cnjEst"];
    if (isset($_REQUEST['xarxaEst'])) {
      $xarxaEst=$_REQUEST["xarxaEst"];  
    } else {
      $xarxaEst="t";      
    }
    
    if ($xarxaEst=='Totes'){
      $xarxaEst="t";      
    }

// NO CANVIAR !!!!!!!!!

    //$xarxaEst="obser";
    //$xarxaEst="auto";  
    $sql="Select Id_estacio,Codi_estacio,Nom_centre,Poblacio, Latitud, Longitud, Altitud, Situacio_estacio, Codi_clima, concat('Est-',substr(concat('0',Id_estacio),-2)) as Abreviatura from meteo_estacions where Situacio_estacio='O' and mapes like '%".$cnjEst."%'  order by Situacio_estacio,`Nom_Centre`,`Poblacio`";
    //$sql="Select Id_estacio,Codi_estacio,Nom_centre,Poblacio, Latitud, Longitud, Altitud, Situacio_estacio, Codi_clima, concat('Est-',substr(concat('0',Id_estacio),-2)) as Abreviatura from meteo_estacions where Situacio_estacio='O' and mapes like '%".$cnjEst."%' and Xarxes_edumet like '%".$xarxaEst."%' order by Situacio_estacio,`Nom_Centre`,`Poblacio`";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql."<br>";
      $l=0;
      while ($row = mysqli_fetch_assoc($result)) {
        $row_est[$l]=$row;
        $l++;
      }
      echo json_encode($row_est);
      break;
    
    case "llistaFenoFenologics":
      $sql="Select * from meteo_obs_fenologia";
      $result=mysqli_query($link, $sql);
      $l=0;
      while ($row = mysqli_fetch_assoc($result)) {
        $rwFen[$l]=$row;
        $l++;
      }
      echo json_encode($rwFen);
      /*while ($row = mysqli_fetch_assoc($result)) {
        $rwFen[$e][0]=$row["Id_feno"];
        $rwFen[$e][1]=$row["Bloc_feno"];
        $rwFen[$e][2]=$row["Codi_feno"];
        $rwFen[$e][3]=$row["Titol_feno"];
        $e ++;
      }*/
      //echo json_encode($rwFen);
      break;





case "centresObser" :
  //carregar grups
  //$sql="Select  Id_estacio,Codi_estacio,Nom_centre,Poblacio, Latitud, Longitud, Situacio_estacio, Altitud, Codi_clima, Abreviatura, Adreca from meteo_obs_centres where Codi_estacio='".$codiEstacio."'";
  $sql="Select  * from meteo_estacions where Codi_estacio='".$codiEstacio."'";
  $result=mysqli_query($link, $sql);
  //echo "<br>".$sql."<br>";
  $l=0;
  while ($row = mysqli_fetch_assoc($result)) {
    $row_cen[$l]=$row;
    $l++;
  }
  //var_dump($row_grp);
  echo json_encode($row_cen);
  break;

case "grupsObser" :
  //carregar grups
  //$sql="Select * from meteo_obs_grups where Codi_estacio='".$codiEstacio."' Order by Codi_grup";
  $sql="Select identificador,contrasenya,nom,correu,codi_estacio  from meteo_usuaris where Codi_estacio='".$codiEstacio."' and nivell='6' Order by Nom";
  $result=mysqli_query($link, $sql);
  $row_grp=mysqli_fetch_all($result,MYSQLI_BOTH) ;
  //echo $sql;  
  /*/
  $l=0;
  while ($row = mysqli_fetch_row($result)) {
    $row_grp[$l]=$row;
    $l++;
  }
  //*/
  //var_dump($row_grp);
  echo json_encode($row_grp);
  break;

case "dadesObser" :
  $codGrup=$_REQUEST["codGrup"];
  $Data_UTC=$_REQUEST["dataDadesObser"];
  $Data_UTC=substr($Data_UTC,6,4)."-".substr($Data_UTC,3,2)."-".substr($Data_UTC,0,2);

  //Carrega de les estacions
  $sql="Select * from meteo_obs_dades where Codi_estacio= '".$codiEstacio."' and Codi_grup= '".$codGrup."' and Data_UTC= '".$Data_UTC."' order by data_utc, hora_utc";
  $result=mysqli_query($link, $sql);
    //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_obs[0][$c]=$val->name;
    $c=$c+1;
  }

  $l=1;
  while ($row = mysqli_fetch_row($result)) {
    $row_obs[$l]=$row;
    $l++;
  }
  //echo "<br>".$sql."<br>";
  echo json_encode($row_obs);
  break;




case "tbEstacioObser" :
  //Carrega de les estacions
  $sql="Select est.*, Codi_koppen, Descripcio_clima, Diagrama_climatic, Viquipedia from meteo_estacions as est left join meteo_climes as clim on est.Codi_clima = clim.Codi_clima where Codi_estacio= '".$codiEstacio."'";
  $result=mysqli_query($link, $sql);
  $row_est = mysqli_fetch_assoc($result);
  echo json_encode($row_est);
  break;


case "tbActualsObser" :
  $data_final = date_create();
  //$avui= date(d,m,Y);

  $avui = date('Y-m-j');
  $dia = time()-(10*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $mes=time()-(30*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $any = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
    $dataFiltre = date('Y-m-d', $dia); //Formatea dia
  
  //$sql="Select ".$columnes." from meteo_obs_dades as obs ";
  $sql="Select * from meteo_estacions as est ";    
  $sql .="left join meteo_obs_dades as obs on est.Codi_estacio=obs.Codi_estacio "  ;
  $sql .="where est.Codi_estacio='".$codiEstacio."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC limit 0,1";
  $result=mysqli_query($link, $sql);
  //echo "<br>".$sql;
  while ($row = mysqli_fetch_assoc($result)) {
      $row_act=$row;
  }

  echo json_encode($row_act);
  break;


case "tbResumDiaObser" :
  $data_final = date_create();
  //$avui= date(d,m,Y);

  $avui = date('Y-m-j');
  //$dia = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $dia = time()-(10*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $mes=time()-(30*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $any = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  //$dataFiltre = date('d-m-Y', $dia); //Formatea dia
  //$dataFiltre = date('Y-m-d', $dia); //Formatea dia
  $dataFiltre = date('Y-m-d', $mes); //Formatea dia

  $sql="Select ".$columnes." from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' and data_UTC >= '".$dataFiltre."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC";
  $result=mysqli_query($link, $sql);
  //echo "\n".$sql;

    //trespassar dades  del nom dels camps
    $c=0;
    $fieldinfo=mysqli_fetch_fields($result);
    foreach ($fieldinfo as $val) {
      $row_dia[0][$c]=$val->name;
      $c=$c+1;
    }

    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_dia[$l]=$row;
      $l++;
    }
    //echo "<script type='text/javascript'>var row_act=eval(".json_encode($row_act).")</script>";
    echo json_encode($row_dia);
//    exit;
    break;




case "tbResumSetObser" :
  //Carrega del resum setmanal
  //$sql="Select * from resum_setmanal_actuals where Codi_estacio= '".$codiEstacio."' and mes = '".date('m')."' and aaaa= '".date('Y')."' order by `dia`";
  $sql="Select * from resum_setmanal_actuals where Codi_estacio= '".$codiEstacio."' order by `Data_UTC` DESC";
  $result=mysqli_query($link, $sql);
  //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_set[0][$c]=$val->name;
    $c=$c+1;
  }

    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_set[$l]=$row;
      $l++;
    }
    echo json_encode($row_set);
    break;




case "tbResumMesObser" :
  //Carrega del resum mensual
  //$sql="Select * from resum_mensual_diaris where Codi_estacio= '".$codiEstacio."' and mes = '".date('m')."' and aaaa= '".date('Y')."' order by `dia`";
  $sql="Select * from resum_mensual_actuals where Codi_estacio= '".$codiEstacio."' order by `Data_UTC` DESC";
  $result=mysqli_query($link, $sql);
  //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_mes[0][$c]=$val->name;
    $c=$c+1;
  }
    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_mes[$l]=$row;
      $l++;
    }
    echo json_encode($row_mes);
    break;



case "tbResumAnyObser" :
  //Carrega del resum anual
  //$sql="Select * from resum_anual_diaris where Codi_estacio= '".$codiEstacio."' and aaaa= '".date('Y')."' order by `mes`";
  //$sql="Select * from resum_anual_diaris where Codi_estacio= '".$codiEstacio."' order by aaaa DESC ,mes DESC";
  $sql="select `Codi_estacio` AS `Codi_estacio`,";
    $sql .="year(`Data_UTC`) AS `aaaa`,";
    $sql .="month(`Data_UTC`) AS `mes`,";
    $sql .="round(avg(`Temp_Ext_actual`),2) AS `T_Mitj`,";
    $sql .="round(avg(`Temp_Ext_Max_avui`),2) AS `MT_Max`,";
    $sql .="round(avg(`Temp_Ext_Min_avui`),2) AS `MT_Min`,";
    $sql .="max(`Temp_Ext_Max_avui`) AS `T_Max`,";
    $sql .="min(`Temp_Ext_Min_avui`) AS `T_Min`,";
    $sql .="`Precip_acum_mens` AS `Prec`,";
    $sql .="round(avg(`Vent_Vel_actual`),2) AS `Vent_Mitj`,";
    $sql .="`Vent_Vel_Max_mens` AS `V_Max`,";
    $sql .="`Vent_Dir_graus_actual` AS `Vent_Dir_Max` ";
    $sql .="from `meteo_dades_actuals` ";
    $sql .="Where `Codi_estacio`='".$codiEstacio."' ";
    $sql .="group by `Codi_estacio`,";
    $sql .="year(`Data_UTC`),";
    $sql .="month(`Data_UTC`)";
    $sql .="Order By aaaa desc, mes desc ";

  $result=mysqli_query($link, $sql);
  //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_any[0][$c]=$val->name;
    $c=$c+1;
  }
  $l=1;
  while ($row = mysqli_fetch_row($result)) {
    $row_any[$l]=$row;
    $l++;
  }
  echo json_encode($row_any);
  break;




//Observacions fenologiques
case "dadesFenologiques" :
  $codiFenologic=$_REQUEST["codiFenologic"];

  //Carrega de les estacions
  $sql="Select * from meteo_obs_fenologia_dades as feno ";
  $sql .=" inner join meteo_usuaris as usu on usu.Identificador = feno.Observador ";
  $sql .=" where Id_feno= '".$codiFenologic."' Order By data_observacio DESC" ;
  $result=mysqli_query($link, $sql);

  $l=0;
  while ($row = mysqli_fetch_assoc($result)) {
    $row_fen[$l]=$row;
    $l++;
  }
  //echo "<br>".$sql."<br>";
  echo json_encode($row_fen);
  break;


case "tbEstacio" :
  //Carrega de les estacions
  $sql="Select est.*, Codi_koppen, Descripcio_clima, Diagrama_climatic, Viquipedia from meteo_estacions as est left join meteo_climes as clim on est.Codi_clima = clim.Codi_clima where Codi_estacio= '".$codiEstacio."'";
  $result=mysqli_query($link, $sql);
  $row_est = mysqli_fetch_all($result, MYSQLI_BOTH );
  $nRegEst=mysqli_num_rows($result);
  $nCmpEst=count(mysqli_fetch_fields($result));
  $rwEstFields=mysqli_fetch_fields($result);
  //var_dump($row_est);
  echo json_encode($row_est);
  break;


case "tbActuals" :
  $data_final = date_create();
  //$avui= date(d,m,Y);

  $avui = date('Y-m-j');
  //$dia = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $dia = time()-(10*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $mes=time()-(30*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $any = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  //$dataFiltre = date('d-m-Y', $dia); //Formatea dia
  $dataFiltre = date('Y-m-d', $dia); //Formatea dia
  //$dataFiltre = date('Y-m-d', $mes); //Formatea dia

  //$sql="Select ".$columnes." from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and data_UTC >= '".$dataFiltre."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC limit 1";
  //$sql="Select ".$columnes." from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' and data_UTC >= '".$dataFiltre."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC limit 1";
  //$result=mysqli_query($link, $sql);
  //echo "<br>".$sql;


  $sql="Select *,".$columnes." from meteo_estacions as est ";    
  $sql .="left join meteo_dades_diaries_resum as obs on est.Codi_estacio=obs.Codi_estacio "  ;
  $sql .="where est.Codi_estacio='".$codiEstacio."' and data_UTC >= '".$dataFiltre."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC limit 1";  
  $result=mysqli_query($link, $sql);
  //echo "<br>".$sql;  



  while ($row = mysqli_fetch_assoc($result)) {
    $row_act=$row;
  }

  //actualitzar la màxima i minima del dia. les que hi ha a la taula de cada registre són les del l'hora 
  $sql="SELECT min(`Temp_Ext_Min`),max(`Temp_Ext_Max`) FROM `meteo_dades_diaries_resum` where Codi_estacio='".$codiEstacio."' and data_UTC = '".$dataFiltre."' group by `Data_UTC`";
  $result=mysqli_query($link, $sql);



  while ($row = mysqli_fetch_row($result)) {
    $row_act["Temp_ext_min_avui"]=$row[0];
    $row_act["Temp_ext_max_avui"]=$row[1];
  }



  //echo "<script type='text/javascript'>var row_act=eval(".json_encode($row_act).")</script>";
  echo json_encode($row_act);
//    exit;
  break;







case "tbResumDia" :
  $data_final = date_create();
  //$avui= date(d,m,Y);

  $avui = date('Y-m-j');
  //$dia = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $dia = time()-(10*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $mes=time()-(30*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  $any = time()-(365*24*60*60); //Te resta un dia (2*24*60*60) te resta dos y //asi...
  //$dataFiltre = date('d-m-Y', $dia); //Formatea dia
  //$dataFiltre = date('Y-m-d', $dia); //Formatea dia
  $dataFiltre = date('Y-m-d', $mes); //Formatea dia

  $sql="Select ".$columnes." from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' and data_UTC >= '".$dataFiltre."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC";
  $result=mysqli_query($link, $sql);
  //echo "\n".$sql;

    //trespassar dades  del nom dels camps
    $c=0;
    $fieldinfo=mysqli_fetch_fields($result);
    foreach ($fieldinfo as $val) {
      $row_dia[0][$c]=$val->name;
      $c=$c+1;
    }

    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_dia[$l]=$row;
      $l++;
    }
    //echo "<script type='text/javascript'>var row_act=eval(".json_encode($row_act).")</script>";
    echo json_encode($row_dia);
//    exit;
    break;




case "tbResumSet" :
  //Carrega del resum setmanal
  //$sql="Select * from resum_setmanal_actuals where Codi_estacio= '".$codiEstacio."' and mes = '".date('m')."' and aaaa= '".date('Y')."' order by `dia`";
  $sql="Select * from resum_setmanal_actuals where Codi_estacio= '".$codiEstacio."' order by `Data_UTC` DESC";
  $result=mysqli_query($link, $sql);
  //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_set[0][$c]=$val->name;
    $c=$c+1;
  }

    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_set[$l]=$row;
      $l++;
    }
    echo json_encode($row_set);
    break;




case "tbResumMes" :
  //Carrega del resum mensual
  //$sql="Select * from resum_mensual_diaris where Codi_estacio= '".$codiEstacio."' and mes = '".date('m')."' and aaaa= '".date('Y')."' order by `dia`";
  $sql="Select * from resum_mensual_actuals where Codi_estacio= '".$codiEstacio."' order by `Data_UTC` DESC";
  $result=mysqli_query($link, $sql);
  //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_mes[0][$c]=$val->name;
    $c=$c+1;
  }
    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_mes[$l]=$row;
      $l++;
    }
    echo json_encode($row_mes);
    break;



case "tbResumAny" :
  //Carrega del resum anual
  //$sql="Select * from resum_anual_diaris where Codi_estacio= '".$codiEstacio."' and aaaa= '".date('Y')."' order by `mes`";
  //$sql="Select * from resum_anual_diaris where Codi_estacio= '".$codiEstacio."' order by aaaa DESC ,mes DESC";
  $sql="select `Codi_estacio` AS `Codi_estacio`,";
    $sql .="year(`Data_UTC`) AS `aaaa`,";
    $sql .="month(`Data_UTC`) AS `mes`,";
    $sql .="round(avg(`Temp_Ext_actual`),2) AS `T_Mitj`,";
    $sql .="round(avg(`Temp_Ext_Max_avui`),2) AS `MT_Max`,";
    $sql .="round(avg(`Temp_Ext_Min_avui`),2) AS `MT_Min`,";
    $sql .="max(`Temp_Ext_Max_avui`) AS `T_Max`,";
    $sql .="min(`Temp_Ext_Min_avui`) AS `T_Min`,";
    $sql .="`Precip_acum_mens` AS `Prec`,";
    $sql .="round(avg(`Vent_Vel_actual`),2) AS `Vent_Mitj`,";
    $sql .="`Vent_Vel_Max_mens` AS `V_Max`,";
    $sql .="`Vent_Dir_graus_actual` AS `Vent_Dir_Max` ";
    $sql .="from `meteo_dades_actuals` ";
    $sql .="Where `Codi_estacio`='".$codiEstacio."' ";
    $sql .="group by `Codi_estacio`,";
    $sql .="year(`Data_UTC`),";
    $sql .="month(`Data_UTC`)";
    $sql .="Order By aaaa desc, mes desc ";

  $result=mysqli_query($link, $sql);
  //trespassar dades  del nom dels camps
  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_any[0][$c]=$val->name;
    $c=$c+1;
  }
  $l=1;
  while ($row = mysqli_fetch_row($result)) {
    $row_any[$l]=$row;
    $l++;
  }
  echo json_encode($row_any);
  break;




case "grafVar":

/*
    SELECT
hora_utc,
`Temp_ext_actual`,
`Hum_ext_actual`,
round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio,
(round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs
FROM `meteo_dades_actuals`
WHERE codi_estacio='25911027' and data_utc='2015-12-23' order by hora_utc
//*/


  $dataInicial=$_REQUEST['dataInicial'];
  $dataFinal=$_REQUEST['dataFinal'];
  $columnes=$_REQUEST['columnes'];

  //$sql="Select `Data_UTC`, Hora_UTC, ".$columnes." round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio, (round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";

  //$sql="Select `Data_UTC`, Hora_UTC, ".$columnes." from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";
  $sql="Select `Data_UTC`, Hora_UTC, ".$columnes." from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";

  //echo "<br>".$sql;
  //exit;
  $nParametres=explode(",",$columnes);
  $result=mysqli_query($link, $sql);
  $row_act = mysqli_fetch_all($result, MYSQLI_BOTH );
  $nRegAct=mysqli_num_rows($result);
  $nCmpAct=count(mysqli_fetch_fields($result));
  $nRegAct=count($row_act);
  //$nRegSetmana=7*24*2;
  //$nRegMigMes=15*24*2;
  //$nRegMes=30*24*2;
  for ($f=0; $f< $nRegAct; $f++) {
    for ($p=0;$p<count($nParametres);$p++) {
        $rw_par_val[$p][$f][0]=$row_act[$f][0]." ".$row_act[$f][1];
        $rw_par_val[$p][$f][1]=(float) $row_act[$f][$p+2];
    }
  }
  echo json_encode($rw_par_val);
  /*
  echo "<br>".$sql;
  echo "<hr>";
  var_dump($rw_par_val);
  //*/
  break;




case "grafVarMon":

/*
    SELECT
hora_utc,
`Temp_ext_actual`,
`Hum_ext_actual`,
round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio,
(round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs
FROM `meteo_dades_actuals`
WHERE codi_estacio='25911027' and data_utc='2015-12-23' order by hora_utc
//*/


  $dataInicial=$_REQUEST['dataInicial'];
  $dataFinal=$_REQUEST['dataFinal'];
  $columnes=$_REQUEST['columnes'];

  //$sql="Select `Data_UTC`, Hora_UTC, ".$columnes." round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio, (round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";

  //$sql="Select `Data_UTC`, Hora_UTC, ".$columnes." from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";
  $sql="Select `Data_UTC`, Hora_UTC, ".$columnes." from mon_dades_diaries_resum where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";

  //echo "<br>".$sql;
  //exit;
  $nParametres=explode(",",$columnes);
  $result=mysqli_query($link, $sql);
  $row_act = mysqli_fetch_all($result, MYSQLI_BOTH );
  $nRegAct=mysqli_num_rows($result);
  $nCmpAct=count(mysqli_fetch_fields($result));
  $nRegAct=count($row_act);
  //$nRegSetmana=7*24*2;
  //$nRegMigMes=15*24*2;
  //$nRegMes=30*24*2;
  for ($f=0; $f< $nRegAct; $f++) {
    for ($p=0;$p<count($nParametres);$p++) {
        $rw_par_val[$p][$f][0]=$row_act[$f][0]." ".$row_act[$f][1];
        $rw_par_val[$p][$f][1]=(float) $row_act[$f][$p+2];
    }
  }
  echo json_encode($rw_par_val);
  /*
  echo "<br>".$sql;
  echo "<hr>";
  var_dump($rw_par_val);
  //*/
  break;




case "grafVar_2":

/*
    SELECT
hora_utc,
`Temp_ext_actual`,
`Hum_ext_actual`,
round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio,
(round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs
FROM `meteo_dades_actuals`
WHERE codi_estacio='25911027' and data_utc='2015-12-23' order by hora_utc
//*/


  $dataInicial=$_REQUEST['dataInicial'];
  $dataFinal=$_REQUEST['dataFinal'];
  $columnes=$_REQUEST['columnes'];

  //$sql="Select `Data_UTC`, Hora_UTC, ".$columnes." round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio, (round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";
  //$sql="Select `Data_UTC`, Hora_UTC, ".$columnes." from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";



$sql="Select `Data_UTC`, Hora_UTC, Temp_ext_actual,Temp_ext_max_avui,Temp_ext_min_avui,Hum_ext_actual,(round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs,
round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio, PuntRos_ext_actual,
Precip_intensitat_actual,Precip_acum_avui,Precip_tempesta_actual,Pres_actual,Vent_vel_actual,Vent_mitj_10min_avui,Vent_vel_max_avui,Vent_dir_sectors_actual, RadSolar_actual from meteo_dades_actuals where Codi_estacio='".$codiEstacio."' and  data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";

/*
Select `Data_UTC`, Hora_UTC, Temp_ext_actual,Temp_ext_max_avui,Temp_ext_min_avui,Hum_ext_actual,(round((((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3))*`Hum_ext_actual`)/100),2)) as Hum_abs,
round((5.018+ 0.32321*`Temp_ext_actual`+0.0081847*pow(`Temp_ext_actual`,2)+0.00031243*pow(`Temp_ext_actual`,3)),2) as Saturacio,
Precip_intensitat_actual,Precip_acum_avui,Precip_tempesta_actual,Pres_actual,Vent_vel_actual,Vent_mitj_10min_avui,Vent_vel_max_avui,Vent_dir_sectors_actual,RadSolar_actual
  from meteo_dades_actuals where Codi_estacio='25911027' and  data_UTC >= '2016-02-01' and data_UTC <= '2016-02-29'  order by `Data_UTC`  DESC, `Hora_UTC`  DESC";
//*/



  //echo "<br>".$sql;
  //exit;
  $nParametres=explode(",",$columnes);
  $result=mysqli_query($link, $sql);
  $row_act = mysqli_fetch_all($result, MYSQLI_BOTH );
  $nRegAct=mysqli_num_rows($result);
  $nCmpAct=count(mysqli_fetch_fields($result));
  $nRegAct=count($row_act);
  //$nRegSetmana=7*24*2;
  //$nRegMigMes=15*24*2;
  //$nRegMes=30*24*2;
  for ($f=0; $f< $nRegAct; $f++) {
    for ($p=0;$p<count($nParametres);$p++) {
        $rw_par_val[$p][$f][0]=$row_act[$f][0]." ".$row_act[$f][1];
        $rw_par_val[$p][$f][1]=(float) $row_act[$f][$p+2];
    }
  }
  echo json_encode($rw_par_val);
  /*
  echo "<br>".$sql;
  echo "<hr>";
  var_dump($rw_par_val);
  //*/
  break;


case "grafEst":
  //$dataFiltre=$_REQUEST['dataFiltre'];
  $dataInicial=$_REQUEST['dataInicial'];
  $dataFinal=$_REQUEST['dataFinal'];
  $columnes=$_REQUEST['columnes'];
  $codisEstacions=$_REQUEST['codisEstacions'];
  $estacions=explode(",",$codisEstacions);
  //$nParametres=explode(",",$columnes);
  $Parametres=explode(",",$columnes);
  $nRegSetmana=7*24*2;
  $nRegMigMes=15*24*2;
  $nRegMes=30*24*2;


  for ($e=0; $e<count($estacions);$e++) {
    $est=$estacions[$e];
    $sql="Select `Codi_estacio`,`Data_UTC`,concat(substr(`Hora_UTC`,1,2),':',if (substr(`Hora_UTC`,4,2)>15 and substr(`Hora_UTC`,4,2)<45,'30','00')) as Hora_UTC, ";
    //$sql .= $columnes." from meteo_dades_actuals where Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    $sql .= $columnes." from meteo_dades_diaries_resum where Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    //echo "<br>".$sql;
    //echo "<br>parametres: ".count($nParametres)."<hr>";
    $result=mysqli_query($link, $sql);
    $nRegAct=mysqli_num_rows($result);
    $nCmpAct=count(mysqli_fetch_fields($result));

    $v=0;
    while ($row=mysqli_fetch_array($result)) {
      for ($p=0;$p<count($Parametres);$p++) {
        $rw_par_val[$p][$e][$v][0]=$row[1]." ".$row[2];
        $rw_par_val[$p][$e][$v][1]=(float) $row[$p+3];
        ////$rw_par_val[$p][$r][$v][2]=$row[0];
      }
      $v ++;
    }
  }
  echo json_encode($rw_par_val);
  break;



case "grafEstMon":
  //$dataFiltre=$_REQUEST['dataFiltre'];
  $dataInicial=$_REQUEST['dataInicial'];
  $dataFinal=$_REQUEST['dataFinal'];
  $columnes=$_REQUEST['columnes'];
  $codisEstacions=$_REQUEST['codisEstacions'];
  $estacions=explode(",",$codisEstacions);
  //$nParametres=explode(",",$columnes);
  $Parametres=explode(",",$columnes);
  $nRegSetmana=7*24*2;
  $nRegMigMes=15*24*2;
  $nRegMes=30*24*2;


  for ($e=0; $e<count($estacions);$e++) {
    $est=$estacions[$e];
    $sql="Select `Codi_estacio`,`Data_UTC`,concat(substr(`Hora_UTC`,1,2),':',if (substr(`Hora_UTC`,4,2)>15 and substr(`Hora_UTC`,4,2)<45,'30','00')) as Hora_UTC, ";
    //$sql .= $columnes." from meteo_dades_actuals where Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    $sql .= $columnes." from mon_dades_diaries_resum where Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    //echo "<br>".$sql;
    //echo "<br>parametres: ".count($nParametres)."<hr>";
    $result=mysqli_query($link, $sql);
    $nRegAct=mysqli_num_rows($result);
    $nCmpAct=count(mysqli_fetch_fields($result));

    $v=0;
    while ($row=mysqli_fetch_array($result)) {
      for ($p=0;$p<count($Parametres);$p++) {
        $rw_par_val[$p][$e][$v][0]=$row[1]." ".$row[2];
        $rw_par_val[$p][$e][$v][1]=(float) $row[$p+3];
        ////$rw_par_val[$p][$r][$v][2]=$row[0];
      }
      $v ++;
    }
  }
  echo json_encode($rw_par_val);
  //var_dump($rw_par_val);
  break;



case "mapa":
  $dataInicial=$_REQUEST['dataInicial'];
  $horaInicial=$_REQUEST['horaInicial'];
  $horaFinal=$_REQUEST['horaFinal'];
  $columnes=$_REQUEST['columnes'];
  $codisEstacions=$_REQUEST['codisEstacions'];
  $estacions=explode(",",$codisEstacions);
  $codisEstacions="";
  for ($e=0;$e<=count($estacions);$e++) {
    $codisEstacions .="'".$estacions[$e]."',";  
  }
  $codisEstacions=substr($codisEstacions,0,-1);

  $nParametres=explode(",",$columnes);

    $sql="Select dades.`Codi_estacio`,`Data_UTC`,concat(substr(`Hora_UTC`,1,2),':',if (substr(`Hora_UTC`,4,2)>15 and substr(`Hora_UTC`,4,2)<45,'30','00')) as Hora_UTC, ";
    //$sql .=" Latitud, Longitud, Altitud, Abreviatura, ".$columnes." from meteo_dades_actuals as dades inner join meteo_estacions as est on dades.Codi_estacio=est.Codi_estacio where dades.Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and hora_UTC >= '".$horaInicial."' and hora_UTC <= '".$horaFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    $sql .=" Latitud, Longitud, Altitud, Abreviatura, max(".$columnes.") from meteo_dades_diaries_resum as dades inner join meteo_estacions as est on dades.Codi_estacio=est.Codi_estacio where dades.Codi_estacio in (".$codisEstacions.") and data_UTC >= '".$dataInicial."' and hora_UTC >= '".$horaInicial."' and hora_UTC <= '".$horaFinal."' Group by  dades.Codi_estacio order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    //$sql .= $columnes." from meteo_dades_diaries_resum where Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
   //echo "<br>".$sql;
    $result=mysqli_query($link, $sql);
    $v=0;
    while ($row=mysqli_fetch_array($result)) {
      $rw_par_val[$v][0]=$row[0]; //codiEstacio
      $rw_par_val[$v][1]=(float) $row[3]; //Latitud
      $rw_par_val[$v][2]=(float) $row[4]; //Longiutd
      $rw_par_val[$v][3]=(float) $row[5]; //Altitud
      $rw_par_val[$v][4]=$row[7]; //parametre
      $rw_par_val[$v][5]=$row[6]." (".$row[7].")"; //codiEtiqueta
      $v ++;
    }
  echo json_encode($rw_par_val);
  //var_dump($rw_par_val);
  break;


case "grafPerfil":
  $dataInicial=$_REQUEST['dataInicial'];
  $horaInicial=$_REQUEST['horaInicial'];
  $horaFinal=$_REQUEST['horaFinal'];
  $columnes=$_REQUEST['columnes'];
  $codisEstacions=$_REQUEST['codisEstacions'];
  $estacions=explode(",",$codisEstacions);
  $nParametres=explode(",",$columnes);


    $sql="Select dades.`Codi_estacio`,`Data_UTC`,concat(substr(`Hora_UTC`,1,2),':',if (substr(`Hora_UTC`,4,2)>15 and substr(`Hora_UTC`,4,2)<45,'30','00')) as Hora_UTC, ";
    //$sql .=" Latitud, Longitud, Altitud, Abreviatura, ".$columnes." from meteo_dades_actuals as dades inner join meteo_estacions as est on dades.Codi_estacio=est.Codi_estacio where dades.Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and hora_UTC >= '".$horaInicial."' and hora_UTC <= '".$horaFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    $sql .=" Latitud, Longitud, Altitud, Abreviatura, max(".$columnes.") from meteo_dades_diaries_resum as dades inner join meteo_estacions as est on dades.Codi_estacio=est.Codi_estacio where dades.Codi_estacio in (".$codisEstacions.") and data_UTC >= '".$dataInicial."' and hora_UTC >= '".$horaInicial."' and hora_UTC <= '".$horaFinal."' Group by  dades.Codi_estacio order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
    //$sql .= $columnes." from meteo_dades_diaries_resum where Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' order by Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
   //echo "<br>".$sql;
    $result=mysqli_query($link, $sql);
    $v=0;
    while ($row=mysqli_fetch_array($result)) {
      $rw_par_val[$v][0]=$row[0]; //codiEstacio
      $rw_par_val[$v][1]=(float) $row[3]; //Latitud
      $rw_par_val[$v][2]=(float) $row[4]; //Longiutd
      $rw_par_val[$v][3]=(float) $row[5]; //Altitud
      $rw_par_val[$v][4]=$row[7]; //parametre
      $rw_par_val[$v][5]=$row[6]." (".$row[7].")"; //codiEtiqueta
      $v ++;
    }
  echo json_encode($rw_par_val);
  //var_dump($rw_par_val);
  break;




case "graf3D":
  //$dataFiltre=$_REQUEST['dataFiltre'];
  $dataInicial=$_REQUEST['dataInicial'];
  $dataFinal=$_REQUEST['dataFinal'];
  $horaInicial=$_REQUEST['horaInicial'];
  $horaFinal=$_REQUEST['horaFinal'];
  $columnes=$_REQUEST['columnes'];
  $codisEstacions=$_REQUEST['codisEstacions'];
  $estacions=explode(",",$codisEstacions);
  $codisEstacions="";
  for ($e=0;$e<=count($estacions);$e++) {
    $codisEstacions .="'".$estacions[$e]."',";  
  }
  $codisEstacions=substr($codisEstacions,0,-1);

  $nParametres=explode(",",$columnes);


  $v=0;
  $valors='"[';

  $sql="Select Longitud, Latitud, Altitud, ";
   //$sql .= $columnes.", concat(Data_UTC,'-',substr(`Hora_UTC`,1,2),':',if (substr(`Hora_UTC`,4,2)>15 and substr(`Hora_UTC`,4,2)<45,'30','00')) as Hora_UTC from meteo_dades_actuals as dades inner join meteo_estacions as est on dades.Codi_estacio=est.Codi_estacio where dades.Codi_estacio='".$est."' and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' and hora_UTC >= '".$horaInicial."' and hora_UTC <= '".$horaFinal."' order by est.Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";
  $sql .="max(".$columnes."), concat(Data_UTC,'-',substr(`Hora_UTC`,1,2),':',if (substr(`Hora_UTC`,4,2)>=15 and substr(`Hora_UTC`,4,2)<=45,'30','00')) as Hora_UTC from meteo_dades_diaries_resum as dades inner join meteo_estacions as est on dades.Codi_estacio=est.Codi_estacio where dades.Codi_estacio in (".$codisEstacions.") and data_UTC >= '".$dataInicial."' and data_UTC <= '".$dataFinal."' and hora_UTC >= '".$horaInicial."' and hora_UTC <= '".$horaFinal."' Group by dades.Codi_estacio  order by est.Codi_estacio, `Data_UTC`  DESC, `Hora_UTC`  DESC ";

  //echo "<br>".$sql,"<br>";
  $result=mysqli_query($link, $sql);
  $nRegAct=mysqli_num_rows($result);
  $nCmpAct=count(mysqli_fetch_fields($result));

  while ($row=mysqli_fetch_array($result)) {
    $valors .="[".(-1)*(float) $row[0].",".(-1)*(float) $row[1].",".(float) $row[2].",".(float) $row[3]."],";

    $rw_par_val[$v][0]=(float) $row[0]; //Longitud
    $rw_par_val[$v][1]=(float) $row[1]; //Latitud
    $rw_par_val[$v][3]=(float) $row[2]; //Altitud
    $rw_par_val[$v][4]=(float) $row[3]; //parametre
    $v ++;
  }

  $valors=substr($valors,0,-1);
  $valors .=']"';
  echo ($valors);
  //echo json_encode($rw_par_val);

  break;




case "climes":


  if ($_REQUEST['color']!='undefined' && $_REQUEST['color']!=null) {
    $color=$_REQUEST['color'];
  } else {
    $color='undefined';
  }

  if ($_REQUEST['codClima']!='undefined' && $_REQUEST['codClima']!=null) {
    $codClima=$_REQUEST['codClima'];
  } else {
    $codClima='undefined';
  }


  $mapa=$_REQUEST['mapa'];
  //var_dump($color);
  //$sql="Select * from meteo_climes ";

  if ($codClima!='undefined') {
    $sql="Select * from meteo_climes where Codi_clima='".$codClima."'";
  } else {
    $sql="Select * from meteo_climes where color='#".$color."'";
  }

  //echo "<br>".$sql;
  $result=mysqli_query($link, $sql);
  $l=0;
  while ($row = mysqli_fetch_row($result)) {
    $row_climes[$l]=$row;
    $l++;
  }
  echo json_encode($row_climes);
  //var_dump($rw_par_val);
  break;



case "climaAnys":
  $sql="SELECT aaaa, COUNT( aaaa )  FROM  `meteo_resum_mensual`  WHERE `Codi_estacio`='".$codiEstacio."' GROUP BY Codi_estacio, aaaa";

 //echo "<br>".$sql."<br>";
  $result=mysqli_query($link, $sql);
  $nAnys=mysqli_num_rows($result);
  echo json_encode($nAnys);
  break;



case "climogrames":
  $sql="Select Mes, avg(Precipitacio), avg(Temp_ext) from meteo_resum_mensual WHERE `Codi_estacio`='".$codiEstacio."' and aaaa in (".$anys.") group by Mes";


 //echo "<br>".$sql."<br>";

  $result=mysqli_query($link, $sql);
  $v=0;
  while ($row=mysqli_fetch_array($result)) {
    $row_clg[$v][0]=(float) $row[0];
    $row_clg[$v][1]=(float) $row[1];
    $row_clg2[$v][0]=(float) $row[0];
    $row_clg2[$v][1]=(float) $row[2];
    $v ++;
  }
  $row[0]=$row_clg;
  $row[1]=$row_clg2;
  //echo $row;
  echo json_encode($row);
  break;



case "sol":
  //Carrega de les estacions
  $codiEstacio=$_REQUEST['codiEstacio'];
  $diesOrigen=$_REQUEST["dies"];
  $dataOrigen=$_REQUEST["dataFiltre"];
  $formatOficial=$_REQUEST["formatOficial"];
  //var_dump($_REQUEST);
  $estacions=explode(",",$codiEstacio);
  //$row_sol=Array();
  //echo "<br>".count($estacions);
  for ($e=0; $e<count($estacions);$e++) {
    $est=$estacions[$e];
    //echo "<hr>".$est."<br>";
    $sql="Select * from meteo_estacions where Codi_estacio='".$est."'";
    $result=mysqli_query($link, $sql);
    $row_est = mysqli_fetch_all($result, MYSQLI_BOTH );

    $lat=$row_est[0]["Latitud"];
    $lon=$row_est[0]["Longitud"];
    $azimut=90+50/60;
    $horesAnt=$diesOrigen*24*60*60;
    $data = strtotime($dataOrigen)-$horesAnt;
    //echo "<br>".$data;
    //echo "<hr>";
    for ($d=0;$d<$diesOrigen;$d++) {
        $data = $data + (24 * 60 * 60);
        $mes = date("m",$data);
        $hora_ofi=1;
        if ($mes>3 and $mes<11 and $formatOficial=='S') {
          $hora_ofi=2;
        }
        $sortida=date_sunrise($data, SUNFUNCS_RET_STRING, $lat,$lon,$azimut,$hora_ofi);
        $posta=date_sunset($data, SUNFUNCS_RET_STRING, $lat,$lon,$azimut,$hora_ofi);
        $diferencia=date("H:i:s", strtotime("00:00") + strtotime($posta) - strtotime($sortida));

        $row_sol[0][$e][$d][0]=date('Y-m-d', $data);
        $row_sol[0][$e][$d][1]=$sortida;

        $row_sol[1][$e][$d][0]=date('Y-m-d', $data);
        $row_sol[1][$e][$d][1]=$posta;
        $row_sol[2][$e][$d][0]=date('Y-m-d', $data);
        $row_sol[2][$e][$d][1]=$diferencia;

    }
  }
  echo json_encode($row_sol);
  break;



case "solObs":
  $codiEstacio=$_REQUEST['codiEstacio'];
  $data=$_REQUEST["data"];

  $sql="Select * from meteo_obs_estacions where Codi_estacio='".$est."'";
  $result=mysqli_query($link, $sql);
  $row_est = mysqli_fetch_all($result, MYSQLI_BOTH );

  $lat=$row_est[0]["Latitud"];
  $lon=$row_est[0]["Longitud"];
  $azimut=90+50/60;
  $data = strtotime(substr($data,-4)."-".substr($data,3,2)."-".substr($data,0,2));

  $dt = $data + (24 * 60 * 60);
  $mes = date("m",$data);
  $hora_ofi=1;
  if ($mes>3 and $mes<11) {
    $hora_ofi=2;
  }

  $row_sol[0]=date_sunrise($data, SUNFUNCS_RET_STRING, $lat,$lon,$azimut,$hora_ofi);
  $row_sol[1]=date_sunset($data, SUNFUNCS_RET_STRING, $lat,$lon,$azimut,$hora_ofi);

  echo json_encode($row_sol);
  break;


case "repte":
  //Carrega de les estacions
  $bloc=$_REQUEST["bloc"];
  $id=$_REQUEST["id"];
  //var_dump($_REQUEST);
  if ($id=="") {
    $sql="Select * from meteo_reptes where Bloc= '".$bloc."'";
    $result=mysqli_query($link, $sql);
    $row = mysqli_fetch_all($result,MYSQLI_ASSOC);
    $nRegRep=mysqli_num_rows($result);
    $atzar=rand(0,$nRegRep-1);
    $id=$row[$atzar]["Id_repte"];
  }
  $sql="Select * from meteo_reptes where Id_repte= '".$id."'";
  $result=mysqli_query($link, $sql);
  //$nRegEst=mysqli_num_rows($result);
  //$nCmpEst=count(mysqli_fetch_fields($result));

  $c=0;
  $fieldinfo=mysqli_fetch_fields($result);
  foreach ($fieldinfo as $val) {
    $row_rep[0][$c]=$val->name;
    $c=$c+1;
  }

    $l=1;
    while ($row = mysqli_fetch_row($result)) {
      $row_rep[$l]=$row;
      $l++;
    }
    //echo "<br>".$sql."<br>";
    echo json_encode($row_rep);
  break;


  //Carrega de les descripcions dels parametres
case "descripParametres":
  $parametre=$_REQUEST["parametre"];
  $sql="Select * from meteo_descripcio_parametres where parametre='".$parametre."'";
  //echo "<br>".$sql;
  $result=mysqli_query($link, $sql);
  $l=0;
  while ($row = mysqli_fetch_row($result)) {
      $row_par[$l]=$row;
    $l++;
  }
  echo json_encode($row_par);
  break;


    //insertar un nou registre
case "afegirSolNouRegistre":

    $row_imp=json_encode(($_REQUEST));
    $row_imp=json_decode(($row_imp));
    $sql="select * from meteo_usuaris_solicituds limit 0,1";
    //echo "<br>".$sql;
    $result=mysqli_query($link, $sql);
    $row=mysqli_fetch_fields($result);

    $j=0;
    foreach ($row as $val) {
      $cmp[$j][0]=$val->name;
      $j ++;
    }

    $sql="Insert into meteo_usuaris_solicituds ";
    $sql_0='';
    $sql_1='';
    for ($c=0;$c<count($cmp);$c++) {
      for ($i=0;$i<count($row_imp);$i++) {
        if (isset($row_imp->{$cmp[$c][0]})) {
          $sql_0 .="`".$cmp[$c][0]."`, ";
          $sql_1 .="'".addslashes((nl2br($row_imp->{$cmp[$c][0]})))."', ";
        }
      }
    }
    $sql_0 =substr($sql_0,0,strlen($sql_0)-2);
    $sql_1 =substr($sql_1,0,strlen($sql_1)-2);
    $sql .=" (".$sql_0.") values (".$sql_1.")";
    //echo "<br>".$sql;
    $resp=mysqli_query($link, $sql);

    if ($resp === TRUE) {
      echo "Sol·licitud enviada i en procès de resolució.<br><br>En el transcurs d'uns dies rebrà informació amb les dades d'usuari i contrasenya";
    } else {
      echo "Se ha produir un error en la sol·licitud<br><br>Posueu-vos en contacte amb la coordinació del projecte a l'adreça edumet@xtec.cat";
    }

    break;


case "tbHistorics":

    $sql="Select `Data_UTC`,`Hora_UTC` from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' order by `Data_UTC`, `Hora_UTC`";
    $result=mysqli_query($link, $sql);
    $nRegAct=mysqli_num_rows($result);
    if ($nRegAct==0) {
      $dataInicialMin = "";
      $dataFinalMax = "";
      $intervalDatesEstacio="Aquest servidor No disposa de dades d'aquesta estació.";
      $existenDades='N';
    } else {

      $sql="SELECT `Data_UTC` from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' order by `Data_UTC` ASC limit 1";
      $result=mysqli_query($link, $sql);
      $row = mysqli_fetch_assoc($result);
      //$dIMin=$row['MinData_UTC'];
      //$dFMax=$row['MaxData_UTC'];
      $dIMin=$row['Data_UTC'];
      //echo "<br>Min: ".$sql;

      $sql="SELECT `Data_UTC` from meteo_dades_diaries_resum where Codi_estacio='".$codiEstacio."' order by `Data_UTC` DESC limit 1";
      $result=mysqli_query($link, $sql);
      $row = mysqli_fetch_assoc($result);
      $dFMax=$row['Data_UTC'];
      //echo "<br>Max: ".$sql;

      $dataInicialMin = substr($dIMin,-2)."-".substr($dIMin,5,2)."-".substr($dIMin,0,4);
      $dataFinalMax = substr($dFMax,-2)."-".substr($dFMax,5,2)."-".substr($dFMax,0,4);
      $intervalDatesEstacio="Aquest servidor disposa de dades d'aquesta estació des del ".$dataInicialMin." al ".$dataFinalMax;
      $existenDades='S';
    }
    //echo json_encode("existenDades=".$existenDades."#DataInicialMin=".$dataInicialMin."#dataFinalMax=".$dataFinalMax);
    $resposta[0]=$existenDades;
    $resposta[1]=$dataInicialMin;
    $resposta[2]=$dataFinalMax;
    echo json_encode($resposta);
    break;


case "tbExportacio":
    if (isset($_REQUEST["dataInicial"])) {
      $dataInicial=$_REQUEST["dataInicial"];
    }

    if (isset($_REQUEST["dataFinal"])) {
      $dataFinal=$_REQUEST["dataFinal"];
    }

    if (isset($_REQUEST["parametres"])) {
      $parametres=$_REQUEST["parametres"];
    }


    $dataFiltreIni = substr($dataInicial,-4)."-".substr($dataInicial,3,2)."-".substr($dataInicial,0,2);
    $dataFiltreFin = substr($dataFinal,-4)."-".substr($dataFinal,3,2)."-".substr($dataFinal,0,2);
    //$sql="Select `Data_UTC`,`Hora_UTC`,`Codi_estacio`,".$parametres." from meteo_dades_actuals ";
    //$sql="Select `Data_UTC`,`Hora_UTC`,`Codi_estacio`,".$parametres." from meteo_historics ";
    $sql="Select `Data_UTC`,`Hora_UTC`,`Codi_estacio`,".$parametres." from meteo_dades_diaries_resum ";
    $sql .="where Codi_estacio='".$codiEstacio."' and data_UTC >= '".$dataFiltreIni."' and data_UTC <= '".$dataFiltreFin."' ";
    $sql .="order by `Data_UTC` ASC, `Hora_UTC`  ASC";
    //echo "<br>".$sql;

    $result=mysqli_query($link, $sql);
    $row_act = mysqli_fetch_all($result, MYSQLI_BOTH );
    $nRegAct=mysqli_num_rows($result);
    $nCmpAct=count(mysqli_fetch_fields($result));
    $nRegAct=count($row_act);

    /*
    echo "hola";
    break;
    exit;
    //*/

    $csv_sep = ";";
    $fitxer="../tmp/Dades_estacio_".$codiEstacio."_".date("d_m_Y").".csv";
    if (!$h = fopen($fitxer, "w")) {
      echo "<br>No es pot obrir el fitxer";
      exit;
    }
    if ($result_camp = mysqli_query($link, $sql)) {
      $k = 0;
      $csv ="";
      while ($finfo = mysqli_fetch_field($result_camp)) {
        $rw_camp[$k][0] = $finfo->name;
        $csv .=$rw_camp[$k][0].$csv_sep;
        $k = $k+1;
      }
      fwrite($h, utf8_decode($csv)."\r\n");
      $result = mysqli_query($link, $sql);
      while ($row = mysqli_fetch_array($result)) {
        $csv="";
        for ($c=0; $c<$k; $c++) {
          $csv.=$row[$c].$csv_sep;
        }
        fwrite($h, utf8_decode($csv)."\r\n");
      }
    }
    fclose($h);

    # create new zip opbject
    $fil = "../tmp/EduMet_".$codiEstacio.".zip";
//*
    unlink($fil);
    $zip = new ZipArchive();
    //$fil = "tmp/EduMet_".time().".zip";
    $zip->open($fil, ZipArchive::CREATE);
    $download_file = file_get_contents($fitxer);
    $zip->addFromString(basename($fitxer),$download_file);
    $zip->close();

    //*
    header('Content-Type: application/csv');
    header("Content-Disposition: attachment;filename=".$fil);
    header('Cache-Control: max-age=0');
    //header("Location: ".$fil);
    //unlink($fitxer);
//*/
    echo json_encode($fil);
    break;

   //enviar correu
case "enviarCorreu":
  $row_imp=($_REQUEST);
  $row_imp=json_encode($_REQUEST);
  $row_imp=json_decode($row_imp);

  /*
  echo "<hr>";
  var_dump($row_imp);
  echo "<hr>";
  //*/

  $destinataris=$row_imp->{"destinatari_correu"};
  $assumpte=$row_imp->{"assumpte"};
  $cos_missatge=$row_imp->{"cos_missatge"};
  $correu=$row_imp->{"emissor_correu"};
  $emissor=$row_imp->{"emissor_nom"};


  // preparaci? de l'entorn de correu
  $mail = new PHPMailer();
  $mail->IsSMTP();
  $mail->Host = EW_SMTP_SERVER;
  $mail->SMTPAuth = (EW_SMTP_SERVER_USERNAME <> "" && EW_SMTP_SERVER_PASSWORD <> "");
  $mail->Username = EW_SMTP_SERVER_USERNAME;
  $mail->Password = EW_SMTP_SERVER_PASSWORD;
  $mail->Port = EW_SMTP_SERVER_PORT;
  $mail->Mailer = EW_Mailer;
  $mail->SMTPSecure = EW_SMTPSecure; // sets the prefix to the servier
  $mail->From = $correu;//$sFrEmail;
  $mail->FromName = $emissor;//$sFrEmail;
  $mail->Subject = nl2br(utf8_decode($assumpte))."-Apl";//$sSubject;
  //$mail->Body = $emissor." (".$correu.")<hr>".nl2br(utf8_decode($cos_missatge));//$sMail;
  $mail->Body = nl2br(utf8_decode($cos_missatge));//$sMail;
  $mail->ClearAddresses();
  $mail->ClearAttachments();

  //$mail->AddAddress(EW_WEB_MASTER_EMAIL);
  //$mail->AddAddress($destinataris);

    $destinataris = str_replace(";", ",", $destinataris);
    $dest = explode(",", $destinataris);
    foreach ($dest as $sTo) {
      $mail->AddAddress($sTo);
    }


  if ($correu != "") {
    $correu = str_replace(";", ",", $correu);
    $arrCc = explode(",", $correu);
    foreach ($arrCc as $sCc) {
      $mail->AddCC(trim($sCc));
      $mail->AddReplyTo($sCc,$emissor );
    }
  }



  $mail->ContentType = "text/html; charset=iso-8859-1";
//enviar el mensaje.
  if(!$mail->Send()) {
    echo "Error: " . $mail->ErrorInfo;
  } else {
    echo "Missatge enviat.";
    echo "\n\nCorreu de: ".$emissor." (".$correu.")";
    echo "\ndestinataris: ".$destinataris;
    echo "\nassumpte: ".$assumpte;
    echo "\ncos_missatge: ";
    echo "\n".$cos_missatge;
  }
  break;

case "mobil":
    $codEst="0".$_REQUEST["codEst"];
    $codEst=substr($codEst,-8);
    $sql="Select Data_UTC, Hora_UTC, Sortida_sol, Posta_sol, Temp_Ext as Temp_ext_actual, Temp_Ext_Max as Temp_ext_max_avui, Temp_Ext_Min as Temp_ext_min_avui, Vent_Dir as Vent_dir_sectors_actual, Hum_Ext as Hum_ext_actual, Pressio as Pres_actual, Vent_Vel as Vent_vel_actual, Vent_Vel_Max as Vent_vel_max_avui, Hora_UTC as Vent_vel_hor_max_avui, Precipitacio as Precip_acum_avui, Heat_DD as IndexCal_ext_actual, Cool_DD as IndexFred_ext_actual, codi_INE, Nom_centre, Poblacio, Latitud, Longitud, Altitud, est.Codi_estacio, est.web from meteo_dades_diaries_resum as act  left join meteo_estacions as est on act.codi_estacio=est.codi_estacio where act.Codi_estacio='".$codEst."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC limit 1";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    while ($row = mysqli_fetch_row($result)) {
        $row_par[$l]=$row;
      $l++;
    }
    echo json_encode($row_par);
    break;

case "mobilApp":
    $codEst="0".$_REQUEST["codEst"];
    $codEst=substr($codEst,-8);
    $sql="Select Data_UTC, Hora_UTC, Sortida_sol, Posta_sol, Temp_Ext as Temp_ext_actual, Temp_Ext_Max as Temp_ext_max_avui, Temp_Ext_Min as Temp_ext_min_avui, Vent_Dir as Vent_dir_sectors_actual, Hum_Ext as Hum_ext_actual, Pressio as Pres_actual, Vent_Vel as Vent_vel_actual, Vent_Vel_Max as Vent_vel_max_avui, Hora_UTC as Vent_vel_hor_max_avui, Precipitacio as Precip_acum_avui, Heat_DD as IndexCal_ext_actual, Cool_DD as IndexFred_ext_actual, codi_INE, Nom_centre, Poblacio, Latitud, Longitud, Altitud, est.Codi_estacio, est.web from meteo_dades_diaries_resum as act  left join meteo_estacions as est on act.codi_estacio=est.codi_estacio where act.Codi_estacio='".$codEst."' order by `Data_UTC`  DESC, `Hora_UTC`  DESC limit 1";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    while ($row = mysqli_fetch_assoc($result)) {
        $row_par[$l]=$row;
      $l++;
    }
    echo json_encode($row_par);
    break;

case "nuvols":
    $sql="Select * from meteo_obs_nuvols";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    while ($row = mysqli_fetch_row($result)) {
        $row_nuv[$l]=$row;
      $l++;
    }
    echo json_encode($row_nuv);
    break;



case "meteors":
    $sql="Select * from meteo_obs_meteors";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    while ($row = mysqli_fetch_row($result)) {
        $row_meteors[$l]=$row;
      $l++;
    }
    echo json_encode($row_meteors);
    break;


case "registrar_se":
    $ident=$_REQUEST["ident"];
    $psw=$_REQUEST["psw"];
    $sql="Select * from meteo_usuaris Where identificador='".$ident."'";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    while ($row = mysqli_fetch_assoc($result)) {
      if ($psw==$row["contrasenya"] or $psw==EW_CONN_PASS) {
        $resposta=$row["nom"];
      } else {
        $resposta=false;
      }

    }
    echo $resposta;
    break;

case "registrar_se_app":
    $ident=$_REQUEST["ident"];
    $psw=$_REQUEST["psw"];
    $sql="Select * from meteo_usuaris Where identificador='".$ident."'";
    $result=mysqli_query($link, $sql);
    while ($row = mysqli_fetch_assoc($result)) {
      if ($psw==$row["contrasenya"] or $psw==EW_CONN_PASS) {
        $resposta=$row["Codi_estacio"];
      } else {
        $resposta=false;
      }
    }
    echo $resposta;
    break;

case "recordarContrasenya":
  $correuEstacio=$_REQUEST["correuEstacio"];
  $sql="Select * from meteo_usuaris where correu ='".$correuEstacio."'";
  //echo "<br>".$sql;
  $result=mysqli_query($link, $sql);
  while ($row = mysqli_fetch_assoc($result)) {
    enviarMissatge($correuEstacio,$row["contrasenya"]);
  }
  break;

case "salvarFenoApp":
  //var_dump($_REQUEST);
  //define a maxim size for the uploaded images
  define ("MAX_SIZE","10000");
  // define the width and height for the thumbnail
  // note that theese dimmensions are considered the maximum dimmension and are not fixed,
  // because we have to keep the image ratio intact or it will be deformed
  define ("WIDTH","800");
  define ("HEIGHT","800");


  // read JSon input
  $data_back = json_decode(file_get_contents('php://input'));
   
  // set json string to php variables
  $fitxer = $data_back->{"fitxer"};
  $usuari= $data_back->{"usuari"};
  $data = $data_back->{"dia"};
  $hora = $data_back->{"hora"};  
  $lat = $data_back->{"lat"};
  $lon= $data_back->{"lon"};
  $id_feno= $data_back->{"id_feno"};
  $descripcio = addslashes(nl2br($data_back->{"descripcio"}));
  $tab = $data_back->{"tab"};

  $dir = 'imatges/fenologia/';

  $decoded_string = base64_decode($fitxer);
  $antNom="foto.jpg";
  $ext="jpg";
  $nouNom=$usuari."_".date('YmdHis').".".$ext;

  file_put_contents ($dir.$antNom, $decoded_string);


  $thumb=redimensionar($dir.$antNom,$dir.$nouNom,WIDTH,HEIGHT,$ext);
  //unlink($carpeta.$antNom);

  //echo $usuari,",",$lat,",",$lon,",",$id_feno,",",$descripcio,",",$tab,"\n",$fitxer;


  $sql="Insert into meteo_obs_fenologia_dades ";
  $sql .="(Data_observacio,Hora_observacio,Latitud,Longitud,Observador,Id_feno,Descripcio_observacio,Fotografia_observacio)";
  $sql .=" values ";
  //$sql .="('".date('Y-m-d')."','".date('H:i')."','".$lat."','".$lon."','".$usuari."','".$id_feno."','".$descripcio."','".$nouNom."')";
  $sql .="('".$data."','".$hora."','".$lat."','".$lon."','".$usuari."','".$id_feno."','".$descripcio."','".$nouNom."')";  
  $resp=mysqli_query($link, $sql);

  
  echo $link->insert_id;
   
  break;

case "salvarObservacio":
  	$data_back = json_decode(file_get_contents('php://input'));

    $tab = $data_back->{"tab"};
   // set json string to php variables

    //Observacions meteorologiques
	$Codi_estacio= $data_back->{"Codi_estacio"};   
	$Codi_grup= $data_back->{"Codi_grup"};
	$Observadors= $data_back->{"Observadors"};
	$Data_UTC= $data_back->{"Data_UTC"};
	$Hora_UTC= $data_back->{"Hora_UTC"};
	$Sortida_sol= $data_back->{"Sortida_sol"};
	$Posta_sol= $data_back->{"Posta_sol"};
  $Fase_lluna= $data_back->{"Fase_lluna"};  
	$Temp_Ext= $data_back->{"Temp_Ext"};
	$Temp_Ext_Max= $data_back->{"Temp_Ext_Max"};
	$Temp_Ext_Min= $data_back->{"Temp_Ext_Min"};

	$Hum_Ext= $data_back->{"Hum_Ext"};
	$Pressio= $data_back->{"Pressio"};
	$Pres_tend_barometre= $data_back->{"Pres_tend_barometre"};
	$Vent_Vel= $data_back->{"Vent_Vel"};
	$Vent_Beaufort= $data_back->{"Vent_Beaufort"};
	$Vent_Dir_actual= $data_back->{"Vent_Dir_actual"};
	$Precip_acum_avui= $data_back->{"Precip_acum_avui"};
	$Nuvulositat= $data_back->{"Nuvulositat"};
	$Tipus_nuvols= $data_back->{"Tipus_nuvols"};
	$Fenomens_observats= $data_back->{"Fenomens_observats"};
	//*/

	if(!is_numeric($Temp_Ext)){$Temp_Ext='null';};
	if(!is_numeric($Temp_Ext_Max)){$Temp_Ext_Max='null';};
	if(!is_numeric($Temp_Ext_Min)){$Temp_Ext_Min='null';};
	if(!is_numeric($Hum_Ext)){ $Hum_Ext='null';}		
	if(!is_numeric($Pressio)){ $Pressio='null';}			
	if(!is_numeric($Vent_Vel)){ $Vent_Vel='null';}
  if(!is_numeric($Vent_Beaufort)){ $Vent_Beaufort='null';}  
  if(!is_numeric($Precip_acum_avui)){ $Precip_acum_avui='null';}    
  

  $sql="Insert into meteo_obs_dades ";
  $sql .="(Codi_estacio,Codi_grup,Observadors,Data_UTC,Hora_UTC,Sortida_sol,Posta_sol,Fase_lluna,Temp_Ext,Temp_Ext_Max,Temp_Ext_Min,Hum_ext,Pressio,Pres_tend_barometre,Vent_Vel,Vent_Beaufort,Vent_Dir_actual,Precip_acum_avui,Nuvulositat,Tipus_nuvols,Fenomens_observats)";
  $sql .=" values ";
  $sql .="('".$Codi_estacio."','".$Codi_grup."','".$Observadors."','".$Data_UTC."','".$Hora_UTC."','".$Sortida_sol."','".$Posta_sol."','".$Fase_lluna."',".$Temp_Ext.",".$Temp_Ext_Max.",".$Temp_Ext_Min.",".$Hum_Ext.",".$Pressio.",'".$Pres_tend_barometre."',".$Vent_Vel.",".$Vent_Beaufort.",'".$Vent_Dir_actual."',".$Precip_acum_avui.",'".$Nuvulositat."','".$Tipus_nuvols."','".$Fenomens_observats."')";  

  $resp=mysqli_query($link, $sql);

  echo $link->insert_id;
  
  break;



case "modificarFenoApp":
  // read JSon input
  $data_back = json_decode(file_get_contents('php://input'));
  
  // set json string to php variables
  $id = $data_back->{"id"};
  $id_feno= $data_back->{"id_feno"};
  $descripcio = addslashes(nl2br($data_back->{"descripcio"}));

  $sql  = "Update meteo_obs_fenologia_dades SET Id_feno=";
  $sql .= $id_feno;
  $sql .= ', Descripcio_observacio="';
  $sql .= $descripcio;
  $sql .= '" WHERE ID=';
  $sql .= $id;
  $resp=mysqli_query($link, $sql);
  
  echo $id;
   
  break;

case "salvarFeno":
	//define a maxim size for the uploaded images
	define ("MAX_SIZE","10000");
	// define the width and height for the thumbnail
	// note that theese dimmensions are considered the maximum dimmension and are not fixed,
	// because we have to keep the image ratio intact or it will be deformed
	define ("WIDTH","500");
	define ("HEIGHT","450");


	$row=$_REQUEST;


	$usuari=$row["usuari"];
	$lat=$row["lat"];
	$lon=$row["lon"];
	$id_feno=$row["id_feno"];
	$descripcio=addslashes(nl2br($row["descripcio"]));
	$ftxNom = $_FILES['fitxer']['name'];
	$ext = strtolower(substr($ftxNom,strpos($ftxNom,'.') + 1,100));

	$size=getimagesize($_FILES['fitxer']['tmp_name']);
	$sizekb=filesize($_FILES['fitxer']['tmp_name']);
	//compare the size with the maxim size we defined and print error if bigger
	if ($sizekb > MAX_SIZE*1024) {
	  echo '<h1>La imatge és massa gran!</h1>';
	  $errors=1;
	  return;
	}


	if (($ext != "jpg") && ($ext != "jpeg") && ($ext != "png")) {
	  echo "<h1>L'extensió de la seva imatge no es pot processar. Hauria se ser jpg, jpeg, o png</h1>";
	  $errors=1;
	  //return;
	}


	/*
	$destination_path = getcwd().DIRECTORY_SEPARATOR."imatges".DIRECTORY_SEPARATOR."fenologia".DIRECTORY_SEPARATOR;
	$target_path = $destination_path . basename( $_FILES['fitxer']['name']);
	//*/

	//$carpeta="/var/www/html/edumet-data/meteocat/fenologia/";
	$carpeta="/var/www/html/edumet/meteo_proves/imatges/fenologia/";


	if (move_uploaded_file($_FILES['fitxer']['tmp_name'], $carpeta.$ftxNom)) {
	  //redimentsionar la imatge
	  $antNom=$ftxNom;
	  $nouNom=$usuari."_".date('YmdHis').".".$ext;
	  //$copied = copy($carpeta.$antNom, $carpeta.$nouNom);

	  $thumb=redimensionar($carpeta.$antNom,$carpeta.$nouNom,WIDTH,HEIGHT,$ext);
	  unlink($carpeta.$antNom);


	}

	$sql="Insert into meteo_obs_fenologia_dades ";
	$sql .="(Data_observacio,Hora_observacio,Latitud,Longitud,Observador,Id_feno,Descripcio_observacio,Fotografia_observacio)";
	$sql .=" values ";
	$sql .="('".date('Y-m-d')."','".date('H:i')."','".$lat."','".$lon."','".$usuari."','".$id_feno."','".$descripcio."','".$nouNom."')";
	$resp=mysqli_query($link, $sql);
	
	echo $sql;

	break;


case "visuFeno":
    $usuari=$_REQUEST["usuari"];
    $sql="Select * from meteo_obs_fenologia_dades where Observador='".$usuari."' order by Data_observacio,Hora_observacio";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    while ($row = mysqli_fetch_row($result)) {
        $row_feno[$l]=$row;
      $l++;
    }
    echo json_encode($row_feno);
    break;

case "visuFenoApp":
    $usuari=$_REQUEST["usuari"];
    $sql="Select * from meteo_obs_fenologia_dades where Observador='".$usuari."' order by Data_observacio,Hora_observacio";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    while ($row = mysqli_fetch_assoc($result)) {
        $row_feno[$l]=$row;
      $l++;
    }
    echo json_encode($row_feno);
    break;

case "eliminarFenUsu":
    $usuari=$_REQUEST["usuari"];
    $id=$_REQUEST["id"];

    $sql="Select * from meteo_obs_fenologia_dades where Observador='".$usuari."' and id='".$id."'";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;
    while ($row = mysqli_fetch_assoc($result)) {
        $fitxer=$row['Fotografia_observacio'];
    }

    $fitxer="imatges/fenologia/".$fitxer;

    unlink($fitxer);


    $sql="delete from meteo_obs_fenologia_dades where Observador='".$usuari."' and id='".$id."';";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;
    $rw=[];
    echo json_encode($rw);
    break;


case "visuObsFeno":
    $id=$_REQUEST["id"];
    $sql="Select ID, Data_observacio, Hora_observacio, Latitud, Longitud, Observador, obs.Id_feno, Descripcio_observacio, Fotografia_observacio, Data_registre, Bloc_feno, Codi_feno, Titol_feno, Descripcio_feno, Icona_feno, Fitxa_feno, Enllac_feno, Seguiment, nom, Components_grup ";
    $sql .=" from meteo_obs_fenologia_dades as obs ";
    $sql .=" inner join meteo_obs_fenologia as cod on obs.Id_feno=cod.Id_feno ";
    $sql .=" inner join meteo_usuaris as usu on obs.Observador=usu.identificador ";
    $sql .=" where id='".$id."' ";
    $sql .=" order by data_registre desc";



    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    $l=0;
    //while ($row = mysqli_fetch_row($result)) {
    while ($row = mysqli_fetch_assoc($result)){   
        $row_feno[$l]=$row;
      $l++;
    }
    echo json_encode($row_feno);
    break;



case "altaEstacio":
//alta noves estacions 

    if (isset($_REQUEST["codiEstacio"])) {$codiEstacio=$_REQUEST["codiEstacio"];} else {$codiEstacio="";};
    if (isset($_REQUEST["nomEstacio"])) {$nomEstacio=$_REQUEST["nomEstacio"];} else {$nomEstacio="";};    
    if (isset($_REQUEST["adrEstacio"])) {$adrEstacio=$_REQUEST["adrEstacio"];} else {$adrEstacio="";};    
    if (isset($_REQUEST["munEstacio"])) {$munEstacio=$_REQUEST["munEstacio"];} else {$munEstacio="";};        
    if (isset($_REQUEST["crrEstacio"])) {$crrEstacio=$_REQUEST["crrEstacio"];} else {$crrEstacio="";};    
    if (isset($_REQUEST["telEstacio"])) {$telEstacio=$_REQUEST["telEstacio"];} else {$telEstacio="";};                
    if (isset($_REQUEST["latlEstacio"])) {$latEstacio=$_REQUEST["latEstacio"];} else {$latEstacio="";};                
    if (isset($_REQUEST["lonEstacio"])) {$lonEstacio=$_REQUEST["lonEstacio"];} else {$lonEstacio="";};                
    if (isset($_REQUEST["altEstacio"])) {$altEstacio=$_REQUEST["altEstacio"];} else {$altEstacio="";};                            
    if (isset($_REQUEST["xrxEstacio"])) {$xrxEstacio=$_REQUEST["xrxEstacio"];} else {$xrxEstacio="";};                                
    if (isset($_REQUEST["psw"])) {$psw=$_REQUEST["psw"];} else {$psw=generateRandomString(6);};
    if (isset($_REQUEST["cntNom"])) {$cntNom=$_REQUEST["cntNom"];} else {$cntNom="";};
    if (isset($_REQUEST["cntCrr"])) {$cntCrr=$_REQUEST["cntCrr"];} else {$cntCrr="";};    
    if (isset($_REQUEST["cntTel"])) {$cntTel=$_REQUEST["cntTel"];} else {$cntTel="";};        
    if (isset($_REQUEST["cntAlt"])) {$cntAlt=$_REQUEST["cntAlt"];} else {$cntAlt="";};            



    $sql="Select * from meteo_centres where `Codi_centre`='".$codiEstacio."'";
    $result=mysqli_query($link, $sql);
    //echo "<br>".$sql;

    while ($row_est = mysqli_fetch_assoc($result)) {
        $row=$row_est;
    }

    if ($result === TRUE) {
      $resposta="Codi trobat a la taula de centres: ".$codiEstacio;
    } else {
      $resposta="Codi No trobat a la taula de centres: ".$codiEstacio;      
    }

    //Entrar les dades 
    if ($row["Codi_centre"]==$codiEstacio){
      $correu_centre=substr($row["Codi_centre"],1,7)."@xtec.cat";
      switch (substr($correu_centre,0,1)){
        case "8":
          $correu_centre ="a".$correu_centre;
          break;
        case "7":
          $correu_centre ="b".$correu_centre;
          break;          
        case "5":
          $correu_centre ="c".$correu_centre;
          break;          
        case "3":
          $correu_centre ="e".$correu_centre;
          break;          
      }


      //alta en estacions
      $sql="INSERT INTO `meteo_estacions` (`Codi_estacio`,`Nom_centre`,`Adreca`,`Poblacio`,`Codi_comarca`,`Comarca`,`Telefon`,`correu`,`Latitud`,`Longitud`,`any_connexio_xarxa`,`Situacio_estacio`,`Abreviatura`,`Mapes`,`tipus_web`,`Xarxes_edumet`) ";
      $sql .="VALUES ";
      //$sql .="(".$row["Codi centre"].",".$row["Denominació completa"].",".$row["Adreça"].",".$row["Codi postal"].",".$row["Nom municipi"].",".$row["Codi comarca"].",".$row["Nom comarca"].",".$row["Telèfon"].",".$row["E-mail centre"].",".$row["Coordenades GEO X"].",".$row["Coordenades GEO Y"].",'2019','O','Est-','cat,','edumet,','obser,')";
      $sql .='("'.$row["Codi_centre"].'","'.$row["Nom_centre"].'","'.$row["Adreça"].'","'.$row["Nom_municipi"].'","'.$row["Codi_comarca"].'","'.$row["Nom_comarca"].'","'.$row["Telèfon"].'","'.$correu_centre.'","'.$row["Lat"].'","'.$row["Lon"].'","2019","O","Est-","cat,","edumet,","obser,")';      
      $result=mysqli_query($link,$sql);
      //echo "<br>".$sql;
      if ($result === true) {
          $resposta .=utf8_encode("\nCreada la nova estació: ").$codiEstacio;
          //alta en usuaris
          $sql="INSERT INTO `meteo_usuaris` (`Actiu`,`nivell`,`identificador`,`contrasenya`,`nom`,`correu`,`Tipus`,`Tipus_estacio`,`Codi_estacio`,`Contacte_nom`,`Contacte_correu`,`Contacte_telefon`,`Altres_contactes`) ";
          $sql .="VALUES ";
          $sql .='("1","3","'.$row["Codi_centre"].'","'.$psw.'","'.$row["Nom_centre"].'","'.$correu_centre.'","Obser","","'.$row["Codi_centre"].'","'.$cntNom.'","'.$cntCrr.'","'.$cntTel.'","'.$contacte_altres.'")';      
          $result=mysqli_query($link, $sql);

          if ($result === TRUE) {
              $resposta .="\n----Usuari creat correctament: ".$codiEstacio;
          } else {
              $resposta .="\nError al crear l'usuari: \n".$link->error."\n".stripslashes($sql)  ;
          }
      } else {
          $resposta="\nError al crear l'estació: \n".$link->error."\n".stripslashes($sql) ;
      }

    }
    echo json_encode($resposta);
    break;
}




// preparaci? de l'entorn de correu
Function enviarMissatge($correuEstacio,$contrasenya) {
    $mail = new PHPMailer();
    $mail->IsSMTP();
    $mail->Host = EW_SMTP_SERVER;
    $mail->SMTPAuth = (EW_SMTP_SERVER_USERNAME <> "" && EW_SMTP_SERVER_PASSWORD <> "");
    $mail->Username = EW_SMTP_SERVER_USERNAME;
    $mail->Password = EW_SMTP_SERVER_PASSWORD;
    $mail->Port = EW_SMTP_SERVER_PORT;
    $mail->Mailer = EW_Mailer;
    $mail->SMTPSecure = EW_SMTPSecure; // sets the prefix to the servier
    $mail->From = "edumet@xtec.cat";//$sFrEmail;
    $mail->FromName = "edumet@xtec.cat";//$sFrEmail;
    $mail->Subject = "Recordatori psw";//$sSubject;
    $mail->Body = utf8_decode("La seva constrasenya d'accès a l'aplicació és: ").$contrasenya;//$sMail;
    $mail->ClearAddresses();
    $mail->ClearAttachments();
    $mail->AddAddress($correuEstacio);
    $mail->AddCC("edumet@xtec.cat");
    $mail->ContentType = "text/plain";
  //*
    if(!$mail->Send()) {
      echo "Error: " . $mail->ErrorInfo;
    } else {
      echo "Missatge enviat a: ".$correuEstacio;
    }
  //*/
}







// this is the function that will create the thumbnail image from the uploaded image
// the resize will be done considering the width and height defined, but without deforming the image
function redimensionar($img_name,$filename,$new_w,$new_h,$ext) {
  //get image extension.
  //creates the new image using the appropriate function from gd library
  if(!strcmp("jpg",$ext) || !strcmp("jpeg",$ext)) $src_img=imagecreatefromjpeg($img_name);

  if(!strcmp("png",$ext)) $src_img=imagecreatefrompng($img_name);

  //gets the dimmensions of the image
  $old_x=imageSX($src_img);
  $old_y=imageSY($src_img);

  // next we will calculate the new dimmensions for the thumbnail image
  // the next steps will be taken:
  // 1. calculate the ratio by dividing the old dimmensions with the new ones
  //  2. if the ratio for the width is higher, the width will remain the one define in WIDTH variable
  //  and the height will be calculated so the image ratio will not change
  //  3. otherwise we will use the height ratio for the image
  // as a result, only one of the dimmensions will be from the fixed ones
  $ratio1=$old_x/$new_w;
  $ratio2=$old_y/$new_h;
  if($ratio1>$ratio2) {
    $thumb_w=$new_w;
    $thumb_h=$old_y/$ratio1;
  } else {
    $thumb_h=$new_h;
    $thumb_w=$old_x/$ratio2;
  }

  // we create a new image with the new dimmensions
  $dst_img=ImageCreateTrueColor($thumb_w,$thumb_h);

  // resize the big image to the new created one
  imagecopyresampled($dst_img,$src_img,0,0,0,0,$thumb_w,$thumb_h,$old_x,$old_y);

  // output the created image to the file. Now we will have the thumbnail into the file named by $filename
  if(!strcmp("png",$ext)) {
    imagepng($dst_img,$filename);
  } else {
    imagejpeg($dst_img,$filename);
  }

  //destroys source and destination images.
  imagedestroy($dst_img);
  imagedestroy($src_img);
}



function generateRandomString($length = 4) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}


?>




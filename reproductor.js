// ======================================================
// CONFIGURACIÓN
// ======================================================

// Como los HTML están dentro de /files
// y los MP3 están en /files/canciones:
//
// canciones/de_musica_ligera.mp3

const CARPETA_AUDIOS = "canciones/";


// Un único reproductor para toda la página.
const audioRockArg = new Audio();


// Canción seleccionada.
let cancionReproduciendo = null;


// ======================================================
// ELEMENTOS DEL REPRODUCTOR
// ======================================================

function obtenerElementosReproductor(){
  return {
    panel: document.getElementById("panelReproductor"),
    portada: document.getElementById("portadaCancionActual"),
    titulo: document.getElementById("nombreCancionActual"),
    artista: document.getElementById("artistaCancionActual"),
    boton: document.getElementById("botonPlayPausa"),
    barra: document.getElementById("barraProgreso"),
    progreso: document.getElementById("progresoCancion"),
    tiempoActual: document.getElementById("tiempoActual"),
    tiempoTotal: document.getElementById("tiempoTotal")
  };
}


// ======================================================
// FORMATEAR TIEMPO
// ======================================================

function formatearTiempoReproductor(segundos){
  segundos = Number(segundos);

  if(!Number.isFinite(segundos)){
    return "0:00";
  }

  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = Math.floor(segundos % 60);

  return `${minutos}:${segundosRestantes.toString().padStart(2, "0")}`;
}


// ======================================================
// MOSTRAR INFORMACIÓN
// ======================================================

function actualizarInformacionReproductor(){
  if(!cancionReproduciendo){
    return;
  }

  const elementos =
    obtenerElementosReproductor();

  if(elementos.panel){
    elementos.panel.style.display = "block";
  }

  if(elementos.titulo){
    elementos.titulo.textContent =
      cancionReproduciendo.cancion;
  }

  if(elementos.artista){
    elementos.artista.textContent =
      `${cancionReproduciendo.banda} · ${cancionReproduciendo.Nombre_Album}`;
  }

  if(elementos.portada){
    elementos.portada.src =
      `${API_URL}/imagenes/albumes/${cancionReproduciendo.imagenes}`;
  }
}


// ======================================================
// IMAGEN PLAY
// ======================================================

function mostrarPlay(){
  const boton =
    obtenerElementosReproductor().boton;

  if(!boton){
    return;
  }

  boton.src =
    "imagenes/logos/Play.png";

  boton.alt =
    "Reproducir";
}


// ======================================================
// IMAGEN PAUSA
// ======================================================

function mostrarPausa(){
  const boton =
    obtenerElementosReproductor().boton;

  if(!boton){
    return;
  }

  boton.src =
    "imagenes/logos/Pausa.png";

  boton.alt =
    "Pausar";
}


// ======================================================
// REPRODUCIR UNA CANCIÓN
// ======================================================

function reproducirCancion(cancion){

  if(!cancion){
    console.error("La canción no existe.");
    return;
  }


  // Ahora esta propiedad viene desde SQLite.
  if(
    !cancion.archivos ||
    cancion.archivos.trim() === ""
  ){
    console.error(
      "Esta canción no tiene archivo de audio:",
      cancion.cancion
    );

    return;
  }


  // Si tocamos la misma canción:
  // hacemos Play/Pausa.
  if(
    cancionReproduciendo &&
    Number(cancionReproduciendo.ID) ===
    Number(cancion.ID)
  ){
    alternarPlayPausa();
    return;
  }


  cancionReproduciendo =
    cancion;


  // Creamos una URL correcta aunque el archivo
  // tenga espacios, tildes o ñ.
  const rutaAudio =
    new URL(
      CARPETA_AUDIOS + cancion.archivos,
      window.location.href
    );


  audioRockArg.src =
    rutaAudio.href;


  console.log(
    "Canción:",
    cancion.cancion
  );

  console.log(
    "Archivo BDD:",
    cancion.archivos
  );

  console.log(
    "Ruta final:",
    audioRockArg.src
  );


  audioRockArg.load();


  actualizarInformacionReproductor();

  reiniciarBarra();


  // Empieza a sonar inmediatamente
  // al tocar Play en la fila.
  audioRockArg.play()
    .then(() => {
      console.log(
        "Reproduciendo correctamente"
      );
    })
    .catch(error => {
      console.error(
        "No se pudo reproducir:",
        error
      );
    });
}


// ======================================================
// PLAY / PAUSA
// ======================================================

function alternarPlayPausa(){

  if(!cancionReproduciendo){
    return;
  }


  if(audioRockArg.paused){

    audioRockArg.play()
      .catch(error => {
        console.error(
          "Error al reproducir:",
          error
        );
      });

  }else{

    audioRockArg.pause();

  }
}


// ======================================================
// REINICIAR BARRA
// ======================================================

function reiniciarBarra(){

  const elementos =
    obtenerElementosReproductor();


  if(elementos.progreso){
    elementos.progreso.style.width =
      "0%";
  }


  if(elementos.tiempoActual){
    elementos.tiempoActual.textContent =
      "0:00";
  }


  if(elementos.tiempoTotal){
    elementos.tiempoTotal.textContent =
      "0:00";
  }
}


// ======================================================
// ACTUALIZAR BARRA
// ======================================================

function actualizarBarra(){

  const elementos =
    obtenerElementosReproductor();


  if(
    !Number.isFinite(audioRockArg.duration) ||
    audioRockArg.duration <= 0
  ){
    return;
  }


  if(elementos.tiempoActual){

    elementos.tiempoActual.textContent =
      formatearTiempoReproductor(
        audioRockArg.currentTime
      );

  }


  if(elementos.tiempoTotal){

    elementos.tiempoTotal.textContent =
      formatearTiempoReproductor(
        audioRockArg.duration
      );

  }


  const porcentaje =
    (
      audioRockArg.currentTime /
      audioRockArg.duration
    ) * 100;


  if(elementos.progreso){

    elementos.progreso.style.width =
      porcentaje + "%";

  }
}


// ======================================================
// MOVERSE POR LA CANCIÓN
// ======================================================

function moverCancion(evento){

  const elementos =
    obtenerElementosReproductor();


  if(
    !elementos.barra ||
    !Number.isFinite(audioRockArg.duration)
  ){
    return;
  }


  const rectangulo =
    elementos.barra.getBoundingClientRect();


  const posicion =
    evento.clientX -
    rectangulo.left;


  let porcentaje =
    posicion /
    rectangulo.width;


  porcentaje =
    Math.max(
      0,
      Math.min(
        porcentaje,
        1
      )
    );


  audioRockArg.currentTime =
    audioRockArg.duration *
    porcentaje;


  actualizarBarra();
}


// ======================================================
// ACTUALIZAR PLAY / PAUSA DE TODAS LAS FILAS
// ======================================================

function actualizarBotonesReproductor(){

  document
    .querySelectorAll(".boton-reproducir-fila")
    .forEach(boton => {

      const fila =
        boton.closest(".song-row");


      if(!fila){
        return;
      }


      const id =
        Number(
          fila.dataset.cancionId
        );


      const esActual =
        cancionReproduciendo &&
        Number(
          cancionReproduciendo.ID
        ) === id;


      if(
        esActual &&
        !audioRockArg.paused
      ){

        boton.src =
          "imagenes/logos/Pausa.png";

        boton.alt =
          "Pausar";

      }else{

        boton.src =
          "imagenes/logos/Play.png";

        boton.alt =
          "Reproducir";

      }

    });
}


// ======================================================
// CLIC SOBRE PLAY DE UNA FILA
// ======================================================

document.addEventListener(
  "click",
  evento => {

    const boton =
      evento.target.closest(
        ".boton-reproducir-fila"
      );


    if(!boton){
      return;
    }


    const fila =
      boton.closest(
        ".song-row"
      );


    if(!fila){
      return;
    }


    const id =
      Number(
        fila.dataset.cancionId
      );


    const cancion =
      todasLasCanciones.find(
        elemento =>
          Number(elemento.ID) === id
      );


    if(!cancion){

      console.error(
        "No encontré la canción ID:",
        id
      );

      return;
    }


    console.log(
      "Canción obtenida desde API:",
      cancion
    );


    reproducirCancion(
      cancion
    );
  }
);


// ======================================================
// EVENTOS DEL AUDIO
// ======================================================

// Cuando realmente comienza a reproducir.
audioRockArg.addEventListener(
  "play",
  () => {

    console.log("PLAY");

    mostrarPausa();

    actualizarBotonesReproductor();

  }
);


// Cuando realmente se pausa.
audioRockArg.addEventListener(
  "pause",
  () => {

    console.log("PAUSA");

    mostrarPlay();

    actualizarBotonesReproductor();

  }
);


// Actualiza tiempo y barra constantemente.
audioRockArg.addEventListener(
  "timeupdate",
  actualizarBarra
);


// Cuando conoce la duración del MP3.
audioRockArg.addEventListener(
  "loadedmetadata",
  () => {

    console.log(
      "Duración:",
      audioRockArg.duration
    );

    actualizarBarra();

  }
);


// Cuando el archivo ya está listo.
audioRockArg.addEventListener(
  "canplay",
  () => {

    console.log(
      "Audio listo para reproducir"
    );

  }
);


// Cuando termina.
audioRockArg.addEventListener(
  "ended",
  () => {

    audioRockArg.currentTime = 0;

    actualizarBarra();

    mostrarPlay();

    actualizarBotonesReproductor();

  }
);


// Error de archivo.
audioRockArg.addEventListener(
  "error",
  () => {

    console.error(
      "ERROR CARGANDO AUDIO"
    );

    console.error(
      audioRockArg.src
    );

    if(audioRockArg.error){

      console.error(
        "Código:",
        audioRockArg.error.code
      );

    }

  }
);


// ======================================================
// BOTÓN DEL REPRODUCTOR + BARRA
// ======================================================

function iniciarReproductor(){

  const elementos =
    obtenerElementosReproductor();


  if(elementos.boton){

    elementos.boton.addEventListener(
      "click",
      alternarPlayPausa
    );

  }


  if(elementos.barra){

    elementos.barra.addEventListener(
      "click",
      moverCancion
    );

  }


  mostrarPlay();
}


// ======================================================
// INICIO
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  iniciarReproductor
);
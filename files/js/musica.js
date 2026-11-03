// Catálogo y reproducción — config.js
const API_URL = window.location.origin;

// Catálogo y reproducción — utils.js
function normalizarTexto(texto){
  return String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

function formatearDuracion(segundos){
  segundos=Number(segundos);
  if(!Number.isFinite(segundos)) return "0:00";

  const minutos=Math.floor(segundos/60);
  const segundosRestantes=Math.floor(segundos%60);

  return `${minutos}:${segundosRestantes.toString().padStart(2,"0")}`;
}

// Catálogo y reproducción — api.js
async function obtenerCanciones(){
  const respuesta=await fetch(`${API_URL}/api/canciones`);
  if(!respuesta.ok) throw new Error("No se pudieron obtener las canciones");
  return await respuesta.json();
}

async function obtenerBandas(){
  const respuesta=await fetch(`${API_URL}/api/bandas`);
  if(!respuesta.ok) throw new Error("No se pudieron obtener las bandas");
  return await respuesta.json();
}

async function obtenerDiscos(){
  const respuesta=await fetch(`${API_URL}/api/discos`);
  if(!respuesta.ok) throw new Error("No se pudieron obtener los discos");
  return await respuesta.json();
}

// Catálogo y reproducción — catalogo.js
let todasLasCanciones = [];
async function cargarCanciones() {
  todasLasCanciones = await obtenerCanciones();
}

// Catálogo y reproducción — canciones.js
function crearFilaCancion(cancion, indice){
  return `
    <div class="song-row" data-cancion-id="${cancion.ID}">
      <span class="row-index">${indice + 1}</span>

      <div class="row-cover">
        <img src="${API_URL}/imagenes/albumes/${cancion.imagenes}" alt="${cancion.Nombre_Album}">
      </div>

      <div class="row-title">
        <p class="title">${cancion.cancion}</p>
        <p class="sub">${cancion.banda} · ${cancion.Nombre_Album}</p>
      </div>

      <div class="row-time">
        ${formatearDuracion(cancion.duracion)}
      </div>

      <img
        src="/imagenes/logos/Play.png"
        class="boton-reproducir-fila"
        alt="Reproducir"
      >
    </div>
  `;
}

// Catálogo y reproducción — explorar.js
let artistaActual="";
let origenAlbum="albumes";
let bandasExplorar=[];
let discosExplorar=[];
let paginaBandas=0;
let paginaAlbumes=0;
const artistasPorPagina=5;
const albumesPorPagina=10;


function crearTarjetaArtista(banda){
  return `
    <div class="artist-card" data-banda-nombre="${banda.nombre}">
      <div class="artist-avatar">
        ${banda.imagenes
          ? `<img src="${API_URL}/imagenes/foto_bandas/${encodeURIComponent(banda.imagenes)}" alt="${banda.nombre}">`
          : `<span class="artist-sin-foto">Sin foto</span>`}
      </div>
      <p class="title">${banda.nombre}</p>
    </div>
  `;
}

function mostrarPaginaBandas(){
  const contenedor=document.getElementById("listaBandas");
  if(!contenedor) return;

  const inicio=paginaBandas*artistasPorPagina;
  const visibles=bandasExplorar.slice(inicio,inicio+artistasPorPagina);

  contenedor.innerHTML=visibles.length
    ? visibles.map(crearTarjetaArtista).join("")
    : "<p>No hay artistas disponibles.</p>";

  const totalPaginas=Math.max(1,Math.ceil(bandasExplorar.length/artistasPorPagina));
  const anterior=document.getElementById("anteriorBandas");
  const siguiente=document.getElementById("siguienteBandas");
  const pagina=document.getElementById("paginaBandas");

  if(anterior) anterior.disabled=paginaBandas===0;
  if(siguiente) siguiente.disabled=paginaBandas>=totalPaginas-1;
  if(pagina) pagina.textContent=`${paginaBandas+1} / ${totalPaginas}`;
}

async function renderizarBandas(){
  const contenedor=document.getElementById("listaBandas");
  if(!contenedor) return;

  try{
    bandasExplorar=await obtenerBandas();
    paginaBandas=0;
    mostrarPaginaBandas();

    const total=document.getElementById("totalBandas");
    if(total) total.textContent=`${bandasExplorar.length} artistas`;
  }catch(error){
    console.error(error);
    contenedor.innerHTML="<p>No se pudieron cargar los artistas.</p>";
  }
}

// ======================================================
// ÁLBUMES
// ======================================================

function crearTarjetaAlbum(disco){
  return `
    <div class="card album-clickeable" data-disco-nombre="${disco.Nombre_Album}" data-disco-banda="${disco.banda}">
      <div class="cover">
        <img src="${API_URL}/imagenes/albumes/${disco.imagenes}" alt="${disco.Nombre_Album}">
      </div>

      <p class="title">${disco.Nombre_Album}</p>
      <p class="sub">${disco.banda}, ${disco.año}</p>
    </div>
  `;
}

function mostrarPaginaAlbumes(){
  const contenedor=document.getElementById("listaAlbumes");
  if(!contenedor) return;

  const inicio=paginaAlbumes*albumesPorPagina;
  const visibles=discosExplorar.slice(inicio,inicio+albumesPorPagina);

  contenedor.innerHTML=visibles.length
    ? visibles.map(crearTarjetaAlbum).join("")
    : "<p>No hay álbumes disponibles.</p>";

  const totalPaginas=Math.max(1,Math.ceil(discosExplorar.length/albumesPorPagina));
  const anterior=document.getElementById("anteriorAlbumes");
  const siguiente=document.getElementById("siguienteAlbumes");
  const pagina=document.getElementById("paginaAlbumes");

  if(anterior) anterior.disabled=paginaAlbumes===0;
  if(siguiente) siguiente.disabled=paginaAlbumes>=totalPaginas-1;
  if(pagina) pagina.textContent=`${paginaAlbumes+1} / ${totalPaginas}`;
}

async function renderizarAlbumes(){
  const contenedor=document.getElementById("listaAlbumes");
  if(!contenedor) return;

  try{
    discosExplorar=await obtenerDiscos();
    paginaAlbumes=0;
    mostrarPaginaAlbumes();

    const total=document.getElementById("totalAlbumes");
    if(total) total.textContent=`${discosExplorar.length} álbumes`;
  }catch(error){
    console.error(error);
    contenedor.innerHTML="<p>No se pudieron cargar los álbumes.</p>";
  }
}
// ======================================================
// CONTROLES DE LOS SLIDERS
// ======================================================

function iniciarSliders(){
  const anteriorBandas=document.getElementById("anteriorBandas");
  const siguienteBandas=document.getElementById("siguienteBandas");
  const anteriorAlbumes=document.getElementById("anteriorAlbumes");
  const siguienteAlbumes=document.getElementById("siguienteAlbumes");

  if(anteriorBandas){
    anteriorBandas.addEventListener("click",()=>{
      if(paginaBandas>0){
        paginaBandas--;
        mostrarPaginaBandas();
      }
    });
  }

  if(siguienteBandas){
    siguienteBandas.addEventListener("click",()=>{
      const totalPaginas=Math.ceil(bandasExplorar.length/artistasPorPagina);

      if(paginaBandas<totalPaginas-1){
        paginaBandas++;
        mostrarPaginaBandas();
      }
    });
  }

  if(anteriorAlbumes){
    anteriorAlbumes.addEventListener("click",()=>{
      if(paginaAlbumes>0){
        paginaAlbumes--;
        mostrarPaginaAlbumes();
      }
    });
  }

  if(siguienteAlbumes){
    siguienteAlbumes.addEventListener("click",()=>{
      const totalPaginas=Math.ceil(discosExplorar.length/albumesPorPagina);

      if(paginaAlbumes<totalPaginas-1){
        paginaAlbumes++;
        mostrarPaginaAlbumes();
      }
    });
  }
}
// ======================================================
// BOTONES ARTISTAS / ÁLBUMES
// ======================================================

function ocultarSeccionesExplorar(){
  const ids=[
    "seccionArtistas",
    "seccionAlbumes",
    "seccionArtistaDetalle",
    "seccionTemasAlbum"
  ];

  ids.forEach(id=>{
    const elemento=document.getElementById(id);
    if(elemento) elemento.style.display="none";
  });
}

function activarBoton(tipo){
  const artistas=document.getElementById("botonArtistas");
  const albumes=document.getElementById("botonAlbumes");

  if(!artistas||!albumes) return;

  artistas.classList.remove("active");
  albumes.classList.remove("active");

  if(tipo==="artistas") artistas.classList.add("active");
  if(tipo==="albumes") albumes.classList.add("active");
}

function mostrarArtistas(){
  ocultarSeccionesExplorar();

  const seccion=document.getElementById("seccionArtistas");

  if(seccion) seccion.style.display="block";

  activarBoton("artistas");
}

function mostrarAlbumes(){
  ocultarSeccionesExplorar();

  const seccion=document.getElementById("seccionAlbumes");

  if(seccion) seccion.style.display="block";

  activarBoton("albumes");
}

function iniciarBotonesExplorar(){
  const botonArtistas=document.getElementById("botonArtistas");
  const botonAlbumes=document.getElementById("botonAlbumes");

  if(!botonArtistas||!botonAlbumes) return;

  botonArtistas.addEventListener("click",mostrarArtistas);
  botonAlbumes.addEventListener("click",mostrarAlbumes);

  mostrarArtistas();
}

// ======================================================
// ARTISTA -> ÁLBUMES
// ======================================================

async function mostrarAlbumesDeArtista(nombre){
  artistaActual=nombre;

  ocultarSeccionesExplorar();

  const seccion=document.getElementById("seccionArtistaDetalle");
  const titulo=document.getElementById("nombreArtistaSeleccionado");
  const contenedor=document.getElementById("albumesDelArtista");
  const cantidad=document.getElementById("cantidadAlbumesArtista");

  if(!seccion||!contenedor) return;

  seccion.style.display="block";

  if(titulo) titulo.textContent=nombre;

  const discos=await obtenerDiscos();

  const filtrados=discos.filter(disco=>
    normalizarTexto(disco.banda)===normalizarTexto(nombre)
  );

  if(cantidad) cantidad.textContent=`${filtrados.length} álbumes`;

  contenedor.innerHTML=filtrados.map(crearTarjetaAlbum).join("");
}

// ======================================================
// ÁLBUM -> CANCIONES
// ======================================================

async function mostrarTemasDeAlbum(nombreAlbum,banda,origen){
  origenAlbum=origen;

  ocultarSeccionesExplorar();

  const seccion=document.getElementById("seccionTemasAlbum");
  const titulo=document.getElementById("nombreAlbumSeleccionado");
  const artista=document.getElementById("artistaAlbumSeleccionado");
  const cantidad=document.getElementById("cantidadTemasAlbum");
  const contenedor=document.getElementById("temasDelAlbum");

  if(!seccion||!contenedor) return;

  seccion.style.display="block";

  if(titulo) titulo.textContent=nombreAlbum;
  if(artista) artista.textContent=banda;

  const canciones=todasLasCanciones.filter(cancion=>
    normalizarTexto(cancion.Nombre_Album)===normalizarTexto(nombreAlbum)&&
    normalizarTexto(cancion.banda)===normalizarTexto(banda)
  );

  if(cantidad) cantidad.textContent=`${canciones.length} canciones`;

  contenedor.innerHTML=canciones.map(crearFilaCancion).join("");

  if(typeof actualizarBotonesReproductor==="function"){
    actualizarBotonesReproductor();
  }
}

// ======================================================
// CLIC EN ARTISTAS / ÁLBUMES
// ======================================================

function iniciarNavegacionExplorar(){
  document.addEventListener("click",evento=>{
    const artista=evento.target.closest(".artist-card");

    if(artista){
      mostrarAlbumesDeArtista(artista.dataset.bandaNombre);
      return;
    }

    const album=evento.target.closest(".album-clickeable");

    if(album){
      const dentroArtista=album.closest("#albumesDelArtista");

      mostrarTemasDeAlbum(
        album.dataset.discoNombre,
        album.dataset.discoBanda,
        dentroArtista?"artista":"albumes"
      );
    }
  });

  const volverArtistas=document.getElementById("volverArtistas");

  if(volverArtistas){
    volverArtistas.addEventListener("click",mostrarArtistas);
  }

  const volverAlbum=document.getElementById("volverDesdeAlbum");

  if(volverAlbum){
    volverAlbum.addEventListener("click",()=>{
      if(origenAlbum==="artista"){
        mostrarAlbumesDeArtista(artistaActual);
      }else{
        mostrarAlbumes();
      }
    });
  }
}

// Catálogo y reproducción — buscador.js
function buscarCanciones(texto){
  const busqueda=normalizarTexto(texto);

  if(!busqueda) return [];

  return todasLasCanciones.filter(cancion=>
    normalizarTexto(cancion.cancion).includes(busqueda)||
    normalizarTexto(cancion.banda).includes(busqueda)||
    normalizarTexto(cancion.Nombre_Album).includes(busqueda)
  );
}

function mostrarResultadosBusqueda(texto){
  const seccion=document.getElementById("seccionResultados");
  const contenedor=document.getElementById("resultadosBusqueda");
  const titulo=document.getElementById("tituloResultados");
  const cantidad=document.getElementById("cantidadResultados");
  const contenido=document.getElementById("contenidoExplorar");

  if(!seccion||!contenedor) return;

  const consulta=texto.trim();

  if(!consulta){
    seccion.hidden=true;
    contenedor.innerHTML="";

    if(contenido) contenido.style.display="block";

    return;
  }

  const resultados=buscarCanciones(consulta);

  seccion.hidden=false;

  if(contenido) contenido.style.display="none";

  if(titulo) titulo.textContent=`Resultados para "${consulta}"`;
  if(cantidad) cantidad.textContent=`${resultados.length} resultados`;

  contenedor.innerHTML=resultados.length
    ? resultados.map(crearFilaCancion).join("")
    : "<p>No se encontraron resultados.</p>";

  if(typeof actualizarBotonesReproductor==="function"){
    actualizarBotonesReproductor();
  }
}

function iniciarBuscador(){
  const buscador=document.getElementById("buscadorCanciones");
  const limpiar=document.getElementById("limpiarBusqueda");

  if(!buscador) return;

  buscador.addEventListener("input",()=>{
    mostrarResultadosBusqueda(buscador.value);
  });

  if(limpiar){
    limpiar.addEventListener("click",()=>{
      buscador.value="";
      mostrarResultadosBusqueda("");
      buscador.focus();
    });
  }
}

// Catálogo y reproducción — hero.js
const imagenesHero=[
  "soda_stereo.jpg",
  "patricio_rey.jpg",
  "fito_paez.jpg",
  "divididos.jpg",
  "cerati.jpg",
  "charly_garcia.jpg"
];

function cargarImagenAleatoria(){
  const imagen=document.getElementById("heroSpin");

  if(!imagen) return;

  const elegida=imagenesHero[
    Math.floor(Math.random()*imagenesHero.length)
  ];

  imagen.src=`/imagenes/foto_bandas/${elegida}`;
}

// Catálogo y reproducción — me-gusta.js
let cancionId = null;
let favoritos = new Set();
let logueado = false;
let cargado = false;
let ocupado = false;
let version = 0;

function elementos() {
  return {
    boton: document.getElementById("botonMeGusta"),
    imagen: document.getElementById("imagenMeGusta"),
    mensaje: document.getElementById("mensajeMeGusta"),
    login: document.getElementById("loginMeGusta")
  };
}

function mostrarMensaje(texto = "", ofrecerLogin = false) {
  const { mensaje, login } = elementos();
  if (mensaje) mensaje.textContent = texto;
  if (login) login.hidden = !ofrecerLogin;
}

function actualizarBoton() {
  const { boton, imagen } = elementos();
  if (!boton || !imagen) return;
  const marcado = favoritos.has(cancionId);
  imagen.src = "/imagenes/logos/" + (marcado ? "me_gusta" : "sin_me_gusta");
  const etiqueta = marcado ? "Quitar me gusta" : "Dar me gusta";
  boton.setAttribute("aria-pressed", String(marcado));
  boton.setAttribute("aria-label", etiqueta);
  boton.title = etiqueta;
  boton.disabled = ocupado || cancionId === null;
}

async function seleccionarCancionMeGusta(id) {
  cancionId = Number(id);
  const solicitud = ++version;
  favoritos = new Set();
  cargado = false;
  ocupado = true;
  mostrarMensaje();
  actualizarBoton();
  try {
    const respuesta = await fetch("/api/me-gusta", { cache: "no-store" });
    const datos = await respuesta.json();
    if (solicitud !== version) return;
    if (!respuesta.ok && respuesta.status !== 401) throw new Error(datos.mensaje || "No se pudieron cargar tus me gusta.");
    logueado = respuesta.ok;
    favoritos = new Set(logueado ? datos.me_gusta.map(Number) : []);
    cargado = true;
  } catch (error) {
    if (solicitud === version) mostrarMensaje("No se pudieron cargar tus me gusta. Tocá el corazón para reintentar.");
  } finally {
    if (solicitud === version) {
      ocupado = false;
      actualizarBoton();
    }
  }
}

async function alternarMeGusta() {
  if (ocupado || cancionId === null) return;
  if (!cargado) return seleccionarCancionMeGusta(cancionId);
  if (!logueado) {
    mostrarMensaje("Iniciá sesión para guardar tus me gusta.", true);
    return;
  }
  const id = cancionId;
  const solicitud = version;
  const marcado = !favoritos.has(id);
  ocupado = true;
  mostrarMensaje();
  actualizarBoton();
  try {
    const respuesta = await fetch(`/api/me-gusta/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me_gusta: marcado })
    });
    const datos = await respuesta.json();
    if (solicitud !== version) return;
    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        logueado = false;
        favoritos = new Set();
        mostrarMensaje(datos.mensaje, true);
        return;
      }
      throw new Error(datos.mensaje || "No se pudo guardar el me gusta.");
    }
    favoritos = new Set(datos.me_gusta.map(Number));
    document.dispatchEvent(new CustomEvent("me-gusta-actualizado"));
    mostrarMensaje(marcado ? "Guardada en tus me gusta." : "Quitada de tus me gusta.");
  } catch (error) {
    if (solicitud === version) mostrarMensaje("No se pudo guardar el me gusta. Intentá nuevamente.");
  } finally {
    if (solicitud === version) {
      ocupado = false;
      actualizarBoton();
    }
  }
}

function iniciarMeGusta() {
  const { boton } = elementos();
  if (boton) boton.addEventListener("click", alternarMeGusta);
}

// Catálogo y reproducción — reproductor.js
// ======================================================
// CONFIGURACIÓN
// ======================================================

// Como los HTML están dentro de /files
// y los MP3 están en /files/canciones:
//
// canciones/de_musica_ligera.mp3

const CARPETA_AUDIOS = "/canciones/";


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
    "/imagenes/logos/Play.png";

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
    "/imagenes/logos/Pausa.png";

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
  seleccionarCancionMeGusta(cancion.ID);

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
      formatearDuracion(
        audioRockArg.currentTime
      );

  }


  if(elementos.tiempoTotal){

    elementos.tiempoTotal.textContent =
      formatearDuracion(
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
          "/imagenes/logos/Pausa.png";

        boton.alt =
          "Pausar";

      }else{

        boton.src =
          "/imagenes/logos/Play.png";

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
  iniciarMeGusta();

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

export { cargarCanciones, renderizarBandas, renderizarAlbumes, iniciarSliders, iniciarBotonesExplorar, iniciarNavegacionExplorar, iniciarBuscador, cargarImagenAleatoria, reproducirCancion, iniciarMeGusta, seleccionarCancionMeGusta };

const API_URL="http://localhost:3000";

let todasLasCanciones=[];
let cancionesParaBuscar=[];
let artistaActual="";
let origenAlbum="albumes";

// ======================================================
// FUNCIONES GENERALES
// ======================================================

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

// ======================================================
// API
// ======================================================

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

// ======================================================
// CANCIONES
// ======================================================
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
        src="imagenes/logos/Play.png"
        class="boton-reproducir-fila"
        alt="Reproducir"
      >
    </div>
  `;
}
// ======================================================
// ARTISTAS
// ======================================================

function obtenerFotoBanda(id){
  const fotos={
    1:"soda_stereo.jpg",
    2:"patricio_rey.jpg",
    3:"fito_paez.jpg",
    4:"las_pelotas.jpeg",
    5:"divididos.jpg",
    6:"seru giran.jpg",
    7:"charly_garcia.jpg",
    8:"pescado_rabioso.jpg",
    9:"los_tipitos.jpg",
    10:"los_piojos.png",
    11:"babasonicos.jpg",
    12:"cerati.jpg",
    13:"ciro_y_los_persas.jpg",
    14:"los_enanitos_verdes.jpg",
    15:"los_autenticos_decadentes.jpeg",
    16:"pappo.jpeg",
    17:"calamaro.jpg",
    18:"intoxicados.jpg",
    19:"airbag.jpg",
    20:"bersuit_vergarabat.jpg",
    21:"turf.jpg",
    22:"viejas_locas.jpg",
    23:"la_mancha_de_rolando.jpg",
    24:"callejeros.jpg",
    25:"no_te_va_a_gustar.jpg"
  };

  return fotos[id]||"";
}

function crearTarjetaArtista(banda){
  return `
    <div class="artist-card" data-banda-nombre="${banda.nombre}">
      <div class="artist-avatar">
        <img src="${API_URL}/imagenes/foto_bandas/${obtenerFotoBanda(banda.ID)}" alt="${banda.nombre}">
      </div>
      <p class="title">${banda.nombre}</p>
    </div>
  `;
}

async function renderizarBandas(){
  const contenedor=document.getElementById("listaBandas");
  if(!contenedor) return;

  try{
    const bandas=await obtenerBandas();

    contenedor.innerHTML=bandas.map(crearTarjetaArtista).join("");

    const total=document.getElementById("totalBandas");
    if(total) total.textContent=`${bandas.length} artistas`;
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

async function renderizarAlbumes(){
  const contenedor=document.getElementById("listaAlbumes");
  if(!contenedor) return;

  try{
    const discos=await obtenerDiscos();

    contenedor.innerHTML=discos.map(crearTarjetaAlbum).join("");

    const total=document.getElementById("totalAlbumes");
    if(total) total.textContent=`${discos.length} álbumes`;
  }catch(error){
    console.error(error);
    contenedor.innerHTML="<p>No se pudieron cargar los álbumes.</p>";
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

// ======================================================
// BUSCADOR
// ======================================================

function buscarCanciones(texto){
  const busqueda=normalizarTexto(texto);

  if(!busqueda) return [];

  return cancionesParaBuscar.filter(cancion=>
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

// ======================================================
// HERO
// ======================================================

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

  imagen.src=`imagenes/foto_bandas/${elegida}`;
}

// ======================================================
// INICIO
// ======================================================

document.addEventListener("DOMContentLoaded",async()=>{
  try{
    todasLasCanciones=await obtenerCanciones();
    cancionesParaBuscar=todasLasCanciones;
  }catch(error){
    console.error("Error cargando canciones:",error);
  }

  cargarImagenAleatoria();
  renderizarBandas();
  renderizarAlbumes();
  iniciarBotonesExplorar();
  iniciarNavegacionExplorar();
  iniciarBuscador();
});
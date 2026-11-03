// Usuario e historia — auth/favoritos.js
let solicitud = 0;

async function cargarFavoritosPerfil() {
  const lista = document.getElementById("listaFavoritos");
  const estado = document.getElementById("estadoFavoritos");
  const cantidad = document.getElementById("cantidadFavoritos");
  if (!lista || !estado || !cantidad) return;
  const actual = ++solicitud;
  lista.replaceChildren();
  cantidad.textContent = "";
  estado.textContent = "Cargando tus canciones…";
  try {
    const [favoritos, catalogo] = await Promise.all([
      fetch("/api/me-gusta", { cache: "no-store" }),
      fetch("/api/canciones")
    ]);
    if (actual !== solicitud) return;
    if (favoritos.status === 401) {
      estado.textContent = "Tu sesión terminó. Volvé a iniciar sesión para ver tus me gusta.";
      return;
    }
    if (!favoritos.ok || !catalogo.ok) throw new Error("No se pudieron obtener las canciones.");
    const [datos, canciones] = await Promise.all([favoritos.json(), catalogo.json()]);
    if (actual !== solicitud) return;
    const ids = new Set(datos.me_gusta.map(Number));
    const seleccionadas = canciones.filter(cancion => ids.has(Number(cancion.ID)));
    cantidad.textContent = `(${seleccionadas.length})`;
    estado.textContent = seleccionadas.length ? "" : "Todavía no tenés canciones con me gusta.";
    const fragmento = document.createDocumentFragment();
    seleccionadas.forEach(cancion => {
      const item = document.createElement("li");
      const portada = document.createElement("img");
      portada.src = "/imagenes/albumes/" + encodeURIComponent(cancion.imagenes);
      portada.alt = "";
      portada.loading = "lazy";
      const texto = document.createElement("div");
      const titulo = document.createElement("strong");
      titulo.textContent = cancion.cancion;
      const artista = document.createElement("span");
      artista.textContent = cancion.banda + " · " + cancion.Nombre_Album;
      texto.append(titulo, artista);
      item.append(portada, texto);
      if (document.getElementById("panelReproductor") && cancion.archivos?.trim()) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "favorito-play";
        boton.setAttribute("aria-label", "Reproducir " + cancion.cancion);
        const icono = document.createElement("img");
        icono.src = "/imagenes/logos/Play.png";
        icono.alt = "";
        boton.append(icono);
        boton.addEventListener("click", async () => {
          const { reproducirCancion } = await import("./musica.js");
          reproducirCancion(cancion);
        });
        item.append(boton);
      }
      fragmento.append(item);
    });
    lista.replaceChildren(fragmento);
  } catch (error) {
    if (actual !== solicitud) return;
    estado.textContent = "No se pudieron cargar tus canciones. Cerrá y abrí el menú para reintentar.";
  }
}

// Usuario e historia — auth/registro.js
/* REGISTRO */
const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
  formRegistro.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombre = document.getElementById("nombreRegistro").value.trim();
    const usuario = document.getElementById("usuarioRegistro").value.trim();
    const contraseña = document.getElementById("contrasenaRegistro").value;
    const mensaje = document.getElementById("mensajeRegistro");

    mensaje.textContent = "Creando cuenta...";

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, usuario, contraseña })
      });

      const datos = await respuesta.json();
      mensaje.textContent = datos.mensaje;

      if (respuesta.ok) formRegistro.reset();
    } catch (error) {
      console.error(error);
      mensaje.textContent = "No se pudo conectar con el servidor.";
    }
  });
}

// Usuario e historia — auth/login.js
/* INICIO DE SESIÓN */
const formLogin = document.getElementById("formLogin");

if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = document.getElementById("usuarioLogin").value.trim();
    const contraseña = document.getElementById("contrasenaLogin").value;
    const mensaje = document.getElementById("mensajeLogin");

    mensaje.textContent = "Comprobando datos...";

    try {
      const respuesta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña })
      });

      const datos = await respuesta.json();
      mensaje.textContent = datos.mensaje;

      if (respuesta.ok) {
        window.location.href = "/html/index.html";
      }
    } catch (error) {
      console.error(error);
      mensaje.textContent = "No se pudo conectar con el servidor.";
    }
  });
}

// Usuario e historia — auth/perfil.js
/* PERFIL Y AVATAR */
document.addEventListener("DOMContentLoaded", () => {
  const authLinks = document.getElementById("authLinks");
  const botonUsuario = document.getElementById("botonUsuario");
  const panelUsuario = document.getElementById("panelUsuario");
  const nombrePerfil = document.getElementById("nombrePerfil");
  const usuarioActual = document.getElementById("usuarioActual");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const formPerfil = document.getElementById("formPerfil");
  const mensajePerfil = document.getElementById("mensajePerfil");
  const cerrarSesion = document.getElementById("cerrarSesion");

  if (!authLinks || !botonUsuario || !panelUsuario) return;

  async function cargarSesion() {
    try {
      const respuesta = await fetch("/api/sesion");
      const datos = await respuesta.json();
      const iniciada = respuesta.ok && datos.logueado === true;

      authLinks.hidden = iniciada;
      botonUsuario.hidden = !iniciada;

      if (iniciada) {
        if (nombrePerfil) nombrePerfil.textContent = datos.nombre || "";
        if (usuarioActual) usuarioActual.textContent = datos.usuario || "";
        if (nombreUsuario) nombreUsuario.value = datos.usuario || "";
      } else {
        panelUsuario.hidden = true;
        botonUsuario.setAttribute("aria-expanded", "false");
      }
    } catch (error) {
      console.error("Error al comprobar la sesión:", error);
      authLinks.hidden = false;
      botonUsuario.hidden = true;
    }
  }

  botonUsuario.addEventListener("click", () => {
    panelUsuario.hidden = !panelUsuario.hidden;
    botonUsuario.setAttribute("aria-expanded", String(!panelUsuario.hidden));
    if (!panelUsuario.hidden) cargarFavoritosPerfil();
  });

  document.addEventListener("click", (event) => {
    if (!panelUsuario.contains(event.target) && !botonUsuario.contains(event.target)) {
      panelUsuario.hidden = true;
      botonUsuario.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panelUsuario.hidden) {
      panelUsuario.hidden = true;
      botonUsuario.setAttribute("aria-expanded", "false");
      botonUsuario.focus();
    }
  });
  document.addEventListener("me-gusta-actualizado", () => {
    if (!panelUsuario.hidden) cargarFavoritosPerfil();
  });

  if (formPerfil) {
    formPerfil.addEventListener("submit", async (event) => {
      event.preventDefault();
      mensajePerfil.textContent = "Guardando usuario...";

      try {
        const respuesta = await fetch("/api/perfil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: nombreUsuario.value.trim() })
        });

        const datos = await respuesta.json();
        mensajePerfil.textContent = datos.mensaje || "No se pudo guardar el usuario.";

        if (respuesta.ok) {
          nombreUsuario.value = datos.usuario;
          if (usuarioActual) usuarioActual.textContent = datos.usuario;
        }
      } catch (error) {
        console.error(error);
        mensajePerfil.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }

  if (cerrarSesion) {
    cerrarSesion.addEventListener("click", async () => {
      try {
        const respuesta = await fetch("/api/logout", { method: "POST" });

        if (respuesta.ok) {
          window.location.href = "/html/index.html";
        } else {
          mensajePerfil.textContent = "No se pudo cerrar la sesión.";
        }
      } catch (error) {
        console.error(error);
        mensajePerfil.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }

  cargarSesion();
});

// Usuario e historia — auth/admin.js
async function actualizarEnlaceAdmin() {
  const enlaceAdmin = document.getElementById("enlaceAdmin");

  if (!enlaceAdmin) return;

  enlaceAdmin.hidden = true;

  try {
    const respuesta = await fetch("/api/admin/verificar", {
      credentials: "same-origin"
    });

    if (!respuesta.ok) return;

    const datos = await respuesta.json();

    enlaceAdmin.hidden = datos.admin !== true;
  } catch (error) {
    enlaceAdmin.hidden = true;
  }
}

actualizarEnlaceAdmin();

// Usuario e historia — historia.js
const audioHistoria = new Audio();
const botonesHistoria = [...document.querySelectorAll(".timeline-dot")];
let botonHistoriaActual = null;

function actualizarBotonesHistoria() {
  botonesHistoria.forEach(boton => {
    const reproduciendo = boton === botonHistoriaActual && !audioHistoria.paused && !audioHistoria.ended;
    boton.classList.toggle("reproduciendo", reproduciendo);
    boton.setAttribute("aria-pressed", String(reproduciendo));
    const etiqueta = boton.dataset.etiquetaReproducir;
    boton.setAttribute("aria-label", reproduciendo ? etiqueta.replace(/^Reproducir/, "Pausar") : etiqueta);
    boton.querySelector("img").src = reproduciendo
      ? "/imagenes/logos/Pausa.png"
      : "/imagenes/logos/Play.png";
  });
}

botonesHistoria.forEach(boton => {
  boton.dataset.etiquetaReproducir = boton.getAttribute("aria-label");
  boton.addEventListener("click", () => {
    if (botonHistoriaActual === boton && !audioHistoria.paused) {
      audioHistoria.pause();
      return;
    }
    if (botonHistoriaActual !== boton) {
      audioHistoria.pause();
      botonHistoriaActual = boton;
      audioHistoria.src = boton.dataset.audio;
    }
    audioHistoria.play().catch(error => {
      // Un cambio rápido de canción puede cancelar la reproducción anterior.
      if (error.name !== "AbortError") console.error("No se pudo reproducir el audio de Historia:", error);
      actualizarBotonesHistoria();
    });
  });
});

// Cambia el icono cuando el audio realmente comienza o se detiene.
["play", "pause", "ended", "error", "emptied"].forEach(evento => {
  audioHistoria.addEventListener(evento, actualizarBotonesHistoria);
});

// REGISTRO
const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
  formRegistro.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mail = document.getElementById("mailRegistro").value;
    const contraseña = document.getElementById("contrasenaRegistro").value;
    const mensaje = document.getElementById("mensajeRegistro");

    mensaje.textContent = "Registrando cuenta...";

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, contraseña })
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

// INICIO DE SESIÓN
const formLogin = document.getElementById("formLogin");

if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mail = document.getElementById("mailLogin").value;
    const contraseña = document.getElementById("contrasenaLogin").value;
    const mensaje = document.getElementById("mensajeLogin");

    mensaje.textContent = "Comprobando datos...";

    try {
      const respuesta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, contraseña })
      });

      const datos = await respuesta.json();
      mensaje.textContent = datos.mensaje;

      if (respuesta.ok) {
        window.location.href = "/index.html";
      }
    } catch (error) {
      console.error(error);
      mensaje.textContent = "No se pudo conectar con el servidor.";
    }
  });
}

// PERFIL Y ESTADO DE SESIÓN
const authLinks = document.getElementById("authLinks");
const botonUsuario = document.getElementById("botonUsuario");
const panelUsuario = document.getElementById("panelUsuario");
const correoUsuario = document.getElementById("correoUsuario");
const formPerfil = document.getElementById("formPerfil");
const nombreUsuario = document.getElementById("nombreUsuario");
const mensajePerfil = document.getElementById("mensajePerfil");
const cerrarSesion = document.getElementById("cerrarSesion");

async function cargarSesion() {
  if (!authLinks || !botonUsuario) return;

  try {
    const respuesta = await fetch("/api/sesion");
    const datos = await respuesta.json();

    if (datos.autenticado) {
      authLinks.hidden = true;
      botonUsuario.hidden = false;
      correoUsuario.textContent = datos.usuario.mail;
      nombreUsuario.value = datos.usuario.nombre_usuario || "";
    } else {
      authLinks.hidden = false;
      botonUsuario.hidden = true;
      panelUsuario.hidden = true;
    }
  } catch (error) {
    console.error("Error al consultar la sesión:", error);
  }
}

// Abrir y cerrar el panel
if (botonUsuario && panelUsuario) {
  botonUsuario.addEventListener("click", () => {
    panelUsuario.hidden = !panelUsuario.hidden;
    botonUsuario.setAttribute(
      "aria-expanded",
      String(!panelUsuario.hidden)
    );
  });

  document.addEventListener("click", (event) => {
    const acciones = document.getElementById("authActions");

    if (acciones && !acciones.contains(event.target)) {
      panelUsuario.hidden = true;
      botonUsuario.setAttribute("aria-expanded", "false");
    }
  });
}

// Guardar nombre de usuario
if (formPerfil) {
  formPerfil.addEventListener("submit", async (event) => {
    event.preventDefault();

    mensajePerfil.textContent = "Guardando...";

    try {
      const respuesta = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario.value
        })
      });

      const datos = await respuesta.json();
      mensajePerfil.textContent = datos.mensaje;

      if (respuesta.ok) {
        nombreUsuario.value = datos.usuario.nombre_usuario;
      }
    } catch (error) {
      console.error(error);
      mensajePerfil.textContent = "No se pudo guardar el nombre.";
    }
  });
}

// Cerrar sesión
if (cerrarSesion) {
  cerrarSesion.addEventListener("click", async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/index.html";
    } catch (error) {
      console.error(error);
      mensajePerfil.textContent = "No se pudo cerrar la sesión.";
    }
  });
}

// Comprobar sesión al cargar la página
cargarSesion();
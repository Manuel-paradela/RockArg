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


document.addEventListener("DOMContentLoaded", () => {
  const authLinks = document.getElementById("authLinks");
  const botonUsuario = document.getElementById("botonUsuario");
  const panelUsuario = document.getElementById("panelUsuario");
  const correoUsuario = document.getElementById("correoUsuario");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const formPerfil = document.getElementById("formPerfil");
  const mensajePerfil = document.getElementById("mensajePerfil");
  const cerrarSesion = document.getElementById("cerrarSesion");
  if (!authLinks || !botonUsuario || !panelUsuario) return;
  // Comprueba si hay una sesión iniciada
  async function cargarSesion() {
    try {
      const respuesta = await fetch("/api/sesion");
      const datos = await respuesta.json();
      const iniciada = respuesta.ok && datos.logueado === true;
      authLinks.hidden = iniciada;
      botonUsuario.hidden = !iniciada;
      if (iniciada) {
        correoUsuario.textContent = datos.mail || "";
        if (nombreUsuario) {
          nombreUsuario.value = datos.nombre_usuario || "";
        }
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
  // Abre y cierra el panel al presionar la imagen
  botonUsuario.addEventListener("click", () => {
    panelUsuario.hidden = !panelUsuario.hidden;
    botonUsuario.setAttribute("aria-expanded", String(!panelUsuario.hidden));
  });
  // Cierra el panel al hacer clic fuera de él
  document.addEventListener("click", (event) => {
    if (!panelUsuario.contains(event.target) && !botonUsuario.contains(event.target)) {
      panelUsuario.hidden = true;
      botonUsuario.setAttribute("aria-expanded", "false");
    }
  });
  // Guarda el nombre de usuario en la base de datos
  if (formPerfil) {
    formPerfil.addEventListener("submit", async (event) => {
      event.preventDefault();
      mensajePerfil.textContent = "Guardando nombre...";
      try {
        const respuesta = await fetch("/api/perfil", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            nombre_usuario: nombreUsuario.value.trim()
          })
        });
        const datos = await respuesta.json();
        mensajePerfil.textContent = datos.mensaje || "No se pudo guardar el nombre.";
        if (respuesta.ok) {
          nombreUsuario.value = datos.nombre_usuario || nombreUsuario.value.trim();
        }
        if (respuesta.status === 401) {
          await cargarSesion();
        }
      } catch (error) {
        console.error(error);
        mensajePerfil.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }
  // Cierra la sesión
  if (cerrarSesion) {
    cerrarSesion.addEventListener("click", async () => {
      try {
        const respuesta = await fetch("/api/logout", {
          method: "POST"
        });
        if (respuesta.ok) {
          window.location.href = "/index.html";
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

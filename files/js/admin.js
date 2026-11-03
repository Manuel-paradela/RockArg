// Administración — html.js
function escapar(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Administración — http.js
async function pedir(url, opciones = {}) {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: {
      ...(opciones.headers || {}),
      "Content-Type": "application/json"
    }
  });

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(resultado.error || "Ocurrió un error");
  }

  return resultado;
}

// Administración — admin/formularios.js
function crearFormularios(datos) {
function nombreRegistro(tipo, registro) {
  if (tipo === "bandas") {
    return registro.nombre;
  }

  if (tipo === "discos") {
    return registro.Nombre_Album + " — " + registro.banda;
  }

  const disco = datos.discos.find(
    item => Number(item.ID) === Number(registro.album_id)
  );

  const nombreAlbum = registro.album ||
    (disco ? disco.Nombre_Album : "Sin álbum");

  return registro.cancion + " — " + nombreAlbum;
}

function opcionesRegistros(tipo, seleccionado) {
  return datos[tipo].map(registro => `
    <option value="${registro.ID}"
      ${String(registro.ID) === String(seleccionado) ? "selected" : ""}>
      ${escapar(nombreRegistro(tipo, registro))}
    </option>
  `).join("");
}

function opcionesBandas(seleccionado) {
  return datos.bandas.map(banda => `
    <option value="${banda.ID}"
      ${String(banda.ID) === String(seleccionado) ? "selected" : ""}>
      ${escapar(banda.nombre)}
    </option>
  `).join("");
}


function opcionesDiscos(seleccionado) {
  return datos.discos.map(disco => `
    <option value="${disco.ID}"
      ${Number(disco.ID) === Number(seleccionado) ? "selected" : ""}>
      ${escapar(disco.Nombre_Album)} — ${escapar(disco.banda)}
    </option>
  `).join("");
}


function camposFormulario(tipo, registro) {
  if (tipo === "bandas") {
    return `
      <label>
        Nombre de la banda o artista
        <input name="nombre" required
          value="${escapar(registro?.nombre)}">
      </label>
    `;
  }

  if (tipo === "discos") {
    return `
      <label>
        Nombre del álbum
        <input name="nombre" required
          value="${escapar(registro?.Nombre_Album)}">
      </label>

      <label>
        Año de lanzamiento
        <input name="anio" type="number" min="1" step="1" required
          value="${escapar(registro?.año)}">
      </label>

      <label>
        Banda o artista
        <select name="bandaId" required>
          ${opcionesBandas(registro?.banda_id)}
        </select>
      </label>

      <label>
        Archivo de imagen de portada
        <input name="imagenes" required
          placeholder="ejemplo.jpg"
          value="${escapar(registro?.imagenes)}">
      </label>
    `;
  }

  return `
    <label>
      Nombre de la canción
      <input name="nombre" required
        value="${escapar(registro?.cancion)}">
    </label>

    <label>
      Álbum
      <select name="albumId" required>
        ${opcionesDiscos(registro?.album_id)}
      </select>
    </label>

    <label>
      Duración en segundos
      <input name="duracion" type="number" min="0" step="1" required
        value="${escapar(registro?.duracion)}">
    </label>

    <label>
      Nombre del archivo de audio (opcional)
      <input name="archivos"
        placeholder="ejemplo.mp3"
        value="${escapar(registro?.archivos)}">
    </label>
  `;
}


return { opcionesRegistros, camposFormulario };
}

// Administración — admin/index.js
const panelAdmin = document.getElementById("panelAdmin");
const mensajePrincipal = document.getElementById("mensajePrincipal");
const tipoEntidad = document.getElementById("tipoEntidad");
const formularioAdmin = document.getElementById("formularioAdmin");

let accionActual = "";
let datos = {
  bandas: [],
  discos: [],
  canciones: []
};

async function iniciar() {
  try {
    const permisos = await pedir("/api/admin/verificar");

    if (!permisos.admin) {
      mensajePrincipal.textContent =
        "Acceso denegado. Iniciá sesión con un usuario administrador.";
      return;
    }

    mensajePrincipal.textContent = "";
    panelAdmin.hidden = false;

    await cargarDatos();
  } catch (error) {
    mensajePrincipal.textContent = error.message;
  }
}

async function cargarDatos() {
  datos = {
    bandas: await pedir("/api/admin/bandas"),
    discos: await pedir("/api/admin/discos"),
    canciones: await pedir("/api/admin/canciones")
  };
}


function renderFormulario() {
  const tipo = tipoEntidad.value;
  const registros = datos[tipo];
  const { opcionesRegistros, camposFormulario } = crearFormularios(datos);

  formularioAdmin.hidden = false;

  if (accionActual !== "agregar" && registros.length === 0) {
    formularioAdmin.innerHTML =
      "<p>No hay registros disponibles para esta operación.</p>";
    return;
  }

  if (accionActual === "agregar" &&
      tipo === "discos" && datos.bandas.length === 0) {
    formularioAdmin.innerHTML =
      "<p>Primero agregá una banda o artista.</p>";
    return;
  }

  if (accionActual === "agregar" &&
      tipo === "canciones" && datos.discos.length === 0) {
    formularioAdmin.innerHTML =
      "<p>Primero agregá una banda y después un álbum.</p>";
    return;
  }

  const selectorAnterior = document.getElementById("registroSeleccionado");
  const idAnterior = selectorAnterior
    ? selectorAnterior.value
    : registros[0]?.ID;

  const registro = accionActual === "agregar"
    ? null
    : registros.find(item => String(item.ID) === String(idAnterior))
      || registros[0];

  const titulo = accionActual === "agregar"
    ? "Agregar"
    : accionActual === "modificar"
      ? "Modificar"
      : "Borrar";

  let html = `<h2>${titulo} ${
    tipoEntidad.options[tipoEntidad.selectedIndex].text.toLowerCase()
  }</h2>`;

  if (accionActual !== "agregar") {
    html += `
      <label for="registroSeleccionado">Seleccioná el registro</label>
      <select id="registroSeleccionado">
        ${opcionesRegistros(tipo, registro.ID)}
      </select>
    `;
  }

  html += `<form id="formAdmin">`;

  if (accionActual === "borrar") {
    html += `
      <p>Se eliminará el registro seleccionado de la base de datos.</p>
      <button type="submit" class="borrar guardar">
        Confirmar borrado
      </button>
    `;
  } else {
    html += `
      <div class="campos">
        ${camposFormulario(tipo, registro)}
      </div>

      <button type="submit"
        class="${accionActual === "agregar" ? "agregar" : "modificar"} guardar">
        ${accionActual === "agregar" ? "Guardar nuevo registro" : "Guardar cambios"}
      </button>
    `;
  }

  html += `<p id="mensajeCrud" class="mensaje"></p></form>`;

  formularioAdmin.innerHTML = html;

  const selector = document.getElementById("registroSeleccionado");

  if (selector) {
    selector.addEventListener("change", renderFormulario);
  }

  document.getElementById("formAdmin")
    .addEventListener("submit", procesarFormulario);
}

async function procesarFormulario(evento) {
  evento.preventDefault();

  const tipo = tipoEntidad.value;
  const selector = document.getElementById("registroSeleccionado");
  const id = selector ? selector.value : null;
  const mensaje = document.getElementById("mensajeCrud");

  try {
    let textoMensaje;

    if (accionActual === "borrar") {
      if (!confirm("¿Seguro que querés borrar este registro?")) {
        return;
      }

      await pedir(`/api/admin/${tipo}/${id}`, {
        method: "DELETE"
      });

      textoMensaje = "Registro eliminado correctamente.";
    } else {
      const formulario = evento.target;

      const datosFormulario = Object.fromEntries(
        new FormData(formulario).entries()
      );

      if (tipo === "discos") {
        datosFormulario.anio = Number(datosFormulario.anio);
        datosFormulario.bandaId = Number(datosFormulario.bandaId);
      }

      if (tipo === "canciones") {
        datosFormulario.albumId = Number(datosFormulario.albumId);
        datosFormulario.duracion = Number(datosFormulario.duracion);
      }

      const esAgregar = accionActual === "agregar";
      const url = esAgregar
        ? `/api/admin/${tipo}`
        : `/api/admin/${tipo}/${id}`;

      await pedir(url, {
        method: esAgregar ? "POST" : "PUT",
        body: JSON.stringify(datosFormulario)
      });

      textoMensaje = esAgregar
        ? "Registro agregado correctamente."
        : "Registro modificado correctamente.";
    }

    await cargarDatos();
    renderFormulario();

    const mensajeNuevo = document.getElementById("mensajeCrud");

    if (mensajeNuevo) {
      mensajeNuevo.textContent = textoMensaje;
    }
  } catch (error) {
    const mensajeActual = document.getElementById("mensajeCrud");

    if (mensajeActual) {
      mensajeActual.textContent = error.message;
    } else {
      mensajePrincipal.textContent = error.message;
    }
  }
}

document.getElementById("btnAgregar").addEventListener("click", () => {
  accionActual = "agregar";
  renderFormulario();
});

document.getElementById("btnModificar").addEventListener("click", () => {
  accionActual = "modificar";
  renderFormulario();
});

document.getElementById("btnBorrar").addEventListener("click", () => {
  accionActual = "borrar";
  renderFormulario();
});

tipoEntidad.addEventListener("change", () => {
  if (accionActual) {
    renderFormulario();
  } else {
    formularioAdmin.hidden = true;
  }
});

iniciar();

// Alta de administradores. El servidor vuelve a comprobar los permisos en cada petición.
const botonAbrirAdministradores = document.getElementById("btnAbrirAdministradores");
const formAdministrador = document.getElementById("formAdministrador");
const selectorAdministrador = document.getElementById("usuarioAdministrador");
const botonGuardarAdministrador = document.getElementById("btnGuardarAdministrador");
const mensajeAdministrador = document.getElementById("mensajeAdministrador");
let guardandoAdministrador = false;

async function cargarUsuariosAdministradores() {
  selectorAdministrador.disabled = true;
  botonGuardarAdministrador.disabled = true;
  mensajeAdministrador.textContent = "Cargando usuarios…";
  selectorAdministrador.replaceChildren(new Option("Seleccioná un usuario", ""));
  try {
    const usuarios = await pedir("/api/admin/usuarios", { cache: "no-store" });
    usuarios.forEach(usuario => {
      const etiqueta = `${usuario.usuario || usuario.nombre || "Usuario"} (ID ${usuario.ID})${usuario.admin ? " — Ya es administrador" : ""}`;
      const opcion = new Option(etiqueta, usuario.ID);
      opcion.disabled = Boolean(usuario.admin);
      selectorAdministrador.append(opcion);
    });
    selectorAdministrador.disabled = !usuarios.some(usuario => !usuario.admin);
    mensajeAdministrador.textContent = selectorAdministrador.disabled
      ? "Todos los usuarios registrados ya son administradores." : "";
  } catch (error) {
    mensajeAdministrador.textContent = error.message;
  }
}

botonAbrirAdministradores.addEventListener("click", () => {
  if (guardandoAdministrador) return;
  formAdministrador.hidden = !formAdministrador.hidden;
  botonAbrirAdministradores.setAttribute("aria-expanded", String(!formAdministrador.hidden));
  if (!formAdministrador.hidden) cargarUsuariosAdministradores();
});

selectorAdministrador.addEventListener("change", () => {
  botonGuardarAdministrador.disabled = !selectorAdministrador.value || guardandoAdministrador;
});

formAdministrador.addEventListener("submit", async evento => {
  evento.preventDefault();
  if (guardandoAdministrador || !selectorAdministrador.value) return;
  guardandoAdministrador = true;
  selectorAdministrador.disabled = true;
  botonGuardarAdministrador.disabled = true;
  botonAbrirAdministradores.disabled = true;
  mensajeAdministrador.textContent = "Agregando administrador…";
  try {
    const resultado = await pedir("/api/admin/administradores", {
      method: "POST", body: JSON.stringify({ idUsuario: Number(selectorAdministrador.value) })
    });
    await cargarUsuariosAdministradores();
    mensajeAdministrador.textContent = resultado.mensaje;
  } catch (error) {
    selectorAdministrador.disabled = false;
    mensajeAdministrador.textContent = error.message;
  } finally {
    guardandoAdministrador = false;
    botonAbrirAdministradores.disabled = false;
    botonGuardarAdministrador.disabled = !selectorAdministrador.value;
  }
});

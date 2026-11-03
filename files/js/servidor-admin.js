//importar el modulo expres
const express = require("express");
const db = require("./servidor-database.js");
const { sesiones } = require("./servidor-sesiones.js");
const router = express.Router();

function obtenerIdAdmin(req) {
  const cookies = req.headers.cookie || "";
  const coincidencia = cookies.match(/(?:^|;\s*)rockarg_session=([^;]+)/);

  if (!coincidencia) return null;

  let token = coincidencia[1];

  try {
    token = decodeURIComponent(token);
  } catch (error) {
    return null;
  }

  const sesion = sesiones.get(token);

  if (!sesion) return null;

  const expiracion = sesion.expira ?? sesion.expiresAt;

  if (expiracion && Number(expiracion) < Date.now()) {
    sesiones.delete(token);
    return null;
  }

  const idUsuario = sesion.id ?? sesion.userId ?? sesion.Id;

  if (!idUsuario) return null;

  const usuario = db.prepare(
    "SELECT ID FROM Usuarios WHERE ID = ?"
  ).get(idUsuario);

  if (!usuario) return null;

  const admin = db.prepare(
    "SELECT ID FROM Usuarios_admin WHERE id_usuario = ?"
  ).get(usuario.ID);

  return admin ? usuario.ID : null;
}

function siguienteId(tabla) {
  return db.prepare(
    `SELECT COALESCE(MAX(ID), 0) + 1 AS nuevoID FROM ${tabla}`
  ).get().nuevoID;
}

function obtenerTipoAdmin(tipo) {
  const tipos = ["bandas", "discos", "canciones"];
  return tipos.includes(tipo) ? tipo : null;
}

function responderErrorAdmin(res, error, mensaje) {
  console.error("Error en el panel administrador:", error);
  return res.status(400).json({ error: error.message });
}

// Verificar si el usuario es administrador.
router.get("/api/admin/verificar", (req, res) => {
  res.json({ admin: obtenerIdAdmin(req) !== null });
});

// Obtener registros.
router.get("/api/admin/:tipo", (req, res) => {
  if (!obtenerIdAdmin(req)) {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  const tipo = obtenerTipoAdmin(req.params.tipo);

  if (!tipo) {
    return res.status(404).json({ error: "Tipo de registro inválido" });
  }

  try {
    let resultado;

    if (tipo === "bandas") {
      resultado = db.prepare(`
        SELECT ID, nombre
        FROM "bandas/solista"
        ORDER BY nombre
      `).all();
    }

    if (tipo === "discos") {
      resultado = db.prepare(`
        SELECT
          d.ID,
          d.Nombre_Album,
          d.año,
          d.imagenes,
          d."banda/artista" AS banda_id,
          b.nombre AS banda
        FROM discos d
        JOIN "bandas/solista" b
          ON d."banda/artista" = b.ID
        ORDER BY d.Nombre_Album
      `).all();
    }


if (tipo === "canciones") {
  resultado = db.prepare(`
    SELECT
      c.ID,
      c.cancion,
      c.album AS album_id,
      c.URLS,
      c.duracion,
      c.archivos,
      d.Nombre_Album AS album
    FROM todas_las_canciones c
    LEFT JOIN discos d
      ON CAST(c.album AS INTEGER) = CAST(d.ID AS INTEGER)
    ORDER BY c.cancion
  `).all();
}


    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudieron cargar los registros"
    });
  }
});

// AGREGAR
router.post("/api/admin/:tipo", (req, res) => {
  if (!obtenerIdAdmin(req)) {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  const tipo = obtenerTipoAdmin(req.params.tipo);

  if (!tipo) {
    return res.status(404).json({ error: "Tipo de registro inválido" });
  }

  try {
    const datos = req.body;
//bandas
    if (tipo === "bandas") {
      const nombre = String(datos.nombre || "").trim();

      if (!nombre) {
        return res.status(400).json({
          error: "Ingresá el nombre de la banda"
        });
      }

      const id = siguienteId('"bandas/solista"');

      db.prepare(`
        INSERT INTO "bandas/solista" (ID, nombre)
        VALUES (?, ?)
      `).run(id, nombre);

      return res.status(201).json({
        mensaje: "Banda agregada",
        ID: id
      });
    }
    //discos
    if (tipo === "discos") {
      const nombre = String(datos.nombre || "").trim();
      const anio = Number(datos.anio);
      const bandaId = Number(datos.bandaId);
      const imagenes = String(datos.imagenes || "").trim();

      if (
        !nombre ||
        !imagenes ||
        !Number.isInteger(anio) ||
        anio < 1 ||
        !Number.isInteger(bandaId) ||
        bandaId < 1
      ) {
        return res.status(400).json({
          error: "Completá correctamente todos los campos del álbum"
        });
      }

      const banda = db.prepare(
        'SELECT ID FROM "bandas/solista" WHERE ID = ?'
      ).get(bandaId);

      if (!banda) {
        return res.status(400).json({
          error: "La banda seleccionada no existe"
        });
      }

      const id = siguienteId("discos");

      db.prepare(`
        INSERT INTO discos
          (ID, Nombre_Album, año, "banda/artista", imagenes)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, nombre, anio, bandaId, imagenes);

      return res.status(201).json({
        mensaje: "Álbum agregado",
        ID: id
      });
    }
//canciones

    if (tipo === "canciones") {
      const nombre = String(datos.nombre || "").trim();
      const albumId = String(datos.albumId || "").trim();
      const duracion = Number(datos.duracion);
      const archivos = String(datos.archivos || "").trim();

      if (
        !nombre ||
        !/^\d+$/.test(albumId) ||
        !Number.isInteger(duracion) ||
        duracion < 0
      ) {
        return res.status(400).json({
          error: "Completá correctamente los datos de la canción"
        });
      }

      const album = db.prepare(`
        SELECT ID
        FROM discos
        WHERE CAST(ID AS INTEGER) = CAST(? AS INTEGER)
      `).get(albumId);

      if (!album) {
        return res.status(400).json({
          error: "Primero debe existir el álbum seleccionado"
        });
      }

      const id = siguienteId("todas_las_canciones");

      db.prepare(`
        INSERT INTO todas_las_canciones
          (ID, cancion, album, URLS, duracion, archivos)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, nombre, album.ID, "", duracion, archivos || null);

      return res.status(201).json({
        mensaje: "Canción agregada",
        ID: id
      });
    }

  } catch (error) {
    return responderErrorAdmin(
      res,
      error,
      "No se pudo agregar el registro. Revisá los datos ingresados."
    );
  }
});

// MODIFICAR (en CRUD,)
router.put("/api/admin/:tipo/:id", (req, res) => {
  if (!obtenerIdAdmin(req)) {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  const tipo = obtenerTipoAdmin(req.params.tipo);
  const id = Number(req.params.id);

  if (!tipo || !Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Registro inválido" });
  }

  try {
    const datos = req.body;
    let resultado;

    if (tipo === "bandas") {
      const nombre = String(datos.nombre || "").trim();

      if (!nombre) {
        return res.status(400).json({
          error: "Ingresá el nombre de la banda"
        });
      }

      resultado = db.prepare(`
        UPDATE "bandas/solista"
        SET nombre = ?
        WHERE ID = ?
      `).run(nombre, id);
    }

    if (tipo === "discos") {
      const nombre = String(datos.nombre || "").trim();
      const anio = Number(datos.anio);
      const bandaId = Number(datos.bandaId);
      const imagenes = String(datos.imagenes || "").trim();

      if (
        !nombre ||
        !imagenes ||
        !Number.isInteger(anio) ||
        anio < 1 ||
        !Number.isInteger(bandaId) ||
        bandaId < 1
      ) {
        return res.status(400).json({
          error: "Completá correctamente todos los campos del álbum"
        });
      }

      const banda = db.prepare(
        'SELECT ID FROM "bandas/solista" WHERE ID = ?'
      ).get(bandaId);

      if (!banda) {
        return res.status(400).json({
          error: "La banda seleccionada no existe"
        });
      }

      resultado = db.prepare(`
  UPDATE discos
  SET Nombre_Album = ?,
      año = ?,
      "banda/artista" = ?,
      imagenes = ?
  WHERE CAST(ID AS INTEGER) = CAST(? AS INTEGER)
`).run(nombre, anio, banda.ID, imagenes, id);
    }

    if (tipo === "canciones") {
      const nombre = String(datos.nombre || "").trim();
      const albumId = String(datos.albumId || "").trim();
      const duracion = Number(datos.duracion);
      const archivos = String(datos.archivos || "").trim();

      if (
        !nombre ||
        !/^\d+$/.test(albumId) ||
        !Number.isInteger(duracion) ||
        duracion < 0
      ) {
        return res.status(400).json({
          error: "Completá correctamente los datos de la canción"
        });
      }

      const album = db.prepare(`
        SELECT ID
        FROM discos
        WHERE CAST(ID AS INTEGER) = CAST(? AS INTEGER)
      `).get(albumId);

      if (!album) {
        return res.status(400).json({
          error: "El álbum seleccionado no existe"
        });
      }

      resultado = db.prepare(`
        UPDATE todas_las_canciones
        SET cancion = ?,
            album = ?,
            duracion = ?,
            archivos = ?
        WHERE ID = ?
      `).run(nombre, album.ID, duracion, archivos || null, id);
    }


    if (!resultado || resultado.changes === 0) {
      return res.status(404).json({
        error: "No se encontró el registro"
      });
    }

    res.json({ mensaje: "Registro modificado correctamente" });
  } catch (error) {
    return responderErrorAdmin(
      res,
      error,
      "No se pudo modificar el registro. Revisá los datos ingresados."
    );
  }
});

// BORRAR
router.delete("/api/admin/:tipo/:id", (req, res) => {
  if (!obtenerIdAdmin(req)) {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  const tipo = obtenerTipoAdmin(req.params.tipo);
  const id = Number(req.params.id);

  if (!tipo || !Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Registro inválido" });
  }

  try {
    let resultado;

    if (tipo === "canciones") {
      resultado = db.prepare(
        "DELETE FROM todas_las_canciones WHERE ID = ?"
      ).run(id);
    }

    if (tipo === "discos") {
      const canciones = db.prepare(`
        SELECT COUNT(*) AS cantidad
        FROM todas_las_canciones
        WHERE album = ?
      `).get(id).cantidad;

      if (canciones > 0) {
        return res.status(400).json({
          error: "No se puede borrar el álbum porque tiene canciones asociadas"
        });
      }

      resultado = db.prepare(
        "DELETE FROM discos WHERE ID = ?"
      ).run(id);
    }

    if (tipo === "bandas") {
      const discos = db.prepare(`
        SELECT COUNT(*) AS cantidad
        FROM discos
        WHERE "banda/artista" = ?
      `).get(id).cantidad;

      if (discos > 0) {
        return res.status(400).json({
          error: "No se puede borrar la banda porque tiene álbumes asociados"
        });
      }

      resultado = db.prepare(
        'DELETE FROM "bandas/solista" WHERE ID = ?'
      ).run(id);
    }

    if (!resultado || resultado.changes === 0) {
      return res.status(404).json({
        error: "No se encontró el registro"
      });
    }

    res.json({ mensaje: "Registro eliminado correctamente" });
  } catch (error) {
    return responderErrorAdmin(
      res,
      error,
      "No se pudo eliminar el registro."
    );
  }
});



// ======================================================

module.exports = router;

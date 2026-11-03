// Rutas y lógica de RockArg. Todas comparten la conexión SQLite y las mismas sesiones.
const express = require("express");
const crypto = require("crypto");

function registrarRutas(app, db) {
  const sesiones = new Map();

  function obtenerToken(req) {
    const cookies = (req.headers.cookie || "").split(";");
    const cookie = cookies.find(c => c.trim().startsWith("rockarg_session="));
    return cookie ? cookie.trim().slice("rockarg_session=".length) : null;
  }

  function obtenerSesion(req) {
    const token = obtenerToken(req);
    if (!token) return null;
    const sesion = sesiones.get(token);
    if (!sesion) return null;
    if (sesion.expira <= Date.now()) {
      sesiones.delete(token);
      return null;
    }
    return sesion;
  }

  // Agrupa las operaciones de catalogo.
  function crearRutasCatalogo() {
    const router = express.Router();

    router.get("/api/bandas", (req, res) => {
      try {

        const resultado = db.prepare(`SELECT * FROM "bandas/solista"`).all();
        res.json(resultado);
      } catch(error) {
        console.error(error);
        res.status(500).json({error: "Error al obtener las bandas"});
      }
    });


    // ======================================================
    // DISCOS
    // ======================================================


    router.get("/api/discos", (req, res) => {
      try {
        const resultado = db.prepare(`
          SELECT
            discos.ID,
            discos.Nombre_Album,
            discos.año,
            discos.imagenes,
            "bandas/solista".nombre AS banda
          FROM discos
          JOIN "bandas/solista"
            ON discos."banda/artista" = "bandas/solista".ID
        `).all();

        res.json(resultado);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error: "Error al obtener los discos"
        });
      }
    });


    // ======================================================
    // CANCIONES
    // ======================================================

    router.get("/api/canciones", (req, res) => {
      try {

        const resultado = db.prepare(`
          SELECT
            todas_las_canciones.ID,
            todas_las_canciones.cancion,
            todas_las_canciones.URLS,
            todas_las_canciones.duracion,
            todas_las_canciones.archivos,

            discos.Nombre_Album,
            discos.imagenes,

            "bandas/solista".nombre AS banda

          FROM todas_las_canciones

          JOIN discos
            ON todas_las_canciones.album = CAST(discos.ID AS INTEGER)

          JOIN "bandas/solista"
            ON discos."banda/artista" = "bandas/solista".ID
        `).all();

        res.json(resultado);

      } catch(error) {

        console.error(error);

        res.status(500).json({
          error: "Error al obtener las canciones"
        });

      }
    });


    // ======================================================
    // BUSCADOR DE LA API
    // ======================================================

    router.get("/api/buscar", (req, res) => {
      try {

        const q = `%${req.query.q || ""}%`;

        const resultado = db.prepare(`
          SELECT
            todas_las_canciones.ID,
            todas_las_canciones.cancion,
            todas_las_canciones.URLS,
            todas_las_canciones.duracion,
            todas_las_canciones.archivos,

            discos.Nombre_Album,
            discos.imagenes,

            "bandas/solista".nombre AS banda

          FROM todas_las_canciones

          JOIN discos
            ON todas_las_canciones.album = CAST(discos.ID AS INTEGER)

          JOIN "bandas/solista"
            ON discos."banda/artista" = "bandas/solista".ID

          WHERE
            todas_las_canciones.cancion LIKE ?
            OR discos.Nombre_Album LIKE ?
            OR "bandas/solista".nombre LIKE ?
        `).all(q, q, q);

        res.json(resultado);

      } catch(error) {

        console.error(error);

        res.status(500).json({
          error: "Error al buscar canciones"
        });

      }
    });
    return router;
  }

  // Agrupa las operaciones de cuentas.
  function crearRutasCuentas() {
    const router = express.Router();

    /* REGISTRO */
    router.post("/api/registro", (req, res) => {
      try {
        const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
        const usuario = typeof req.body?.usuario === "string" ? req.body.usuario.trim() : "";
        const contraseña = typeof req.body?.contraseña === "string" ? req.body.contraseña : "";

        if (!nombre || !usuario || !contraseña) {
          return res.status(400).json({ mensaje: "Completá todos los campos." });
        }
        if (nombre.length > 50) {
          return res.status(400).json({ mensaje: "El nombre no puede superar los 50 caracteres." });
        }
        if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(usuario)) {
          return res.status(400).json({
            mensaje: "El usuario debe tener entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo."
          });
        }
        if (contraseña.length < 4 || contraseña.length > 128) {
          return res.status(400).json({ mensaje: "La contraseña debe tener entre 4 y 128 caracteres." });
        }

        const existente = db.prepare(
          "SELECT ID FROM Usuarios WHERE usuario = ? COLLATE NOCASE"
        ).get(usuario);

        if (existente) {
          return res.status(409).json({ mensaje: "Ese nombre de usuario ya existe." });
        }

        // La columna mail se conserva por compatibilidad con la tabla anterior.
        // En las cuentas nuevas guarda el nombre de usuario, no un correo.
        db.prepare(`
          INSERT INTO Usuarios (mail, "contraseña", nombre_usuario, nombre, usuario, me_gusta)
          VALUES (?, ?, ?, ?, ?, '[]')
        `).run(usuario, contraseña, usuario, nombre, usuario);

        res.status(201).json({
          ok: true,
          mensaje: "Cuenta creada correctamente. Ya podés iniciar sesión."
        });
      } catch (error) {
        console.error(error);
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return res.status(409).json({ mensaje: "Ese nombre de usuario ya existe." });
        }
        res.status(500).json({ mensaje: "No se pudo registrar la cuenta." });
      }
    });

    /* INICIO DE SESIÓN */
    router.post("/api/login", (req, res) => {
      try {
        const usuario = typeof req.body?.usuario === "string" ? req.body.usuario.trim() : "";
        const contraseña = typeof req.body?.contraseña === "string" ? req.body.contraseña : "";

        if (!usuario || !contraseña) {
          return res.status(400).json({ mensaje: "Completá el usuario y la contraseña." });
        }

        const cuenta = db.prepare(`
          SELECT ID, nombre, usuario
          FROM Usuarios
          WHERE usuario = ? COLLATE NOCASE AND "contraseña" = ?
        `).get(usuario, contraseña);

        if (!cuenta) {
          return res.status(401).json({ mensaje: "El usuario o la contraseña son incorrectos." });
        }

        const token = crypto.randomBytes(32).toString("hex");
        sesiones.set(token, {
          id: cuenta.ID,
          expira: Date.now() + 24 * 60 * 60 * 1000
        });

        res.setHeader(
          "Set-Cookie",
          "rockarg_session=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400"
        );

        res.json({
          ok: true,
          mensaje: "Inicio de sesión correcto."
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "No se pudo iniciar sesión." });
      }
    });

    /* CONSULTAR SESIÓN */
    router.get("/api/sesion", (req, res) => {
      const sesion = obtenerSesion(req);
      if (!sesion) return res.json({ logueado: false });

      const cuenta = db.prepare(
        "SELECT nombre, usuario FROM Usuarios WHERE ID = ?"
      ).get(sesion.id);

      if (!cuenta) return res.json({ logueado: false });

      res.json({
        logueado: true,
        nombre: cuenta.nombre || "",
        usuario: cuenta.usuario || ""
      });
    });

    /* CAMBIAR NOMBRE DE USUARIO */
    router.post("/api/perfil", (req, res) => {
      try {
        const sesion = obtenerSesion(req);
        if (!sesion) {
          return res.status(401).json({ mensaje: "Iniciá sesión nuevamente." });
        }

        const usuario = typeof req.body?.usuario === "string" ? req.body.usuario.trim() : "";

        if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(usuario)) {
          return res.status(400).json({
            mensaje: "El usuario debe tener entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo."
          });
        }

        const existente = db.prepare(
          "SELECT ID FROM Usuarios WHERE usuario = ? COLLATE NOCASE AND ID != ?"
        ).get(usuario, sesion.id);

        if (existente) {
          return res.status(409).json({ mensaje: "Ese nombre de usuario ya está en uso." });
        }

        db.prepare(`
          UPDATE Usuarios
          SET usuario = ?, mail = ?, nombre_usuario = ?
          WHERE ID = ?
        `).run(usuario, usuario, usuario, sesion.id);

        res.json({
          mensaje: "Nombre de usuario guardado correctamente.",
          usuario: usuario
        });
      } catch (error) {
        console.error(error);
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return res.status(409).json({ mensaje: "Ese nombre de usuario ya está en uso." });
        }
        res.status(500).json({ mensaje: "No se pudo guardar el usuario." });
      }
    });

    /* CERRAR SESIÓN */
    router.post("/api/logout", (req, res) => {
      const token = obtenerToken(req);
      if (token) sesiones.delete(token);

      res.setHeader(
        "Set-Cookie",
        "rockarg_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
      );

      res.json({ ok: true, mensaje: "Sesión cerrada correctamente." });
    });




    //=====================================================
    //Usuario Admin
    //=====================================================
    return router;
  }

  // Agrupa las operaciones de megusta.
  function crearRutasMeGusta() {
    const router = express.Router();

    function leerLista(valor) {
      if (valor == null || valor.trim() === "") return [];
      const lista = JSON.parse(valor);
      if (!Array.isArray(lista) || !lista.every(id => Number.isSafeInteger(Number(id)) && Number(id) > 0)) {
        throw new Error("La lista de me gusta guardada no es válida.");
      }
      return [...new Set(lista.map(Number))];
    }

    router.use((req, res, next) => {
      const sesion = obtenerSesion(req);
      if (!sesion || !db.prepare("SELECT ID FROM Usuarios WHERE ID = ?").get(sesion.id)) {
        return res.status(401).json({ mensaje: "Iniciá sesión para guardar tus me gusta." });
      }
      res.setHeader("Cache-Control", "no-store");
      req.usuarioMeGusta = sesion.id;
      next();
    });

    router.get("/", (req, res) => {
      try {
        const cuenta = db.prepare("SELECT me_gusta FROM Usuarios WHERE ID = ?").get(req.usuarioMeGusta);
        res.json({ me_gusta: leerLista(cuenta.me_gusta) });
      } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "No se pudieron cargar tus me gusta." });
      }
    });

    // La transacción evita perder cambios de otras pestañas. El estado explícito evita duplicados al reintentar.
    const guardar = db.transaction((usuarioId, cancionId, marcado) => {
      const cuenta = db.prepare("SELECT me_gusta FROM Usuarios WHERE ID = ?").get(usuarioId);
      const lista = new Set(leerLista(cuenta.me_gusta));
      if (marcado) lista.add(cancionId);
      else lista.delete(cancionId);
      const resultado = [...lista];
      db.prepare("UPDATE Usuarios SET me_gusta = ? WHERE ID = ?").run(JSON.stringify(resultado), usuarioId);
      return resultado;
    });

    router.put("/:id", (req, res) => {
      const id = Number(req.params.id);
      if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id < 1 || typeof req.body?.me_gusta !== "boolean") {
        return res.status(400).json({ mensaje: "La canción y el estado del me gusta no son válidos." });
      }
      try {
        if (!db.prepare("SELECT ID FROM todas_las_canciones WHERE ID = ?").get(id)) {
          return res.status(404).json({ mensaje: "La canción no existe." });
        }
        const lista = guardar.immediate(req.usuarioMeGusta, id, req.body.me_gusta);
        res.json({ me_gusta: lista });
      } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "No se pudo guardar el me gusta. Intentá nuevamente." });
      }
    });
    return router;
  }

  // Agrupa las operaciones de administracion.
  function crearRutasAdministracion() {
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

    // discos.ID es TEXT: se compara numéricamente para que 62 sea mayor que 9.
    function siguienteId(tabla) {
      return db.prepare(
        `SELECT COALESCE(MAX(CAST(ID AS INTEGER)), 0) + 1 AS nuevoID FROM ${tabla}`
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

    // Estas rutas específicas van antes de /:tipo para que no se confundan con el CRUD.
    router.get("/api/admin/usuarios", (req, res) => {
      if (!obtenerIdAdmin(req)) return res.status(403).json({ error: "Acceso denegado" });
      try {
        const usuarios = db.prepare(`
          SELECT u.ID, u.nombre, u.usuario,
            EXISTS(SELECT 1 FROM Usuarios_admin a WHERE a.id_usuario = u.ID) AS admin
          FROM Usuarios u
          ORDER BY u.usuario COLLATE NOCASE, u.ID
        `).all();
        res.setHeader("Cache-Control", "no-store");
        res.json(usuarios);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudieron cargar los usuarios" });
      }
    });

    // Comprueba e inserta en la misma transacción para evitar administradores duplicados.
    const otorgarAdministrador = db.transaction(idUsuario => {
      if (!db.prepare("SELECT ID FROM Usuarios WHERE ID = ?").get(idUsuario)) return null;
      if (db.prepare("SELECT ID FROM Usuarios_admin WHERE id_usuario = ?").get(idUsuario)) {
        return { nuevo: false };
      }
      const id = siguienteId("Usuarios_admin");
      db.prepare("INSERT INTO Usuarios_admin (ID, id_usuario) VALUES (?, ?)").run(id, idUsuario);
      return { nuevo: true };
    });

    router.post("/api/admin/administradores", (req, res) => {
      if (!obtenerIdAdmin(req)) return res.status(403).json({ error: "Acceso denegado" });
      const idUsuario = Number(req.body?.idUsuario);
      if (!Number.isSafeInteger(idUsuario) || idUsuario < 1) {
        return res.status(400).json({ error: "Seleccioná un usuario válido" });
      }
      try {
        const resultado = otorgarAdministrador.immediate(idUsuario);
        if (!resultado) return res.status(404).json({ error: "El usuario seleccionado ya no existe" });
        res.status(resultado.nuevo ? 201 : 200).json({
          mensaje: resultado.nuevo ? "Usuario agregado como administrador." : "Ese usuario ya es administrador."
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo agregar al administrador" });
      }
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
          `).run(String(id), nombre, anio, bandaId, imagenes);

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
    return router;
  }

  app.use(crearRutasCatalogo());
  app.use(crearRutasCuentas());
  app.use("/api/me-gusta", crearRutasMeGusta());
  app.use(crearRutasAdministracion());
}

module.exports = { registrarRutas };

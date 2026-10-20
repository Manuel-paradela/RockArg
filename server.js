//1) reinstalar el modulo
//2) abrir simbolo del sistema cmd
//3) pushd "\\MUTISIA\Info5A\INFORMATICA-RODRI\paradela\Bases de datos\proyecto final"
//4) node server.js
// ======================================================
// VARIABLES DE ENTORNO
// ======================================================

require("dotenv").config();


// ======================================================
// MÓDULOS
// ======================================================

const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());



// ======================================================
// CONFIGURACIÓN
// ======================================================

const PORT = process.env.PORT || 3000;


// BASE DE DATOS
const rutaDB = path.join(__dirname, "Canciones.db");
console.log("BASE DE DATOS:");
console.log(rutaDB);
const db = new Database(rutaDB);
// ======================================================
// COMPROBAR BASE DE DATOS
// ======================================================

const cantidad = db
  .prepare(`
    SELECT COUNT(*) AS cantidad
    FROM todas_las_canciones
  `)
  .get();

console.log("CANTIDAD DE CANCIONES:");
console.log(cantidad.cantidad);


// ======================================================
// ARCHIVOS ESTÁTICOS
// ======================================================

// Todo lo que esté dentro de /files puede abrirse
// directamente desde localhost:3000.
//
// Ejemplo:
//
// files/canciones/de_musica_ligera.mp3
//
// queda:
//
// http://localhost:3000/canciones/de_musica_ligera.mp3

app.use(
  express.static(
    path.join(__dirname, "files")
  )
);


// ======================================================
// BANDAS
// ======================================================

app.get("/api/bandas", (req, res) => {
  try {

    const resultado = db.prepare(`
      SELECT *
      FROM "bandas/solista"
    `).all();

    res.json(resultado);

  } catch(error) {

    console.error(error);

    res.status(500).json({
      error: "Error al obtener las bandas"
    });

  }
});


// ======================================================
// DISCOS
// ======================================================

app.get("/api/discos", (req, res) => {
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

  } catch(error) {

    console.error(error);

    res.status(500).json({
      error: "Error al obtener los discos"
    });

  }
});


// ======================================================
// CANCIONES
// ======================================================

app.get("/api/canciones", (req, res) => {
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

app.get("/api/buscar", (req, res) => {
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


 // FUNCIONES PARA PROTEGER LAS CONTRASEÑAS
function crearHash(contraseña) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(contraseña, salt, 64).toString("hex");
  return "scrypt$" + salt + "$" + hash;
}

function verificarContraseña(contraseña, hashGuardado) {
  if(typeof hashGuardado !== "string") return false;

  const partes = hashGuardado.split("$");

  if(partes.length !== 3 || partes[0] !== "scrypt") return false;
  if(!/^[a-f0-9]{32}$/i.test(partes[1])) return false;
  if(!/^[a-f0-9]{128}$/i.test(partes[2])) return false;

  const hashIngresado = crypto.scryptSync(contraseña, partes[1], 64);
  const hashOriginal = Buffer.from(partes[2], "hex");

  return crypto.timingSafeEqual(hashIngresado, hashOriginal);
}

// SESIONES SIMPLES
const sesiones = new Map();

function obtenerToken(req) {
  const cookies = (req.headers.cookie || "").split(";");
  const cookie = cookies.find(c => c.trim().startsWith("rockarg_session="));
  return cookie ? cookie.trim().slice("rockarg_session=".length) : null;
}

// REGISTRAR USUARIO
app.post("/api/registro", (req, res) => {
  console.log("REGISTRO RECIBIDO:", req.body);
  try {
    const mail = typeof req.body?.mail === "string"
      ? req.body.mail.trim().toLowerCase()
      : "";

    const contraseña = typeof req.body?.contraseña === "string"
      ? req.body.contraseña
      : "";

    if(!mail || !contraseña) {
      return res.status(400).json({
        mensaje: "Completá el mail y la contraseña."
      });
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      return res.status(400).json({
        mensaje: "Ingresá un mail válido."
      });
    }

    if(contraseña.length < 8 || Buffer.byteLength(contraseña, "utf8") > 128) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener entre 8 y 128 bytes."
      });
    }

    const hash = crearHash(contraseña);

    db.prepare(`
      INSERT INTO Usuarios (mail, "contraseña")
      VALUES (?, ?)
    `).run(mail, hash);

    res.status(201).json({
      ok: true,
      mensaje: "Cuenta creada correctamente. Ya podés iniciar sesión."
    });
  } catch(error) {
    if(error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        mensaje: "Ya existe una cuenta con ese mail."
      });
    }

    console.error(error);
    res.status(500).json({
      mensaje: "No se pudo registrar la cuenta."
    });
  }
});

// INICIAR SESIÓN
app.post("/api/login", (req, res) => {
  try {
    const mail = typeof req.body?.mail === "string"
      ? req.body.mail.trim().toLowerCase()
      : "";

    const contraseña = typeof req.body?.contraseña === "string"
      ? req.body.contraseña
      : "";

    if(!mail || !contraseña) {
      return res.status(400).json({
        mensaje: "Completá el mail y la contraseña."
      });
    }

    const usuario = db.prepare(`
      SELECT ID, mail, "contraseña" AS hash
      FROM Usuarios
      WHERE mail = ? COLLATE NOCASE
    `).get(mail);

    if(!usuario || !verificarContraseña(contraseña, usuario.hash)) {
      return res.status(401).json({
        mensaje: "El mail o la contraseña son incorrectos."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    sesiones.set(token, {
      id: usuario.ID,
      mail: usuario.mail,
      expira: Date.now() + 24 * 60 * 60 * 1000
    });

    res.setHeader(
      "Set-Cookie",
      "rockarg_session=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400"
    );

    res.json({
      ok: true,
      mensaje: "Inicio de sesión correcto.",
      usuario: {
        mail: usuario.mail
      }
    });
  } catch(error) {
    console.error(error);
    res.status(500).json({
      mensaje: "No se pudo iniciar sesión."
    });
  }
});

// COMPROBAR SI HAY UNA SESIÓN ACTIVA
app.get("/api/sesion", (req, res) => {
  const token = obtenerToken(req);
  const sesion = token ? sesiones.get(token) : null;

  if(!sesion || sesion.expira < Date.now()) {
    if(token) sesiones.delete(token);

    res.setHeader(
      "Set-Cookie",
      "rockarg_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    );

    return res.json({
      logueado: false,
      usuario: null
    });
  }

  res.json({
    logueado: true,
    usuario: {
      mail: sesion.mail
    }
  });
});

// CERRAR SESIÓN
app.post("/api/logout", (req, res) => {
  const token = obtenerToken(req);

  if(token) sesiones.delete(token);

  res.setHeader(
    "Set-Cookie",
    "rockarg_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
  );

  res.json({
    ok: true,
    mensaje: "Sesión cerrada correctamente."
  });
});


// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(PORT, () => {

  console.log("");
  console.log("================================");
  console.log("API CORRIENDO");
  console.log("================================");
  console.log(`http://localhost:${PORT}`);

});
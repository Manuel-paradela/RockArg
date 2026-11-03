// Configuración, conexión SQLite y archivos públicos del servidor.
const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const { registrarRutas } = require("./servidor-rutas.js");

function obtenerConfiguracion(opciones = {}) {
  require("dotenv").config();
  return {
    port: opciones.port ?? process.env.PORT ?? 3000,
    databasePath: opciones.databasePath ?? path.join(__dirname, "..", "..", "Canciones.db"),
    publicPath: path.join(__dirname, "..", "public"),
    imagesPath: path.join(__dirname, "..", "imagenes"),
    audioPath: path.join(__dirname, "..", "canciones")
  };
}

// Conserva las cuentas existentes y prepara las columnas usadas por registro y favoritos.
function prepararUsuarios(db) {
  const columnasUsuarios = db.prepare("PRAGMA table_info(Usuarios)").all().map(c => c.name);
  if (!columnasUsuarios.includes("nombre")) {
    db.exec("ALTER TABLE Usuarios ADD COLUMN nombre TEXT");
  }
  if (!columnasUsuarios.includes("usuario")) {
    db.exec("ALTER TABLE Usuarios ADD COLUMN usuario TEXT");
  }
  if (!columnasUsuarios.includes("nombre_usuario")) {
    db.exec("ALTER TABLE Usuarios ADD COLUMN nombre_usuario TEXT");
  }
  if (!columnasUsuarios.includes("me_gusta")) {
    db.exec("ALTER TABLE Usuarios ADD COLUMN me_gusta TEXT DEFAULT '[]'");
  }
  db.prepare("UPDATE Usuarios SET me_gusta = '[]' WHERE me_gusta IS NULL OR TRIM(me_gusta) = ''").run();
  // Mantiene compatibles las cuentas anteriores.
  db.prepare(`
    UPDATE Usuarios
    SET usuario = mail
    WHERE usuario IS NULL OR TRIM(usuario) = ''
  `).run();
  db.prepare(`
    UPDATE Usuarios
    SET nombre = COALESCE(NULLIF(TRIM(nombre), ''), NULLIF(TRIM(nombre_usuario), ''), mail)
    WHERE nombre IS NULL OR TRIM(nombre) = ''
  `).run();
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_usuario_nocase
    ON Usuarios(usuario COLLATE NOCASE)
  `);
}

function configurarArchivos(app, config) {
  // Los módulos del servidor comparten carpeta con los del navegador, pero no se publican.
  const archivosNavegador = new Set(["main.js", "musica.js", "usuario.js", "admin.js"]);
  app.get("/js/:archivo", (req, res) => {
    if (!archivosNavegador.has(req.params.archivo)) return res.sendStatus(404);
    res.sendFile(path.join(__dirname, req.params.archivo));
  });
  app.use(express.static(config.publicPath));
  app.use("/imagenes", express.static(config.imagesPath, {
    setHeaders(res, filePath) {
      if (["me_gusta", "sin_me_gusta"].includes(path.basename(filePath))) {
        res.setHeader("Content-Type", "image/png");
      }
    }
  }));
  app.use("/canciones", express.static(config.audioPath));
}

function configurarPaginas(app) {
  app.get("/", (req, res) => res.redirect("/html/index.html"));
  // Mantiene los enlaces anteriores a la separación de los HTML en una carpeta.
  for (const page of ["index", "explorar", "historia", "login", "registro", "admin"]) {
    app.get("/" + page + ".html", (req, res) => res.redirect("/html/" + page + ".html"));
  }
}

// Construye una aplicación completa, sin abrir todavía el puerto de escucha.
function crearServidor(opciones = {}) {
  const config = obtenerConfiguracion(opciones);
  const db = new Database(config.databasePath);
  try {
    prepararUsuarios(db);
    const app = express();
    app.use(cors());
    // Se registra antes de las rutas para que los formularios JSON estén en req.body.
    app.use(express.json());
    configurarArchivos(app, config);
    configurarPaginas(app);
    registrarRutas(app, db);
    return { app, db, port: config.port };
  } catch (error) {
    db.close();
    throw error;
  }
}

module.exports = { crearServidor };

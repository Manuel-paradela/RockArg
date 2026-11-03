// Ejecutar npm start desde la carpeta del proyecto.
// El módulo crea la aplicación, configura sus rutas y abre la conexión con SQLite.
const { crearServidor } = require("./files/js/servidor-app");
const { app, port } = crearServidor();

// El archivo principal solo inicia la escucha HTTP; la lógica está en files/js.
app.listen(port, () => {
  console.log(`RockArg disponible en http://localhost:${port}`);
});

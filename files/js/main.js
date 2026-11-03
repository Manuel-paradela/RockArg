import {
  cargarCanciones, renderizarBandas, renderizarAlbumes,
  iniciarSliders, iniciarBotonesExplorar, iniciarNavegacionExplorar,
  iniciarBuscador, cargarImagenAleatoria
} from "./musica.js";

document.addEventListener("DOMContentLoaded", async () => {
  try { await cargarCanciones(); }
  catch (error) { console.error("Error cargando canciones:", error); }
  cargarImagenAleatoria();
  renderizarBandas();
  renderizarAlbumes();
  iniciarBotonesExplorar();
  iniciarNavegacionExplorar();
  iniciarBuscador();
  iniciarSliders();
});

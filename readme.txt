ROCKARG - INSTALACIÓN Y ORGANIZACIÓN DEL PROYECTO

1. DESCARGAR EL PROYECTO

Repositorio:
https://github.com/Manuel-paradela/RockArg

En GitHub, abrir Code y elegir Download ZIP. Extraer el ZIP completo
antes de ejecutar los comandos. También se puede clonar el repositorio
con Git. Abrir la carpeta que contiene server.js, crear_bdd.py y
package.json; esa es la raíz del proyecto.

2. INSTALAR LAS HERRAMIENTAS

Node.js: versión utilizada en el desarrollo, 24.22.1.
npm: versión utilizada en el desarrollo, 11.19.1.
Python: 3.12 o superior; comprobado con Python 3.12.14.

Descarga oficial de Node.js (incluye npm):
https://nodejs.org/en/download

Versiones anteriores de Node.js:
https://nodejs.org/en/download/releases/

Instalación de Node.js y npm:
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/

Python para Windows:
https://www.python.org/downloads/windows/

Seleccionar los instaladores correspondientes a la arquitectura del
equipo. Mantener las opciones para agregar las herramientas al PATH.
Si se usa el instalador tradicional de Python, seleccionar Add Python
to PATH y conservar el lanzador py si está disponible.

Cerrar y abrir la terminal después de instalar. Verificar:

   node --version
   npm --version
   py --version

Si py no se reconoce, probar python --version y utilizar python en los
comandos de creación de la base indicados más abajo.

3. ABRIR LA TERMINAL EN LA CARPETA CORRECTA

En Windows, entrar en la carpeta del proyecto desde el Explorador de
archivos. Hacer clic en la barra de direcciones, escribir cmd y pulsar
Enter. También se puede usar una terminal de PowerShell en esa carpeta.

Si se usa cd, escribir la ruta real entre comillas, por ejemplo:

   cd "C:\proyectos\RockArg"

No ejecutar los comandos desde la carpeta Documentación ni desde files.

4. INSTALAR LAS DEPENDENCIAS DE NODE.JS

Desde la raíz, ejecutar:

   npm ci

Este comando usa package-lock.json para preparar node_modules con las
versiones fijadas. La carpeta node_modules no se incluye en GitHub:
se genera en cada equipo con npm. No instalarla desde otro sitio.

Si PowerShell bloquea npm.ps1, usar CMD o ejecutar npm.cmd ci.

Paquetes declarados en el proyecto:
- express 5.3.0: servidor HTTP y rutas.
- better-sqlite3 13.0.3: conexión con SQLite.
- cors 2.8.6: cabeceras para acceso entre orígenes.
- dotenv 18.0.9: variables de entorno.
- bcryptjs 3.0.3: biblioteca incluida en las dependencias.
- express-session 1.19.0: biblioteca incluida en las dependencias.

npm instala también las dependencias internas de esos paquetes.
No hace falta ejecutar npm install para cada paquete por separado.

Enlaces oficiales de los paquetes:
https://www.npmjs.com/package/express
https://www.npmjs.com/package/better-sqlite3
https://www.npmjs.com/package/cors
https://www.npmjs.com/package/dotenv
https://www.npmjs.com/package/bcryptjs
https://www.npmjs.com/package/express-session

Documentación de npm ci:
https://docs.npmjs.com/cli/v11/commands/npm-ci/

5. CREAR LA BASE DE DATOS Y EL ADMINISTRADOR INICIAL

Antes de iniciar el servidor, ejecutar:

   py crear_bdd.py --crear-admin

Alternativa si se utiliza python:

   python crear_bdd.py --crear-admin

El script crea Canciones.db junto a server.js y carga el catálogo
incluido. Después solicita nombre, usuario y contraseña para una cuenta
administradora nueva. La contraseña no se muestra al escribirla.
Guardar esas credenciales para iniciar sesión desde la página.

Para crear únicamente la base y el catálogo, sin una cuenta inicial:

   py crear_bdd.py

Después se puede ejecutar el comando con --crear-admin para crear una
cuenta administradora nueva. El script no sobrescribe una base existente
ni duplica el catálogo al repetirlo. No incluye cuentas ni contraseñas
personales del equipo de desarrollo.

Python utiliza sqlite3 y otros módulos de su biblioteca estándar:
no hace falta pip install ni instalar un servidor de base de datos.

6. INICIAR LA PÁGINA

Ejecutar:

   npm start

Si PowerShell bloquea el comando, usar npm.cmd start o abrir CMD.
También se puede iniciar con node server.js. Usar solo una instancia.

Abrir en el navegador:

   http://localhost:3000/

Mantener abierta la terminal. No abrir los HTML con doble clic ni usar
Live Server como reemplazo del servidor Node.js: la página necesita la
API, las sesiones y la conexión con SQLite del proyecto.

Para detener el servidor, pulsar Ctrl + C en su terminal.
Después de modificar el backend, detenerlo y volver a ejecutar npm start.
El reinicio cierra las sesiones en memoria, pero conserva las cuentas y
los favoritos guardados en Canciones.db.

Opcionalmente se puede definir PORT=3001 en un archivo .env de la raíz,
reiniciar y abrir http://localhost:3001/. No se requiere .env para usar
el puerto predeterminado 3000. No subir credenciales ni archivos .env.

7. DISPOSICIÓN DE LAS CARPETAS

RockArg/
  server.js                 Inicio del servidor Node.js.
  crear_bdd.py              Crea SQLite y carga el catálogo de entrega.
  package.json              Dependencias y comando npm start.
  package-lock.json         Versiones fijadas para npm ci.
  readme.txt                Esta guía de instalación.
  .gitignore                Exclusiones de archivos locales y generados.
  Canciones.db               Se genera; no se incluye en el repositorio.
  node_modules/             Se genera con npm ci; no se incluye.
  files/
    js/                     JavaScript del navegador y módulos del servidor.
      main.js               Inicialización del frontend.
      musica.js             Catálogo, búsqueda y reproducción.
      usuario.js            Cuentas, perfil, favoritos e Historia.
      admin.js              Interfaz de administración.
      servidor-*.js         Módulos privados del backend.
    public/
      html/                 Páginas de Inicio, Explorar, Historia y cuentas.
      css/                  Estilos generales, de componentes y responsive.
    imagenes/
      albumes/              Portadas de discos.
      foto_bandas/          Fotografías de artistas.
      historia/             Imágenes de la línea del tiempo.
      logos/                Marca e íconos de los controles.
    canciones/              Archivos de audio del proyecto.
  Documentación/            Manual, prompts, wireframes y diseño de la base.

Conservar estos nombres y ubicaciones. Los módulos servidor-* no se
publican como archivos del navegador aunque compartan carpeta.
Los HTML se solicitan por /html/, los estilos por /css/, los módulos del
navegador por /js/, las imágenes por /imagenes/ y los audios por /canciones/.

8. USO BÁSICO

- Crear una cuenta desde Registrarse e iniciar sesión.
- Usar el buscador de Inicio o Explorar.
- Recorrer artistas y álbumes con las flechas y abrir sus canciones.
- Reproducir los temas que tengan audio disponible; usar play, pausa
  y la barra de progreso.
- Dar o quitar me gusta desde el reproductor con una sesión iniciada.
- Abrir el menú del usuario para consultar los favoritos.
- Entrar en Historia para recorrer la línea del tiempo y sus audios.
- Con una cuenta administradora, entrar en Admin para gestionar contenido
  y otorgar permisos a otras cuentas registradas.

El manual completo se encuentra en Documentación/Manual de uso.txt.
No todos los registros del catálogo tienen necesariamente un MP3 incluido.

9. SI ALGO NO FUNCIONA

- Si faltan paquetes, detener el servidor y repetir npm ci.
- Si falta la base, ejecutar crear_bdd.py antes de iniciar Node.js.
- Si el puerto está ocupado, revisar si ya hay una instancia abierta.
- Si una ruta nueva no existe, reiniciar el servidor con el código actual.
- Si no aparecen cambios de estilos o scripts, recargar con Ctrl + F5.
- Si un audio no suena, revisar el nombre del archivo y su existencia.
- Los archivos .db, las copias de respaldo y node_modules no se suben:
  la base y las dependencias se generan siguiendo estos pasos.

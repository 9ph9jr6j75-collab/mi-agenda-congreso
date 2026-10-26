# Mi agenda del congreso

Guía independiente del Congreso Médico Nacional 2026. Incluye 504 actividades y un catálogo de 102 bloques. La guía con robot busca en todo el programa sin cuentas externas.
Elaborada por el Dr. Luis Mauricio Solano Corella.

## Publicación

Este paquete contiene todos los archivos de la web, sin configuración de un proveedor de alojamiento. Publicar el contenido completo en GitHub Pages o cualquier servidor estático HTTPS. No necesita backend, instalación de paquetes ni claves de API.

Todas las rutas son relativas. Se puede alojar en la raíz de un dominio o en la subcarpeta de un repositorio. Mantener los nombres y la ubicación de los archivos.

`index.html` es la entrada; `agenda.json` contiene los datos; `manifest.webmanifest` permite agregarla a la pantalla de inicio. `sw.js` guarda archivos para uso sin conexión. Al actualizar recursos, aumentar el identificador CACHE de sw.js.

Los favoritos se guardan en el navegador de cada visitante. No se envían a un servidor ni se comparten entre usuarios.

La fuente académica es la versión actualizada del programa incorporada el 25 de octubre de 2026. Los cambios posteriores deben incorporarse a agenda.json.

## Estadísticas de visitas

Google Analytics 4 utiliza la propiedad independiente `Agenda del congreso CMN 2026`, el flujo web de `https://9ph9jr6j75-collab.github.io/mi-agenda-congreso/` y el ID público `G-ZJJLBCR440`. La configuración de cada app está en `app-config.json`; la medición sólo se inicia si los IDs están completos y la dirección coincide con la de esa app. Al copiar el proyecto para otra app, se deben sustituir esos datos por los de su propia propiedad.

La app envía únicamente la vista inicial de página y no añade eventos de búsquedas ni favoritos. La medición mejorada está desactivada en el flujo web. Google Analytics puede generar sus eventos técnicos de sesión y actividad a partir de esa vista. La personalización publicitaria y Google Signals están desactivados en la etiqueta.

El código se carga de forma asíncrona y no impide usar la agenda si Analytics está bloqueado o no hay conexión. Las estadísticas se consultan en la propiedad `Agenda del congreso CMN 2026`, separada de la app de farmacias.

# Instrucciones para agentes de IA (Copilot) — taller_lfmotor

Este repositorio es una aplicación web estática con vistas HTML y lógica JS que se ejecuta directamente en el navegador. No hay build ni backend local: todo el flujo de datos se hace desde el frontend hacia Supabase.

- Arquitectura general:
  - Cada vista tiene un HTML en la raíz y su JS asociado en `js/`.
  - Estilos por página en `css/`, donde los nombres de archivos corresponden a las páginas.
  - Ejemplos: `ver_repuesto.html` + `js/ver_repuesto.js`, `ventas.html` + `js/ventas.js`, `subrubro.html` + `js/subrubro.js`.

- Integración con Supabase:
  - Cada script importa Supabase como ESM desde `https://esm.sh/@supabase/supabase-js@2`.
  - El cliente se inicializa en cada archivo con la misma `supabaseUrl` y `supabaseKey`.
  - Los datos se consultan y modifican directamente desde el frontend con `supabase.from(...).select()`, `insert()`, `update()`, `delete()`.
  - Esto significa que no hay API local ni servidor intermediario en este código.

- Navegación y comunicación entre páginas:
  - No es una SPA; las páginas cambian con `window.location.href` y enlaces/`onclick`.
  - Los detalles se pasan por query params, por ejemplo `factura.html?id_venta=...`.
  - Vistas relacionadas se comunican indirectamente mediante la base de datos y parámetros de URL.

- Patrones comunes del DOM y UI:
  - Inicialización de página con `document.addEventListener('DOMContentLoaded', ...)` o con ejecución directa al final del módulo.
  - Modales gestionados por IDs y `style.display` (`modalForm`, `modalMovimientos`, `cerrarForm`, `cerrarModal`).
  - Tablas dinámicas se montan con `innerHTML` y `createElement('tr')`.
  - Hay inputs tipo dropdown construidos manualmente, por ejemplo `crearDropdown(...)` en `js/ver_repuesto.js`.
  - Filtros son `<select>` + `<input>` y disparan recarga de datos.

- Librerías externas y carga de scripts:
  - `jsPDF`, `XLSX` y `jspdf-autotable` se cargan en los HTML, no en los módulos JS.
  - `reportes.html` también carga `Chart.js` desde CDN.
  - Añade nuevas dependencias preferentemente como ESM CDN imports o `<script>` globals si la página espera ese objeto.

- Comportamientos específicos a tener en cuenta:
  - `js/ver_repuesto.js` tiene lógica avanzada de exportación PDF/Excel, filtros y stock.
  - `js/ventas.js` usa funciones globales asignadas a `window` para que botones inline `onclick` funcionen.
  - `js/reportes.js` trabaja con tablas ocultas para exportar Excel y PDF.
  - `js/subrubro.js` y `js/proveedores.js` siguen un CRUD sencillo con modales.

- Flujo de errores y debugging:
  - Si algo falla, abre la consola del navegador y revisa la red para los errores de Supabase.
  - El repo no contiene tests ni scripts de npm, así que la validación se hace en el navegador.

- Ejecución local:
  - No hay `package.json`, no hay build.
  - Usa un servidor local estático:
    - `python -m http.server 8000`
    - `npx serve .`
  - Accede a `http://localhost:8000/index.html`.

- Señales de diseño importantes:
  - La app asume que el frontend tiene acceso a Supabase.
  - Las páginas están desacopladas entre sí excepto por la base de datos y query params.
  - Los cambios de ID de elementos en HTML deben reflejarse en el JS equivalente.

- Riesgos y precauciones:
  - La misma `supabaseKey` aparece en múltiples archivos JS.
  - No conviertas esta app en una SPA por accidente: el flujo actual es multi-página.
  - Evita suponer que el HTML importa librerías JS automáticamente; revisa cada página antes de usar `jsPDF`, `XLSX` o `Chart.js`.

- Referencias clave:
  - `js/ver_repuesto.js` — lógica más completa de filtros, exportaciones y modales.
  - `js/ventas.js` — navegación entre páginas y eliminación de ventas/entidades relacionadas.
  - `js/reportes.js` — gráficos y exportaciones.
  - `ver_repuesto.html`, `reportes.html`, `ver_factura_venta.html` — ejemplos de librerías globales cargadas desde HTML.

Si hay alguna parte del flujo que quieres que clarifique con ejemplos concretos, avísame.

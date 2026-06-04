# Instrucciones para agentes de IA (Copilot) — taller_lfmotor

Breve guía práctica para trabajar con este repositorio frontend estático.

- **Arquitectura general**: aplicación web estática (HTML + CSS + JS) organizada por vistas. Cada página HTML en la raíz corresponde a una vista (por ejemplo `index.html`, `ver_repuesto.html`). El comportamiento está en `js/` y estilos en `css/`.

- **Patrón de archivos**: una vista → un HTML + un JS con el mismo propósito.
  - Ejemplos: [js/ver_repuesto.js](../js/ver_repuesto.js) implementa toda la lógica de repuestos; [index.html](../index.html) es la landing.

- **Librerías e integraciones externas**:
  - Usa imports ESM desde CDNs (por ejemplo `import { createClient } from 'https://esm.sh/@supabase/...` en `js/ver_repuesto.js`). Los navegadores modernos deben servir ESM.
  - Cliente Supabase se usa directamente en frontend. La URL y la llave pública están en `js/ver_repuesto.js` (dato descubierto en el código): trata esto como sensible y verifica con el equipo antes de exponer o modificar.
  - Dependencias de runtime: `jsPDF` y `XLSX` (se asumen como globals cuando se cargan en los HTML).

- **Convenciones de código y DOM**:
  - Inicialización principal en `document.addEventListener('DOMContentLoaded', ...)` (ver `js/ver_repuesto.js`).
  - Funciones principales con prefijos claros: `cargar*`, `editar*`, `exportar*`, `crearDropdown`, `mostrarAlerta`.
  - Manejo de modales por IDs: `modalForm`, `modalMovimientos`, `cerrarForm`, `cerrarModal`.
  - Exportaciones explícitas para uso inter-module: `export async function actualizarStock(...)` en `js/ver_repuesto.js` (usar cuando otras vistas necesitan actualizar stock desde ventas).

- **Flujos de datos observables**:
  - Lectura/actualización de datos se hacen vía Supabase queries desde el cliente (`supabase.from('articulos').select(...)`, `insert`, `update`, `delete`).
  - Las tablas HTML se rellenan dinámicamente con `cuerpoTabla.innerHTML` y `createElement('tr')`.
  - Filtros se implementan por select inputs (`filtroSubrubro`, `filtroMarca`) y por `input` de búsqueda que llama `cargarRepuestos()`.

- **UX / estilos**:
  - Clases semánticas para estado de stock: `stock-verde`, `stock-amarillo`, `stock-rojo` (ver `css/` para estilos asociados).
  - Sistema de alertas central `mostrarAlerta(mensaje, tipo)` — reutilizar para mensajes y errores.

- **Depuración y ejecución local**:
  - No hay build: sirve los archivos estáticos con un servidor simple. Ejemplos (PowerShell):
    - `python -m http.server 8000`
    - `npx serve .`
  - Abrir `http://localhost:8000/index.html` y usar DevTools (Console/Network) para inspeccionar llamadas a Supabase y errores de ESM imports.

- **Qué buscar al editar JS**:
  - Mantener la inicialización en `DOMContentLoaded` y respetar los IDs de DOM usados por los HTML.
  - Cuando añadas nuevas dependencias ESM, prefiere CDNs compatibles con import (ej. `esm.sh`) o agregar `<script>` al HTML si se espera global.
  - Evitar mover la lógica de Supabase al servidor sin coordinar: actualmente la app asume credenciales públicas en frontend.

- **Seguridad y secretos**:
  - Se encontró una `supabaseKey` en `js/ver_repuesto.js`. Si vas a modificar o commitear, pregunta al equipo si debe rotarse o moverse a backend.

- **Referencias clave**:
  - Lógica repuestos: [js/ver_repuesto.js](../js/ver_repuesto.js)
  - Páginas principales: `index.html`, `ventas.html`, `compra.html`, `factura.html` (cada una con su `js/` correspondiente)
  - Estilos: carpeta `css/`
  - Nota general: leer [README.md](../README.md) para contexto del proyecto.

Si algo en estas notas queda poco claro o quieres que incluya ejemplos de edición concretos (p. ej. cómo extraer la llave de Supabase o cómo transformar la dependencia `jsPDF` a import ESM), dime y lo ajusto. ¿Quieres que haga un PR con la versión que sugiero al repo (commit + mensaje)?

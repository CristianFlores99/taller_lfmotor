const SUPABASE_URL = "https://ovfsffckhzelgbgohakv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const modalForm = document.getElementById("modalForm");

function buildSupabaseUrl(path, method = "GET") {
    const url = new URL(`${SUPABASE_URL}/rest/v1/articulos`);

    if (path === "/repuestos" || path.startsWith("/repuestos?")) {
        const query = new URLSearchParams(path.split("?")[1] || "");
        url.searchParams.set("select", "*");
        url.searchParams.set("order", "codigo.asc");

        const subrubro = query.get("subrubro");
        const marca = query.get("marca");
        const filtro = query.get("filtro");

        if (subrubro) url.searchParams.set("subrubro", `eq.${subrubro}`);
        if (marca) url.searchParams.set("marca", `eq.${marca}`);
        if (filtro) {
            const filtroTerm = `*${filtro}*`;
            url.searchParams.set(
                "or",
                `(codigo.ilike.${filtroTerm},descripcion.ilike.${filtroTerm},marca.ilike.${filtroTerm},rubro.ilike.${filtroTerm},subrubro.ilike.${filtroTerm},ubicacion.ilike.${filtroTerm})`
            );
        }
        return url.toString();
    }

    if (path.startsWith("/repuestos/")) {
        const id = path.slice("/repuestos/".length);
        url.searchParams.set("id_articulo", `eq.${id}`);
        if (method === "GET") url.searchParams.set("select", "*");
        return url.toString();
    }

    return `${SUPABASE_URL}/rest/v1${path}`;
}

async function apiRequest(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    if (method === "POST" || method === "PATCH") {
        headers.Prefer = "return=representation";
    }

    const response = await fetch(buildSupabaseUrl(path, method), {
        method,
        headers,
        body: options.body,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const errorMessage = data?.message || data?.error_description || data?.error || response.statusText || "Error de red";
        throw new Error(errorMessage);
    }

    return data;
}

function buildQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            query.append(key, String(value).trim());
        }
    });
    return query.toString() ? `?${query.toString()}` : "";
}

const cerrarForm = document.getElementById("cerrarForm");
const formRepuesto = document.getElementById("formRepuesto");
const tituloForm = document.getElementById("tituloForm");
const btnEliminar = document.getElementById("eliminarRepuesto");

const modalMov = document.getElementById("modalMovimientos");
const cerrarModal = document.getElementById("cerrarModal");

let cuerpoTabla;
let inputBusqueda;
let btnAgregar;
let indicadorStock;
let btnExportarPDF;
let btnExportarExcel;

let precioAnterior = null;
let editId = null;
let imagenesRepuesto = [];
let imagenActualIndex = 0;

// ---------- Funciones ----------

// --- Cargar Repuestos con filtro de subrubro + texto
async function cargarRepuestos() {
    const filtro = inputBusqueda.value.trim();
    const _subrubro = document.getElementById("filtroSubrubro")?.value;
    const marcaSel = document.getElementById("filtroMarca")?.value; // 🆕 nuevo

    const queryString = buildQuery({ filtro, subrubro: _subrubro, marca: marcaSel });
    let data;
    try {
        data = await apiRequest(`/repuestos${queryString}`);
    } catch (err) {
        console.error(err);
        cuerpoTabla.innerHTML = "<tr><td colspan='9'>Error cargando repuestos</td></tr>";
        indicadorStock.textContent = "Error de carga";
        return;
    }

    cuerpoTabla.innerHTML = "";
    if (!data.length) {
        cuerpoTabla.innerHTML = "<tr><td colspan='9'>No se encontraron repuestos</td></tr>";
        indicadorStock.textContent = "Sin datos";
        return;
    }

    // 🔹 Calcular resumen de stock
    const rojo = data.filter(r => r.stock_actual === 0).length;
    const amarillo = data.filter(r => r.stock_actual > 0 && r.stock_actual <= 1).length;
    const verde = data.filter(r => r.stock_actual >= 2).length;

    indicadorStock.innerHTML = `
  <span style="color:#dc2626">🔴 ${rojo} sin stock</span> |
  <span style="color:#facc15">🟡 ${amarillo} bajo</span> |
  <span style="color:#16a34a">🟢 ${verde} correcto</span>
`;

    data.forEach(rep => {
        let claseStock = "stock-verde";
        if (rep.stock_actual === 0) {
            claseStock = "stock-rojo";
        } else if (rep.stock_actual <= 1) {
            claseStock = "stock-amarillo";
        }
        const imagenes = parseImagenes(rep.imagen_url2);
        const imagenPrincipal = imagenes[0] || "";
        const imagenContador = imagenes.length > 1 ? `<span class="imagen-cantidad">+${imagenes.length - 1}</span>` : "";
        const miniaturaHTML = imagenPrincipal
            ? `<div class="miniatura-contenedor"><img src="${imagenPrincipal}" alt="miniatura" class="miniatura-repuesto" data-id="${rep.id_articulo}" style="cursor: pointer;" />${imagenContador}</div>`
            : `<div class="miniatura-contenedor placeholder-miniatura">SIN IMAGEN</div>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${rep.codigo}</td>
      <td>${rep.descripcion}</td>
      <td>${rep.marca || "-"}</td>
      <td>${rep.subrubro || "-"}</td>
      <td>${rep.rubro || "-"}</td>
      <td class="${claseStock}">${rep.stock_actual}</td>
      <td>${rep.ubicacion || "-"}</td>
      <td>$${rep.precio_venta?.toFixed(2) || "0.00"}</td>
      <td>${rep.fecha_actualizacion}</td>
            <td>
                <div class="acciones-fila">
                    ${miniaturaHTML}
                    <button class="btn-ver-imagen" data-id="${rep.id_articulo}">Ver repuesto</button>
                    <button class="btn-editar" data-id="${rep.id_articulo}">Editar</button>
                </div>
            </td>
    `;
        cuerpoTabla.appendChild(tr);
    });

    document.querySelectorAll(".btn-editar").forEach(btn =>
        btn.addEventListener("click", e => editarRepuesto(e.target.dataset.id))
    );

    document.querySelectorAll(".btn-ver-imagen").forEach(btn =>
        btn.addEventListener("click", async e => {
            const id = e.target.dataset.id;
            if (id) {
                await mostrarImagenById(id);
            }
        })
    );

    document.querySelectorAll(".miniatura-repuesto").forEach(img =>
        img.addEventListener("click", async e => {
            const id = e.currentTarget.dataset.id || e.target.dataset.id;
            if (id) {
                await mostrarImagenById(id);
            }
        })
    );

}

function parseImagenes(urls) {
    if (!urls) return [];

    if (Array.isArray(urls)) {
        return urls
            .map(url => String(url).trim())
            .filter(Boolean);
    }

    const value = String(urls).trim();
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map(url => String(url).trim()).filter(Boolean);
        }
    } catch (err) {
        // ignore, no es JSON válido
    }

    return value
        .split(/[;,\n]+/)
        .map(url => url.trim())
        .filter(Boolean);
}

function renderMiniaturas() {
    const contenedor = document.getElementById('miniaturasGaleria');
    if (!contenedor) return;

    contenedor.innerHTML = imagenesRepuesto
        .map((url, index) => `
            <img src="${url}" data-index="${index}" class="${index === imagenActualIndex ? 'activa' : ''}" alt="miniatura ${index + 1}" />
        `)
        .join('');

    contenedor.querySelectorAll('img').forEach(thumb => {
        thumb.addEventListener('click', () => {
            imagenActualIndex = Number(thumb.dataset.index);
            actualizarImagenGaleria();
        });
    });
}

function actualizarImagenGaleria() {
    const imagenPreview = document.getElementById('imagenPreview');
    if (!imagenesRepuesto.length || !imagenPreview) return;

    imagenActualIndex = (imagenActualIndex + imagenesRepuesto.length) % imagenesRepuesto.length;
    imagenPreview.src = imagenesRepuesto[imagenActualIndex];
    renderMiniaturas();
}

// Abrir Formulario
function abrirFormulario() {
    formRepuesto.reset();
    editId = null;
    tituloForm.textContent = "Agregar Repuesto";
    btnEliminar.style.display = "none";
    modalForm.style.display = "flex";
}

// Editar Repuesto
async function editarRepuesto(id) {
    let data;
    try {
        data = await apiRequest(`/repuestos/${id}`);
    } catch (err) {
        console.error(err);
        return;
    }

    editId = id;
    tituloForm.textContent = "Editar Repuesto";
    btnEliminar.style.display = "inline-block";

    document.getElementById("idRepuesto").value = data.id_articulo;
    document.getElementById("codigo").value = data.codigo;
    document.getElementById("descripcion").value = data.descripcion;
    document.getElementById("marca").value = data.marca || "";
    document.getElementById("subrubro").value = data.subrubro || "";
    document.getElementById("rubro").value = data.rubro || "";
    document.getElementById("ubicacion").value = data.ubicacion || "";
    document.getElementById("imagen_url2").value = Array.isArray(data.imagen_url2)
        ? data.imagen_url2.join(", ")
        : (data.imagen_url2 || "");
    document.getElementById("stock_actual").value = data.stock_actual;
    document.getElementById("precio_venta").value = data.precio_venta;
    precioAnterior = Number(data.precio_venta) || 0;

    modalForm.style.display = "flex";
}

// Guardar Repuesto
formRepuesto.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codigoNorm = codigo.value.trim().toUpperCase();
    const marcaNorm = marca.value.trim().toUpperCase();

    // Validación básica
    if (!codigo.value) {
        mostrarAlerta("Código es obligatorio");
        return;
    }
    if (!marcaNorm) {
        mostrarAlerta("La marca es obligatoria", "error");
        return;
    }
    const precioNuevo = parseFloat(precio_venta.value) || 0;

    const imagenUrl2Raw = document.getElementById("imagen_url2").value.trim();
    const imagenesUrl2 = parseImagenes(imagenUrl2Raw);

    const repuesto = {
        codigo: codigoNorm,
        descripcion: descripcion.value.trim(),
        marca: marcaNorm,
        subrubro: subrubro.value.trim(),
        rubro: rubro.value.trim(),
        ubicacion: ubicacion.value.trim(),
        imagen_url2: imagenesUrl2.length ? imagenesUrl2 : null,
        stock_actual: parseInt(stock_actual.value) || 0,
        precio_venta: parseFloat(precio_venta.value) || 0
    };

    // 📅 Si es nuevo o cambió el precio → actualizar fecha
    if (!editId || precioNuevo !== precioAnterior) {
        repuesto.fecha_actualizacion = new Date().toISOString().split("T")[0];
    }

    try {
        if (editId) {
            await apiRequest(`/repuestos/${editId}`, {
                method: "PUT",
                body: JSON.stringify(repuesto)
            });
        } else {
            await apiRequest(`/repuestos`, {
                method: "POST",
                body: JSON.stringify(repuesto)
            });
        }
    } catch (err) {
        mostrarAlerta("Error al guardar: " + err.message, "error");
        return;
    }

    mostrarAlerta("Repuesto guardado correctamente");
    modalForm.style.display = "none";
    cargarRepuestos();

});

// Muestra la imagen y completa los detalles en el modal a partir de un objeto 'item'
function mostrarImagenWithData(item) {
    const modalImagen = document.getElementById("modalImagen");
    const imagenPreview = document.getElementById("imagenPreview");
    const imagenWrapper = document.getElementById("imagenWrapper");
    const miniaturasGaleria = document.getElementById("miniaturasGaleria");
    const btnPrev = document.getElementById("btnPrevImagen");
    const btnNext = document.getElementById("btnNextImagen");

    const imagenes = parseImagenes(item.imagen_url2);
    imagenesRepuesto = imagenes;
    imagenActualIndex = 0;

    const placeholder = document.getElementById("imagenPlaceholder");
    if (!imagenes.length) {
        imagenPreview.src = "";
        imagenPreview.style.display = "block";
        if (placeholder) placeholder.style.display = "flex";
        miniaturasGaleria.innerHTML = "";
        if (btnPrev) btnPrev.style.display = "inline-flex";
        if (btnNext) btnNext.style.display = "inline-flex";
    } else {
        imagenPreview.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
        imagenPreview.src = imagenesRepuesto[imagenActualIndex];
        imagenPreview.style.transform = "scale(1) translate(0, 0)";
        document.getElementById("zoomLevel").textContent = "100%";
        zoomActual = 1;
        offsetX = 0;
        offsetY = 0;
        renderMiniaturas();
        if (btnPrev) btnPrev.style.display = "inline-flex";
        if (btnNext) btnNext.style.display = "inline-flex";
    }

    // Rellenar detalles
    document.getElementById('det_codigo').textContent = item.codigo || '-';
    document.getElementById('det_descripcion').textContent = item.descripcion || '-';
    document.getElementById('det_marca').textContent = item.marca || '-';
    document.getElementById('det_subrubro').textContent = item.subrubro || '-';
    document.getElementById('det_rubro').textContent = item.rubro || '-';
    document.getElementById('det_stock').textContent = (item.stock_actual != null) ? item.stock_actual : '-';
    document.getElementById('det_ubicacion').textContent = item.ubicacion || '-';
    document.getElementById('det_precio').textContent = item.precio_venta != null ? `$${Number(item.precio_venta).toFixed(2)}` : '-';
    document.getElementById('det_fecha').textContent = item.fecha_actualizacion || '-';

    modalImagen.style.display = "flex";
}

// Buscar por id y mostrar
async function mostrarImagenById(id) {
    if (!id) return mostrarAlerta('ID inválido', 'error');

    let data;
    try {
        data = await apiRequest(`/repuestos/${id}`);
    } catch (err) {
        console.error('Error obteniendo repuesto:', err);
        mostrarAlerta('Error obteniendo datos del repuesto', 'error');
        return;
    }

    mostrarImagenWithData(data);
}

let zoomActual = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Actualizar stock automáticamente desde ventas
export async function actualizarStock(id_articulo, cantidad) {
    if (!id_articulo || !cantidad) return;

    // Obtener stock actual
    let data;
    try {
        data = await apiRequest(`/repuestos/${id_articulo}`);
    } catch (err) {
        console.error('Error obteniendo stock:', err);
        return;
    }

    const nuevoStock = Math.max(0, (data?.stock_actual || 0) - cantidad);
    try {
        await apiRequest(`/repuestos/${id_articulo}`, {
            method: "PUT",
            body: JSON.stringify({ stock_actual: nuevoStock })
        });
    } catch (err) {
        console.error('Error actualizando stock:', err);
        return;
    }

    cargarRepuestos(); // refresca tabla
}

// --- Cargar Subrubros (únicos desde articulos)
async function cargarSubrubrosFiltro() {
    let data;
    try {
        data = await apiRequest(`/repuestos`);
    } catch (err) {
        console.error(err);
        return;
    }

    const subrubrosUnicos = [
        ...new Set(
            data
                .map(r => r.subrubro?.trim())
                .filter(Boolean)
        )
    ];

    const select = document.getElementById("filtroSubrubro");

    select.innerHTML = `
        <option value="">Todos los subrubros</option>
        ${subrubrosUnicos
            .map(s => `<option value="${s}">${s}</option>`)
            .join("")}
    `;

    select.addEventListener("change", cargarRepuestos);
}

// --- Cargar Marcas (únicas desde repuestos)
async function cargarMarcas() {
    let data;
    try {
        data = await apiRequest(`/repuestos`);
    } catch (err) {
        console.error(err);
        return;
    }

    const marcasUnicas = [...new Set(data.map(r => r.marca?.trim()).filter(Boolean))].sort();

    const filtroMarca = document.getElementById("filtroMarca");
    filtroMarca.innerHTML = `<option value="">Todas las marcas</option>` +
        marcasUnicas.map(m => `<option value="${m}">${m}</option>`).join("");

    filtroMarca.addEventListener("change", cargarRepuestos);
}

///ALERTA! 
async function cargarSugerenciasImagenes() {
    const inputImagen = document.getElementById("imagen_url2");
    if (!inputImagen) return;

    let data;
    try {
        data = await apiRequest(`/repuestos`);
    } catch (err) {
        console.error("No se pudieron cargar URLs desde los repuestos:", err);
        return;
    }

    const urls = new Set();
    data.forEach(item => {
        const imagenes = parseImagenes(item?.imagen_url2);
        imagenes.forEach(url => urls.add(url));
    });

    const opciones = [...urls]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    if (opciones.length) {
        inputImagen.setAttribute("placeholder", `Ej: ${opciones[0]}`);
    }
}

function mostrarAlerta(mensaje, tipo = "ok") {
    const alerta = document.getElementById("alertaCustom");

    alerta.textContent = mensaje;

    alerta.className = "alerta-custom"; // reset
    alerta.classList.add(`alerta-${tipo}`);

    alerta.style.display = "flex";

    // Fade + slide in
    setTimeout(() => {
        alerta.style.opacity = 1;
        alerta.style.transform = "translateX(0)";
    }, 10);

    // Si es error → vibración
    if (tipo === "error") {
        alerta.classList.add("anim-vibrar");
        setTimeout(() => alerta.classList.remove("anim-vibrar"), 500);
    }

    // Ocultar automático
    setTimeout(() => {
        alerta.style.opacity = 0;
        alerta.style.transform = "translateX(20px)";
        setTimeout(() => alerta.style.display = "none", 400);
    }, 3000);
}

// ==============================
// 📌 Exportación PDF y Excel
// ==============================

// Formatear fecha/hora para el nombre del archivo
function nombreArchivo() {
    const ahora = new Date();
    return ahora.toISOString().replace(/[:.]/g, "-");
}

// ------------------------------
// 📄 EXPORTAR A PDF
// ------------------------------
async function exportarPDF() {
    try {
        const subrubroSeleccionado = document.getElementById("filtroSubrubro").value;
        const queryString = buildQuery({ subrubro: subrubroSeleccionado });
        const data = await apiRequest(`/repuestos${queryString}`);

        if (!data || data.length === 0) {
            mostrarAlerta("ℹ️ No hay repuestos para exportar", "info");
            return;
        }

        const jsPDFclass =
            (window.jspdf && window.jspdf.jsPDF)
                ? window.jspdf.jsPDF
                : (typeof jsPDF !== "undefined" ? jsPDF : null);

        if (!jsPDFclass) {
            mostrarAlerta("❌ jsPDF no está disponible", "error");
            return;
        }

        const pdf = new jsPDFclass({ unit: "pt", format: "a4" });
        const pageHeight = pdf.internal.pageSize.height;

        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text("Listado de Repuestos", 40, 50);

        let y = 90;

        data.forEach((r, index) => {
            const codigo = r.codigo ?? "-";
            const marca = r.marca ?? "-";
            const descripcion = r.descripcion ?? "-";
            const stock = r.stock_actual ?? 0;
            const precio = r.precio_venta ?? 0;
            const subrubro = r.subrubro || "Sin categoría";

            if (y > pageHeight - 100) {
                pdf.addPage();
                y = 50;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${index + 1}. ${descripcion}`, 40, y);
            y += 18;

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Código: ${codigo}`, 60, y);
            y += 14;
            pdf.text(`Marca: ${marca}`, 60, y);
            y += 14;
            pdf.text(`Subrubro: ${subrubro}`, 60, y);
            y += 14;
            pdf.text(`Stock: ${stock}`, 60, y);
            y += 14;
            pdf.text(`Precio Venta: $${precio}`, 60, y);
            y += 20;

            pdf.setDrawColor(180);
            pdf.line(40, y, 550, y);
            y += 20;
        });

        pdf.save(`repuestos_${nombreArchivo()}.pdf`);
        mostrarAlerta("📄 PDF exportado correctamente", "ok");
    } catch (err) {
        console.error(err);
        mostrarAlerta("❌ Error al generar PDF: " + err.message, "error");
    }
}

// ------------------------------
// 📊 EXPORTAR A EXCEL
// ------------------------------
async function exportarExcel() {
    try {
        const data = await apiRequest(`/repuestos`);

        if (!data || data.length === 0) {
            mostrarAlerta("ℹ️ No hay repuestos para exportar", "info");
            return;
        }

        const subrubrosUnicos = [
            ...new Set(data.map(r => r.subrubro || "Sin categoría"))
        ].sort((a, b) => a.localeCompare(b));

        const workbook = XLSX.utils.book_new();

        subrubrosUnicos.forEach(nombreSub => {
            const datosFiltrados = data
                .filter(r => (r.subrubro || "Sin categoría") === nombreSub)
                .sort((a, b) => {
                    const marcaA = (a.marca || "").toLowerCase();
                    const marcaB = (b.marca || "").toLowerCase();
                    return marcaA.localeCompare(marcaB);
                })
                .map(r => ({
                    "Código": r.codigo ?? "-",
                    "Marca": r.marca ?? "-",
                    "Subrubro": nombreSub,
                    "Rubro": r.rubro ?? "-",
                    "Descripción": r.descripcion ?? "-",
                    "Stock Actual": r.stock_actual ?? 0,
                    "Precio Venta": r.precio_venta ?? 0,
                    "Fecha de actualización": r.fecha_actualizacion ?? "-",
                    "Estante/Fila": r.ubicacion ?? "-"
                }));

            const worksheet = XLSX.utils.json_to_sheet(datosFiltrados);

            const colWidths = [];
            datosFiltrados.forEach(row => {
                Object.values(row).forEach((val, i) => {
                    const width = (val ? val.toString().length : 10) + 5;
                    colWidths[i] = Math.max(colWidths[i] || 10, width);
                });
            });
            worksheet["!cols"] = colWidths.map(w => ({ wch: w }));

            const nombreHoja = limpiarNombreHoja(nombreSub);
            XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
        });

        XLSX.writeFile(
            workbook,
            `repuestos_por_subrubro_${nombreArchivo()}.xlsx`
        );

        mostrarAlerta(
            "✅ Excel generado correctamente (una hoja por subrubro ordenado A–Z)",
            "ok"
        );
    } catch (err) {
        console.error(err);
        mostrarAlerta("❌ Error al generar Excel: " + err.message, "error");
    }
}
function limpiarNombreHoja(nombre) {
    return nombre
        .replace(/[:\\\/\?\*\[\]]/g, "") // elimina caracteres inválidos
        .substring(0, 30)                // límite Excel
        .trim() || "Sin categoría";
}


function crearDropdown(input, dropdown, toggle, lista) {
    let selectedIndex = -1;
    let abierto = false;

    function render(filtro = "") {
        dropdown.innerHTML = "";
        const matches = lista.filter(v =>
            v.toLowerCase().includes(filtro.toLowerCase())
        );

        matches.forEach((v, idx) => {
            const div = document.createElement("div");
            div.textContent = v;
            div.addEventListener("click", () => {
                input.value = v;
                cerrar();
            });
            dropdown.appendChild(div);
        });

        if (matches.length) abrir();
        else cerrar();
    }

    function abrir() {
        dropdown.style.display = "block";
        toggle.classList.add("open");
        abierto = true;
    }

    function cerrar() {
        dropdown.style.display = "none";
        toggle.classList.remove("open");
        selectedIndex = -1;
        abierto = false;
    }

    function highlight(items) {
        items.forEach((el, i) =>
            el.classList.toggle("active", i === selectedIndex)
        );
        if (items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: "nearest" });
        }
    }

    // Escribir
    input.addEventListener("input", () => {
        render(input.value);
    });

    // Teclado
    input.addEventListener("keydown", e => {
        const items = dropdown.querySelectorAll("div");
        if (!items.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            highlight(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            highlight(items);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0) {
                input.value = items[selectedIndex].textContent;
                cerrar();
            }
        } else if (e.key === "Escape") {
            cerrar();
        }
    });

    // Click en icono ▾
    toggle.addEventListener("click", e => {
        e.stopPropagation();
        abierto ? cerrar() : render("");
    });

    // Click fuera
    document.addEventListener("click", e => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            cerrar();
        }
    });
}

async function cargarValoresUnicos(campo) {
    let data;
    try {
        data = await apiRequest(`/repuestos`);
    } catch (err) {
        console.error(err);
        return [];
    }

    return [...new Set(
        data
            .map(r => r[campo]?.trim())
            .filter(Boolean)
    )].sort();
}

document.addEventListener("DOMContentLoaded", async () => {

    // 🔹 DOM
    cuerpoTabla = document.getElementById("cuerpoTabla");
    inputBusqueda = document.getElementById("busqueda");
    btnAgregar = document.getElementById("btnAgregar");
    indicadorStock = document.getElementById("indicadorStock");
    const modalImagen = document.getElementById("modalImagen");
    const cerrarImagenModal = document.getElementById("cerrarImagenModal");

    // 🔹 Eventos
    inputBusqueda.addEventListener("input", cargarRepuestos);
    btnAgregar.addEventListener("click", abrirFormulario);

    cerrarForm.addEventListener("click", () => modalForm.style.display = "none");
    cerrarModal.addEventListener("click", () => modalMov.style.display = "none");
    cerrarImagenModal.addEventListener("click", () => modalImagen.style.display = "none");

    window.addEventListener("click", e => {
        if (e.target === modalForm) modalForm.style.display = "none";
        if (e.target === modalMov) modalMov.style.display = "none";
        if (e.target === modalImagen) modalImagen.style.display = "none";
    });

    // 🔹 Cargas iniciales
    await cargarSubrubrosFiltro();
    await cargarMarcas();
    await cargarRepuestos();
    await cargarSugerenciasImagenes();

    // 🔹 Dropdowns del formulario
    const marcas = await cargarValoresUnicos("marca");
    crearDropdown(
        document.getElementById("marca"),
        document.getElementById("marca-dropdown"),
        document.getElementById("marca-toggle"),
        marcas
    );

    const rubros = await cargarValoresUnicos("rubro");
    crearDropdown(
        document.getElementById("rubro"),
        document.getElementById("rubro-dropdown"),
        document.getElementById("rubro-toggle"),
        rubros
    );

    // Zoom controls
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const imagenPreview = document.getElementById("imagenPreview");
    const zoomLevel = document.getElementById("zoomLevel");
    const imagenWrapper = document.getElementById("imagenWrapper");

    function actualizarTransform() {
        imagenPreview.style.transform = `scale(${zoomActual}) translate(${offsetX}px, ${offsetY}px)`;
    }

    function actualizarZoom(factor) {
        zoomActual = Math.max(0.5, Math.min(3, zoomActual + factor));
        zoomLevel.textContent = Math.round(zoomActual * 100) + "%";
        actualizarTransform();
    }

    // click = pequeño paso
    btnZoomIn?.addEventListener("click", () => actualizarZoom(0.1));
    btnZoomOut?.addEventListener("click", () => actualizarZoom(-0.1));

    const btnPrevImagen = document.getElementById("btnPrevImagen");
    const btnNextImagen = document.getElementById("btnNextImagen");

    btnPrevImagen?.addEventListener("click", () => {
        if (!imagenesRepuesto.length) return;
        imagenActualIndex = (imagenActualIndex - 1 + imagenesRepuesto.length) % imagenesRepuesto.length;
        actualizarImagenGaleria();
    });

    btnNextImagen?.addEventListener("click", () => {
        if (!imagenesRepuesto.length) return;
        imagenActualIndex = (imagenActualIndex + 1) % imagenesRepuesto.length;
        actualizarImagenGaleria();
    });

    imagenWrapper?.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 0.1 : -0.1;
        actualizarZoom(factor);
    });

    // Drag/Pan
    imagenPreview?.addEventListener("mousedown", (e) => {
        if (zoomActual <= 1) return;
        isDragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
        imagenPreview.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        actualizarTransform();
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        if (imagenPreview) imagenPreview.style.cursor = zoomActual > 1 ? "grab" : "default";
    });

    const subrubros = await cargarValoresUnicos("subrubro");
    crearDropdown(
        document.getElementById("subrubro"),
        document.getElementById("subrubro-dropdown"),
        document.getElementById("subrubro-toggle"),
        subrubros
    );
    btnExportarPDF = document.getElementById("exportarPDF");
    btnExportarExcel = document.getElementById("exportarExcel");

    btnExportarPDF?.addEventListener("click", exportarPDF);
    btnExportarExcel?.addEventListener("click", exportarExcel);

    // Eliminar
    btnEliminar.addEventListener("click", async () => {
        if (!editId) return;
        if (!confirm("¿Desea eliminar este repuesto?")) return;

        try {
            await apiRequest(`/repuestos/${editId}`, {
                method: "DELETE"
            });
            mostrarAlerta("Repuesto eliminado correctamente");
            modalForm.style.display = "none";
            cargarRepuestos();
        } catch (err) {
            mostrarAlerta("Error al eliminar: " + err.message, "error");
        }
    });
});

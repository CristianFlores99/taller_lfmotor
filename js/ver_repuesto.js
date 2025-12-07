import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const cuerpoTabla = document.getElementById("cuerpoTabla");
const inputBusqueda = document.getElementById("busqueda");
const btnAgregar = document.getElementById("btnAgregar");

const modalForm = document.getElementById("modalForm");
const cerrarForm = document.getElementById("cerrarForm");
const formRepuesto = document.getElementById("formRepuesto");
const tituloForm = document.getElementById("tituloForm");
const subrubroSelect = document.getElementById("subrubro");
const btnEliminar = document.getElementById("eliminarRepuesto");

const modalMov = document.getElementById("modalMovimientos");
const cerrarModal = document.getElementById("cerrarModal");
const cuerpoMovimientos = document.getElementById("cuerpoMovimientos");
const tituloRepuesto = document.getElementById("tituloRepuesto");

const filtroSubrubro = document.getElementById("filtroSubrubro");
const indicadorStock = document.getElementById("indicadorStock");

let editId = null;

// ---------- Eventos ----------
document.addEventListener("DOMContentLoaded", () => {
    cargarSubrubro();
    cargarMarcas(); // 🆕 nuevo
    cargarRepuestos();
});

inputBusqueda.addEventListener("input", cargarRepuestos);
filtroSubrubro.addEventListener("change", cargarRepuestos);
btnAgregar.addEventListener("click", abrirFormulario);
cerrarForm.addEventListener("click", () => modalForm.style.display = "none");
cerrarModal.addEventListener("click", () => modalMov.style.display = "none");

window.addEventListener("click", e => {
    if (e.target === modalForm) modalForm.style.display = "none";
    if (e.target === modalMov) modalMov.style.display = "none";
});

// ---------- Funciones ----------

// --- Cargar Subrubros con el filtro principal
async function cargarSubrubro() {
    const { data, error } = await supabase.from("subrubro").select("*").order("nombre", { ascending: true });
    if (error) return console.error(error);

    filtroSubrubro.innerHTML = `<option value="">Todos los subrubros</option>` +
        data.map(c => `<option value="${c.id_subrubro}">${c.nombre}</option>`).join("");

    subrubroSelect.innerHTML = data.map(c => `<option value="${c.id_subrubro}">${c.nombre}</option>`).join("");
}

// --- Cargar Repuestos con filtro de subrubro + texto
async function cargarRepuestos() {
    const filtro = inputBusqueda.value.trim();
    const _subrubro = filtroSubrubro.value;
    const marcaSel = document.getElementById("filtroMarca").value; // 🆕 nuevo

    let query = supabase
        .from("repuestos")
        .select("*, subrubro(nombre)")
        .order("codigo", { ascending: true });

//    if (filtro) query = query.or(`codigo.ilike.%${filtro}%, descripcion.ilike.%${filtro}%, marca.ilike.%${filtro}%, ubicacion.ilike.%${filtro}%`);
    // --------------------------------------------------------
    // 🔎 1) Si hay texto en el buscador → buscar subrubros
    // --------------------------------------------------------
    let idsSub = [];
    if (filtro) {
        const { data: subs } = await supabase
            .from("subrubro")
            .select("id_subrubro")
            .ilike("nombre", `%${filtro}%`);

        idsSub = subs?.map(s => s.id_subrubro) ?? [];
    }

    // --------------------------------------------------------
    // 🔎 2) OR principal (ya funciona bien tuyo)
    // --------------------------------------------------------
    if (filtro) {
        let orFilters = [
            `codigo.ilike.%${filtro}%`,
            `descripcion.ilike.%${filtro}%`,
            `marca.ilike.%${filtro}%`,
            `ubicacion.ilike.%${filtro}%`
        ];

        // --------------------------------------------------------
        // 🔎 3) Si se encontraron subrubros → agregarlos al OR
        // --------------------------------------------------------
        if (idsSub.length > 0) {
            orFilters.push(`id_subrubro.in.(${idsSub.join(",")})`);
        }

        query = query.or(orFilters.join(","));
    }

    if (_subrubro) query = query.eq("id_subrubro", _subrubro);
    if (marcaSel) query = query.eq("marca", marcaSel); // 🆕 nuevo

    const { data, error } = await query;
    if (error) return console.error(error);

    cuerpoTabla.innerHTML = "";
    if (!data.length) {
        cuerpoTabla.innerHTML = "<tr><td colspan='9'>No se encontraron repuestos</td></tr>";
        indicadorStock.textContent = "Sin datos";
        return;
    }

    // 🔹 Calcular resumen de stock
    const bajo = data.filter(r => r.stock_actual <= r.stock_minimo).length;
    const normal = data.length - bajo;
    indicadorStock.innerHTML = `
    <span style="color:#f87171">⚠️ ${bajo} con stock bajo</span> |
    <span style="color:#86efac">🔋 ${normal} en stock normal</span>
  `;

    data.forEach(rep => {
        const claseStock = rep.stock_actual <= rep.stock_minimo ? "stock-bajo" : "stock-ok";
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${rep.codigo}</td>
      <td>${rep.descripcion}</td>
      <td>${rep.marca || "-"}</td>
      <td>${rep.subrubro?.nombre || "-"}</td>
      <td class="${claseStock}">${rep.stock_actual}</td>
      <td>${rep.ubicacion || "-"}</td>
      <td>$${rep.precio_venta?.toFixed(2) || "0.00"}</td>
      <td>
        <button class="btn-editar" data-id="${rep.id_repuesto}">Editar</button>
        <button class="btn-mov" data-id="${rep.id_repuesto}" data-desc="${rep.descripcion}">Ver Historial</button>
      </td>
    `;
        cuerpoTabla.appendChild(tr);
    });

    document.querySelectorAll(".btn-editar").forEach(btn =>
        btn.addEventListener("click", e => editarRepuesto(e.target.dataset.id))
    );
    document.querySelectorAll(".btn-mov").forEach(btn =>
        btn.addEventListener("click", e => verMovimientos(e.target.dataset.id, e.target.dataset.desc))
    );
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
    const { data, error } = await supabase.from("repuestos").select("*").eq("id_repuesto", id).single();
    if (error) return console.error(error);

    editId = id;
    tituloForm.textContent = "Editar Repuesto";
    btnEliminar.style.display = "inline-block";

    document.getElementById("idRepuesto").value = data.id_repuesto;
    document.getElementById("codigo").value = data.codigo;
    document.getElementById("descripcion").value = data.descripcion;
    document.getElementById("marca").value = data.marca || "";
    document.getElementById("ubicacion").value = data.ubicacion || "";
    document.getElementById("stock_actual").value = data.stock_actual;
    document.getElementById("stock_minimo").value = data.stock_minimo;
    document.getElementById("precio_venta").value = data.precio_venta;
    subrubroSelect.value = data.id_subrubro || "";

    modalForm.style.display = "flex";
}

// Guardar Repuesto
formRepuesto.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validación básica
    if (!codigo.value || !descripcion.value) {
        mostrarAlerta("Código y Descripción son obligatorios");
        return;
    }

    const repuesto = {
        codigo: codigo.value.trim(),
        descripcion: descripcion.value.trim(),
        marca: marca.value.trim(),
        ubicacion: ubicacion.value.trim(),
        stock_actual: parseInt(stock_actual.value) || 0,
        stock_minimo: parseInt(stock_minimo.value) || 0,
        precio_venta: parseFloat(precio_venta.value) || 0,
        id_subrubro: parseInt(subrubro.value)
    };

    let result;
    if (editId) {
        result = await supabase.from("repuestos").update(repuesto).eq("id_repuesto", editId);
    } else {
        // Verificar duplicados por código
        const { data: duplicado } = await supabase.from("repuestos").select("*").eq("codigo", repuesto.codigo);
        if (duplicado.length > 0) {
            mostrarAlerta("Ya existe un repuesto con ese código");
            return;
        }
        result = await supabase.from("repuestos").insert([repuesto]);
    }

    if (result.error) alert("Error: " + result.error.message);
    else {
        // Feedback visual
        mostrarAlerta("Repuesto guardado correctamente");
        modalForm.style.display = "none";
        cargarRepuestos();
    }
});

// Eliminar
btnEliminar.addEventListener("click", async () => {
    if (!editId) return;
    if (!confirm("¿Desea eliminar este repuesto?")) return;

    const { error } = await supabase.from("repuestos").delete().eq("id_repuesto", editId);
    if (error) mostrarAlerta("Error al eliminar: " + error.message);
    else {
        mostrarAlerta("Repuesto eliminado correctamente");
        modalForm.style.display = "none";
        cargarRepuestos();
    }
});

// Ver Movimientos
async function verMovimientos(idRepuesto, descripcion) {
    tituloRepuesto.textContent = `Repuesto: ${descripcion}`;
    modalMov.style.display = "flex";
    cuerpoMovimientos.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

    const { data, error } = await supabase
        .from("movimientos_stock")
        .select("*")
        .eq("id_repuesto", idRepuesto)
        .order("fecha", { ascending: false });

    if (error) {
        cuerpoMovimientos.innerHTML = "<tr><td colspan='4'>Error al cargar movimientos</td></tr>";
        return;
    }

    if (!data.length) {
        cuerpoMovimientos.innerHTML = "<tr><td colspan='4'>No hay movimientos registrados</td></tr>";
        return;
    }

    cuerpoMovimientos.innerHTML = "";
    data.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${new Date(m.fecha).toLocaleDateString()}</td>
            <td>${m.tipo_movimiento}</td>
            <td>${m.cantidad}</td>
            <td>${m.motivo || "-"}</td>
        `;
        cuerpoMovimientos.appendChild(tr);
    });
}

// Actualizar stock automáticamente desde ventas
export async function actualizarStock(id_repuesto, cantidad) {
    if (!id_repuesto || !cantidad) return;
    await supabase.from('repuestos')
        .update({ stock_actual: supabase.raw('stock_actual - ?', [cantidad]) })
        .eq('id_repuesto', id_repuesto);
    cargarRepuestos(); // refresca tabla
}

// --- Cargar Marcas (únicas desde repuestos)
async function cargarMarcas() {
    const { data, error } = await supabase
        .from("repuestos")
        .select("marca")
        .not("marca", "is", null);

    if (error) return console.error(error);

    // Obtener valores únicos
    const marcasUnicas = [...new Set(data.map(r => r.marca.trim()).filter(m => m))].sort();

    const filtroMarca = document.getElementById("filtroMarca");
    filtroMarca.innerHTML = `<option value="">Todas las marcas</option>` +
        marcasUnicas.map(m => `<option value="${m}">${m}</option>`).join("");

    filtroMarca.addEventListener("change", cargarRepuestos);
}

///ALERTA! 
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
document.getElementById("exportarPDF").addEventListener("click", async () => {
    try {
        const subrubroSeleccionado = document.getElementById("filtroSubrubro").value;

        // Construyo query base
        let query = supabase
            .from("repuestos")
            .select("codigo, marca, descripcion, stock_actual, precio_venta, id_subrubro");

        // Si se selecciona un subrubro → filtro
        if (subrubroSeleccionado !== "") {
            query = query.eq("id_subrubro", subrubroSeleccionado);
        }

        const { data, error } = await query;

        if (error) {
            mostrarAlerta("❌ Error obteniendo datos: " + error.message, "error");
            return;
        }

        if (!data || data.length === 0) {
            mostrarAlerta("ℹ️ No hay repuestos para exportar", "info");
            return;
        }

        // Traigo tabla de subrubros para traducir ID -> nombre
        const { data: subrubros } = await supabase
            .from("subrubro")
            .select("id_subrubro, nombre");

        const mapSubrubro = {};
        subrubros?.forEach(s => mapSubrubro[s.id_subrubro] = s.nombre);

        // jsPDF init
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

        // Título
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
            const subrubro = mapSubrubro[r.id_subrubro] ?? "Sin categoría";

            if (y > pageHeight - 100) {
                pdf.addPage();
                y = 50;
            }

            // Título del repuesto
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${index + 1}. ${descripcion}`, 40, y);
            y += 18;

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Código: ${codigo}`, 60, y); y += 14;
            pdf.text(`Marca: ${marca}`, 60, y); y += 14;
            pdf.text(`Subrubro: ${subrubro}`, 60, y); y += 14;
            pdf.text(`Stock: ${stock}`, 60, y); y += 14;
            pdf.text(`Precio Venta: $${precio}`, 60, y); y += 20;

            // Separador
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
});



// ------------------------------
// 📊 EXPORTAR A EXCEL
// ------------------------------
document.getElementById("exportarExcel").addEventListener("click", async () => {
    try {
        // Repuestos
        const { data, error } = await supabase
            .from("repuestos")
            .select("codigo, marca, descripcion, stock_actual, precio_venta, id_subrubro");

        if (error) {
            mostrarAlerta("❌ Error obteniendo datos: " + error.message, "error");
            return;
        }

        if (!data || data.length === 0) {
            mostrarAlerta("ℹ️ No hay repuestos para exportar", "info");
            return;
        }

        // Subrubros
        const { data: subrubros } = await supabase
            .from("subrubro")
            .select("id_subrubro, nombre")
            .order("nombre", { ascending: true });

        // Crear libro Excel
        const workbook = XLSX.utils.book_new();

        // Recorrer cada subrubro → una hoja por subrubro
        subrubros.forEach(sub => {
            const nombreSub = sub.nombre || "Sin nombre";

            // Filtrar repuestos del subrubro actual
            const datosFiltrados = data
                .filter(r => r.id_subrubro === sub.id_subrubro)
                .map(r => ({
                    "Código": r.codigo ?? "-",
                    "Marca": r.marca ?? "-",
                    "Subrubro": nombreSub,
                    "Descripción": r.descripcion ?? "-",
                    "Stock Actual": r.stock_actual ?? 0,
                    "Precio Venta": r.precio_venta ?? 0
                }));

            // Crear hoja
            const worksheet = XLSX.utils.json_to_sheet(datosFiltrados);

            // Ajustar ancho de columnas
            const colWidths = [];
            datosFiltrados.forEach(row => {
                Object.values(row).forEach((val, i) => {
                    const width = (val ? val.toString().length : 10) + 5;
                    colWidths[i] = Math.max(colWidths[i] || 10, width);
                });
            });
            worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(workbook, worksheet, nombreSub.substring(0, 30));
        });

        // Guardar archivo
        XLSX.writeFile(workbook, `repuestos_por_subrubro_${nombreArchivo()}.xlsx`);

        mostrarAlerta("✅ Excel generado correctamente (una hoja por subrubro)", "ok");

    } catch (err) {
        console.error(err);
        mostrarAlerta("❌ Error al generar Excel: " + err.message, "error");
    }
});

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
const btnEliminar = document.getElementById("eliminarRepuesto");

const modalMov = document.getElementById("modalMovimientos");
const cerrarModal = document.getElementById("cerrarModal");
const cuerpoMovimientos = document.getElementById("cuerpoMovimientos");
const tituloRepuesto = document.getElementById("tituloRepuesto");

const indicadorStock = document.getElementById("indicadorStock");
let editId = null;

inputBusqueda.addEventListener("input", cargarRepuestos);
btnAgregar.addEventListener("click", abrirFormulario);
cerrarForm.addEventListener("click", () => modalForm.style.display = "none");
cerrarModal.addEventListener("click", () => modalMov.style.display = "none");

window.addEventListener("click", e => {
    if (e.target === modalForm) modalForm.style.display = "none";
    if (e.target === modalMov) modalMov.style.display = "none";
});

// ---------- Funciones ----------

// --- Cargar Repuestos con filtro de subrubro + texto
async function cargarRepuestos() {
    const filtro = inputBusqueda.value.trim();
    const _subrubro = document.getElementById("filtroSubrubro")?.value;
    const marcaSel = document.getElementById("filtroMarca").value; // 🆕 nuevo

    let query = supabase
        .from("articulos")
        .select("*")
        .order("codigo", { ascending: true });

    if (filtro) query = query.or(`codigo.ilike.%${filtro}%,descripcion.ilike.%${filtro}%,marca.ilike.%${filtro}%,rubro.ilike.%${filtro}%,subrubro.ilike.%${filtro}%,ubicacion.ilike.%${filtro}%`);
    if (_subrubro) query = query.eq("subrubro", _subrubro);
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
      <td>${rep.subrubro || "-"}</td>
      <td>${rep.rubro || "-"}</td>
      <td class="${claseStock}">${rep.stock_actual}</td>
      <td>${rep.ubicacion || "-"}</td>
      <td>$${rep.precio_venta?.toFixed(2) || "0.00"}</td>
      <td>
        <button class="btn-editar" data-id="${rep.id_articulo}">Editar</button>
        <button class="btn-mov" data-id="${rep.id_articulo}" data-desc="${rep.descripcion}">Ver Historial</button>
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
    const { data, error } = await supabase.from("articulos").select("*").eq("id_articulo", id).single();
    if (error) return console.error(error);

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
    document.getElementById("stock_actual").value = data.stock_actual;
    document.getElementById("stock_minimo").value = data.stock_minimo;
    document.getElementById("precio_venta").value = data.precio_venta;
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
        subrubro: subrubro.value.trim(),
        rubro: rubro.value.trim(),
        ubicacion: ubicacion.value.trim(),
        stock_actual: parseInt(stock_actual.value) || 0,
        stock_minimo: parseInt(stock_minimo.value) || 0,
        precio_venta: parseFloat(precio_venta.value) || 0
    };


    let result;
    if (editId) {
        result = await supabase.from("articulos").update(repuesto).eq("id_articulo", editId);
    } else {
        // Verificar duplicados por código
        const { data: duplicado } = await supabase.from("articulos").select("*").eq("codigo", repuesto.codigo);
        if (duplicado.length > 0) {
            mostrarAlerta("Ya existe un repuesto con ese código");
            return;
        }
        result = await supabase.from("articulos").insert([repuesto]);
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

    const { error } = await supabase.from("articulos").delete().eq("id_articulo", editId);
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
        .eq("id_articulo", idRepuesto)
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
export async function actualizarStock(id_articulo, cantidad) {
    if (!id_articulo || !cantidad) return;
    await supabase.from('articulos')
        .update({ stock_actual: supabase.raw('stock_actual - ?', [cantidad]) })
        .eq('id_articulo', id_articulo);
    cargarRepuestos(); // refresca tabla
}

// --- Cargar Subrubros (únicos desde articulos)
async function cargarSubrubrosFiltro() {
    const { data, error } = await supabase
        .from("articulos")
        .select("subrubro")
        .not("subrubro", "is", null)
        .order("subrubro", { ascending: true });

    if (error) {
        console.error(error);
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
    const { data, error } = await supabase
        .from("articulos")
        .select("marca")
        .not("marca", "is", null)
        .order("marca", { ascending: true });

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

        let query = supabase
            .from("articulos")
            .select("*");

        if (subrubroSeleccionado !== "") {
            query = query.eq("subrubro", subrubroSeleccionado);
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
            const subrubro = r.subrubro || "Sin categoría";


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
            .from("articulos")
            .select("*")

        if (error) {
            mostrarAlerta("❌ Error obteniendo datos: " + error.message, "error");
            return;
        }

        if (!data || data.length === 0) {
            mostrarAlerta("ℹ️ No hay repuestos para exportar", "info");
            return;
        }

        const subrubrosUnicos = [...new Set(
            data.map(r => r.subrubro || "Sin categoría")
        )];

        // Crear libro Excel
        const workbook = XLSX.utils.book_new();

        // Recorrer cada subrubro → una hoja por subrubro
        subrubrosUnicos.forEach(nombreSub => {


            // Filtrar repuestos del subrubro actual
            const datosFiltrados = data
                .filter(r => (r.subrubro || "Sin categoría") === nombreSub)
                .map(r => ({
                    "Código": r.codigo ?? "-",
                    "Marca": r.marca ?? "-",
                    "Subrubro": nombreSub,
                    "Rubro": r.rubro ?? "-",
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
    const { data, error } = await supabase
        .from("articulos")
        .select(campo)
        .not(campo, "is", null);

    if (error) {
        console.error(error);
        return [];
    }

    return [...new Set(
        data
            .map(r => r[campo]?.trim())
            .filter(Boolean)
    )].sort();
}

document.addEventListener("DOMContentLoaded", async () => {
    cargarSubrubrosFiltro();
    cargarMarcas(); // 🆕 nuevo
    cargarRepuestos();
    // MARCA
    const marcas = await cargarValoresUnicos("marca");
    crearDropdown(
        document.getElementById("marca"),
        document.getElementById("marca-dropdown"),
        document.getElementById("marca-toggle"),
        marcas
    );

    // RUBRO
    const rubros = await cargarValoresUnicos("rubro");
    crearDropdown(
        document.getElementById("rubro"),
        document.getElementById("rubro-dropdown"),
        document.getElementById("rubro-toggle"),
        rubros
    );

    // SUBRUBRO
    const subrubros = await cargarValoresUnicos("subrubro");
    crearDropdown(
        document.getElementById("subrubro"),
        document.getElementById("subrubro-dropdown"),
        document.getElementById("subrubro-toggle"),
        subrubros
    );

});


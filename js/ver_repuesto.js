import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

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
const categoriaSelect = document.getElementById("categoria");
const btnEliminar = document.getElementById("eliminarRepuesto");

const modalMov = document.getElementById("modalMovimientos");
const cerrarModal = document.getElementById("cerrarModal");
const cuerpoMovimientos = document.getElementById("cuerpoMovimientos");
const tituloRepuesto = document.getElementById("tituloRepuesto");

const filtroCategoria = document.getElementById("filtroCategoria");
const indicadorStock = document.getElementById("indicadorStock");

let editId = null;

// ---------- Eventos ----------
document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    cargarMarcas(); // 🆕 nuevo
    cargarRepuestos();
});

inputBusqueda.addEventListener("input", cargarRepuestos);
filtroCategoria.addEventListener("change", cargarRepuestos);
btnAgregar.addEventListener("click", abrirFormulario);
cerrarForm.addEventListener("click", () => modalForm.style.display = "none");
cerrarModal.addEventListener("click", () => modalMov.style.display = "none");

window.addEventListener("click", e => {
    if (e.target === modalForm) modalForm.style.display = "none";
    if (e.target === modalMov) modalMov.style.display = "none";
});

// ---------- Funciones ----------

// --- Cargar Categorías con el filtro principal
async function cargarCategorias() {
  const { data, error } = await supabase.from("subrubro").select("*").order("nombre", { ascending: true });
  if (error) return console.error(error);

  filtroCategoria.innerHTML = `<option value="">Todas las categorías</option>` +
    data.map(c => `<option value="${c.id_subrubro}">${c.nombre}</option>`).join("");

  categoriaSelect.innerHTML = data.map(c => `<option value="${c.id_subrubro}">${c.nombre}</option>`).join("");
}

// --- Cargar Repuestos con filtro de categoría + texto
async function cargarRepuestos() {
  const filtro = inputBusqueda.value.trim();
  const cat = filtroCategoria.value;
  const marcaSel = document.getElementById("filtroMarca").value; // 🆕 nuevo

  let query = supabase
    .from("repuestos")
    .select("*, subrubro(nombre)")
    .order("codigo", { ascending: true });

  if (filtro) query = query.or(`codigo.ilike.%${filtro}%, descripcion.ilike.%${filtro}%, marca.ilike.%${filtro}%`);
  if (cat) query = query.eq("id_subrubro", cat);
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
        <button class="btn-editar" data-id="${rep.id_repuesto}">✏️</button>
        <button class="btn-mov" data-id="${rep.id_repuesto}" data-desc="${rep.descripcion}">📦</button>
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
    categoriaSelect.value = data.id_subrubro || "";

    modalForm.style.display = "flex";
}

// Guardar Repuesto
formRepuesto.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validación básica
    if (!codigo.value || !descripcion.value) {
        alert("⚠️ Código y Descripción son obligatorios");
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
        id_subrubro: parseInt(categoria.value)
    };

    let result;
    if (editId) {
        result = await supabase.from("repuestos").update(repuesto).eq("id_repuesto", editId);
    } else {
        // Verificar duplicados por código
        const { data: duplicado } = await supabase.from("repuestos").select("*").eq("codigo", repuesto.codigo);
        if (duplicado.length > 0) {
            return alert("⚠️ Ya existe un repuesto con ese código");
        }
        result = await supabase.from("repuestos").insert([repuesto]);
    }

    if (result.error) alert("Error: " + result.error.message);
    else {
        // Feedback visual
        alert("✅ Repuesto guardado correctamente");
        modalForm.style.display = "none";
        cargarRepuestos();
    }
});

// Eliminar
btnEliminar.addEventListener("click", async () => {
    if (!editId) return;
    if (!confirm("¿Desea eliminar este repuesto?")) return;

    const { error } = await supabase.from("repuestos").delete().eq("id_repuesto", editId);
    if (error) alert("Error al eliminar: " + error.message);
    else {
        alert("🗑️ Repuesto eliminado correctamente");
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

/////exportar a pdf o excel
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
    const { data, error } = await supabase
        .from("repuestos")
        .select("codigo, marca, descripcion, stock_actual, precio_venta");

    if (error) return alert("Error obteniendo datos");

    const pdf = new jsPDF();

    pdf.setFontSize(14);
    pdf.text("Listado de Repuestos", 10, 10);

    let y = 20;

    data.forEach((r, index) => {
        pdf.setFontSize(10);
        pdf.text(
            `${index + 1}. Cod: ${r.codigo} | Marca: ${r.marca} | ${r.descripcion}
Stock: ${r.stock_actual} | Precio: $${r.precio_venta}`,
            10,
            y
        );
        y += 15;

        if (y > 280) {
            pdf.addPage();
            y = 20;
        }
    });

    pdf.save(`repuestos_${nombreArchivo()}.pdf`);
});


// ------------------------------
// 📊 EXPORTAR A EXCEL
// ------------------------------
document.getElementById("exportarExcel").addEventListener("click", async () => {
    const { data, error } = await supabase
        .from("repuestos")
        .select("codigo, marca, descripcion, stock_actual, precio_venta");

    if (error) return alert("Error obteniendo datos");

    // Convertir datos a formato SheetJS
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Repuestos");

    XLSX.writeFile(workbook, `repuestos_${nombreArchivo()}.xlsx`);
});

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

let editId = null;

// Eventos
document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarRepuestos();
});
inputBusqueda.addEventListener("input", cargarRepuestos);
btnAgregar.addEventListener("click", abrirFormulario);
cerrarForm.addEventListener("click", () => modalForm.style.display = "none");
cerrarModal.addEventListener("click", () => modalMov.style.display = "none");

window.addEventListener("click", e => {
  if (e.target === modalForm) modalForm.style.display = "none";
  if (e.target === modalMov) modalMov.style.display = "none";
});

// ---------- Cargar Categorías ----------
async function cargarCategorias() {
  const { data, error } = await supabase.from("categorias").select("*");
  if (error) return console.error(error);
  categoriaSelect.innerHTML = data.map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`).join("");
}

// ---------- Cargar Repuestos ----------
async function cargarRepuestos() {
  const filtro = inputBusqueda.value.trim();
  let query = supabase
    .from("repuestos")
    .select("*, categorias(nombre)")
    .order("codigo", { ascending: true });

  if (filtro) query = query.or(`codigo.ilike.%${filtro}%, descripcion.ilike.%${filtro}%, marca.ilike.%${filtro}%`);

  const { data, error } = await query;
  if (error) return console.error(error);

  cuerpoTabla.innerHTML = "";
  data.forEach(rep => {
    const claseStock = rep.stock_actual <= rep.stock_minimo ? "stock-bajo" : "stock-ok";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rep.codigo}</td>
      <td>${rep.descripcion}</td>
      <td>${rep.marca || "-"}</td>
      <td>${rep.categorias?.nombre || "-"}</td>
      <td>${rep.medida || "-"}</td>
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

// ---------- Abrir Formulario ----------
function abrirFormulario() {
  formRepuesto.reset();
  editId = null;
  tituloForm.textContent = "Agregar Repuesto";
  btnEliminar.style.display = "none";
  modalForm.style.display = "flex";
}

// ---------- Editar ----------
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
  document.getElementById("medida").value = data.medida || "";
  document.getElementById("ubicacion").value = data.ubicacion || "";
  document.getElementById("stock_actual").value = data.stock_actual;
  document.getElementById("stock_minimo").value = data.stock_minimo;
  document.getElementById("precio_venta").value = data.precio_venta;
  categoriaSelect.value = data.id_categoria || "";

  modalForm.style.display = "flex";
}

// ---------- Guardar ----------
formRepuesto.addEventListener("submit", async (e) => {
  e.preventDefault();
  const repuesto = {
    codigo: codigo.value,
    descripcion: descripcion.value,
    marca: marca.value,
    medida: medida.value,
    ubicacion: ubicacion.value,
    stock_actual: parseInt(stock_actual.value),
    stock_minimo: parseInt(stock_minimo.value),
    precio_venta: parseFloat(precio_venta.value),
    id_categoria: parseInt(categoria.value)
  };

  let result;
  if (editId) {
    result = await supabase.from("repuestos").update(repuesto).eq("id_repuesto", editId);
  } else {
    result = await supabase.from("repuestos").insert([repuesto]);
  }

  if (result.error) alert("Error: " + result.error.message);
  else {
    alert("✅ Repuesto guardado correctamente");
    modalForm.style.display = "none";
    cargarRepuestos();
  }
});

// ---------- Eliminar ----------
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

// ---------- Movimientos ----------
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

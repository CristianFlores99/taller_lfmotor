import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const inputBusqueda = document.getElementById("busqueda");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const btnAgregar = document.getElementById("btnAgregar");

const modalMov = document.getElementById("modalMovimientos");
const cerrarModal = document.getElementById("cerrarModal");
const cuerpoMovimientos = document.getElementById("cuerpoMovimientos");
const tituloRepuesto = document.getElementById("tituloRepuesto");

// Modal formulario
const modalForm = document.getElementById("modalForm");
const cerrarForm = document.getElementById("cerrarForm");
const formRepuesto = document.getElementById("formRepuesto");

document.addEventListener("DOMContentLoaded", cargarRepuestos);
inputBusqueda.addEventListener("input", cargarRepuestos);
btnAgregar.addEventListener("click", () => abrirFormulario());
cerrarModal.addEventListener("click", () => modalMov.style.display = "none");
cerrarForm.addEventListener("click", () => modalForm.style.display = "none");

window.addEventListener("click", e => {
  if (e.target === modalMov) modalMov.style.display = "none";
  if (e.target === modalForm) modalForm.style.display = "none";
});

// ---------- Cargar Repuestos ----------
async function cargarRepuestos() {
  const filtro = inputBusqueda.value.trim();
  let query = supabase
    .from("repuestos")
    .select("*")
    .order("codigo", { ascending: true });

  if (filtro) {
    query = query.or(`codigo.ilike.%${filtro}%, descripcion.ilike.%${filtro}%, marca.ilike.%${filtro}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error cargando repuestos:", error);
    return;
  }

  cuerpoTabla.innerHTML = "";
  data.forEach(rep => {
    const claseStock = rep.stock_actual <= rep.stock_minimo ? "stock-bajo" : "stock-ok";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rep.codigo}</td>
      <td>${rep.descripcion}</td>
      <td>${rep.marca || "-"}</td>
      <td>${rep.id_categoria || "-"}</td>
      <td>${rep.medida || "-"}</td>
      <td class="${claseStock}">${rep.stock_actual}</td>
      <td>${rep.ubicacion || "-"}</td>
      <td>$${rep.precio_venta?.toFixed(2) || "0.00"}</td>
      <td>
        <button class="btn-editar" data-id="${rep.id_repuesto}">✏️</button>
      </td>
    `;
    cuerpoTabla.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach(btn =>
    btn.addEventListener("click", e => editarRepuesto(e.target.dataset.id))
  );
}

// ---------- Formulario ----------
function abrirFormulario() {
  formRepuesto.reset();
  document.getElementById("idRepuesto").value = "";
  document.getElementById("tituloForm").textContent = "Agregar Repuesto";
  modalForm.style.display = "flex";
}

async function editarRepuesto(id) {
  const { data, error } = await supabase.from("repuestos").select("*").eq("id_repuesto", id).single();
  if (error) {
    console.error("Error obteniendo repuesto:", error);
    return;
  }

  document.getElementById("tituloForm").textContent = "Editar Repuesto";
  document.getElementById("idRepuesto").value = data.id_repuesto;
  document.getElementById("codigo").value = data.codigo;
  document.getElementById("descripcion").value = data.descripcion;
  document.getElementById("marca").value = data.marca || "";
  document.getElementById("medida").value = data.medida || "";
  document.getElementById("ubicacion").value = data.ubicacion || "";
  document.getElementById("stock_actual").value = data.stock_actual;
  document.getElementById("stock_minimo").value = data.stock_minimo;
  document.getElementById("precio_venta").value = data.precio_venta;

  modalForm.style.display = "flex";
}

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
    precio_venta: parseFloat(precio_venta.value)
  };

  const id = document.getElementById("idRepuesto").value;
  let result;

  if (id) {
    result = await supabase.from("repuestos").update(repuesto).eq("id_repuesto", id);
  } else {
    result = await supabase.from("repuestos").insert([repuesto]);
  }

  if (result.error) {
    alert("Error guardando repuesto: " + result.error.message);
  } else {
    alert("✅ Repuesto guardado correctamente");
    modalForm.style.display = "none";
    cargarRepuestos();
  }
});

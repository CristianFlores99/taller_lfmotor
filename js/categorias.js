import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const cuerpoCategorias = document.getElementById("cuerpoCategorias");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");
const modalCategoria = document.getElementById("modalCategoria");
const cerrarModalCategoria = document.getElementById("cerrarModalCategoria");
const formCategoria = document.getElementById("formCategoria");

// Inicializar
document.addEventListener("DOMContentLoaded", cargarCategorias);
btnNuevaCategoria.addEventListener("click", abrirFormulario);
cerrarModalCategoria.addEventListener("click", () => modalCategoria.style.display = "none");
window.addEventListener("click", e => { if (e.target === modalCategoria) modalCategoria.style.display = "none"; });

// ----------------- Funciones -----------------
async function cargarCategorias() {
  const { data, error } = await supabase.from("categorias").select("*").order("id_categoria", { ascending: true });
  if (error) { console.error(error); return; }

  cuerpoCategorias.innerHTML = "";
  data.forEach(cat => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cat.id_categoria}</td>
      <td>${cat.nombre}</td>
      <td>
        <button class="btn-editar" data-id="${cat.id_categoria}">✏️</button>
      </td>
    `;
    cuerpoCategorias.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach(btn => 
    btn.addEventListener("click", e => editarCategoria(e.target.dataset.id))
  );
}

function abrirFormulario() {
  formCategoria.reset();
  document.getElementById("idCategoria").value = "";
  document.getElementById("tituloCategoria").textContent = "Nueva Categoría";
  modalCategoria.style.display = "flex";
}

async function editarCategoria(id) {
  const { data, error } = await supabase.from("categorias").select("*").eq("id_categoria", id).single();
  if (error) { console.error(error); return; }

  document.getElementById("idCategoria").value = data.id_categoria;
  document.getElementById("nombreCategoria").value = data.nombre;
  document.getElementById("tituloCategoria").textContent = "Editar Categoría";
  modalCategoria.style.display = "flex";
}

formCategoria.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombreCategoria").value;
  const id = document.getElementById("idCategoria").value;

  let result;
  if (id) {
    result = await supabase.from("categorias").update({ nombre }).eq("id_categoria", id);
  } else {
    result = await supabase.from("categorias").insert([{ nombre }]);
  }

  if (result.error) {
    alert("Error guardando categoría: " + result.error.message);
  } else {
    alert("✅ Categoría guardada correctamente");
    modalCategoria.style.display = "none";
    cargarCategorias();
  }
});

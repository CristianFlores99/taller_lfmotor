import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";
const supabase = createClient(supabaseUrl, supabaseKey);

const cuerpoCategorias = document.getElementById("cuerpoCategorias");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");
const modalCategoria = document.getElementById("modalCategoria");
const cerrarModalCategoria = document.getElementById("cerrarModalCategoria");
const formCategoria = document.getElementById("formCategoria");
const buscador = document.getElementById("buscador");
const ordenarPor = document.getElementById("ordenarPor");

let categorias = [];

document.addEventListener("DOMContentLoaded", cargarCategorias);
btnNuevaCategoria.addEventListener("click", abrirFormulario);
cerrarModalCategoria.addEventListener("click", () => (modalCategoria.style.display = "none"));
window.addEventListener("click", (e) => { if (e.target === modalCategoria) modalCategoria.style.display = "none"; });

buscador.addEventListener("input", actualizarVista);
ordenarPor.addEventListener("change", actualizarVista);

async function cargarCategorias() {
  const { data, error } = await supabase
    .from("subrubro")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  categorias = data;
  actualizarVista();
}

function actualizarVista() {
  let lista = filtrarCategorias();
  lista = ordenarCategorias(lista);
  renderizarTabla(lista);
}

function filtrarCategorias() {
  const texto = buscador.value.toLowerCase();
  return categorias.filter(
    (c) =>
      c.nombre.toLowerCase().includes(texto) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(texto))
  );
}

function ordenarCategorias(lista) {
  const criterio = ordenarPor.value;
  return lista.sort((a, b) => {
    if (criterio === "nombre") {
      return a.nombre.localeCompare(b.nombre);
    } else {
      return a.id_subrubro - b.id_subrubro;
    }
  });
}

function renderizarTabla(lista) {
  cuerpoCategorias.innerHTML = "";
  lista.forEach((cat) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cat.id_subrubro}</td>
      <td>${cat.nombre}</td>
      <td>${cat.descripcion || ""}</td>
      <td>
        <button class="btn-editar" data-id="${cat.id_subrubro}">✏️</button>
        <button class="btn-eliminar" data-id="${cat.id_subrubro}">🗑️</button>
      </td>
    `;
    cuerpoCategorias.appendChild(tr);
  });

  // 🔢 Mostrar contador
  const contador = document.getElementById("contadorCategorias");
  contador.textContent = `Mostrando ${lista.length} de ${categorias.length} categorías`;

  document.querySelectorAll(".btn-editar").forEach((btn) =>
    btn.addEventListener("click", (e) => editarCategoria(e.target.dataset.id))
  );
  document.querySelectorAll(".btn-eliminar").forEach((btn) =>
    btn.addEventListener("click", (e) => eliminarCategoria(e.target.dataset.id))
  );
}


function abrirFormulario() {
  formCategoria.reset();
  document.getElementById("idCategoria").value = "";
  document.getElementById("tituloCategoria").textContent = "Nueva Categoría";
  modalCategoria.style.display = "flex";
}

async function editarCategoria(id) {
  const { data, error } = await supabase
    .from("subrubro")
    .select("*")
    .eq("id_subrubro", id)
    .single();
  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("idCategoria").value = data.id_categoria;
  document.getElementById("nombreCategoria").value = data.nombre;
  document.getElementById("descripcionCategoria").value = data.descripcion || "";
  document.getElementById("tituloCategoria").textContent = "Editar Categoría";
  modalCategoria.style.display = "flex";
}

formCategoria.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombreCategoria").value.trim();
  const descripcion = document.getElementById("descripcionCategoria").value.trim();
  const id = document.getElementById("idCategoria").value;

  let result;
  if (id) {
    result = await supabase
      .from("subrubro")
      .update({ nombre, descripcion })
      .eq("id_subrubro", id);
  } else {
    result = await supabase.from("subrubro").insert([{ nombre, descripcion }]);
  }

  if (result.error) {
    alert("❌ Error guardando categoría: " + result.error.message);
  } else {
    alert("✅ Categoría guardada correctamente");
    modalCategoria.style.display = "none";
    cargarCategorias();
  }
});

async function eliminarCategoria(id) {
  if (!confirm("⚠️ ¿Seguro que deseas eliminar esta categoría?")) return;

  const { error } = await supabase.from("subrubro").delete().eq("id_subrubro", id);

  if (error) {
    alert("❌ Error eliminando categoría: " + error.message);
  } else {
    alert("🗑️ Categoría eliminada correctamente");
    cargarCategorias();
  }
}


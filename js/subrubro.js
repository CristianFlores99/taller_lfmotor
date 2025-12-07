import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

// Elementos del DOM
const tabla = document.getElementById("tabla");
const btnNuevo = document.getElementById("btnNuevo");
const modal = document.getElementById("modal");
const cerrarModal = document.getElementById("cerrarModal");
const form = document.getElementById("form");
const buscador = document.getElementById("buscador");
const ordenarPor = document.getElementById("ordenarPor");

let listaSubrubros = [];

// Inicializar
document.addEventListener("DOMContentLoaded", cargarSubrubros);
btnNuevo.addEventListener("click", abrirNuevo);
cerrarModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

buscador.addEventListener("input", actualizarVista);
ordenarPor.addEventListener("change", actualizarVista);

// -------------------------
// Cargar subrubros
// -------------------------
async function cargarSubrubros() {
  const { data, error } = await supabase.from("subrubro").select("*");

  if (error) {
    console.error("Error cargando:", error);
    return;
  }

  listaSubrubros = data;
  actualizarVista();
}

// -------------------------
// FILTRO + ORDEN
// -------------------------
function actualizarVista() {
  let lista = filtrar();
  lista = ordenar(lista);
  renderizar(lista);
}

function filtrar() {
  const texto = buscador.value.toLowerCase();
  return listaSubrubros.filter((s) => s.nombre.toLowerCase().includes(texto));
}

function ordenar(lista) {
  const tipo = ordenarPor.value;
  return lista.sort((a, b) =>
    tipo === "nombre" ? a.nombre.localeCompare(b.nombre) : a.id_subrubro - b.id_subrubro
  );
}

// -------------------------
// RENDER
// -------------------------
function renderizar(lista) {
  tabla.innerHTML = "";

  lista.forEach((s) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.id_subrubro}</td>
      <td>${s.nombre}</td>
      <td>
        <button class="btn-editar" data-id="${s.id_subrubro}">✏️</button>
        <button class="btn-eliminar" data-id="${s.id_subrubro}">🗑️</button>
      </td>
    `;

    tabla.appendChild(tr);
  });

  document.getElementById("contador").textContent =
    `Mostrando ${lista.length} de ${listaSubrubros.length} subrubros`;

  document.querySelectorAll(".btn-editar").forEach((btn) =>
    btn.addEventListener("click", () => editar(btn.dataset.id))
  );

  document.querySelectorAll(".btn-eliminar").forEach((btn) =>
    btn.addEventListener("click", () => eliminar(btn.dataset.id))
  );
}

// -------------------------
// NUEVO / EDITAR
// -------------------------
function abrirNuevo() {
  form.reset();
  document.getElementById("id").value = "";
  document.getElementById("tituloModal").textContent = "Nuevo Subrubro";
  modal.style.display = "flex";
}

async function editar(id) {
  const { data } = await supabase
    .from("subrubro")
    .select("*")
    .eq("id_subrubro", id)
    .single();

  if (!data) return;

  document.getElementById("id").value = data.id_subrubro;
  document.getElementById("nombre").value = data.nombre;

  document.getElementById("tituloModal").textContent = "Editar Subrubro";
  modal.style.display = "flex";
}

// -------------------------
// GUARDAR
// -------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("id").value;
  const nombre = document.getElementById("nombre").value.trim();

  let res;

  if (id) {
    res = await supabase.from("subrubro").update({ nombre }).eq("id_subrubro", id);
  } else {
    res = await supabase.from("subrubro").insert([{ nombre }]);
  }

  if (res.error) {
    alert("❌ Error: " + res.error.message);
    return;
  }

  modal.style.display = "none";
  cargarSubrubros();
});

// -------------------------
// ELIMINAR
// -------------------------
async function eliminar(id) {
  if (!confirm("¿Eliminar este subrubro?")) return;

  const { error } = await supabase.from("subrubro").delete().eq("id_subrubro", id);

  if (error) {
    alert("❌ Error: " + error.message);
    return;
  }

  cargarSubrubros();
}

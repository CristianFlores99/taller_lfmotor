import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const cuerpoProveedores = document.getElementById("cuerpoProveedores");
const btnNuevoProveedor = document.getElementById("btnNuevoProveedor");
const modalProveedor = document.getElementById("modalProveedor");
const cerrarModalProveedor = document.getElementById("cerrarModalProveedor");
const formProveedor = document.getElementById("formProveedor");

// Inicializar
document.addEventListener("DOMContentLoaded", cargarProveedores);
btnNuevoProveedor.addEventListener("click", abrirFormulario);
cerrarModalProveedor.addEventListener("click", () => modalProveedor.style.display = "none");
window.addEventListener("click", e => { if (e.target === modalProveedor) modalProveedor.style.display = "none"; });

// ----------------- Funciones -----------------
async function cargarProveedores() {
  const { data, error } = await supabase.from("proveedores").select("*").order("id_proveedor", { ascending: true });
  if (error) { console.error(error); return; }

  cuerpoProveedores.innerHTML = "";
  data.forEach(prov => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${prov.id_proveedor}</td>
      <td>${prov.nombre}</td>
      <td>${prov.telefono || '-'}</td>
      <td>${prov.email || '-'}</td>
      <td>${prov.direccion || '-'}</td>
      <td>
        <button class="btn-editar" data-id="${prov.id_proveedor}">✏️</button>
      </td>
    `;
    cuerpoProveedores.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach(btn =>
    btn.addEventListener("click", e => editarProveedor(e.target.dataset.id))
  );
}

function abrirFormulario() {
  formProveedor.reset();
  document.getElementById("idProveedor").value = "";
  document.getElementById("tituloProveedor").textContent = "Nuevo Proveedor";
  modalProveedor.style.display = "flex";
}

async function editarProveedor(id) {
  const { data, error } = await supabase.from("proveedores").select("*").eq("id_proveedor", id).single();
  if (error) { console.error(error); return; }

  document.getElementById("idProveedor").value = data.id_proveedor;
  document.getElementById("nombreProveedor").value = data.nombre;
  document.getElementById("telefonoProveedor").value = data.telefono || '';
  document.getElementById("emailProveedor").value = data.email || '';
  document.getElementById("direccionProveedor").value = data.direccion || '';
  document.getElementById("tituloProveedor").textContent = "Editar Proveedor";
  modalProveedor.style.display = "flex";
}

formProveedor.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombreProveedor").value;
  const telefono = document.getElementById("telefonoProveedor").value;
  const email = document.getElementById("emailProveedor").value;
  const direccion = document.getElementById("direccionProveedor").value;
  const id = document.getElementById("idProveedor").value;

  let result;
  if (id) {
    result = await supabase.from("proveedores").update({ nombre, telefono, email, direccion }).eq("id_proveedor", id);
  } else {
    result = await supabase.from("proveedores").insert([{ nombre, telefono, email, direccion }]);
  }

  if (result.error) {
    alert("Error guardando proveedor: " + result.error.message);
  } else {
    alert("✅ Proveedor guardado correctamente");
    modalProveedor.style.display = "none";
    cargarProveedores();
  }
});

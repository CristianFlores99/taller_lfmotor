import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Elementos ---
const btnNuevaVenta = document.getElementById("btnNuevaVenta");
const btnVolver = document.getElementById("btnVolver");
const tablaVentas = document.getElementById("tablaVentas");

// --- Eventos ---
btnNuevaVenta.addEventListener("click", () => (window.location.href = "detalle_ventas.html"));
btnVolver.addEventListener("click", () => (window.location.href = "index.html"));

// --- Cargar ventas ---
async function cargarVentas() {
  const { data, error } = await supabase
    .from("ventas")
    .select("*")
    .order("id_venta", { ascending: false });

  if (error) {
    alert("Error al cargar ventas: " + error.message);
    return;
  }

  tablaVentas.innerHTML = "";

  data.forEach((v) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.fecha}</td>
      <td>${v.cliente}</td>
      <td>${v.medio_pago || "-"}</td>
      <td>$${v.total?.toFixed(2) || "0.00"}</td>
      <td>${v.responsable || "-"}</td>
      <td>
        <button class="btn-ver" onclick="verDetalle(${v.id_venta})">👁 Ver</button>
        <button class="btn-eliminar" onclick="eliminarVenta(${v.id_venta})">🗑 Eliminar</button>
      </td>
    `;
    tablaVentas.appendChild(tr);
  });
}

// --- Redirigir a detalle ---
window.verDetalle = (id_venta) => {
  window.location.href = `detalle_ventas.html?id_venta=${id_venta}`;
};

// --- Eliminar venta ---
window.eliminarVenta = async (id_venta) => {
  if (!confirm("¿Seguro que quieres eliminar esta venta? Se borrarán también sus productos.")) {
    return;
  }

  // Primero eliminamos los detalles asociados
  const { error: errorDetalle } = await supabase
    .from("detalle_venta")
    .delete()
    .eq("id_venta", id_venta);

  if (errorDetalle) {
    alert("Error al eliminar detalles: " + errorDetalle.message);
    return;
  }

  // Luego eliminamos la venta
  const { error: errorVenta } = await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id_venta);

  if (errorVenta) {
    alert("Error al eliminar venta: " + errorVenta.message);
    return;
  }

  alert("🗑 Venta eliminada correctamente");
  cargarVentas();
};

// --- Ejecutar ---
cargarVentas();

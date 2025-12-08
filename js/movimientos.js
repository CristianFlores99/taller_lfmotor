import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Elementos del DOM
const cuerpoTabla = document.getElementById("cuerpoTabla");
const modal = document.getElementById("modalMovimiento");
const cerrarModal = document.getElementById("cerrarModal");
const form = document.getElementById("formMovimiento");
const btnNuevo = document.getElementById("btnNuevo");
const btnVolver = document.getElementById("btnVolver");
const btnFiltrar = document.getElementById("btnFiltrar");

const buscarRepuesto = document.getElementById("buscarRepuesto");
const fechaDesde = document.getElementById("fechaDesde");
const fechaHasta = document.getElementById("fechaHasta");

document.addEventListener("DOMContentLoaded", cargarMovimientos);
btnNuevo.addEventListener("click", () => modal.style.display = "flex");
cerrarModal.addEventListener("click", () => modal.style.display = "none");
btnVolver.addEventListener("click", () => window.location.href = "index.html");
btnFiltrar.addEventListener("click", aplicarFiltros);

window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// 🔹 Cargar movimientos al iniciar
async function cargarMovimientos(filtros = {}) {
  let query = supabase
    .from("movimientos_stock")
    .select("*, articulos(codigo, descripcion)")
    .order("fecha", { ascending: false });

  // Aplicar filtros
  if (filtros.repuesto) {
    query = query.ilike("articulos.descripcion", `%${filtros.repuesto}%`);
  }

  if (filtros.desde) {
    query = query.gte("fecha", filtros.desde);
  }

  if (filtros.hasta) {
    // Ajuste: incluir todo el día final
    const hastaFinDia = new Date(filtros.hasta);
    hastaFinDia.setHours(23, 59, 59, 999);
    query = query.lte("fecha", hastaFinDia.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error cargando movimientos:", error);
    return;
  }

  cuerpoTabla.innerHTML = "";
  if (data.length === 0) {
    cuerpoTabla.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.7;">No se encontraron movimientos</td></tr>`;
    return;
  }

  data.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(m.fecha).toLocaleString()}</td>
      <td>${m.articulos?.descripcion || "—"}</td>
      <td style="color:${m.tipo === "entrada" ? "#10b981" : "#f87171"}">
        ${m.tipo === "entrada" ? "📥 Entrada" : "📤 Salida"}
      </td>
      <td>${m.cantidad}</td>
      <td>${m.motivo || "-"}</td>
      <td>${m.responsable || "-"}</td>
    `;
    cuerpoTabla.appendChild(tr);
  });
}

// 🔹 Aplicar filtros al presionar el botón
function aplicarFiltros() {
  const filtros = {
    repuesto: buscarRepuesto.value.trim(),
    desde: fechaDesde.value ? new Date(fechaDesde.value).toISOString() : null,
    hasta: fechaHasta.value ? new Date(fechaHasta.value).toISOString() : null,
  };
  cargarMovimientos(filtros);
}

// 🔹 Guardar un nuevo movimiento
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const movimiento = {
    id_articulo: parseInt(id_articulo.value),
    tipo: tipo.value,
    cantidad: parseInt(cantidad.value),
    motivo: motivo.value,
    responsable: responsable.value,
    fecha: new Date().toISOString()
  };

  const { error } = await supabase.from("movimientos_stock").insert([movimiento]);
  if (error) {
    alert("❌ Error guardando movimiento: " + error.message);
    return;
  }

  alert("✅ Movimiento guardado correctamente");
  modal.style.display = "none";
  form.reset();
  cargarMovimientos();
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async () => {
  const idVenta = new URLSearchParams(window.location.search).get("id");

  if (!idVenta) {
    alert("No llegó el ID de la venta.");
    return;
  }

  // ------------------------------
  //   1) Obtener la venta
  // ------------------------------
  const { data: venta, error: err1 } = await supabase
    .from("ventas")
    .select("*")
    .eq("id_venta", idVenta)
    .single();

  if (err1) {
    console.error("Error obteniendo venta:", err1);
    alert("Error al cargar la venta.");
    return;
  }

  // Mostrar datos principales
  document.getElementById("fecha").textContent = venta.fecha;
  document.getElementById("cliente").textContent = venta.cliente;
  document.getElementById("medio_pago").textContent = venta.medio_pago;
  document.getElementById("responsable").textContent = venta.responsable;
  document.getElementById("observaciones").textContent =
    venta.observaciones ?? "";

  // ------------------------------
  //   2) Obtener detalle de venta
  // ------------------------------
  const { data: detalle, error: err2 } = await supabase
    .from("detalle_venta")
    .select("*, articulos(*)")
    .eq("id_venta", idVenta);

  if (err2) {
    console.error("Error obteniendo detalle:", err2);
    alert("Error al cargar el detalle.");
    return;
  }

  const tbody = document.getElementById("detalle-body");

  let total = 0;

  detalle.forEach((item) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${item.articulos?.codigo ?? ""}</td>
      <td>${item.articulos?.descripcion ?? ""}</td>
      <td>${item.cantidad}</td>
      <td>$${Number(item.precio_unitario).toFixed(2)}</td>
      <td>$${Number(item.subtotal).toFixed(2)}</td>
    `;

    tbody.appendChild(fila);

    total += Number(item.subtotal);
  });

  document.getElementById("total").textContent = "$" + total.toFixed(2);
});

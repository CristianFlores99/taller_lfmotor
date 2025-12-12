import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function cargarBoleta() {
  const params = new URLSearchParams(window.location.search);
  const idVenta = params.get("id_venta");

  if (!idVenta) {
    alert("No se recibió id_venta");
    return;
  }

  // --- CABECERA ---
  const { data: venta, error: errVenta } = await supabase
    .from("ventas")
    .select("*")
    .eq("id_venta", idVenta)
    .single();

  if (errVenta || !venta) {
    alert("Error cargando la venta");
    return;
  }

  document.getElementById("fecha").textContent =
    new Date(venta.fecha).toLocaleDateString("es-AR");

  document.getElementById("numero").textContent = "N° " + venta.id_venta;

  // --- DETALLE ---
  const { data: items, error: errItems } = await supabase
    .from("detalle_venta")
    .select(`
        cantidad,
        precio_unitario,
        articulos:id_articulo (
            codigo,
            descripcion,
            marca,
            precio_venta
        )
    `)
    .eq("id_venta", idVenta);

  if (errItems) {
    console.error(errItems);
    alert("Error trayendo detalle de artículos");
    return;
  }

  let contenedor = document.getElementById("items");
  let subtotal = 0;

  items.forEach(item => {

    const articulo = item.articulos;

    const unit = item.precio_unitario || articulo?.precio_venta || 0;
    const total = unit * item.cantidad;
    subtotal += total;

    const fila = document.createElement("div");
    fila.classList.add("fila");

    fila.innerHTML = `
      <div class="c1">${item.cantidad}</div>
      <div class="c2">${articulo?.codigo || "-"}</div>
      <div class="c3">${articulo?.descripcion || "-"} (${articulo?.marca || "-"})</div>
      <div class="c4">${unit.toFixed(2)}</div>
      <div class="c5">${total.toFixed(2)}</div>
    `;

    contenedor.appendChild(fila);
  });

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("total").textContent = subtotal.toFixed(2);
}

// --- GENERAR PDF ---
document.getElementById("imprimirPDF").addEventListener("click", async () => {
  const elemento = document.getElementById("areaBoleta");

  const canvas = await html2canvas(elemento, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jspdf.jsPDF("p", "pt", "a4");

  let ancho = pdf.internal.pageSize.getWidth();
  let alto = canvas.height * (ancho / canvas.width);

  pdf.addImage(imgData, "PNG", 0, 0, ancho, alto);
  pdf.save("boleta.pdf");
});

cargarBoleta();

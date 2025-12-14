import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================================
// SUPABASE
// =====================================
const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";
const supabase = createClient(supabaseUrl, supabaseKey);

function formatearFecha(fechaRaw) {
  if (!fechaRaw) {
    const f = new Date();
    return f.toLocaleDateString("es-AR");
  }

  // Si ya viene como string YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(fechaRaw)) {
    const f = new Date(fechaRaw + "T00:00:00");
    return f.toLocaleDateString("es-AR");
  }

  // Si viene como timestamp
  const f = new Date(fechaRaw);
  if (!isNaN(f.getTime())) {
    return f.toLocaleDateString("es-AR");
  }

  // Último recurso
  return fechaRaw;
}


async function cargarBoleta() {
    const params = new URLSearchParams(window.location.search);
    const idVenta = params.get("id_venta");

    const { data: venta } = await supabase
        .from("ventas")
        .select("*")
        .eq("id_venta", idVenta)
        .single();

    document.getElementById("numero").textContent = "N° " + venta.id_venta;
    document.getElementById("fecha").textContent = formatearFecha(venta.fecha)

    document.getElementById("cliente").textContent = venta.cliente || "-";
    document.getElementById("dni").textContent = venta.dni || "-";
    document.getElementById("medio_pago").textContent = venta.medio_pago || "-";

    const { data: items } = await supabase
        .from("detalle_venta")
        .select(`
            cantidad,
            precio_unitario,
            articulos:id_articulo (
                codigo,
                descripcion,
                marca,
                subrubro
            )
        `)
        .eq("id_venta", idVenta);

    let contenedor = document.getElementById("items");
    let subtotal = 0;

    items.forEach(item => {
        const art = item.articulos;
        const sub = art?.subrubro ? ` (${art.subrubro})` : "..";
        const desc = `${art.descripcion}${sub}`;

        const unit = item.precio_unitario || 0;
        const total = unit * item.cantidad;
        subtotal += total;

        const fila = document.createElement("div");
        fila.classList.add("fila");

        fila.innerHTML = `
            <div class="c1">${item.cantidad}</div>
            <div class="c2">${art.codigo}</div>
            <div class="c3">${desc}</div>
            <div class="c4">${unit.toFixed(2)}</div>
            <div class="c5">${total.toFixed(2)}</div>
        `;

        contenedor.appendChild(fila);
    });

//    document.getElementById("subtotal").textContent = subtotal.toFixed(2);
    document.getElementById("total").textContent = subtotal.toFixed(2);
}

// PDF
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
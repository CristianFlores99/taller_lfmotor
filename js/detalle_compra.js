import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

// Tomar ID desde la URL
const params = new URLSearchParams(window.location.search);
const id_compra = params.get("id");

const numFactura = document.getElementById("numFactura");
const fecha = document.getElementById("fecha");
const proveedor = document.getElementById("proveedor");
const total = document.getElementById("total");
const tablaDetalle = document.getElementById("tablaDetalle");

document.addEventListener("DOMContentLoaded", async () => {
    if (!id_compra) {
        alert("No se recibió una factura válida");
        return;
    }

    await cargarFactura();
    await cargarDetalle();
});

// -------------------------------------
// Cargar datos de la factura
// -------------------------------------
async function cargarFactura() {
    const { data, error } = await supabase
        .from("facturas_proveedor")
        .select(`
            *,
            proveedores (nombre)
        `)
        .eq("id_compra", id_compra)
        .single();

    if (error) {
        alert("Error cargando la factura");
        return;
    }

    numFactura.textContent = data.codigo_alfanumerico || "SIN FACTURA";
    fecha.textContent = data.fecha;
    proveedor.textContent = data.proveedores ? data.proveedores.nombre : "Socio / Sin proveedor";
    total.textContent = "$ " + Number(data.monto_total).toFixed(2);
}

// -------------------------------------
// Cargar detalle de artículos
// -------------------------------------
async function cargarDetalle() {
    const { data, error } = await supabase
        .from("compra_detalle")
        .select(`
            *,
            articulos (descripcion, codigo)
        `)
        .eq("id_compra", id_compra);

    if (error) {
        alert("Error cargando detalle");
        return;
    }

    tablaDetalle.innerHTML = "";

    data.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.articulos.codigo}</td>
            <td>${item.articulos.descripcion}</td>
            <td>${item.cantidad}</td>
            <td>$${item.precio_unitario.toFixed(2)}</td>
            <td>$${item.subtotal.toFixed(2)}</td>
        `;
        tablaDetalle.appendChild(tr);
    });
}

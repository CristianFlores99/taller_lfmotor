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
const subtotalF = document.getElementById("subtotal");
const ivaF = document.getElementById("iva");
const saldoPendiente = document.getElementById("saldoPendiente");
const notas = document.getElementById("notas");


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

    subtotalF.textContent = "$ " + Number(data.subtotal).toFixed(2);
    ivaF.textContent = "$ " + Number(data.IVA).toFixed(2);
    saldoPendiente.textContent = "$ " + Number(data.saldo_pendiente).toFixed(2);
    notas.textContent = data.notas && data.notas.trim() !== "" ? data.notas : "—";

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
window.exportarPDF = async function () {

    // Primero recargamos los datos necesarios
    const { data: factura } = await supabase
        .from("facturas_proveedor")
        .select(`
            *,
            proveedores (nombre)
        `)
        .eq("id_compra", id_compra)
        .single();

    const { data: detalles } = await supabase
        .from("compra_detalle")
        .select(`
            *,
            articulos (descripcion, codigo)
        `)
        .eq("id_compra", id_compra);

    // Armado del documento PDF
    const doc = {
        content: [
            { text: "Factura del Proveedor", style: "header" },

            {
                columns: [
                    [
                        { text: `Factura Nº: ${factura.codigo_alfanumerico}` },
                        { text: `Fecha: ${factura.fecha}` },
                        { text: `Proveedor: ${factura.proveedores?.nombre ?? "—"}` },
                    ],
                    [
                        { text: `Subtotal: $${Number(factura.subtotal).toFixed(2)}` },
                        { text: `IVA: $${Number(factura.IVA).toFixed(2)}` },
                        { text: `Total: $${Number(factura.monto_total).toFixed(2)}` },
                    ]
                ]
            },

            { text: "\n" },

            {
                table: {
                    widths: ["auto", "*", "auto", "auto", "auto"],
                    body: [
                        [
                            { text: "Código", bold: true },
                            { text: "Artículo", bold: true },
                            { text: "Cantidad", bold: true },
                            { text: "Precio", bold: true },
                            { text: "Importe", bold: true },
                        ],
                        ...detalles.map(d => [
                            d.articulos.codigo,
                            d.articulos.descripcion,
                            d.cantidad,
                            "$" + Number(d.precio_unitario).toFixed(2),
                            "$" + Number(d.subtotal).toFixed(2),
                        ])
                    ]
                }
            },

            { text: "\n" },
            {
                text: `Saldo pendiente: $${Number(factura.saldo_pendiente).toFixed(2)}`,
                bold: true,
                color: factura.saldo_pendiente > 0 ? "orange" : "green"
            },

            { text: "\nNotas:\n" + (factura.notas || "—") }
        ],

        styles: {
            header: {
                fontSize: 18,
                bold: true,
                marginBottom: 10
            }
        }
    };

    // Descargar el PDF
    pdfMake.createPdf(doc).download(`Factura_${factura.codigo_alfanumerico}.pdf`);
};

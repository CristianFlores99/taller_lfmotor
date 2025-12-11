import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);


const tbody = document.getElementById("tabla_facturas_body");
const buscarInput = document.getElementById("buscar");
const btnNueva = document.getElementById("btnNueva");

btnNueva.addEventListener("click", () => {
    window.location.href = "compra.html";
});

// --------------------------------------------------
// Cargar facturas desde Supabase
// --------------------------------------------------
async function cargarFacturas() {
    const { data, error } = await supabase
        .from("facturas_proveedor")
        .select(`
            *,
            proveedor:proveedores(nombre)
        `)
        .order("fecha", { ascending: false });

    if (error) {
        console.error(error);
        alert("Error cargando facturas");
        return;
    }

    renderTabla(data);
    window.facturasOriginal = data; // para filtrar luego
}

// --------------------------------------------------
// Renderizar tabla
// --------------------------------------------------
function renderTabla(lista) {
    tbody.innerHTML = "";

    lista.forEach(f => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${f.proveedor?.nombre || "Sin proveedor"}</td>
            <td>${f.codigo_alfanumerico || "-"}</td>
            <td>${f.fecha}</td>
            <td>$${f.monto_total}</td>
            <td>
                <button class="btn-detalle" onclick="verDetalle(${f.id_compra})">Ver</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// --------------------------------------------------
// Filtro en vivo
// --------------------------------------------------
buscarInput.addEventListener("input", () => {
    const texto = buscarInput.value.toLowerCase();
    const filtradas = window.facturasOriginal.filter(f =>
        (f.proveedor?.nombre || "").toLowerCase().includes(texto) ||
        (f.codigo_alfanumerico || "").toLowerCase().includes(texto) ||
        (f.fecha || "").toLowerCase().includes(texto)
    );

    renderTabla(filtradas);
});

// --------------------------------------------------
// Ver detalle
// --------------------------------------------------
window.verDetalle = function (id) {
    window.location.href = `detalle_compra.html?id=${id}`;
};

// Ejecutar carga inicial
cargarFacturas();

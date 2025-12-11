import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

// ELEMENTOS HTML
const proveedor = document.getElementById("proveedor");
const numFactura = document.getElementById("numFactura");
const fechaFactura = document.getElementById("fechaFactura");
const notasInput = document.getElementById("notas");

const articuloSel = document.getElementById("articulo");
const cantidadInput = document.getElementById("cantidad");
const precioInput = document.getElementById("precioUnitario");

const tablaDetalle = document.querySelector("#tablaDetalle tbody");
const totalCompra = document.getElementById("totalCompra");

const btnAgregar = document.getElementById("btnAgregar");
const btnGuardar = document.getElementById("btnGuardar");

let detalle = [];
let total = 0;

const listaArticulos = document.getElementById("listaArticulos");

// Cargar combos
document.addEventListener("DOMContentLoaded", async () => {
  await cargarProveedores();
  await cargarArticulos();
});

// --------------------------------------
// Cargar proveedores
// --------------------------------------
async function cargarProveedores() {
  const { data, error } = await supabase
    .from("proveedores")
    .select("*")
    .order("nombre");

  if (error) return alert("Error cargando proveedores");

  proveedor.innerHTML = `<option value="">-- Seleccione proveedor --</option>`;

  data.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id_proveedor;
    opt.textContent = p.nombre;
    proveedor.appendChild(opt);
  });
}

// --------------------------------------
// Cargar artículos
// --------------------------------------
async function cargarArticulos() {
  const { data, error } = await supabase
    .from("articulos")
    .select("*")
    .order("descripcion");

  if (error) return alert("Error cargando artículos");

  listaArticulos.innerHTML = "";

  data.forEach(a => {
    const option = document.createElement("option");
    option.value = `${a.codigo} - ${a.descripcion}`;
    option.dataset.id = a.id_articulo;
    listaArticulos.appendChild(option);
  });
}


// --------------------------------------
// Agregar artículo al detalle visual
// --------------------------------------
btnAgregar.addEventListener("click", () => {
  // Obtener el texto escrito en el input
  const texto = articuloInput.value.trim();

  // Buscar cuál option coincide
  const option = [...listaArticulos.options].find(opt => opt.value === texto);

  if (!option) return alert("Seleccione un artículo válido.");

  // Recuperar ID del artículo
  const id_articulo = option.dataset.id;

  // Separar código y descripción
  const [codigo, descripcion] = texto.split(" - ");
  const cantidad = parseInt(cantidadInput.value);
  const precio = parseFloat(precioInput.value);

  if (!id_articulo) return alert("Seleccione un artículo");
  if (!cantidad || cantidad <= 0) return alert("Ingrese cantidad");
  if (!precio || precio <= 0) return alert("Ingrese precio válido");

  const subtotal = cantidad * precio;

  detalle.push({
    id_articulo,
    codigo,
    descripcion,
    cantidad,
    precio_unitario: precio,
    subtotal
  });

  total += subtotal;
  actualizarTabla();
});

// --------------------------------------
// Render tabla
// --------------------------------------
function actualizarTabla() {
  tablaDetalle.innerHTML = "";

  detalle.forEach((item, index) => {
    tablaDetalle.innerHTML += `
      <tr>
        <td>${item.descripcion}</td>
        <td>${item.cantidad}</td>
        <td>$${item.precio_unitario.toFixed(2)}</td>
        <td>$${item.subtotal.toFixed(2)}</td>
        <td><button onclick="quitarItem(${index})">❌Eliminar</button></td>
      </tr>
    `;
  });

  totalCompra.textContent = total.toFixed(2);
}

window.quitarItem = function (i) {
  total -= detalle[i].subtotal;
  detalle.splice(i, 1);
  actualizarTabla();
};

// --------------------------------------
// Guardar compra
// --------------------------------------
btnGuardar.addEventListener("click", async () => {
  if (detalle.length === 0) return alert("Debe agregar artículos.");

  const compra = {
    id_proveedor: proveedor.value || null,
    codigo_alfanumerico: numFactura.value || "SIN_FACTURA",
    fecha: fechaFactura.value || new Date().toISOString(),
    monto_total: total,
    saldo_pendiente: total,
    notas: notasInput.value || ""
  };


  const { data: factura, error } = await supabase
    .from("facturas_proveedor")
    .insert([compra])
    .select()
    .single();

  if (error) return alert("Error guardando compra");

  // Procesar artículos (SOLO aumentar stock si existen)
  for (const item of detalle) {
    await procesarArticuloExistente(factura.id_compra, item);
  }

  alert("Compra registrada correctamente.");
  window.location.reload();
});

// --------------------------------------
// Buscar artículo por código
// --------------------------------------
async function buscarArticuloPorCodigo(codigo) {
  const { data } = await supabase
    .from("articulos")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();

  return data;
}

// --------------------------------------
// Actualizar stock
// --------------------------------------
async function actualizarStock(id_articulo, cantidad) {
  const { data: actual } = await supabase
    .from("articulos")
    .select("stock_actual")
    .eq("id_articulo", id_articulo)
    .single();

  const nuevoStock = actual.stock_actual + cantidad;

  await supabase
    .from("articulos")
    .update({ stock_actual: nuevoStock })
    .eq("id_articulo", id_articulo);
}

// --------------------------------------
// Registrar detalle compra
// --------------------------------------
async function registrarDetalleCompra(id_compra, item) {
  await supabase.from("compra_detalle").insert([
    {
      id_compra,
      id_articulo: item.id_articulo,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal
    }
  ]);
}

// --------------------------------------
// SOLO manejo de artículos existentes Con aumento de stock(automatizado)
// --------------------------------------
/*
async function procesarArticuloExistente(id_compra, item) {
  const articulo = await buscarArticuloPorCodigo(item.codigo);

  if (!articulo) {
    console.warn(`Artículo NO registrado: ${item.codigo} → NO se crea`);
    return; // no se crea nada
  }

  await actualizarStock(articulo.id_articulo, item.cantidad);
  await registrarDetalleCompra(id_compra, item);
}
*/
// Sin aumento de stock (sin automatizacion)
async function procesarArticuloExistente(id_compra, item) {
  await registrarDetalleCompra(id_compra, item);
}
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Elementos ---
const btnVolver = document.getElementById("btnVolver");
const btnAgregarProducto = document.getElementById("btnAgregarProducto");
const btnGuardarVenta = document.getElementById("btnGuardarVenta");
const tablaProductos = document.getElementById("tablaProductos");
const totalVenta = document.getElementById("totalVenta");

const cliente = document.getElementById("cliente");
const medio_pago = document.getElementById("medio_pago");
const responsable = document.getElementById("responsable");
const observaciones = document.getElementById("observaciones");

// --- Estado temporal ---
let productos = []; // {id_repuesto, descripcion, cantidad, precio_unitario, subtotal}
let idVentaActual = null;

// --- Eventos ---
btnVolver.addEventListener("click", () => (window.location.href = "ventas.html"));
btnAgregarProducto.addEventListener("click", agregarProducto);
btnGuardarVenta.addEventListener("click", guardarVenta);

// --- Detectar si venimos con ID en la URL ---
const params = new URLSearchParams(window.location.search);
idVentaActual = params.get("id_venta");

if (idVentaActual) {
  cargarVenta(idVentaActual);
  btnAgregarProducto.style.display = "none";
  btnGuardarVenta.style.display = "none";
}

// --- Función para agregar producto (solo si es nueva venta) ---
async function agregarProducto() {
  const { data: repuestos, error } = await supabase
    .from("repuestos")
    .select("id_repuesto, descripcion, precio_venta");

  if (error) {
    alert("Error obteniendo repuestos: " + error.message);
    return;
  }

  const id_repuesto = prompt(
    "Ingrese el ID del repuesto o deje vacío para cancelar:\n" +
      repuestos.map((r) => `${r.id_repuesto} - ${r.descripcion}`).join("\n")
  );
  if (!id_repuesto) return;

  const rep = repuestos.find((r) => r.id_repuesto == id_repuesto);
  if (!rep) return alert("ID no encontrado.");

  const cantidad = parseInt(prompt("Cantidad vendida:", "1")) || 1;
  const precio = parseFloat(rep.precio_venta) || 0;
  const subtotal = cantidad * precio;

  productos.push({
    id_repuesto: rep.id_repuesto,
    descripcion: rep.descripcion,
    cantidad,
    precio_unitario: precio,
    subtotal,
  });

  renderTabla();
}

// --- Renderizar tabla ---
function renderTabla() {
  tablaProductos.innerHTML = "";
  let total = 0;

  productos.forEach((p) => {
    total += p.subtotal;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.descripcion}</td>
      <td>${p.cantidad}</td>
      <td>$${p.precio_unitario.toFixed(2)}</td>
      <td>$${p.subtotal.toFixed(2)}</td>
    `;
    tablaProductos.appendChild(tr);
  });

  totalVenta.textContent = `Total: $${total.toFixed(2)}`;
}

// --- Guardar venta + detalles ---
async function guardarVenta() {
  if (productos.length === 0) return alert("Debe agregar al menos un producto.");
  if (!cliente.value.trim()) return alert("Debe ingresar un cliente.");

  const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

  // 1️⃣ Insertar venta
  const { data: venta, error: errVenta } = await supabase
    .from("ventas")
    .insert([
      {
        fecha: new Date().toISOString().split("T")[0],
        cliente: cliente.value.trim(),
        medio_pago: medio_pago.value.trim(),
        responsable: responsable.value.trim(),
        observaciones: observaciones.value.trim(),
        total,
      },
    ])
    .select();

  if (errVenta) {
    alert("Error guardando venta: " + errVenta.message);
    return;
  }

  const idVenta = venta[0].id_venta;

  // 2️⃣ Insertar detalles
  const detalles = productos.map((p) => ({
    id_venta: idVenta,
    id_repuesto: p.id_repuesto,
    cantidad: p.cantidad,
    precio_unitario: p.precio_unitario,
    subtotal: p.subtotal,
  }));

  const { error: errDetalle } = await supabase.from("detalle_venta").insert(detalles);

  if (errDetalle) {
    alert("Error guardando detalle: " + errDetalle.message);
    return;
  }

  alert("✅ Venta guardada correctamente.");
  window.location.href = "ventas.html";
}

// --- Cargar venta existente ---
async function cargarVenta(idVenta) {
  const { data: venta, error: errVenta } = await supabase
    .from("ventas")
    .select("*")
    .eq("id_venta", idVenta)
    .single();

  if (errVenta) {
    alert("Error cargando venta: " + errVenta.message);
    return;
  }

  cliente.value = venta.cliente;
  medio_pago.value = venta.medio_pago;
  responsable.value = venta.responsable;
  observaciones.value = venta.observaciones;

  // Bloquear edición
  [cliente, medio_pago, responsable, observaciones].forEach((el) => (el.disabled = true));

  const { data: detalles, error: errDetalle } = await supabase
    .from("detalle_venta")
    .select("*, repuestos(descripcion)")
    .eq("id_venta", idVenta);

  if (errDetalle) {
    alert("Error cargando detalle: " + errDetalle.message);
    return;
  }

  productos = detalles.map((d) => ({
    id_repuesto: d.id_repuesto,
    descripcion: d.repuestos.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    subtotal: d.subtotal,
  }));

  renderTabla();
}

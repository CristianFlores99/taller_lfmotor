import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

// --- Agregar producto ---
let articulosCache = [];
let articuloSeleccionado = null;

async function agregarProducto() {
  const { data: repuestos, error } = await supabase
    .from("articulos")
    .select("id_articulo, codigo, descripcion, precio_venta, stock_actual");

  if (error) {
    alert("Error obteniendo artículos: " + error.message);
    return;
  }

  articulosCache = repuestos;

  // Mostrar modal
  document.getElementById("modalAgregar").style.display = "flex";

  const lista = document.getElementById("listaArticulos");
  lista.innerHTML = "";

  repuestos.forEach((r) => {
    const div = document.createElement("div");
    div.className = "item-articulo";
    div.dataset.id = r.id_articulo;
    div.innerHTML = `
      <strong>${r.codigo}</strong> - ${r.descripcion}<br>
      <small>Stock: ${r.stock_actual} | $${r.precio_venta}</small>
    `;
    div.onclick = () => seleccionarArticulo(div, r);
    lista.appendChild(div);
  });

  document.getElementById("buscarProducto").onkeyup = filtrarArticulos;

  document.getElementById("btnCancelarModal").onclick = cerrarModal;
  document.getElementById("btnConfirmarProducto").onclick = confirmarAgregar;
}

function seleccionarArticulo(div, articulo) {
  document.querySelectorAll(".item-articulo").forEach(i => i.classList.remove("selected"));
  div.classList.add("selected");
  articuloSeleccionado = articulo;
}

function filtrarArticulos() {
  const texto = this.value.toLowerCase();
  const lista = document.getElementById("listaArticulos");

  lista.innerHTML = "";

  articulosCache
    .filter(a =>
      a.codigo.toLowerCase().includes(texto) ||
      a.descripcion.toLowerCase().includes(texto)
    )
    .forEach(a => {
      const div = document.createElement("div");
      div.className = "item-articulo";
      div.dataset.id = a.id_articulo;
      div.innerHTML = `
        <strong>${a.codigo}</strong> - ${a.descripcion}<br>
        <small>Stock: ${a.stock_actual} | $${a.precio_venta}</small>
      `;
      div.onclick = () => seleccionarArticulo(div, a);
      lista.appendChild(div);
    });
}

function cerrarModal() {
  document.getElementById("modalAgregar").style.display = "none";
  articuloSeleccionado = null;
}

function confirmarAgregar() {
  if (!articuloSeleccionado) {
    alert("Debe seleccionar un artículo.");
    return;
  }

  const cant = parseInt(document.getElementById("cantidadProducto").value);
  if (cant <= 0) {
    alert("Cantidad inválida.");
    return;
  }

  if (cant > articuloSeleccionado.stock_actual) {
    alert("No hay suficiente stock.");
    return;
  }

  productos.push({
    id_articulo: articuloSeleccionado.id_articulo,
    codigo: articuloSeleccionado.codigo,
    descripcion: articuloSeleccionado.descripcion,
    cantidad: cant,
    precio_unitario: articuloSeleccionado.precio_venta,
    subtotal: cant * articuloSeleccionado.precio_venta
  });

  cerrarModal();
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
    <td>${p.codigo}</td>
      <td>${p.descripcion}</td>
      <td>${p.cantidad}</td>
      <td>$${p.precio_unitario.toFixed(2)}</td>
      <td>$${p.subtotal.toFixed(2)}</td>
    `;
    tablaProductos.appendChild(tr);
  });

  totalVenta.textContent = `Total: $${total.toFixed(2)}`;
}

// --- Guardar venta ---
async function guardarVenta() {
  const clienteVal = cliente.value.trim();
  const medioVal = medio_pago.value.trim();
  const respVal = responsable.value.trim();
  const obsVal = observaciones.value.trim();

  if (!clienteVal || productos.length === 0) {
    alert("⚠️ Debes ingresar un cliente y al menos un producto.");
    return;
  }

  const total = productos.reduce((acc, p) => acc + p.subtotal, 0);

  // Insertar venta
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert([
      {
        fecha: new Date(),
        cliente: clienteVal,
        medio_pago: medioVal,
        responsable: respVal,
        observaciones: obsVal,
        total,
      },
    ])
    .select()
    .single();

  if (ventaError) {
    alert("❌ Error al guardar venta: " + ventaError.message);
    return;
  }

  // Insertar detalles
  const detalles = productos.map((p) => ({
    id_venta: venta.id_venta,
    id_articulo: p.id_articulo,
    cantidad: p.cantidad,
    precio_unitario: p.precio_unitario,
    subtotal: p.subtotal,
  }));

  const { error: detalleError } = await supabase
    .from("detalle_venta")
    .insert(detalles);

  if (detalleError) {
    alert("❌ Error al guardar detalles: " + detalleError.message);
    return;
  }

  // 🔹 Descontar stock y registrar movimientos
  for (const p of detalles) {
    // Actualizar stock en repuestos
    const { data: repuesto, error: stockError } = await supabase
      .from("articulos")
      .select("stock_actual")
      .eq("id_articulo", p.id_articulo)
      .single();

    if (!stockError && repuesto) {
      const nuevoStock = (repuesto.stock_actual || 0) - p.cantidad;
      await supabase
        .from("articulos")
        .update({ stock_actual: nuevoStock })
        .eq("id_articulo", p.id_articulo);
    }

    // Registrar movimiento
    await supabase.from("movimientos_stock").insert([
      {
        id_articulo: p.id_articulo,
        tipo: "salida",
        cantidad: p.cantidad,
        motivo: `Venta #${venta.id_venta} - ${clienteVal}`,
        responsable: respVal || "Sistema",
        fecha: new Date().toISOString(),
      },
    ]);
  }

  alert("✅ Venta registrada y stock actualizado correctamente.");
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
  [cliente, medio_pago, responsable, observaciones].forEach(
    (el) => (el.disabled = true)
  );

  const { data: detalles, error: errDetalle } = await supabase
    .from("detalle_venta")
    .select("*, articulos(codigo, descripcion)")
    .eq("id_venta", idVenta);

  if (errDetalle) {
    alert("Error cargando detalle: " + errDetalle.message);
    return;
  }

  productos = detalles.map((d) => ({
    id_articulo: d.id_articulo,
    codigo: d.articulos.codigo,
    descripcion: d.articulos.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    subtotal: d.subtotal,
  }));

  renderTabla();
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

// ELEMENTOS HTML (se asume que el HTML que me diste está presente)
const proveedor = document.getElementById("proveedor");
const numFactura = document.getElementById("numFactura");
const fechaFactura = document.getElementById("fechaFactura");
const notasInput = document.getElementById("notas");

const listaArticulos = document.getElementById("listaArticulos");

// tabla y total
const tablaDetalleBody = document.querySelector("#tablaDetalle tbody");
const totalCompra = document.getElementById("totalCompra");

// botones
const btnMostrarForm = document.getElementById("btnMostrarForm"); // lo usaremos para "Agregar+"
const btnGuardar = document.getElementById("btnGuardar");

// estado
let detalle = []; // filas ya "guardadas" en la sesión (antes de persistir en supabase)
let total = 0;

// cuando carga
document.addEventListener("DOMContentLoaded", async () => {
  await cargarProveedores();
  await cargarArticulos();

  // Mover el botón Agregar+ debajo de la tabla para que quede como querías visualmente.
  // Si ya está donde querés, esto no rompe nada (simplemente lo reubica).
  const tabla = document.getElementById("tablaDetalle");
  if (tabla && btnMostrarForm) {
    tabla.insertAdjacentElement("afterend", btnMostrarForm);
    // agregar un contenedor vacío para mantener el layout
    btnMostrarForm.style.margin = "12px 0";
  }

  renderTabla(); // inicial
});

// ---------------------- Cargar proveedores ----------------------
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

// ---------------------- Cargar artículos (datalist) ----------------------
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

// ---------------------- Helpers de conversión ----------------------
function parsePrecio(valor) {
  valor = valor.trim();

  // Si trae COMA → lo pasamos a punto (formato argentino)
  if (valor.includes(",")) {
    valor = valor.replace(/\./g, "");  // elimina separador de miles
    valor = valor.replace(",", ".");   // coma a punto
  }

  // Si NO trae coma → puede venir como 9360.90
  else {
    // Si hay más de un punto → era separador de miles: 9.360.90 → 9360.90
    const partes = valor.split(".");
    if (partes.length > 2) {
      const decimal = partes.pop();
      valor = partes.join("") + "." + decimal;
    }
  }

  return parseFloat(valor);
}


function formatMoney(num) {
  return Number(num).toFixed(2);
}

// ---------------------- Evento Agregar+ (crea una fila editable) ----------------------
btnMostrarForm.addEventListener("click", () => {
  // siempre creamos una fila editable al final de la tabla (antes de la fila Add)
  crearFilaEditable(); // sin índice -> nueva
});

// ---------------------- Crear fila editable en la tabla ----------------------
function crearFilaEditable(editIndex = null, prefill = null) {
  // editIndex: si es número, indica que estamos editando la fila detalle[editIndex]
  // prefill: objeto {codigo, descripcion, cantidad, precio_unitario} si queremos prellenar

  const tr = document.createElement("tr");
  tr.classList.add("fila-editable");

  // inputs: codigo/descripcion (input with datalist), cantidad, precio
  const codigoInputId = `codigo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cantidadInputId = `cant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const precioInputId = `precio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const codigoVal = prefill ? `${prefill.codigo} - ${prefill.descripcion}` : "";
  const cantidadVal = prefill ? prefill.cantidad : "";
  const precioVal = prefill ? String(prefill.precio_unitario).replace(".", ",") : "";

  tr.innerHTML = `
    <td>
      <input list="listaArticulos" id="${codigoInputId}" class="tbl-input codigo-input" value="${codigoVal}" placeholder="Escribí código o descripción..." />
    </td>
    <td>
      <input type="text" class="tbl-input descripcion-input" value="${prefill ? prefill.descripcion : ""}" placeholder="Descripción (opcional)" />
    </td>
    <td>
      <input type="number" id="${cantidadInputId}" class="tbl-input cantidad-input" min="1" value="${cantidadVal}" />
    </td>
    <td>
      <input type="text" id="${precioInputId}" class="tbl-input precio-input" placeholder="Ej: 9360.90" value="${precioVal}" />
    </td>
    <td class="subtotal-cell">$0.00</td>
    <td class="acciones-cell">
      <button class="guardar-fila">💾 Guardar</button>
      <button class="eliminar-fila">🗑 Eliminar</button>
    </td>
  `;

  // insertar la fila al final (antes del botón Agregar+)
  tablaDetalleBody.appendChild(tr);

  const codigoInput = tr.querySelector(`#${codigoInputId}`);
  const descripcionInput = tr.querySelector(".descripcion-input");
  const cantidadInputLocal = tr.querySelector(".cantidad-input");
  const precioInputLocal = tr.querySelector(".precio-input");
  const subtotalCell = tr.querySelector(".subtotal-cell");
  const btnGuardarFila = tr.querySelector(".guardar-fila");
  const btnEliminarFila = tr.querySelector(".eliminar-fila");

  // Si el usuario selecciona una opción del datalist, intentamos autocompletar descripcion
  codigoInput.addEventListener("change", () => {
    const val = codigoInput.value.trim();
    const opt = [...listaArticulos.options].find(o => o.value === val);
    if (opt) {
      // value format "COD - DESC"
      const [cod, desc] = val.split(" - ");
      descripcionInput.value = desc ? desc : descripcionInput.value;
    }
    actualizarSubtotalUI();
  });

  // recalcular subtotal en cambios
  cantidadInputLocal.addEventListener("input", actualizarSubtotalUI);
  precioInputLocal.addEventListener("input", actualizarSubtotalUI);

  function actualizarSubtotalUI() {
    const cantidad = parseInt(cantidadInputLocal.value) || 0;
    const precio = parsePrecio(precioInput.value);
    const subtotal = cantidad * precio;
    subtotalCell.textContent = `$${formatMoney(subtotal)}`;
  }

  // eliminar fila editable (no está aún en detalle)
  btnEliminarFila.addEventListener("click", () => {
    tr.remove();
    recalcularTotalDesdeDetalle();
  });

  // guardar fila: validar, guardar en detalle (o reemplazar si editIndex != null), y re-render
  btnGuardarFila.addEventListener("click", () => {
    const codigoTexto = codigoInput.value.trim();
    if (!codigoTexto) return alert("Seleccione un artículo válido (codigo - descripción).");

    const opt = [...listaArticulos.options].find(o => o.value === codigoTexto);
    if (!opt) return alert("Seleccione un artículo válido de la lista.");

    const id_articulo = opt.dataset.id;
    const [codigo, descripcionFromCode] = codigoTexto.split(" - ");
    const descripcion = descripcionInput.value.trim() || descripcionFromCode || "";

    const cantidad = parseInt(cantidadInputLocal.value);
    const precio = parsePrecio(precioInputLocal.value);

    if (!cantidad || cantidad <= 0) return alert("Ingrese cantidad válida.");
    if (!precio || precio <= 0) return alert("Ingrese precio válido.");

    const subtotal = cantidad * precio;

    const nuevoItem = {
      id_articulo,
      codigo,
      descripcion,
      cantidad,
      precio_unitario: precio,
      subtotal
    };

    if (typeof editIndex === "number" && editIndex !== null && tr.dataset.editingIndex) {
      // editar fila existente: reemplazar en detalle
      const idx = Number(tr.dataset.editingIndex);
      detalle[idx] = nuevoItem;
    } else if (editIndex !== null && editIndex !== undefined && tr.dataset.editingIndex) {
      // fallback (no debería pasar)
      detalle[Number(tr.dataset.editingIndex)] = nuevoItem;
    } else {
      // nuevo item
      detalle.push(nuevoItem);
    }

    renderTabla(); // re-render como filas "texto"
  });

  // si invocamos la creación de fila con edición de un índice (prefill) guardamos el índice en el tr
  if (Number.isInteger(editIndex) && editIndex !== null) {
    tr.dataset.editingIndex = editIndex;
  }

  // foco en el input codigo
  codigoInput.focus();
  actualizarSubtotalUI();
}

// ---------------------- Renderizar tabla a partir de detalle (filas texto) ----------------------
function renderTabla() {
  // limpiar todas las filas (incluyendo filas editables sueltas)
  tablaDetalleBody.innerHTML = "";

  // crear filas de texto para cada item en detalle
  detalle.forEach((item, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descripcion}</td>
      <td>${item.cantidad}</td>
      <td>$${formatMoney(item.precio_unitario)}</td>
      <td>$${formatMoney(item.subtotal)}</td>
      <td>
        <button class="accion-editar" data-index="${i}">✏ Editar</button>
        <button class="accion-eliminar" data-index="${i}">🗑 Eliminar</button>
      </td>
    `;
    tablaDetalleBody.appendChild(tr);
  });

  // después de las filas guardadas, siempre dejamos una fila "vacía" visual opcional (no necesaria)
  // recalcular total
  recalcularTotalDesdeDetalle();

  // agregar listeners a los botones (editar/eliminar)
  document.querySelectorAll(".accion-editar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = Number(btn.dataset.index);
      // crear una fila editable PRE-LLENADA al final, pero marcándola para editar el índice i
      // para mantener orden visual, reemplazamos la fila de texto por la fila editable en su lugar
      // estrategia: crear fila editable con prefill y store dataset.editingIndex = i, y luego remove row i
      // guardamos el elemento siguiente donde insertar
      const rowToReplace = btn.closest("tr");
      // crear editable prefill
      const prefill = {
        codigo: detalle[i].codigo,
        descripcion: detalle[i].descripcion,
        cantidad: detalle[i].cantidad,
        precio_unitario: detalle[i].precio_unitario
      };
      // crear fila editable y colocarla en la posición del rowToReplace
      const editableTr = crearFilaEditableParaInsertar(i, prefill, rowToReplace);
      // remove old row
      rowToReplace.remove();
    });
  });

  document.querySelectorAll(".accion-eliminar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = Number(btn.dataset.index);
      if (!confirm("Eliminar esta fila?")) return;
      detalle.splice(i, 1);
      renderTabla();
    });
  });
}

// ---------------------- Crear fila editable y reemplazar en la posición dada ----------------------
function crearFilaEditableParaInsertar(editIdx, prefill, insertBeforeTr) {
  // similar a crearFilaEditable, pero retorna el <tr> creado y lo inserta antes de insertBeforeTr
  const tr = document.createElement("tr");
  tr.classList.add("fila-editable");
  tr.dataset.editingIndex = editIdx;

  const codigoInputId = `codigo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cantidadInputId = `cant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const precioInputId = `precio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const codigoVal = prefill ? `${prefill.codigo} - ${prefill.descripcion}` : "";
  const cantidadVal = prefill ? prefill.cantidad : "";
  const precioVal = prefill ? String(prefill.precio_unitario).replace(".", ",") : "";

  tr.innerHTML = `
    <td>
      <input list="listaArticulos" id="${codigoInputId}" class="tbl-input codigo-input" value="${codigoVal}" placeholder="Escribí código o descripción..." />
    </td>
    <td>
      <input type="text" class="tbl-input descripcion-input" value="${prefill ? prefill.descripcion : ""}" placeholder="Descripción (opcional)" />
    </td>
    <td>
      <input type="number" id="${cantidadInputId}" class="tbl-input cantidad-input" min="1" value="${cantidadVal}" />
    </td>
    <td>
      <input type="text" id="${precioInputId}" class="tbl-input precio-input" placeholder="Ej: 9360.90" value="${precioVal}" />
    </td>
    <td class="subtotal-cell">$0.00</td>
    <td class="acciones-cell">
      <button class="guardar-fila">💾 Guardar</button>
      <button class="eliminar-fila">🗑 Eliminar</button>
    </td>
  `;

  // insert before the row that was there
  insertBeforeTr.insertAdjacentElement("beforebegin", tr);

  const codigoInput = tr.querySelector(`#${codigoInputId}`);
  const descripcionInput = tr.querySelector(".descripcion-input");
  const cantidadInputLocal = tr.querySelector(".cantidad-input");
  const precioInputLocal = tr.querySelector(".precio-input");
  const subtotalCell = tr.querySelector(".subtotal-cell");
  const btnGuardarFila = tr.querySelector(".guardar-fila");
  const btnEliminarFila = tr.querySelector(".eliminar-fila");

  function actualizarSubtotalUI() {
    const cantidad = parseInt(cantidadInputLocal.value) || 0;
    const precio = parsePrecio(precioInputLocal.value) || 0;
    const subtotal = cantidad * precio;
    subtotalCell.textContent = `$${formatMoney(subtotal)}`;
  }

  codigoInput.addEventListener("change", () => {
    const val = codigoInput.value.trim();
    const opt = [...listaArticulos.options].find(o => o.value === val);
    if (opt) {
      const [cod, desc] = val.split(" - ");
      descripcionInput.value = desc ? desc : descripcionInput.value;
    }
    actualizarSubtotalUI();
  });

  cantidadInputLocal.addEventListener("input", actualizarSubtotalUI);
  precioInputLocal.addEventListener("input", actualizarSubtotalUI);

  btnEliminarFila.addEventListener("click", () => {
    // si cancelamos edición: colocamos nuevamente la fila original (porque la habíamos removido)
    // simplemente re-renderizamos desde detalle
    if (typeof tr.dataset.editingIndex !== "undefined") {
      renderTabla();
    } else {
      tr.remove();
      recalcularTotalDesdeDetalle();
    }
  });

  btnGuardarFila.addEventListener("click", () => {
    const codigoTexto = codigoInput.value.trim();
    if (!codigoTexto) return alert("Seleccione un artículo válido (codigo - descripción).");
    const opt = [...listaArticulos.options].find(o => o.value === codigoTexto);
    if (!opt) return alert("Seleccione un artículo válido de la lista.");

    const id_articulo = opt.dataset.id;
    const [codigo, descripcionFromCode] = codigoTexto.split(" - ");
    const descripcion = descripcionInput.value.trim() || descripcionFromCode || "";

    const cantidad = parseInt(cantidadInputLocal.value);
    const precio = parsePrecio(precioInputLocal.value);

    if (!cantidad || cantidad <= 0) return alert("Ingrese cantidad válida.");
    if (!precio || precio <= 0) return alert("Ingrese precio válido.");

    const subtotal = cantidad * precio;

    const nuevoItem = {
      id_articulo,
      codigo,
      descripcion,
      cantidad,
      precio_unitario: precio,
      subtotal
    };

    const idx = Number(tr.dataset.editingIndex);
    if (!Number.isNaN(idx)) {
      // reemplazar
      detalle[idx] = nuevoItem;
    } else {
      detalle.push(nuevoItem);
    }

    renderTabla();
  });

  codigoInput.focus();
  actualizarSubtotalUI();

  return tr;
}

// ---------------------- Recalcular total desde detalle ----------------------
function recalcularTotalDesdeDetalle() {
  total = detalle.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  totalCompra.textContent = formatMoney(total);
}

// ---------------------- GUARDAR COMPRA (persistir en Supabase) ----------------------
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

  for (const item of detalle) {
    await registrarDetalleCompra(factura.id_compra, item);
  }

  alert("Compra registrada correctamente.");
  window.location.reload();
});

// ---------------------- Registrar detalle Compra ----------------------
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

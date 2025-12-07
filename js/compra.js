import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async () => {
  const cuerpoCompras = document.getElementById("cuerpoCompras");
  const btnNuevaCompra = document.getElementById("btnNuevaCompra");
  const modalCompra = document.getElementById("modalCompra");
  const cerrarModal = document.getElementById("cerrarModal");
  const formCompra = document.getElementById("formCompra");
  const proveedorSelect = document.getElementById("proveedor");
  const productosDiv = document.getElementById("productosCompra");
  const totalCompraInput = document.getElementById("totalCompra");
  const selectProducto = document.getElementById("selectProducto");
  const cantidadProducto = document.getElementById("cantidadProducto");
  const btnAgregarProducto = document.getElementById("btnAgregarProducto");

  let listaProveedores = [];
  let listaProductos = [];
  let productosCompra = [];

  // Listeners
  btnNuevaCompra.addEventListener("click", ()=> modalCompra.style.display="flex");
  cerrarModal.addEventListener("click", ()=> modalCompra.style.display="none");
  window.addEventListener("click", e => { if(e.target===modalCompra) modalCompra.style.display="none"; });
  btnAgregarProducto.addEventListener("click", agregarProducto);
  formCompra.addEventListener("submit", guardarCompra);

  await cargarProveedores();
  await cargarProductos();
  await cargarCompras();

  async function cargarProveedores(){
    const { data, error } = await supabase.from("proveedores").select("*").order("nombre");
    if(error) return console.error(error);
    listaProveedores = data;
    proveedorSelect.innerHTML = data.map(p=>`<option value="${p.id_proveedor}">${p.nombre}</option>`).join("");
  }

  async function cargarProductos(){
    const { data, error } = await supabase.from("repuestos").select("*").order("descripcion");
    if(error) return console.error(error);
    listaProductos = data;
    selectProducto.innerHTML = data.map(p=>`<option value="${p.id_repuesto}">${p.descripcion} ($${p.precio_venta})</option>`).join("");
  }

  async function cargarCompras(){
    const { data, error } = await supabase.from("compras").select("*").order("fecha",{ascending:false});
    if(error) return console.error(error);
    cuerpoCompras.innerHTML = "";
    data.forEach(c=>{
      const nombreProveedor = listaProveedores.find(p=>p.id_proveedor===c.id_proveedor)?.nombre || "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id_compra}</td>
        <td>${nombreProveedor}</td>
        <td>${new Date(c.fecha).toLocaleDateString()}</td>
        <td>$${c.total?.toFixed(2) || 0}</td>
        <td><a href="detalle_compra.html?id=${c.id_compra}">Detalle</a></td>
      `;
      cuerpoCompras.appendChild(tr);
    });
  }

  function agregarProducto(){
    const id = parseInt(selectProducto.value);
    const cantidad = parseInt(cantidadProducto.value);
    if(!id || cantidad<=0) return;

    const producto = listaProductos.find(p=>p.id_repuesto===id);
    const subtotal = producto.precio_venta * cantidad;
    productosCompra.push({...producto, cantidad, subtotal});
    renderProductos();
  }

  function renderProductos(){
    productosDiv.innerHTML = "";
    let total = 0;
    productosCompra.forEach((p,i)=>{
      total += p.subtotal;
      const div = document.createElement("div");
      div.className = "producto-item";
      div.innerHTML = `
        ${p.descripcion} - Cant: ${p.cantidad} - $${p.subtotal.toFixed(2)}
        <button type="button" data-index="${i}">❌</button>
      `;
      productosDiv.appendChild(div);
      div.querySelector("button").addEventListener("click", ()=>{
        productosCompra.splice(i,1);
        renderProductos();
      });
    });
    totalCompraInput.value = total.toFixed(2);
  }

async function guardarCompra(e){
  e.preventDefault();
  if(!proveedorSelect.value || productosCompra.length===0) return alert("Debe seleccionar proveedor y productos");
  const total = parseFloat(totalCompraInput.value);

  try {
    const { data: compra, error } = await supabase.from("compras").insert([{
      id_proveedor: proveedorSelect.value,
      fecha: new Date(),
      total
    }]).select().single();
    if(error) throw error;

    const detalles = productosCompra.map(p=>({
      id_compra: compra.id_compra,
      id_repuesto: p.id_repuesto,
      cantidad: p.cantidad,
      precio_unitario: p.precio_venta,
      subtotal: p.subtotal
    }));

    const { error: detalleError } = await supabase.from("detalle_compra").insert(detalles);
    if(detalleError) throw detalleError;

    // Actualizar stock y manejar posibles errores
    for(let p of productosCompra){
      try{
        await actualizarStock(p.id_repuesto, p.cantidad);
      }catch(err){
        console.error("Error actualizando stock:", err);
      }
    }

    alert("✅ Compra registrada y stock actualizado");

  } catch(err){
    console.error(err);
    alert("❌ Ocurrió un error al guardar la compra: " + err.message);
  } finally {
    // Esto asegura que el modal siempre se cierra y se limpia la lista
    productosCompra=[];
    productosDiv.innerHTML="";
    totalCompraInput.value="0";
    modalCompra.style.display="none";
    await cargarCompras();
  }
}

});
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async ()=>{
  const cuerpoDetalle = document.getElementById("cuerpoDetalle");
  const params = new URLSearchParams(window.location.search);
  const idCompra = params.get("id");
  if(!idCompra) return alert("ID de compra no encontrado");

  const { data, error } = await supabase.from("detalle_compra").select("*").eq("id_compra", idCompra);
  if(error) return console.error(error);
  cuerpoDetalle.innerHTML = "";
  data.forEach(d=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id_articulo}</td>
      <td>${d.cantidad}</td>
      <td>$${d.precio_unitario}</td>
      <td>$${d.subtotal}</td>
    `;
    cuerpoDetalle.appendChild(tr);
  });
});

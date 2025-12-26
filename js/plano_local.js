import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);

const tituloZona = document.getElementById("tituloZona");
const listaProductos = document.getElementById("listaProductos");

document.querySelectorAll(".zona").forEach(zona => {
  zona.addEventListener("click", async () => {
    const ubicacion = zona.dataset.ubicacion;

    tituloZona.textContent = "Cargando productos...";
    listaProductos.innerHTML = "";

    const { data, error } = await supabase
      .from("articulos")
      .select(`
        codigo,
        descripcion,
        precio_venta,
        stock_actual,
        stock_minimo,
        marca
      `)
      .eq("ubicacion", ubicacion)
      .order("descripcion");

    if (error) {
      tituloZona.textContent = "Error";
      alert("Error cargando artículos: " + error.message);
      return;
    }

    if (data.length === 0) {
      tituloZona.textContent = "Ubicación sin productos";
      listaProductos.innerHTML = "<li>No hay artículos asignados</li>";
      return;
    }

    tituloZona.textContent =
      `Productos en ${ubicacion.replace("_", " ").toUpperCase()}`;

    data.forEach(a => {
      const stockBajo = a.stock_actual <= a.stock_minimo;

      const li = document.createElement("li");
      li.classList.toggle("stock-bajo", stockBajo);

      li.innerHTML = `
        <strong>${a.codigo}</strong> ${a.marca ? `(${a.marca})` : ""}<br>
        ${a.descripcion}<br>
        💲 ${Number(a.precio_venta).toFixed(2)} |
        📦 Stock: ${a.stock_actual}
        ${stockBajo ? " ⚠️" : ""}
      `;

      listaProductos.appendChild(li);
    });
  });
});

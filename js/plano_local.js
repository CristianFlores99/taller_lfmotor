/*
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovfsffckhzelgbgohakv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc";

const supabase = createClient(supabaseUrl, supabaseKey);
*/
const svg = document.getElementById("plano");

// Función helper para crear SVG
function crearElemento(tipo, atributos = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tipo);
  for (const attr in atributos) {
    el.setAttribute(attr, atributos[attr]);
  }
  return el;
}

// ----------------------------
// DIBUJO DEL PLANO
// ----------------------------

// Contorno del local
svg.appendChild(
  crearElemento("rect", {
    x: 20,
    y: 20,
    width: 960,
    height: 560,
    class: "local"
  })
);

// Entrada diagonal
svg.appendChild(
  crearElemento("line", {
    x1: 760,
    y1: 580,
    x2: 980,
    y2: 420,
    class: "entrada"
  })
);

// Texto entrada
svg.appendChild(
  crearElemento("text", {
    x: 800,
    y: 520,
    fill: "#ef4444",
    "font-size": 14
  })
).textContent = "ENTRADA";

// ----------------------------
// ESTANTES
// ----------------------------
const estantes = [
  { id: "E1", x: 60, y: 80 },
  { id: "E2", x: 60, y: 150 },
  { id: "E3", x: 60, y: 220 },
  { id: "E4", x: 60, y: 290 },
  { id: "E5", x: 60, y: 360 },

  { id: "E6", x: 420, y: 80 },
  { id: "E7", x: 420, y: 150 },
  { id: "E8", x: 420, y: 220 },
  { id: "E9", x: 420, y: 290 },
  { id: "E10", x: 420, y: 360 }
];

estantes.forEach(e => {
  svg.appendChild(
    crearElemento("rect", {
      x: e.x,
      y: e.y,
      width: 300,
      height: 50,
      class: "estante"
    })
  );

  svg.appendChild(
    crearElemento("text", {
      x: e.x + 10,
      y: e.y + 30,
      class: "texto-estante"
    })
  ).textContent = e.id;
});

// ----------------------------
// PARED DE GANCHOS
// ----------------------------
svg.appendChild(
  crearElemento("rect", {
    x: 780,
    y: 80,
    width: 160,
    height: 300,
    class: "pared"
  })
);

svg.appendChild(
  crearElemento("text", {
    x: 795,
    y: 100,
    fill: "#020617",
    "font-size": 12,
    "font-weight": "bold"
  })
).textContent = "PARED DE GANCHOS";

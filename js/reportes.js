import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const chartVentasEl = document.getElementById('chartVentas').getContext('2d');
const chartComprasEl = document.getElementById('chartCompras').getContext('2d');

let chartVentas, chartCompras;

document.addEventListener('DOMContentLoaded', async () => {
  await cargarVentas();
  await cargarCompras();
  await cargarStock();
});

// ---------------- Funciones ----------------
async function cargarVentas() {
  const { data, error } = await supabase.from('ventas').select('*').order('fecha', { ascending:true });
  if (error) return console.error(error);

  const tbody = document.querySelector('#tablaVentas tbody');
  tbody.innerHTML = "";
  const etiquetas = [];
  const totales = [];

  data.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${v.id_venta}</td><td>${v.cliente}</td><td>${new Date(v.fecha).toLocaleDateString()}</td><td>${v.total.toFixed(2)}</td>`;
    tbody.appendChild(tr);

    etiquetas.push(new Date(v.fecha).toLocaleDateString());
    totales.push(v.total);
  });

  chartVentas = new Chart(chartVentasEl, {
    type:'line',
    data:{ labels:etiquetas, datasets:[{ label:'Ventas', data:totales, backgroundColor:'rgba(37,99,235,0.3)', borderColor:'#2563eb', borderWidth:2 }] },
    options:{ responsive:true, plugins:{ legend:{display:true} } }
  });
}

async function cargarCompras() {
  const { data, error } = await supabase.from('compras').select('*').order('fecha', { ascending:true });
  if (error) return console.error(error);

  const tbody = document.querySelector('#tablaCompras tbody');
  tbody.innerHTML = "";
  const etiquetas = [];
  const totales = [];

  data.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.id_compra}</td><td>${c.id_proveedor}</td><td>${new Date(c.fecha).toLocaleDateString()}</td><td>${c.total.toFixed(2)}</td>`;
    tbody.appendChild(tr);

    etiquetas.push(new Date(c.fecha).toLocaleDateString());
    totales.push(c.total);
  });

  chartCompras = new Chart(chartComprasEl, {
    type:'bar',
    data:{ labels:etiquetas, datasets:[{ label:'Compras', data:totales, backgroundColor:'#2563eb' }] },
    options:{ responsive:true, plugins:{ legend:{display:true} } }
  });
}

async function cargarStock() {
  const { data, error } = await supabase.from('articulos').select('*').order('stock', { ascending:true });
  if (error) return console.error(error);

  const tbody = document.querySelector('#tablaStock tbody');
  tbody.innerHTML = "";
  data.filter(r => r.stock <= r.stock_critico).forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.descripcion}</td><td>${r.categoria}</td><td>${r.stock}</td>`;
    tbody.appendChild(tr);
  });
}

// ---------------- Exportar PDF ----------------
document.getElementById('exportPDF').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Ventas
  doc.text("📊 Ventas",10,10);
  doc.addImage(chartVentas.toBase64Image(),'PNG',10,20,180,80);
  doc.autoTable({ html:'#tablaVentas', startY:110 });

  // Compras
  doc.addPage();
  doc.text("📦 Compras",10,10);
  doc.addImage(chartCompras.toBase64Image(),'PNG',10,20,180,80);
  doc.autoTable({ html:'#tablaCompras', startY:110 });

  // Stock Crítico
  doc.addPage();
  doc.text("⚠️ Stock Crítico",10,10);
  doc.autoTable({ html:'#tablaStock', startY:20 });

  doc.save('reporte_completo.pdf');
});

// ---------------- Exportar Excel ----------------
document.getElementById('exportExcel').addEventListener('click', () => {
  const wb = XLSX.utils.book_new();
  [['Ventas','#tablaVentas'],['Compras','#tablaCompras'],['Stock','#tablaStock']].forEach(([name, selector])=>{
    const ws = XLSX.utils.table_to_sheet(document.querySelector(selector));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb,'reporte_completo.xlsx');
});
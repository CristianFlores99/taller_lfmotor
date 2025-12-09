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
  await cargarVentasMensual();
});

// ---------------- Funciones ----------------
// ---------------- Ventas ----------------
async function cargarVentas() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .order('fecha', { ascending: true });

  if (error) return console.error(error);

  const etiquetas = data.map(v => new Date(v.fecha).toLocaleDateString());
  const totales = data.map(v => v.total);

  chartVentas = new Chart(chartVentasEl, {
    type: 'line',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Total de ventas',
        data: totales,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: 'nearest',
        intersect: false
      },

      plugins: {
        tooltip: { enabled: true },
        legend: { display: true }
      },

      scales: {
        x: {
          title: {
            display: true,
            text: 'Fecha de venta'
          },
          ticks: {
            display: true,     // <-- MUESTRA REFERENCIAS DEL EJE X
          },
          grid: {
            display: true,     // <-- MUESTRA LAS LÍNEAS DEL EJE X
          },
          border: {
            display: true      // <-- MUESTRA LA LÍNEA DEL EJE X
          }
        },

        y: {
          title: {
            display: true,
            text: 'Monto total'
          },
          ticks: {
            display: true      // <-- MUESTRA LOS VALORES DEL EJE Y
          },
          grid: {
            display: true      // <-- MUESTRA LAS LÍNEAS HORIZONTALES
          },
          border: {
            display: true      // <-- MUESTRA LA LÍNEA DEL EJE Y
          }
        }
      }
    }
  });
}

// ---------------- Agrupar por semana ----------------
function agruparPorMes(ventas) {
  const meses = {};

  ventas.forEach(v => {
    const fecha = new Date(v.fecha);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // 01-12

    const clave = `${año}-${mes}`; // Ej: 2025-03

    if (!meses[clave]) meses[clave] = 0;
    meses[clave] += v.total;
  });

  return meses;
}

// ---------------- Ventas por mes ----------------
async function cargarVentasMensual() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .order('fecha', { ascending: true });

  if (error) return console.error(error);

  const ventasPorMes = agruparPorMes(data);

  const etiquetas = Object.keys(ventasPorMes);
  const totales = Object.values(ventasPorMes);

  const ctx = document.getElementById("chartVentasMes").getContext("2d");

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Ventas por mes',
        data: totales,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Mes' } },
        y: { title: { display: true, text: 'Total vendido' } }
      }
    }
  });
}


// ---------------- Compras ----------------
async function cargarCompras() {
  const { data, error } = await supabase.from('compras').select('*').order('fecha', { ascending: true });
  if (error) return console.error(error);

  const etiquetas = data.map(c => new Date(c.fecha).toLocaleDateString());
  const totales = data.map(c => c.total);

  chartCompras = new Chart(chartComprasEl, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Total de compras',
        data: totales,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Fecha de compra' } },
        y: { title: { display: true, text: 'Monto total' } }
      }
    }
  });
}

// ---------------- Stock Crítico ----------------
async function cargarStock() {
  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .order('stock_minimo', { ascending: true });

  if (error) return console.error(error);

  // FILTRAR CRÍTICOS: stock_actual <= stock_minimo
  const criticos = data.filter(r => Number(r.stock_actual) <= Number(r.stock_minimo));

  // Etiquetas = descripción
  const etiquetas = criticos.map(r => r.descripcion);

  // Valores = stock_actual
  const valores = criticos.map(r => Number(r.stock_actual));

  // Render chart
  const chartStockEl = document.getElementById('chartStock').getContext('2d');

  new Chart(chartStockEl, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Stock actual',
        data: valores,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Repuestos con stock crítico' } },
        y: { title: { display: true, text: 'Cantidad actual' } }
      }
    }
  });
}



// ---------------- Exportar PDF ----------------
document.getElementById('exportPDF').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Ventas
  doc.text("📊 Ventas", 10, 10);
  doc.addImage(chartVentas.toBase64Image(), 'PNG', 10, 20, 180, 80);
  doc.autoTable({ html: '#tablaVentas', startY: 110 });

  // Compras
  doc.addPage();
  doc.text("📦 Compras", 10, 10);
  doc.addImage(chartCompras.toBase64Image(), 'PNG', 10, 20, 180, 80);
  doc.autoTable({ html: '#tablaCompras', startY: 110 });

  // Stock Crítico
  doc.addPage();
  doc.text("⚠️ Stock Crítico", 10, 10);
  doc.autoTable({ html: '#tablaStock', startY: 20 });

  doc.save('reporte_completo.pdf');
});

// ---------------- Exportar Excel ----------------
document.getElementById('exportExcel').addEventListener('click', () => {
  const wb = XLSX.utils.book_new();
  [['Ventas', '#tablaVentas'], ['Compras', '#tablaCompras'], ['Stock', '#tablaStock']].forEach(([name, selector]) => {
    const ws = XLSX.utils.table_to_sheet(document.querySelector(selector));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, 'reporte_completo.xlsx');
});
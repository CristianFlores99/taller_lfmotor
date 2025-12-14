import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const chartVentasEl = document.getElementById('chartVentas').getContext('2d');
const chartComprasEl = document.getElementById('chartCompras').getContext('2d');
const chartComprasMesFacturaEl = document.getElementById("chartComprasMesFactura").getContext("2d");

let chartVentas, chartCompras, chartComprasMesFactura;

document.addEventListener('DOMContentLoaded', async () => {
  await cargarVentas();
  await cargarCompras();
  await cargarComprasMesPorFactura();
  await cargarVentasMensual();
  await metricasVentasDia();
  await metricasVentasMes();
  await metricasComprasMes();
  await metricasStockCritico();
});

// ---------------- Funciones ----------------
// ---------------- Ventas ----------------
async function cargarVentas() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .order('fecha', { ascending: true });

  if (error) return console.error(error);

  const etiquetas = data.map(v => parseFechaLocal(v.fecha).toLocaleDateString());
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
    const fecha = parseFechaLocal(v.fecha);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // 01-12

    const clave = `${año}-${mes}`; // Ej: 2025-03

    if (!meses[clave]) meses[clave] = 0;
    meses[clave] += v.total;
  });

  return meses;
}

function parseFechaLocal(fechaStr) {
  const [año, mes, dia] = fechaStr.split("-").map(Number);
  return new Date(año, mes - 1, dia); // <-- LOCAL, SIN DESFASE UTC
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
  const { data, error } = await supabase.from('facturas_proveedor').select('*').order('fecha', { ascending: true });
  if (error) return console.error(error);

  const etiquetas = data.map(c => parseFechaLocal(c.fecha).toLocaleDateString());
  const totales = data.map(c => c.monto_total);

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

//
async function metricasVentasDia() {
  const hoy = fechaLocalActual();

  const { data, error } = await supabase
    .from("ventas")
    .select("total")
    .eq("fecha", hoy);

  if (error) return console.error(error);

  const total = data.reduce((sum, v) => sum + v.total, 0);

  document.getElementById("m_ventasDia").textContent = `$${total}`;
}
function fechaLocalActual() {
  const f = new Date();
  const año = f.getFullYear();
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const dia = String(f.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

//
async function metricasVentasMes() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");

  const inicioMes = `${año}-${mes}-01`;

  const { data, error } = await supabase
    .from("ventas")
    .select("total, fecha")
    .gte("fecha", inicioMes);

  if (error) return console.error(error);

  const total = data.reduce((sum, v) => sum + v.total, 0);

  document.getElementById("m_ventasMes").textContent = `$${total}`;
}

//
async function metricasStockCritico() {
  const { data, error } = await supabase
    .from("articulos")
    .select("stock_actual, stock_minimo");

  if (error) return console.error(error);

  const criticos = data.filter(a => a.stock_actual <= a.stock_minimo).length;

  document.getElementById("m_stockCritico").textContent = `${criticos} Items`;
}

//
async function metricasComprasMes() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");

  const inicioMes = `${año}-${mes}-01`;

  const { data, error } = await supabase
    .from("facturas_proveedor")
    .select("monto_total, fecha")
    .gte("fecha", inicioMes);

  if (error) {
    console.error("Error métricas compras mes:", error);
    return;
  }

  const total = data.reduce(
    (sum, c) => sum + Number(c.monto_total),
    0
  );

  document.getElementById("m_comprasMes").textContent =
    `$${total.toLocaleString("es-AR")}`;
}

//
async function cargarComprasMesPorFactura() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const inicioMes = `${año}-${mes}-01`;

  const { data, error } = await supabase
    .from("facturas_proveedor")
    .select("fecha, monto_total, codigo_alfanumerico")
    .gte("fecha", inicioMes)
    .order("fecha", { ascending: true });

  if (error) {
    console.error("Error compras mes por factura:", error);
    return;
  }

  const etiquetas = data.map(f =>
    f.numero_factura
      ? `Factura ${f.numero_factura}`
      : new Date(f.fecha).toLocaleDateString("es-AR")
  );

  const totales = data.map(f => Number(f.monto_total));

  if (chartComprasMesFactura) {
    chartComprasMesFactura.destroy();
  }

  chartComprasMesFactura = new Chart(chartComprasMesFacturaEl, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Compras del mes",
        data: totales,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx =>
              `$ ${ctx.parsed.y.toLocaleString("es-AR")}`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Facturas del mes"
          }
        },
        y: {
          title: {
            display: true,
            text: "Monto"
          },
          ticks: {
            callback: v => `$ ${v.toLocaleString("es-AR")}`
          }
        }
      }
    }
  });
}

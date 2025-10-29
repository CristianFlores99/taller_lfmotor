import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const tablaVentas = document.getElementById('tablaVentas');
const busqueda = document.getElementById('busqueda');
const btnNuevaVenta = document.getElementById('btnNuevaVenta');
const btnVolver = document.getElementById('btnVolver');

document.addEventListener('DOMContentLoaded', cargarVentas);
busqueda.addEventListener('input', cargarVentas);

btnNuevaVenta.addEventListener('click', () => {
  window.location.href = 'detalle_ventas.html';
});

btnVolver.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// ---------- Cargar Ventas ----------
async function cargarVentas() {
  const filtro = busqueda.value.trim();
  let query = supabase.from('ventas').select('*').order('fecha', { ascending: false });

  if (filtro) {
    query = query.or(`cliente.ilike.%${filtro}%, responsable.ilike.%${filtro}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error cargando ventas:', error);
    return;
  }

  tablaVentas.innerHTML = '';
  data.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(v.fecha).toLocaleDateString()}</td>
      <td>${v.cliente || '-'}</td>
      <td>${v.medio_pago || '-'}</td>
      <td>$${v.total?.toFixed(2) || '0.00'}</td>
      <td>${v.responsable || '-'}</td>
      <td>
        <button class="btn-ver" data-id="${v.id_venta}">🔍 Ver</button>
      </td>
    `;
    tablaVentas.appendChild(tr);
  });

  document.querySelectorAll('.btn-ver').forEach(btn =>
    btn.addEventListener('click', e => {
      const idVenta = e.target.dataset.id;
      window.location.href = `detalle_ventas.html?id_venta=${idVenta}`;
    })
  );
}

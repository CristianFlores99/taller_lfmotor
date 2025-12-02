// ------------------------------
// Conexión a Supabase
// ------------------------------
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ------------------------------
// Cargar Rubros
// ------------------------------
async function cargarRubros() {
    const { data, error } = await supabaseClient.from("rubro").select("*");

    const select = document.querySelector("#filtro-rubro");
    select.innerHTML = `<option value="">-- Rubro --</option>`;

    if (data) {
        data.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id_rubro;
            opt.textContent = r.nombre;
            select.appendChild(opt);
        });
    }
}

// ------------------------------
// Cargar Subrubros
// ------------------------------
async function cargarSubrubros() {
    const { data, error } = await supabaseClient.from("subrubro").select("*");

    const select = document.querySelector("#filtro-subrubro");
    select.innerHTML = `<option value="">-- Subrubro --</option>`;

    if (data) {
        data.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id_subrubro;
            opt.textContent = s.nombre;
            select.appendChild(opt);
        });
    }
}

// ------------------------------
// Cargar Productos
// ------------------------------
async function cargarProductos() {
    const cont = document.getElementById("lista-productos");
    cont.textContent = "Cargando productos...";

    const { data, error } = await supabaseClient.from("producto").select("*");

    cont.innerHTML = "";

    if (!data || data.length === 0) {
        cont.textContent = "No hay productos cargados.";
        return;
    }

    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <h3>${p.codigo}</h3>
            <p><strong>Marca:</strong> ${p.marca}</p>
            <p><strong>Stock:</strong> ${p.stock}</p>
            <p><strong>Precio:</strong> $${p.precio_venta}</p>
        `;
        cont.appendChild(div);
    });
}

// ------------------------------
// Inicializar
// ------------------------------
window.onload = () => {
    cargarRubros();
    cargarSubrubros();
    cargarProductos();
};

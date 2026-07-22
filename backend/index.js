import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REST_URL = `${supabaseUrl}/rest/v1`;
const HEADERS = {
  "Content-Type": "application/json",
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
};

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${REST_URL}${path}`, {
    headers: HEADERS,
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = data?.message || data?.error_description || data?.error || response.statusText;
    throw new Error(error || "Error en Supabase REST");
  }
  return data;
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.get("/api/repuestos", async (req, res) => {
  const { filtro, subrubro, marca } = req.query;
  const params = new URLSearchParams();
  params.append("select", "*");
  params.append("order", "codigo.asc");
  if (subrubro) params.append("subrubro", `eq.${subrubro}`);
  if (marca) params.append("marca", `eq.${marca}`);
  if (filtro) {
    const filtroTerm = `*${filtro}*`;
    params.append(
      "or",
      `(codigo.ilike.${filtroTerm},descripcion.ilike.${filtroTerm},marca.ilike.${filtroTerm},rubro.ilike.${filtroTerm},subrubro.ilike.${filtroTerm},ubicacion.ilike.${filtroTerm})`
    );
  }

  try {
    const data = await supabaseFetch(`/articulos?${params.toString()}`);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron cargar los repuestos." });
  }
});

app.get("/api/repuestos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await supabaseFetch(`/articulos?id_articulo=eq.${id}&select=*`);
    if (!data || !data.length) {
      return res.status(404).json({ error: "Repuesto no encontrado." });
    }
    res.json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo cargar el repuesto." });
  }
});

app.post("/api/repuestos", async (req, res) => {
  const { codigo, descripcion, marca, subrubro, rubro, ubicacion, imagen_url2, stock_actual, precio_venta } = req.body;
  if (!codigo || !descripcion) {
    return res.status(400).json({ error: "Código y descripción son obligatorios." });
  }

  const payload = {
    codigo: String(codigo).trim().toUpperCase(),
    descripcion: String(descripcion).trim(),
    marca: marca ? String(marca).trim().toUpperCase() : null,
    subrubro: subrubro ? String(subrubro).trim() : null,
    rubro: rubro ? String(rubro).trim() : null,
    ubicacion: ubicacion ? String(ubicacion).trim() : null,
    imagen_url2: imagen_url2 || null,
    stock_actual: Number(stock_actual) || 0,
    precio_venta: Number(precio_venta) || 0,
  };

  try {
    const data = await supabaseFetch(`/articulos`, {
      method: "POST",
      headers: {
        ...HEADERS,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    res.status(201).json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo crear el repuesto." });
  }
});

app.put("/api/repuestos/:id", async (req, res) => {
  const { id } = req.params;
  const { codigo, descripcion, marca, subrubro, rubro, ubicacion, imagen_url2, stock_actual, precio_venta } = req.body;

  const payload = {};
  if (codigo !== undefined) payload.codigo = String(codigo).trim().toUpperCase();
  if (descripcion !== undefined) payload.descripcion = String(descripcion).trim();
  if (marca !== undefined) payload.marca = marca ? String(marca).trim().toUpperCase() : null;
  if (subrubro !== undefined) payload.subrubro = subrubro ? String(subrubro).trim() : null;
  if (rubro !== undefined) payload.rubro = rubro ? String(rubro).trim() : null;
  if (ubicacion !== undefined) payload.ubicacion = ubicacion ? String(ubicacion).trim() : null;
  if (imagen_url2 !== undefined) payload.imagen_url2 = imagen_url2;
  if (stock_actual !== undefined) payload.stock_actual = Number(stock_actual);
  if (precio_venta !== undefined) payload.precio_venta = Number(precio_venta);

  try {
    const data = await supabaseFetch(`/articulos?id_articulo=eq.${id}`, {
      method: "PATCH",
      headers: {
        ...HEADERS,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    res.json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar el repuesto." });
  }
});

app.delete("/api/repuestos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await supabaseFetch(`/articulos?id_articulo=eq.${id}`, {
      method: "DELETE",
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo eliminar el repuesto." });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(port, () => {
  console.log(`Backend iniciado en http://localhost:${port}`);
});

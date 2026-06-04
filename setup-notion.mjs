// Uso: node setup-notion.mjs <NOTION_TOKEN> <NOTION_DATABASE_ID>
// Configura la base de datos Pedidos LayerVault con todas las columnas necesarias.

const TOKEN = process.argv[2];
const DB_ID = process.argv[3];

if (!TOKEN || !DB_ID) {
  console.error("❌ Faltan argumentos.\n   Uso: node setup-notion.mjs <NOTION_TOKEN> <NOTION_DATABASE_ID>");
  process.exit(1);
}

const HEADERS = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

async function get(path) {
  const res = await fetch(`https://api.notion.com/v1${path}`, { headers: HEADERS });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));
  return data;
}

async function patch(path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));
  return data;
}

async function main() {
  console.log("🔍 Leyendo base de datos...");
  const db = await get(`/databases/${DB_ID}`);
  const existing = Object.fromEntries(
    Object.entries(db.properties).map(([k, v]) => [k, v.type])
  );
  console.log("   Columnas actuales:", Object.keys(existing).join(", "));

  // Si Estado existe pero es tipo "status" (el nativo de Notion), lo eliminamos
  if (existing["Estado"] && existing["Estado"] !== "select") {
    console.log("🗑️  Eliminando columna Estado (tipo incorrecto)...");
    await patch(`/databases/${DB_ID}`, { properties: { "Estado": null } });
    delete existing["Estado"];
  }

  // Columnas a añadir
  const toAdd = {};

  if (!existing["Estado"]) {
    toAdd["Estado"] = {
      select: {
        options: [
          { name: "Pendiente de pago", color: "red"     },
          { name: "Pago recibido",     color: "yellow"  },
          { name: "En producción",     color: "blue"    },
          { name: "Preparando envío",  color: "orange"  },
          { name: "Enviado",           color: "green"   },
          { name: "Entregado",         color: "default" },
        ],
      },
    };
  }

  for (const name of ["Cliente", "Contacto", "Productos", "Items JSON", "Tracking", "Nota pública"]) {
    if (!existing[name]) toAdd[name] = { rich_text: {} };
  }

  if (!existing["Total"])   toAdd["Total"]   = { number: { format: "euro" } };
  if (!existing["Fecha"])   toAdd["Fecha"]   = { date: {} };

  // Historial de fechas por estado
  const fechasEstado = ["Fecha pago recibido", "Fecha producción", "Fecha preparando", "Fecha enviado", "Fecha entregado"];
  for (const name of fechasEstado) {
    if (!existing[name]) toAdd[name] = { date: {} };
  }

  if (!existing["Entrega"]) {
    toAdd["Entrega"] = {
      select: {
        options: [
          { name: "En mano", color: "green" },
          { name: "Envío",   color: "blue"  },
        ],
      },
    };
  }

  if (Object.keys(toAdd).length === 0) {
    console.log("✅ Todas las columnas ya existen. Nada que hacer.");
    return;
  }

  console.log("➕ Añadiendo columnas:", Object.keys(toAdd).join(", "));
  await patch(`/databases/${DB_ID}`, { properties: toAdd });

  console.log("\n🎉 Base de datos configurada correctamente.");
  console.log("   Ahora añade estas variables en Netlify:");
  console.log(`   NOTION_DATABASE_ID = ${DB_ID}`);
  console.log(`   NOTION_TOKEN       = (el token que usaste aquí)`);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

import type { Handler, HandlerEvent } from "@netlify/functions";

// Solo enviamos a Península — sin islas, Ceuta ni Melilla
const NO_SHIP = new Set(["07", "35", "38", "51", "52"]);

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };
const CACHED_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600",
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const cp = (event.queryStringParameters?.["cp"] ?? "").trim();
  if (!/^\d{5}$/.test(cp)) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "CP inválido" }) };
  }

  if (NO_SHIP.has(cp.slice(0, 2))) {
    return { statusCode: 422, headers: JSON_HEADERS, body: JSON.stringify({ error: "Zona no disponible" }) };
  }

  // Correos iPaq domicilio — 30×20×20 cm, hasta 2 kg
  // Precio verificado correos.es jun-2025 (Barcelona → A Coruña)
  return {
    statusCode: 200,
    headers: CACHED_HEADERS,
    body: JSON.stringify({ zone: "Península", price: 5.92 }),
  };
};

export { handler };

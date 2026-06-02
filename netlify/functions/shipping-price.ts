import type { Handler, HandlerEvent } from "@netlify/functions";

// Correos España — tarifas aproximadas paquete pequeño (<500g)
const ZONES: { prefixes: string[]; zone: string; price: number }[] = [
  { prefixes: ["07"],             zone: "Islas Baleares",  price: 7.95  },
  { prefixes: ["35", "38"],       zone: "Islas Canarias",  price: 10.95 },
  { prefixes: ["51"],             zone: "Ceuta",           price: 8.50  },
  { prefixes: ["52"],             zone: "Melilla",         price: 8.50  },
];

function lookup(cp: string): { zone: string; price: number } {
  const prefix = cp.slice(0, 2);
  for (const z of ZONES) {
    if (z.prefixes.includes(prefix)) return { zone: z.zone, price: z.price };
  }
  return { zone: "Península", price: 4.95 };
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const cp = (event.queryStringParameters?.["cp"] ?? "").trim();
  if (!/^\d{5}$/.test(cp)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Código postal inválido" }),
    };
  }

  const result = lookup(cp);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
    body: JSON.stringify(result),
  };
};

export { handler };

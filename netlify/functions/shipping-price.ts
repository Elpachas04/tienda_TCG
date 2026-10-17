import type { Handler, HandlerEvent } from "@netlify/functions";
import { requestOk } from "./_guard";
import { SHIPPING, shipsTo } from "../../src/app/shared/constants/shop-policy";

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };
const CACHED_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600",
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!requestOk(event.headers)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const cp = (event.queryStringParameters?.["cp"] ?? "").trim();
  if (!/^\d{5}$/.test(cp)) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "CP inválido" }) };
  }

  if (!shipsTo(cp)) {
    return { statusCode: 422, headers: JSON_HEADERS, body: JSON.stringify({ error: "Zona no disponible" }) };
  }

  return {
    statusCode: 200,
    headers: CACHED_HEADERS,
    body: JSON.stringify({ zone: SHIPPING.zone, price: SHIPPING.price }),
  };
};

export { handler };

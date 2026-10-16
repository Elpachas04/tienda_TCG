import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { originOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";
import { purgeCatalogCache } from "./_catalog-cache";
import { notifyBackInStock } from "./_restock";

const STORE_NAME     = "products";
const BLOB_KEY        = "catalog";
const MAX_SAVE_BODY   = 2_000_000; // el catálogo completo con imágenes/variantes puede pesar varios KB

interface MinimalProduct {
  id?:    unknown;
  sku?:   unknown;
  name?:  unknown;
  price?: unknown;
}

function isValidProduct(p: unknown): boolean {
  if (typeof p !== "object" || p === null) return false;
  const prod = p as MinimalProduct;
  return (
    typeof prod.id === "string" && prod.id.trim().length > 0 &&
    typeof prod.name === "string" && prod.name.trim().length > 0 &&
    typeof prod.price === "number" && Number.isFinite(prod.price) && prod.price >= 0
  );
}

const handler: Handler = async (event, context) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "PUT") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!originOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }
  if (!verifyAdminSession(event.headers["cookie"])) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
  }
  if (event.body && event.body.length > MAX_SAVE_BODY) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: "payload_too_large" }) };
  }

  let products: unknown[];
  try {
    const raw = JSON.parse(event.body ?? "{}") as { products?: unknown };
    if (!Array.isArray(raw.products)) throw new Error("invalid");
    products = raw.products;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "bad_request" }) };
  }

  if (!products.every(isValidProduct)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid_product_shape" }) };
  }

  try {
    // Funciones en formato Lambda: Blobs necesita el contexto que viene en el evento
    connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
    const store    = getStore(STORE_NAME);
    const existing = (await store.get(BLOB_KEY, { type: "json" })) as Record<string, unknown> | null;
    const catalog  = { ...(existing ?? {}), products };
    await store.setJSON(BLOB_KEY, catalog);
    await purgeCatalogCache(context);

    // Productos que estaban agotados y ahora se pueden comprar: avisar a quien lo pidió
    type P = { id: string; name: string; available?: boolean; hidden?: boolean };
    const before = new Map(((existing?.["products"] ?? []) as P[]).map(p => [p.id, p]));
    const back = (products as P[]).filter(p => p.available && !p.hidden && before.get(p.id)?.available === false);
    const notified = await notifyBackInStock(event, back);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, notified }) };
  } catch (err) {
    console.error("Error saving products blob:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };

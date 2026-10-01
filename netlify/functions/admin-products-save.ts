import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { originOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";

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

const handler: Handler = async (event) => {
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
    const store    = getStore(STORE_NAME);
    const existing = (await store.get(BLOB_KEY, { type: "json" })) as Record<string, unknown> | null;
    const catalog  = { ...(existing ?? {}), products };
    await store.setJSON(BLOB_KEY, catalog);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Error saving products blob:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };

import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { originOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";

const STORE_NAME       = "products";
const BLOB_KEY          = "catalog";
const MAX_CATALOG_BODY  = 500_000;
const ALLOWED_KEYS = ["categories", "colors", "addons", "bulk_boxes", "settings"] as const;

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
  if (event.body && event.body.length > MAX_CATALOG_BODY) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: "payload_too_large" }) };
  }

  let updates: Record<string, unknown>;
  try {
    const raw = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
    updates = {};
    for (const key of ALLOWED_KEYS) {
      if (key in raw) updates[key] = raw[key];
    }
    if (Object.keys(updates).length === 0) throw new Error("invalid");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "bad_request" }) };
  }

  try {
    const store    = getStore(STORE_NAME);
    const existing = (await store.get(BLOB_KEY, { type: "json" })) as Record<string, unknown> | null;
    const catalog  = { ...(existing ?? {}), ...updates };
    await store.setJSON(BLOB_KEY, catalog);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Error saving catalog blob:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };

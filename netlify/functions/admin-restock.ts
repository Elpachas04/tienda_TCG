import type { Handler } from "@netlify/functions";
import { verifyAdminSession } from "./_admin-auth";
import { Waiting, restockStore } from "./_restock";

// GET /api/admin/restock → { [productId]: personas esperando } para el listado de productos del admin
const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  if (!verifyAdminSession(event.headers["cookie"])) return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
  try {
    const store = restockStore(event);
    const { blobs } = await store.list();
    const counts: Record<string, number> = {};
    for (const b of blobs) {
      const w = await store.get(b.key, { type: "json" }) as Waiting | null;
      if (w?.emails.length) counts[b.key] = w.emails.length;
    }
    return { statusCode: 200, headers, body: JSON.stringify({ counts }) };
  } catch (err) {
    console.error("admin-restock:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };

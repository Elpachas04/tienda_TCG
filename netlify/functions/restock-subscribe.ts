import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { originOk } from "./_guard";
import { MAX_WAITING, Waiting, isEmail, restockStore } from "./_restock";

// POST /api/restock { productId, email, website } → apunta el email para avisar cuando el producto vuelva
const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const json = (statusCode: number, body: unknown) => ({ statusCode, headers, body: JSON.stringify(body) });

  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });
  if (!originOk(event.headers)) return json(403, { error: "forbidden" });
  if ((event.body?.length ?? 0) > 2_000) return json(413, { error: "payload_too_large" });

  let productId: string, email: string;
  try {
    const raw = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
    if (raw["website"]) return json(200, { success: true }); // honeypot: a los bots les decimos que sí
    productId = String(raw["productId"] ?? "");
    email = String(raw["email"] ?? "").trim().toLowerCase();
  } catch {
    return json(400, { error: "bad_request" });
  }
  if (!/^[a-z0-9-]{1,80}$/.test(productId)) return json(400, { error: "product" });
  if (!isEmail(email)) return json(400, { error: "email" });

  try {
    // Solo para productos que existen y están agotados
    connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
    const catalog = await getStore("products").get("catalog", { type: "json" }) as { products?: Array<{ id: string; available?: boolean; hidden?: boolean }> } | null;
    const product = catalog?.products?.find(p => p.id === productId);
    if (!product || product.hidden) return json(404, { error: "product" });
    if (product.available) return json(409, { error: "available" });

    const store = restockStore(event);
    const waiting = (await store.get(productId, { type: "json" }) as Waiting | null) ?? { emails: [] };
    if (!waiting.emails.includes(email) && waiting.emails.length < MAX_WAITING) {
      waiting.emails.push(email);
      await store.setJSON(productId, waiting);
    }
    return json(200, { success: true });
  } catch (err) {
    console.error("restock-subscribe:", err);
    return json(500, { error: "server_error" });
  }
};

export { handler };

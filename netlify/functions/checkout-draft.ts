import { originOk } from "./_guard";
import { isEmail } from "./_restock";
import { SITE_URL } from "./_email-kit";
import { Draft, draftKey, draftsStore, emailHash, sanitizeItems, verifyRef } from "./_checkout-drafts";

// /api/checkout-draft
//   POST   { email, name, items, website } → guarda o actualiza la cesta pendiente (casilla de recordatorio marcada)
//   DELETE { email }                        → la borra (casilla desmarcada)
//   GET    ?recuperar=<ref>                 → devuelve la cesta para restaurarla desde el enlace del email
//   GET    ?baja=<ref>                      → página para confirmar la baja (enlace del email). No borra nada:
//                                             los antivirus del correo abren los enlaces solos
//   POST   ?baja=<ref>                      → borra la cesta y el email (botón de esa página)
export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const baja = url.searchParams.get("baja");
    const recuperar = url.searchParams.get("recuperar");
    const hash = verifyRef(baja ?? recuperar ?? "");
    if (!hash) return baja !== null ? page("Este enlace no es válido o ha caducado.") : json(404, { error: "not_found" });

    const store = draftsStore();
    if (baja !== null) {
      return page("¿Borramos tu cesta guardada y tu email? No te volveremos a escribir por este pedido.",
        `<form method="post"><button style="font:inherit;font-weight:600;padding:12px 24px;border:0;border-radius:999px;background:#F5F0E8;color:#121212;cursor:pointer">Sí, borrarlos</button></form>`);
    }
    const draft = await store.get(draftKey(hash), { type: "json" }) as Draft | null;
    if (!draft) return json(404, { error: "not_found" });
    return json(200, { email: draft.email, name: draft.name, items: draft.items });
  }

  const headers = Object.fromEntries(req.headers);
  if (!originOk(headers)) return json(403, { error: "forbidden" });

  const baja = url.searchParams.get("baja");
  if (baja !== null && req.method === "POST") {
    const hash = verifyRef(baja);
    if (!hash) return page("Este enlace no es válido o ha caducado.");
    await draftsStore().delete(draftKey(hash));
    return page("Hecho: hemos borrado tu cesta y tu email.");
  }
  const body = await req.text();
  if (body.length > 20_000) return json(413, { error: "payload_too_large" });

  let raw: Record<string, unknown>;
  try { raw = JSON.parse(body || "{}"); } catch { return json(400, { error: "bad_request" }); }
  if (raw["website"]) return json(200, { success: true }); // honeypot

  const email = String(raw["email"] ?? "").trim().toLowerCase();
  if (!isEmail(email)) return json(400, { error: "email" });
  const key = draftKey(emailHash(email));
  const store = draftsStore();

  try {
    if (req.method === "DELETE") {
      await store.delete(key);
      return json(200, { success: true });
    }
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

    const items = await sanitizeItems(raw["items"]);
    if (items.length === 0) {
      await store.delete(key);
      return json(200, { success: true });
    }
    const now = new Date().toISOString();
    const prev = await store.get(key, { type: "json" }) as Draft | null;
    const name = typeof raw["name"] === "string" ? raw["name"].replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 100) || undefined : undefined;
    const draft: Draft = { email, name, items, createdAt: prev?.createdAt ?? now, updatedAt: now };
    await store.setJSON(key, draft);
    return json(200, { success: true });
  } catch (err) {
    console.error("checkout-draft:", err);
    return json(500, { error: "server_error" });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function page(message: string, extra = ""): Response {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>LayerVault</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#121212;color:#F5F0E8;font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box">
<main style="max-width:420px;text-align:center"><p style="font-size:18px;line-height:1.5;margin:0 0 24px">${message}</p>${extra ? `<div style="margin-bottom:24px">${extra}</div>` : ""}
<a href="${SITE_URL}/" style="color:#C9A84C">Volver a LayerVault</a></main></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

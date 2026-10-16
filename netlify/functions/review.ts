import type { Handler } from "@netlify/functions";
import { originOk, requestOk, MAX_BODY } from "./_guard";
import { destroyImage } from "./_cloudinary";
import { MAX_PHOTOS, Review, checkOrder, photoFolder, reviewsStore, verifyReviewToken } from "./_reviews";

// GET  /api/review?id=LV-…&t=…  → datos para el formulario (nombre, productos y valoración previa si la hay)
// POST /api/review              → guarda o actualiza la valoración (queda "pendiente" hasta aprobarla en el admin)
const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const json = (statusCode: number, body: unknown) => ({ statusCode, headers, body: JSON.stringify(body) });

  try {
    if (event.httpMethod === "GET") {
      if (!requestOk(event.headers)) return json(403, { error: "forbidden" });
      const id = event.queryStringParameters?.["id"] ?? "";
      const t  = event.queryStringParameters?.["t"] ?? "";
      if (!verifyReviewToken(id, t)) return json(403, { error: "invalid_link" });

      const order = await checkOrder(id);
      if (!order.ok) return json(order.statusCode, { error: order.error });
      const store    = reviewsStore(event);
      const existing = await store.get(id, { type: "json" }) as Review | null;
      return json(200, {
        firstName: order.info.firstName,
        fullName:  order.info.fullName,
        products:  order.info.products,
        review:    existing ? { name: existing.name, rating: existing.rating, text: existing.text, photos: existing.photos ?? [], status: existing.status } : null,
      });
    }

    if (event.httpMethod === "POST") {
      if (!originOk(event.headers)) return json(403, { error: "forbidden" });
      if ((event.body?.length ?? 0) > MAX_BODY) return json(413, { error: "payload_too_large" });

      let body: Record<string, unknown>;
      try { body = JSON.parse(event.body ?? "{}"); } catch { return json(400, { error: "bad_request" }); }
      const orderId = String(body["orderId"] ?? "");
      const token   = String(body["token"] ?? "");
      if (!verifyReviewToken(orderId, token)) return json(403, { error: "invalid_link" });

      const rating = Number(body["rating"]);
      const text   = String(body["text"] ?? "").replace(/\s+\n/g, "\n").trim().slice(0, 1000);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: "rating" });
      // Solo fotos subidas a la carpeta de este pedido (review-photo.ts)
      const photos = (Array.isArray(body["photos"]) ? body["photos"] : [])
        .map(String).filter(id => id.startsWith(photoFolder(orderId))).slice(0, MAX_PHOTOS);

      // El nº de pedido tiene que existir en Notion y estar entregado, también al editar
      const order = await checkOrder(orderId);
      if (!order.ok) return json(order.statusCode, { error: order.error });
      const store    = reviewsStore(event);
      const existing = await store.get(orderId, { type: "json" }) as Review | null;
      // El nombre no lo elige el cliente: es el del pedido en Notion
      const name     = order.info.fullName || "Cliente";
      const now      = new Date().toISOString();
      const review: Review = {
        orderId, name, rating, text,
        productIds: order.info.productIds,
        photos,
        products:   order.info.products,
        // Si la edita después de publicada, vuelve a revisión
        status:     "pendiente",
        createdAt:  existing?.createdAt ?? now,
        updatedAt:  now,
      };
      await store.setJSON(orderId, review);
      // Fotos que tenía y ha quitado al editar: fuera de Cloudinary
      for (const id of (existing?.photos ?? []).filter(id => !photos.includes(id))) {
        await destroyImage(id).catch(err => console.error("destroy photo:", err));
      }
      return json(200, { success: true });
    }

    return json(405, { error: "method_not_allowed" });
  } catch (err) {
    console.error("review error:", err);
    return json(500, { error: "server_error" });
  }
};

export { handler };

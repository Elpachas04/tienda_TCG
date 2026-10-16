import { purgeCache, type Handler, type HandlerContext } from "@netlify/functions";
import { originOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";
import { destroyFolderImages, destroyImage } from "./_cloudinary";
import { Review, ReviewStatus, listReviews, photoFolder, reviewsStore } from "./_reviews";

const STATUSES: ReviewStatus[] = ["pendiente", "publicada", "oculta"];

// GET    → todas las valoraciones (con nº de pedido)
// PUT    → { orderId, status } cambia el estado (publicar / ocultar)
//          { orderId, removePhoto } quita una foto (y la borra de Cloudinary)
// DELETE → ?id=LV-… borra la valoración y su carpeta de fotos
const handler: Handler = async (event, context) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const json = (statusCode: number, body: unknown) => ({ statusCode, headers, body: JSON.stringify(body) });

  if (event.httpMethod !== "GET" && !originOk(event.headers)) return json(403, { error: "forbidden" });
  if (!verifyAdminSession(event.headers["cookie"])) return json(401, { error: "unauthorized" });

  try {
    const store = reviewsStore(event);

    if (event.httpMethod === "GET") return json(200, { reviews: await listReviews(store) });

    if (event.httpMethod === "PUT") {
      let body: Record<string, unknown>;
      try { body = JSON.parse(event.body ?? "{}"); } catch { return json(400, { error: "bad_request" }); }
      const orderId = String(body["orderId"] ?? "");
      const review = await store.get(orderId, { type: "json" }) as Review | null;
      if (!review) return json(404, { error: "not_found" });

      if (typeof body["removePhoto"] === "string") {
        const id = body["removePhoto"];
        if (!(review.photos ?? []).includes(id)) return json(404, { error: "photo_not_found" });
        await destroyImage(id).catch(err => console.error("destroy photo:", err));
        await store.setJSON(orderId, { ...review, photos: review.photos.filter(p => p !== id), updatedAt: new Date().toISOString() });
        await refreshPublic(context);
        return json(200, { success: true });
      }

      const status = String(body["status"] ?? "") as ReviewStatus;
      if (!STATUSES.includes(status)) return json(400, { error: "status" });
      await store.setJSON(orderId, { ...review, status, updatedAt: new Date().toISOString() });
      await refreshPublic(context);
      return json(200, { success: true });
    }

    if (event.httpMethod === "DELETE") {
      const orderId = event.queryStringParameters?.["id"] ?? "";
      if (!orderId) return json(400, { error: "bad_request" });
      await store.delete(orderId);
      await destroyFolderImages(photoFolder(orderId)).catch(err => console.error("delete review photos:", err));
      await refreshPublic(context);
      return json(200, { success: true });
    }

    return json(405, { error: "method_not_allowed" });
  } catch (err) {
    console.error("admin-reviews error:", err);
    return json(500, { error: "server_error" });
  }
};

/** Que la web vea el cambio al momento en vez de esperar a que caduque la caché del CDN (≤ 5 min) */
async function refreshPublic(context: HandlerContext): Promise<void> {
  try {
    const token = (context.clientContext?.["custom"] as { purge_api_token?: string } | undefined)?.purge_api_token;
    await purgeCache({ tags: ["reviews"], token });
  } catch (err) {
    console.error("No se pudo purgar la caché de valoraciones:", err);
  }
}

export { handler };

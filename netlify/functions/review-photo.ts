import type { Handler } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import { originOk } from "./_guard";
import { uploadImage } from "./_cloudinary";
import { photoFolder, verifyReviewToken } from "./_reviews";

const MAX_PHOTO_BODY = 4_000_000; // el navegador la reduce a ~1600 px antes de mandarla

// POST /api/review/photo { orderId, token, dataBase64 } → { publicId }
// La foto va a Cloudinary en layervault/valoraciones/<nº de pedido>/ con la etiqueta del pedido.
// No se publica nada: se enlaza a la valoración al enviarla y se revisa en el admin.
const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const json = (statusCode: number, body: unknown) => ({ statusCode, headers, body: JSON.stringify(body) });

  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });
  if (!originOk(event.headers)) return json(403, { error: "forbidden" });
  if ((event.body?.length ?? 0) > MAX_PHOTO_BODY) return json(413, { error: "payload_too_large" });

  let orderId: string, token: string, dataBase64: string;
  try {
    const raw = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
    orderId    = String(raw["orderId"] ?? "");
    token      = String(raw["token"] ?? "");
    dataBase64 = String(raw["dataBase64"] ?? "");
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataBase64)) throw new Error("invalid");
  } catch {
    return json(400, { error: "bad_request" });
  }
  if (!verifyReviewToken(orderId, token)) return json(403, { error: "invalid_link" });

  try {
    const publicId = await uploadImage(dataBase64, {
      publicId: `${photoFolder(orderId)}${randomBytes(4).toString("hex")}`,
      tags:     ["valoracion", orderId],
      context:  { pedido: orderId },
    });
    return json(200, { publicId });
  } catch (err) {
    console.error("review-photo error:", err);
    return json(502, { error: "upload_failed" });
  }
};

export { handler };

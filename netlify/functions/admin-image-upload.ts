import type { Handler } from "@netlify/functions";
import { createHash } from "node:crypto";
import { originOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";

const CLOUD_NAME       = "dew1whfdu";
const MAX_UPLOAD_BODY  = 8_000_000; // ~8MB en base64

const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!originOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }
  if (!verifyAdminSession(event.headers["cookie"])) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
  }
  if (event.body && event.body.length > MAX_UPLOAD_BODY) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: "payload_too_large" }) };
  }

  const apiKey    = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];
  if (!apiKey || !apiSecret) {
    console.error("Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET env vars");
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_configuration_error" }) };
  }

  let productId: string;
  let dataBase64: string;
  let sequence: string | undefined;
  try {
    const raw = JSON.parse(event.body ?? "{}") as { productId?: unknown; dataBase64?: unknown; sequence?: unknown };
    if (typeof raw.productId !== "string" || !/^[a-z0-9-]+$/.test(raw.productId)) throw new Error("invalid");
    if (typeof raw.dataBase64 !== "string" || !raw.dataBase64.startsWith("data:image/")) throw new Error("invalid");
    productId  = raw.productId;
    dataBase64 = raw.dataBase64;
    sequence   = typeof raw.sequence === "string" && /^\d{2}$/.test(raw.sequence) ? raw.sequence : undefined;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "bad_request" }) };
  }

  // Convención existente: layervault/{product-id}/{n}
  const publicId  = `layervault/${productId}/${sequence ?? Date.now().toString(36)}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign    = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.set("file", dataBase64);
  form.set("public_id", publicId);
  form.set("timestamp", timestamp);
  form.set("api_key", apiKey);
  form.set("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      console.error("Cloudinary upload error:", res.status, await res.text());
      return { statusCode: 502, headers, body: JSON.stringify({ error: "upload_failed" }) };
    }

    const data = await res.json() as { public_id?: string };
    return { statusCode: 200, headers, body: JSON.stringify({ publicId: data.public_id ?? publicId }) };
  } catch (err) {
    console.error("Error uploading to Cloudinary:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };

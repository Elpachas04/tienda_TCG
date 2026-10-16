// Subida y borrado de imágenes en Cloudinary desde las funciones (firmado con la API secret).
import { createHash } from "node:crypto";

export const CLOUD_NAME = "dew1whfdu";

function credentials(): { apiKey: string; apiSecret: string } {
  const apiKey    = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];
  if (!apiKey || !apiSecret) throw new Error("Faltan CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET");
  return { apiKey, apiSecret };
}

/** Firma de Cloudinary: parámetros ordenados alfabéticamente, sin file/api_key, + secret, SHA-1 */
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function uploadImage(dataBase64: string, opts: { publicId: string; tags?: string[]; context?: Record<string, string> }): Promise<string> {
  const { apiKey, apiSecret } = credentials();
  const params: Record<string, string> = { public_id: opts.publicId, timestamp: Math.floor(Date.now() / 1000).toString() };
  if (opts.tags?.length) params["tags"] = opts.tags.join(",");
  if (opts.context) params["context"] = Object.entries(opts.context).map(([k, v]) => `${k}=${v}`).join("|");

  const form = new FormData();
  form.set("file", dataBase64);
  for (const [k, v] of Object.entries(params)) form.set(k, v);
  form.set("api_key", apiKey);
  form.set("signature", sign(params, apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Cloudinary upload ${res.status}: ${await res.text()}`);
  const data = await res.json() as { public_id?: string };
  return data.public_id ?? opts.publicId;
}

export async function destroyImage(publicId: string): Promise<void> {
  const { apiKey, apiSecret } = credentials();
  const params = { public_id: publicId, invalidate: "true", timestamp: Math.floor(Date.now() / 1000).toString() };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.set(k, v);
  form.set("api_key", apiKey);
  form.set("signature", sign(params, apiSecret));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Cloudinary destroy ${res.status}: ${await res.text()}`);
}

/** Borra todo lo que haya bajo una carpeta (incluidas fotos subidas y luego descartadas en el formulario) */
export async function destroyFolderImages(prefix: string): Promise<void> {
  const { apiKey, apiSecret } = credentials();
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload?prefix=${encodeURIComponent(prefix)}&invalidate=true`;
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) throw new Error(`Cloudinary delete prefix ${res.status}: ${await res.text()}`);
}

// Valoraciones de clientes, guardadas en Netlify Blobs (store "reviews", una entrada por pedido).
// Solo puede valorar quien tiene el enlace del email de "Entregado": lleva una firma HMAC del nº de pedido.
// Nada se publica solo: entran como "pendiente" y se aprueban desde el admin.
import { createHmac, timingSafeEqual } from "node:crypto";
import { connectLambda, getStore } from "@netlify/blobs";

export const REVIEWS_STORE = "reviews";
export const SITE_URL = "https://layervault.es";

export type ReviewStatus = "pendiente" | "publicada" | "oculta";

export interface Review {
  orderId:    string;
  name:       string;      // nombre que se muestra (lo elige el cliente; por defecto su nombre de pila)
  rating:     number;      // 1–5
  text:       string;
  productIds: string[];    // productos del pedido, para mostrarla en sus fichas
  products:   string[];    // nombres, para el admin
  status:     ReviewStatus;
  createdAt:  string;
  updatedAt:  string;
}

/** Lo que se publica en la web: sin nº de pedido */
export interface PublicReview {
  name: string; rating: number; text: string; productIds: string[]; createdAt: string;
}

function secret(): string {
  const s = process.env["REVIEW_SECRET"] || process.env["ADMIN_SECRET"];
  if (!s) throw new Error("REVIEW_SECRET/ADMIN_SECRET no configurado");
  return s;
}

export function reviewToken(orderId: string): string {
  return createHmac("sha256", secret()).update(`review:${orderId}`).digest("hex").slice(0, 32);
}

export function verifyReviewToken(orderId: string, token: string): boolean {
  if (!/^LV-[A-Za-z0-9-]{3,40}$/.test(orderId) || !/^[0-9a-f]{32}$/.test(token)) return false;
  const a = Buffer.from(reviewToken(orderId), "hex");
  const b = Buffer.from(token, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function reviewUrl(orderId: string): string {
  return `${SITE_URL}/valorar?id=${encodeURIComponent(orderId)}&t=${reviewToken(orderId)}`;
}

export function reviewsStore(event: unknown) {
  // Funciones en formato Lambda: Blobs necesita el contexto que viene en el evento
  connectLambda(event as Parameters<typeof connectLambda>[0]);
  return getStore(REVIEWS_STORE);
}

export async function listReviews(store: ReturnType<typeof getStore>): Promise<Review[]> {
  const { blobs } = await store.list();
  const all = await Promise.all(blobs.map(b => store.get(b.key, { type: "json" }) as Promise<Review | null>));
  return all.filter((r): r is Review => !!r).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function toPublic(r: Review): PublicReview {
  return { name: r.name, rating: r.rating, text: r.text, productIds: r.productIds, createdAt: r.createdAt };
}

/** Datos del pedido en Notion: nombre del cliente y productos (de "Items JSON") */
export async function orderInfo(orderId: string): Promise<{ firstName: string; productIds: string[]; products: string[] } | null> {
  const token = process.env["NOTION_TOKEN"];
  const db    = process.env["NOTION_DATABASE_ID"];
  if (!token || !db) return null;
  const res = await fetch(`https://api.notion.com/v1/databases/${db}/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
    body: JSON.stringify({ filter: { property: "ID Pedido", title: { equals: orderId } } }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { results: Array<{ properties: Record<string, unknown> }> };
  const props = data.results[0]?.properties;
  if (!props) return null;
  const text = (p: unknown) => ((p as { rich_text?: Array<{ plain_text?: string }> } | undefined)?.rich_text ?? []).map(t => t.plain_text ?? "").join("");
  let items: Array<{ productId?: string; productName?: string }> = [];
  try { items = JSON.parse(text(props["Items JSON"]) || "[]"); } catch { /* pedido antiguo sin Items JSON */ }
  return {
    firstName:  text(props["Cliente"]).trim().split(/\s+/)[0] ?? "",
    productIds: [...new Set(items.map(i => i.productId).filter((x): x is string => !!x))],
    products:   [...new Set(items.map(i => i.productName).filter((x): x is string => !!x))],
  };
}

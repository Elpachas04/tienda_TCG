// Recordatorio de checkout abandonado. Solo si el cliente lo pide con la casilla del checkout (consentimiento
// expreso, desmarcada por defecto): guardamos su email y la cesta, y si no termina el pedido le escribimos UNA vez.
//
// Netlify Blobs, store "checkout-drafts":
//   draft/<hash>  → la cesta pendiente (un borrador por email; se borra al pedir, al darse de baja o a los 7 días)
//   sent/<hash>   → cuándo se le recordó por última vez (para no escribir más de una vez cada 30 días)
// <hash> es el SHA-256 del email: la clave no revela la dirección.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import seedCatalog from "../../src/assets/data/products.json";
import { SITE_URL, button, esc, eur, layout, link, paragraph, panel, row } from "./_email-kit";

export const DRAFTS_STORE = "checkout-drafts";

export const REMINDER_POLICY = {
  /** Horas sin terminar el pedido antes de escribir */
  remindAfterHours: 24,
  /** Pasado este tiempo ya no se escribe: el recordatorio llegaría tarde */
  remindUntilHours: 72,
  /** Días que se guarda un borrador como máximo */
  keepDays: 7,
  /** Días mínimos entre dos recordatorios al mismo email */
  cooldownDays: 30,
} as const;

const MAX_ITEMS = 30;

export interface DraftItem {
  productId: string;
  productName: string;
  variant?: string;
  color?: string;
  leader?: string;
  quantity: number;
  unitPrice: number;
}

export interface Draft {
  email: string;
  name?: string;
  items: DraftItem[];
  createdAt: string;
  updatedAt: string;
  remindedAt?: string;
}

interface CatalogProduct { id: string; name: string; hidden?: boolean }

export function draftsStore() {
  return getStore(DRAFTS_STORE);
}

export function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export const draftKey = (hash: string) => `draft/${hash}`;
export const sentKey  = (hash: string) => `sent/${hash}`;

function secret(): string {
  const s = process.env["CHECKOUT_SECRET"] || process.env["ADMIN_SECRET"];
  if (!s) throw new Error("CHECKOUT_SECRET/ADMIN_SECRET no configurado");
  return s;
}

/** Referencia firmada "<hash>.<firma>" para los enlaces del email (recuperar la cesta y darse de baja) */
export function signedRef(hash: string): string {
  return `${hash}.${createHmac("sha256", secret()).update(`checkout-draft:${hash}`).digest("hex").slice(0, 32)}`;
}

export function verifyRef(ref: string): string | null {
  const [hash, sig] = ref.split(".");
  if (!hash || !sig || !/^[a-f0-9]{64}$/.test(hash)) return null;
  const expected = Buffer.from(signedRef(hash).split(".")[1]);
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? hash : null;
}

function cleanStr(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\x00-\x1F\x7F]/g, "").trim();
  return s ? s.slice(0, max) : undefined;
}

/**
 * Valida la cesta contra el catálogo publicado. El nombre del producto se toma del catálogo, nunca del navegador,
 * para que nadie pueda usar el recordatorio para mandar texto arbitrario a otra dirección.
 */
export async function sanitizeItems(raw: unknown): Promise<DraftItem[]> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return [];
  const catalog = (await getStore("products").get("catalog", { type: "json" }).catch(() => null)) as { products?: CatalogProduct[] } | null;
  const products = new Map(((catalog?.products ?? seedCatalog.products) as CatalogProduct[]).filter(p => !p.hidden).map(p => [p.id, p]));

  const items: DraftItem[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    const product = products.get(String(r?.["productId"] ?? ""));
    const quantity = Number(r?.["quantity"]);
    const unitPrice = Number(r?.["unitPrice"]);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) continue;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 1000) continue;
    items.push({
      productId: product.id,
      productName: product.name,
      variant: cleanStr(r["variant"], 60),
      color: cleanStr(r["color"], 40),
      leader: cleanStr(r["leader"], 80),
      quantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
    });
  }
  return items;
}

export function reminderHtml(draft: Draft, ref: string): string {
  const total = draft.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const rows = draft.items.map(i => row(
    `${i.quantity > 1 ? `${i.quantity} &times; ` : ""}${esc(i.productName)}`,
    eur(i.unitPrice * i.quantity),
    { sub: [i.variant, i.color, i.leader && `Líder: ${i.leader}`].filter(Boolean).map(v => esc(v as string)).join(" &middot; ") || undefined },
  )).join("") + row("Total", eur(total), { top: true, total: true });

  return layout({
    preheader: "Tu cesta sigue guardada. Termina el pedido cuando quieras.",
    greeting: draft.name ? `Hola, ${esc(draft.name.split(" ")[0])}` : "Hola",
    title: "Tu cesta sigue aquí",
    lede: "Empezaste un pedido y no llegaste a confirmarlo. Te lo dejamos tal cual para que lo termines con un clic.",
    blocks: [
      panel("Tu cesta", rows),
      button(`${SITE_URL}/checkout?recuperar=${encodeURIComponent(ref)}`, "Terminar el pedido"),
      paragraph(`Te escribimos porque marcaste la casilla del recordatorio, y solo lo hacemos esta vez. ${link(`${SITE_URL}/api/checkout-draft?baja=${encodeURIComponent(ref)}`, "Borrar mi cesta y mi email")}.`, { size: 14 }),
    ],
  });
}

export async function sendBrevoEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env["BREVO_API_KEY"];
  if (!apiKey) return false;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json; charset=utf-8", "api-key": apiKey },
    body: JSON.stringify({ sender: { name: "LayerVault", email: "hola@layervault.es" }, to: [{ email: to }], subject, htmlContent: html }),
  }).catch(() => null);
  if (!res?.ok) console.error("brevo error:", res?.status, await res?.text().catch(() => ""));
  return !!res?.ok;
}

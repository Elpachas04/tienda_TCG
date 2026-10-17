// Invitaciones ("invita a un nakama"). Reglas e importes en REFERRAL (shop-policy.ts); se activan con
// settings.referralsEnabled desde Admin → Invitaciones. Mientras estén apagadas, nada de esto se ejecuta.
//
// Netlify Blobs, store "referrals":
//   owner/<hash>      → código personal de un cliente ("NAKAMA-XXXXX"), se crea al entregarle su primer pedido
//   code/<CODE>       → datos del código: de invitación (reutilizable) o vale de quien invita (un solo uso)
//   used/<hash>       → este email ya usó una invitación (solo se puede una vez)
//   pending/<orderId> → pedido hecho con invitación: al entregarse, quien invitó recibe su vale
// <hash> es el SHA-256 del email.
import { randomInt } from "node:crypto";
import { getStore } from "@netlify/blobs";
import seedCatalog from "../../src/assets/data/products.json";
import { REFERRAL } from "../../src/app/shared/constants/shop-policy";
import { SITE_URL, bigValue, button, esc, gap, layout, panel, paragraph, strong } from "./_email-kit";
import { emailHash, sendBrevoEmail } from "./_checkout-drafts";

export const REFERRALS_STORE = "referrals";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type CouponKind = "invitacion" | "vale";

interface InviteCode { kind: "invitacion"; ownerHash: string; ownerEmail: string; ownerName?: string; createdAt: string }
interface RewardCode { kind: "vale"; ownerHash: string; amount: number; createdAt: string; expiresAt: string; usedAt?: string; usedBy?: string }
type CodeRecord = InviteCode | RewardCode;

interface Pending { code: string; referrerEmail: string; referrerName?: string; friendHash: string; createdAt: string }

export type CouponCheck =
  | { ok: true; code: string; kind: CouponKind; amount: number; minSubtotal: number }
  | { ok: false; reason: "disabled" | "not_found" | "own_code" | "already_used" | "expired" };

export function referralsStore() {
  return getStore(REFERRALS_STORE);
}

export async function referralsEnabled(): Promise<boolean> {
  const catalog = await getStore("products").get("catalog", { type: "json" }).catch(() => null) as { settings?: { referralsEnabled?: boolean } } | null;
  return !!(catalog?.settings ?? (seedCatalog as { settings?: { referralsEnabled?: boolean } }).settings)?.referralsEnabled;
}

export function normalizeCode(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
}

function randomCode(prefix: string, length: number): string {
  return `${prefix}-${Array.from({ length }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("")}`;
}

/**
 * Comprueba un cupón sin gastarlo. El subtotal mínimo no se mira aquí: lo aplica orderTotals() (shop-policy.ts),
 * así el cliente puede meter el código y ver cuánto le falta.
 */
export async function checkCoupon(rawCode: unknown, email: string): Promise<CouponCheck> {
  if (!(await referralsEnabled())) return { ok: false, reason: "disabled" };
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "not_found" };
  const store = referralsStore();
  const record = await store.get(`code/${code}`, { type: "json" }) as CodeRecord | null;
  if (!record) return { ok: false, reason: "not_found" };

  const hash = emailHash(email);
  if (record.kind === "invitacion") {
    if (record.ownerHash === hash) return { ok: false, reason: "own_code" };
    if (await store.get(`used/${hash}`)) return { ok: false, reason: "already_used" };
  } else {
    if (record.ownerHash !== hash) return { ok: false, reason: "not_found" }; // el vale es personal
    if (record.usedAt) return { ok: false, reason: "already_used" };
    if (Date.parse(record.expiresAt) < Date.now()) return { ok: false, reason: "expired" };
  }

  const amount = record.kind === "invitacion" ? REFERRAL.friendDiscount : record.amount;
  return { ok: true, code, kind: record.kind, amount, minSubtotal: REFERRAL.minSubtotal };
}

/** Gasta el cupón cuando el pedido ya está hecho. Nunca lanza: el pedido no se deshace por esto. */
export async function redeemCoupon(check: Extract<CouponCheck, { ok: true }>, email: string, orderId: string): Promise<void> {
  try {
    const store = referralsStore();
    const hash = emailHash(email);
    const now = new Date().toISOString();
    const record = await store.get(`code/${check.code}`, { type: "json" }) as CodeRecord | null;
    if (!record) return;
    if (record.kind === "invitacion") {
      await store.setJSON(`used/${hash}`, { code: check.code, orderId, at: now });
      const pending: Pending = { code: check.code, referrerEmail: record.ownerEmail, referrerName: record.ownerName, friendHash: hash, createdAt: now };
      await store.setJSON(`pending/${orderId}`, pending);
    } else {
      await store.setJSON(`code/${check.code}`, { ...record, usedAt: now, usedBy: orderId });
    }
  } catch (err) {
    console.error("redeemCoupon:", err);
  }
}

/** Código personal del cliente; lo crea la primera vez */
export async function inviteCodeFor(email: string, name?: string): Promise<string> {
  const store = referralsStore();
  const hash = emailHash(email);
  const existing = await store.get(`owner/${hash}`);
  if (typeof existing === "string" && existing) return existing;

  for (let i = 0; i < 5; i++) {
    const code = randomCode("NAKAMA", 5);
    if (await store.get(`code/${code}`)) continue;
    const record: InviteCode = { kind: "invitacion", ownerHash: hash, ownerEmail: email, ownerName: name, createdAt: new Date().toISOString() };
    await store.setJSON(`code/${code}`, record);
    await store.set(`owner/${hash}`, code);
    return code;
  }
  throw new Error("No se pudo generar un código único");
}

/** Bloque del email de "Entregado" con el código para invitar */
export function inviteBlock(code: string): string {
  return panel("Invita a un nakama", [
    paragraph(`Pásale este código a quien quieras: tendrá ${strong(`${REFERRAL.friendDiscount}&nbsp;€ de descuento`)} en su primer pedido desde ${REFERRAL.minSubtotal}&nbsp;€, y cuando le llegue, te regalamos un vale de ${strong(`${REFERRAL.referrerReward}&nbsp;€`)} para el tuyo.`, { size: 14 }),
    gap(16),
    bigValue("Tu código", esc(code), { gold: true, last: true }),
  ].join(""));
}

/**
 * Pedido entregado: si se hizo con una invitación, crea el vale de quien invitó y se lo manda.
 * Nunca lanza.
 */
export async function rewardReferrer(orderId: string): Promise<boolean> {
  try {
    const store = referralsStore();
    const pending = await store.get(`pending/${orderId}`, { type: "json" }) as Pending | null;
    if (!pending) return false;

    const code = randomCode("VALE", 6);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFERRAL.rewardValidDays * 86_400_000);
    const reward: RewardCode = { kind: "vale", ownerHash: emailHash(pending.referrerEmail), amount: REFERRAL.referrerReward, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() };
    await store.setJSON(`code/${code}`, reward);
    await store.delete(`pending/${orderId}`);

    const html = layout({
      preheader: `Tienes un vale de ${REFERRAL.referrerReward} € para tu próximo pedido.`,
      greeting: pending.referrerName ? `Hola, ${esc(pending.referrerName.split(" ")[0])}` : "Hola",
      title: "Tu invitación ha llegado",
      lede: `Alguien ha hecho su pedido con tu código y ya lo tiene en casa. Gracias por recomendarnos: aquí tienes tu vale.`,
      blocks: [
        panel("Tu vale", bigValue(`${REFERRAL.referrerReward} € de descuento · pedidos desde ${REFERRAL.minSubtotal} €`, esc(code), { gold: true, last: true })),
        button(`${SITE_URL}/catalog`, "Ver el catálogo"),
        paragraph(`Es personal: funciona con este email, una sola vez, hasta el ${expiresAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}. Escríbelo en el checkout, en «Código de descuento».`, { size: 14 }),
      ],
    });
    return await sendBrevoEmail(pending.referrerEmail, `Tu vale de ${REFERRAL.referrerReward} € en LayerVault`, html);
  } catch (err) {
    console.error("rewardReferrer:", err);
    return false;
  }
}

export interface ReferralStats {
  enabled: boolean;
  inviteCodes: number;
  invitesUsed: number;
  pendingRewards: number;
  rewardsIssued: number;
  rewardsUsed: number;
}

export async function referralStats(): Promise<ReferralStats> {
  const store = referralsStore();
  const count = async (prefix: string) => (await store.list({ prefix })).blobs.length;
  let rewardsIssued = 0, rewardsUsed = 0, inviteCodes = 0;
  for (const { key } of (await store.list({ prefix: "code/" })).blobs) {
    const r = await store.get(key, { type: "json" }) as CodeRecord | null;
    if (r?.kind === "vale") { rewardsIssued++; if (r.usedAt) rewardsUsed++; }
    else if (r?.kind === "invitacion") inviteCodes++;
  }
  return {
    enabled: await referralsEnabled(),
    inviteCodes,
    invitesUsed: await count("used/"),
    pendingRewards: await count("pending/"),
    rewardsIssued,
    rewardsUsed,
  };
}

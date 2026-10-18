// "Avísame cuando vuelva": emails de quien espera un producto agotado (Netlify Blobs, store "restock",
// una entrada por producto). Al marcar el producto como "Se puede comprar" en el admin se avisa y se borra la lista.
import { connectLambda, getStore } from "@netlify/blobs";
import { SITE_URL, button, layout, paragraph } from "./_email-kit";
import { SHIPPING } from "../../src/app/shared/constants/shop-policy";

export const RESTOCK_STORE = "restock";
export const MAX_WAITING = 500;

export interface Waiting { emails: string[] }

export function restockStore(event: unknown) {
  connectLambda(event as Parameters<typeof connectLambda>[0]);
  return getStore(RESTOCK_STORE);
}

export function isEmail(s: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(s) && s.length <= 254;
}

function backInStockHtml(name: string, productId: string): string {
  return layout({
    preheader: `${name} vuelve a estar disponible.`,
    greeting: "Hola",
    title: `${name} ya está disponible`,
    lede: `Nos pediste que te avisáramos cuando volviera. Ya puedes pedirlo: lo fabricamos en ${SHIPPING.handlingDays.min}–${SHIPPING.handlingDays.max} días laborables.`,
    blocks: [
      button(`${SITE_URL}/product/${encodeURIComponent(productId)}`, "Ver el producto"),
      paragraph("Te escribimos solo esta vez: no te hemos apuntado a ninguna lista.", { size: 14 }),
    ],
  });
}

/** Avisa a quien espera cada producto que acaba de volver y vacía su lista. Nunca lanza. */
export async function notifyBackInStock(event: unknown, products: Array<{ id: string; name: string }>): Promise<number> {
  const apiKey = process.env["BREVO_API_KEY"];
  if (!apiKey || !products.length) return 0;
  let sent = 0;
  try {
    const store = restockStore(event);
    for (const p of products) {
      const waiting = await store.get(p.id, { type: "json" }) as Waiting | null;
      if (!waiting?.emails.length) continue;
      const html = backInStockHtml(p.name, p.id);
      for (const email of waiting.emails) {
        // Un email por persona: nadie ve las direcciones de los demás
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "accept": "application/json", "content-type": "application/json; charset=utf-8", "api-key": apiKey },
          body: JSON.stringify({
            sender: { name: "LayerVault", email: "hola@layervault.es" },
            to: [{ email }],
            subject: `${p.name} vuelve a estar disponible`,
            htmlContent: html,
          }),
        }).catch(() => null);
        if (res?.ok) sent++;
        else console.error("restock email error:", res?.status, await res?.text().catch(() => ""));
      }
      await store.delete(p.id);
    }
  } catch (err) {
    console.error("notifyBackInStock:", err);
  }
  return sent;
}

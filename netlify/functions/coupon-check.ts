import { originOk } from "./_guard";
import { isEmail } from "./_restock";
import { checkCoupon } from "./_referrals";

// POST /api/coupon { code, email } → ¿vale este código para este email? No lo gasta:
// eso pasa al confirmar el pedido (send-telegram.ts), que vuelve a comprobarlo.
const MESSAGES: Record<string, string> = {
  disabled: "Ahora mismo no hay códigos de descuento activos.",
  not_found: "Este código no existe. Revisa que esté bien escrito.",
  own_code: "Este es tu propio código: pásaselo a un amigo.",
  already_used: "Este código ya se ha usado con este email.",
  expired: "Este vale ha caducado.",
};

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!originOk(Object.fromEntries(req.headers))) return json(403, { error: "forbidden" });

  let raw: Record<string, unknown>;
  try { raw = JSON.parse((await req.text()).slice(0, 2_000) || "{}"); } catch { return json(400, { error: "bad_request" }); }
  const email = String(raw["email"] ?? "").trim().toLowerCase();
  if (!isEmail(email)) return json(400, { ok: false, message: "Escribe primero tu email: el código va ligado a él." });

  try {
    const result = await checkCoupon(raw["code"], email);
    return json(200, result.ok ? result : { ...result, message: MESSAGES[result.reason] });
  } catch (err) {
    console.error("coupon-check:", err);
    return json(500, { ok: false, message: "No hemos podido comprobar el código. Prueba otra vez." });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

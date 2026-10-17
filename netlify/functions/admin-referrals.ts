import type { Handler } from "@netlify/functions";
import { connectLambda } from "@netlify/blobs";
import { verifyAdminSession } from "./_admin-auth";
import { referralStats } from "./_referrals";

// GET /api/admin/referrals → cifras de las invitaciones para Admin → Invitaciones
const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  if (!verifyAdminSession(event.headers["cookie"])) return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
  try {
    connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
    return { statusCode: 200, headers, body: JSON.stringify(await referralStats()) };
  } catch (err) {
    console.error("admin-referrals:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };

import type { Handler } from "@netlify/functions";
import { createHash, timingSafeEqual } from "node:crypto";
import { originOk, MAX_BODY } from "./_guard";
import { buildSessionCookie } from "./_admin-auth";

function safeStringEqual(a: string, b: string): boolean {
  const bufA = createHash("sha256").update(a).digest();
  const bufB = createHash("sha256").update(b).digest();
  return timingSafeEqual(bufA, bufB);
}

const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!originOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }
  if (event.body && event.body.length > MAX_BODY) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: "payload_too_large" }) };
  }

  const adminPassword = process.env["ADMIN_PASSWORD"];
  const adminSecret   = process.env["ADMIN_SECRET"];
  if (!adminPassword || !adminSecret) {
    console.error("Missing ADMIN_PASSWORD or ADMIN_SECRET env vars");
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_configuration_error" }) };
  }

  let password: string;
  try {
    const raw = JSON.parse(event.body ?? "{}") as { password?: unknown };
    if (typeof raw.password !== "string" || raw.password.length === 0) throw new Error("invalid");
    password = raw.password;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "bad_request" }) };
  }

  if (!safeStringEqual(password, adminPassword)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "invalid_password" }) };
  }

  return {
    statusCode: 200,
    headers,
    multiValueHeaders: { "Set-Cookie": [buildSessionCookie(adminSecret)] },
    body: JSON.stringify({ success: true }),
  };
};

export { handler };

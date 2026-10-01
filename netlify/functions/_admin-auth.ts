import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME     = "admin_session";
const SESSION_MS      = 7 * 24 * 60 * 60 * 1000;
const COOKIE_ATTRS    = "HttpOnly; Secure; SameSite=Strict; Path=/";

function sign(expiry: string, secret: string): string {
  return createHmac("sha256", secret).update(expiry).digest("hex");
}

/** Genera el header Set-Cookie para una nueva sesión de admin válida 7 días */
export function buildSessionCookie(secret: string): string {
  const expiry    = (Date.now() + SESSION_MS).toString();
  const signature = sign(expiry, secret);
  return `${COOKIE_NAME}=${expiry}.${signature}; ${COOKIE_ATTRS}; Max-Age=${Math.floor(SESSION_MS / 1000)}`;
}

/** Header Set-Cookie que borra la sesión de admin */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; ${COOKIE_ATTRS}; Max-Age=0`;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

/** Valida la cookie admin_session: firma HMAC correcta y expiry no pasado */
export function verifyAdminSession(cookieHeader: string | undefined): boolean {
  const secret = process.env["ADMIN_SECRET"];
  if (!secret) return false;

  const raw = parseCookies(cookieHeader)[COOKIE_NAME];
  if (!raw) return false;

  const dot = raw.indexOf(".");
  if (dot === -1) return false;

  const expiry    = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return false;
  if (!/^[0-9a-f]+$/i.test(signature)) return false;

  const expected = Buffer.from(sign(expiry, secret), "hex");
  const actual   = Buffer.from(signature, "hex");
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

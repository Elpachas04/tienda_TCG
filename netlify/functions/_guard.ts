const PROD_ORIGINS = new Set([
  'https://layervault.es',
  'https://www.layervault.es',
]);

function isAllowed(origin: string): boolean {
  return PROD_ORIGINS.has(origin) || origin.startsWith('http://localhost:');
}

/** POST requests — browsers always send Origin for non-simple cross-origin and same-origin POSTs */
export function originOk(headers: Record<string, string | undefined>): boolean {
  return isAllowed(headers['origin'] ?? '');
}

/** GET requests — fall back to Referer when Origin is absent */
export function requestOk(headers: Record<string, string | undefined>): boolean {
  const origin = headers['origin'] ?? '';
  if (origin && isAllowed(origin)) return true;
  const ref = headers['referer'] ?? '';
  return (
    ref.startsWith('https://layervault.es/') ||
    ref.startsWith('https://www.layervault.es/') ||
    ref.startsWith('http://localhost:')
  );
}

export const MAX_BODY = 20_000;

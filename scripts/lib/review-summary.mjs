// Nota media y número de valoraciones publicadas por producto, para el aggregateRating de la ficha.
// Se calcula en el build porque las valoraciones se cargan en el navegador y los buscadores y agentes
// de IA necesitan verlas en el HTML prerenderizado. Una valoración publicada después del deploy
// entra en el siguiente.

export async function fetchReviewSummary({ site, enabled }) {
  if (!enabled) return {};
  const res = await fetch(`${site}/api/reviews`, {
    headers: { Referer: `${site}/` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { reviews = [] } = await res.json();
  return summarize(reviews);
}

export function summarize(reviews) {
  const acc = {};
  for (const r of reviews) {
    if (!Number.isFinite(r.rating)) continue;
    for (const id of new Set(r.productIds ?? [])) {
      acc[id] ??= { sum: 0, count: 0 };
      acc[id].sum += r.rating;
      acc[id].count += 1;
    }
  }
  return Object.fromEntries(
    Object.entries(acc).map(([id, { sum, count }]) => [id, { average: Math.round((sum / count) * 10) / 10, count }])
  );
}

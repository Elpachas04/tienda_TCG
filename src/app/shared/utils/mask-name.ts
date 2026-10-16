/** "Marta López" → "Ma***": así se muestra el nombre en las valoraciones públicas (igual que _reviews.ts) */
export function maskName(name: string): string {
  const first = Array.from(name.trim().split(/\s+/)[0] ?? '');
  if (!first.length) return '***';
  return first.slice(0, 2).join('') + '*'.repeat(Math.max(3, first.length - 2));
}

/**
 * Nombre y apellidos tapados para la web: tres primeras letras, asteriscos y dos últimas.
 * 'Marta Gómez' → 'Mar******ez'. Los espacios también se tapan, para no revelar cuántas palabras tiene.
 */
export function maskName(fullName: string): string {
  const c = Array.from(fullName.trim().replace(/\s+/g, ' '));
  if (!c.length) return '***';
  if (c.length <= 5) return c[0] + '*'.repeat(Math.max(3, c.length - 1));
  return c.slice(0, 3).join('') + '*'.repeat(c.length - 5) + c.slice(-2).join('');
}

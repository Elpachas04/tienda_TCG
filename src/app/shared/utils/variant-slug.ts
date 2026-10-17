// Slug de una variante para la URL de la ficha (?variante=100-cartas). Lo usan la ficha (para abrir con esa
// variante), el JSON-LD y el feed de Google Merchant (scripts/lib/merchant-feed.mjs lo importa con Node),
// así que va sin imports ni sintaxis exclusiva de TypeScript.
export function variantSlug(label: string): string {
  return label.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const VARIANT_PARAM = 'variante';

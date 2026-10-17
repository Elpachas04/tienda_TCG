// Feed de productos para Google Merchant Center (RSS 2.0 con el espacio de nombres g:).
// Se genera en cada build a partir del catálogo real; Merchant Center lo descarga de /feeds/google-merchant.xml.
// Envío y devoluciones NO van aquí: se configuran en la cuenta de Merchant Center, que permite excluir
// los códigos postales sin envío (ver SHIPPING.excludedPostalPrefixes en shop-policy.ts).
import { SHIPPING, SHOP_CURRENCY } from '../../src/app/shared/constants/shop-policy.ts';

const IMAGE_BASE = 'https://res.cloudinary.com/dew1whfdu/image/upload';
const IMAGE_TRANSFORM = 'f_jpg,q_auto:good,c_limit,w_1200,h_1200';

export function buildMerchantFeed({ site, brand, products, categories }) {
  const categoryLabel = Object.fromEntries((categories ?? []).map(c => [c.id, c.label]));
  const items = products.flatMap(p => productItems(p, { site, brand, categoryLabel }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(brand)}</title>
    <link>${site}/</link>
    <description>${xml(`Catálogo de ${brand}`)}</description>
${items.join('\n')}
  </channel>
</rss>
`;
}

function productItems(p, { site, brand, categoryLabel }) {
  const variants = p.variants?.length ? p.variants : [null];
  const images = (p.images ?? []).filter(Boolean).map(id => `${IMAGE_BASE}/${IMAGE_TRANSFORM}/${id}`);
  if (images.length === 0) return [];

  return variants.map(v => {
    const id = v ? `${p.sku ?? p.id}-${slug(v.label)}` : (p.sku ?? p.id);
    const title = v ? `${p.name} — ${v.label}` : p.name;
    const description = v?.copy?.description ?? p.description ?? p.tagline;
    const fields = [
      ['g:id', id],
      ['g:title', title],
      ['g:description', description],
      ['g:link', `${site}/product/${p.id}`],
      ['g:image_link', images[0]],
      ...images.slice(1, 10).map(url => ['g:additional_image_link', url]),
      ['g:availability', p.available ? 'in_stock' : 'out_of_stock'],
      ['g:price', `${(v?.price ?? p.price).toFixed(2)} ${SHOP_CURRENCY}`],
      ['g:brand', brand],
      ['g:condition', 'new'],
      ['g:identifier_exists', 'no'],
      ['g:product_type', categoryLabel[p.category] ?? p.category],
      ['g:min_handling_time', String(SHIPPING.handlingDays.min)],
      ['g:max_handling_time', String(SHIPPING.handlingDays.max)],
      ...(v ? [['g:item_group_id', p.sku ?? p.id], ['g:size', v.label]] : []),
    ];
    return `    <item>\n${fields.map(([k, val]) => `      <${k}>${xml(val)}</${k}>`).join('\n')}\n    </item>`;
  });
}

function slug(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function xml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

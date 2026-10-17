import { Product } from '../models/product.model';
import { RETURNS, SHIPPING, SHOP_COUNTRY, SHOP_CURRENCY } from '../../shared/constants/shop-policy';
import { VARIANT_PARAM, variantSlug } from '../../shared/utils/variant-slug';

export interface RatingSummary {
  average: number;
  count: number;
}

export interface ProductSchemaInput {
  product: Product;
  url: string;
  description: string;
  images: string[];
  brand: string;
  rating?: RatingSummary | null;
}

// Datos estructurados de Product (schema.org). Google y los agentes de compra con IA leen de aquí precio,
// stock, envío y devoluciones, así que todo sale de shop-policy.ts para que no se desincronice de la web.
export function buildProductSchema({ product, url, description, images, brand, rating }: ProductSchemaInput): object {
  const availability = product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const variants = product.variants?.length ? product.variants : [{ label: '', price: product.price }];

  const offers = variants.map(v => ({
    '@type': 'Offer',
    ...(v.label && { name: `${product.name} — ${v.label}` }),
    price: v.price.toFixed(2),
    priceCurrency: SHOP_CURRENCY,
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    url: v.label ? `${url}?${VARIANT_PARAM}=${variantSlug(v.label)}` : url,
    seller: { '@type': 'Organization', name: brand },
    shippingDetails: shippingDetails(),
    hasMerchantReturnPolicy: returnPolicy(),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: images,
    ...(product.sku && { sku: product.sku }),
    brand: { '@type': 'Brand', name: brand },
    ...(rating && rating.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.average.toFixed(1),
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: offers.length === 1 ? offers[0] : offers,
  };
}

function shippingDetails(): object {
  const days = (r: { min: number; max: number }) => ({ '@type': 'QuantitativeValue', minValue: r.min, maxValue: r.max, unitCode: 'DAY' });
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: SHIPPING.price.toFixed(2), currency: SHOP_CURRENCY },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: SHOP_COUNTRY },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: days(SHIPPING.handlingDays),
      transitTime: days(SHIPPING.transitDays),
    },
  };
}

function returnPolicy(): object {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: SHOP_COUNTRY,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: RETURNS.days,
    returnMethod: 'https://schema.org/ReturnByMail',
    refundType: 'https://schema.org/StoreCreditRefund',
  };
}

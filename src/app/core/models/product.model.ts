export interface VariantSpecs {
  capacity: number;
  width_cm: number;
  length_cm: number;
}

export interface VariantCopy {
  tagline: string;
  description: string;
  uses: string[];
}

export interface ProductVariant {
  label: string;
  price: number;
  default?: boolean;
  specs?: VariantSpecs;
  copy?: VariantCopy;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  default: boolean;
}

export type BadgeStyle = 'gold' | 'teal' | 'purple' | 'coral' | null;
export type ProductCategory = 'deckbox' | 'storage' | 'tools' | 'accessories';

export interface Product {
  id: string;
  sku?: string;
  name: string;
  tagline: string;
  category: ProductCategory;
  badge?: string | null;
  badgeStyle?: BadgeStyle;
  description: string;
  features: string[];
  video?: string;
  colorImageKey?: string;
  images: string[];
  price: number;
  variants?: ProductVariant[];
  available_addons?: string[];
  colorPickerEnabled: boolean;
  available: boolean;
  hidden?: boolean;
}

export interface CategoryItem {
  id: 'all' | ProductCategory;
  label: string;
  emoji: string;
}

export interface Color {
  id: string;
  name: string;
  hex: string;
  type: string;
  stock: 'alto' | 'normal' | 'bajo';
  quantity: number;
  popular: boolean;
}

export interface ShopSettings {
  shopName: string;
  city: string;
  whatsappPhone: string;
  paymentMethods: string[];
  deliveryDays: string;
}

export interface ProductCatalog {
  products: Product[];
  categories: CategoryItem[];
  colors: Color[];
  addons: ProductAddon[];
  settings: ShopSettings;
}

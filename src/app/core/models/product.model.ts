export interface ProductVariant {
  label: string;
  price: number;
}

export type BadgeStyle = 'gold' | 'teal' | 'purple' | 'coral' | null;
export type ProductCategory = 'deckbox' | 'storage' | 'tools' | 'accessories';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  badge?: string | null;
  badgeStyle?: BadgeStyle;
  description: string;
  features: string[];
  images: string[];
  price: number;
  variants?: ProductVariant[];
  colorPickerEnabled: boolean;
  available: boolean;
}

export interface CategoryItem {
  id: 'all' | ProductCategory;
  label: string;
  emoji: string;
}

export interface ShopSettings {
  shopName: string;
  city: string;
  telegramUsername: string;
  depositPercent: number;
  paymentMethods: string[];
  deliveryDays: string;
}

export interface ProductCatalog {
  products: Product[];
  categories: CategoryItem[];
  settings: ShopSettings;
}

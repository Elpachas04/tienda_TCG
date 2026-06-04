export interface CartItem {
  productId: string;
  productSku?: string;
  productName: string;
  variant?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

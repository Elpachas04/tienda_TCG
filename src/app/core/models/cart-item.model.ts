export interface CartItem {
  productId: string;
  productName: string;
  variant?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

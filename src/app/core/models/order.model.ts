import { CartItem } from './cart-item.model';

export interface Order {
  items: CartItem[];
  customerName: string;
  customerContact: string;
  deliveryMethod: 'pickup' | 'shipping';
  postalCode?: string;
  shippingZone?: string;
  shippingCost?: number;
  notes?: string;
  totalAmount: number;
  depositAmount: number;
  timestamp: string;
}

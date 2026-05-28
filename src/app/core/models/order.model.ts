import { CartItem } from './cart-item.model';

export interface Order {
  items: CartItem[];
  customerName: string;
  customerContact: string;
  deliveryMethod: 'pickup' | 'shipping';
  notes?: string;
  totalAmount: number;
  depositAmount: number;
  timestamp: string;
}

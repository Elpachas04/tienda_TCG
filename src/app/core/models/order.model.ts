import { CartItem } from './cart-item.model';
import { OficinaCorreos } from './oficina.model';

export interface Order {
  items: CartItem[];
  customerName: string;
  customerContact: string;
  deliveryMethod: 'pickup' | 'shipping';
  postalCode?: string;
  shippingZone?: string;
  shippingCost?: number;
  oficinaCorreos?: OficinaCorreos;
  notes?: string;
  totalAmount: number;
  timestamp: string;
}

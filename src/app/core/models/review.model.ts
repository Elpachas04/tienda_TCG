export type ReviewStatus = 'pendiente' | 'publicada' | 'oculta';

export interface PublicReview {
  name: string;
  rating: number;
  text: string;
  productIds: string[];
  photos: string[];
  createdAt: string;
}

export interface AdminReview extends PublicReview {
  orderId: string;
  products: string[];
  status: ReviewStatus;
  updatedAt: string;
}

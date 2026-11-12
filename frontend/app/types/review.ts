export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
  user: { name: string };
}

export interface AdminReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; slug: string };
}

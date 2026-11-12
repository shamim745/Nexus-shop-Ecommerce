export interface Brand {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive?: boolean;
  _count?: { products: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId?: string | null;
  isActive?: boolean;
  position?: number;
  productCount?: number;
  children?: Category[];
  _count?: { products: number };
}

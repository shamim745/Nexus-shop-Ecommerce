import type { Brand } from "./brand";
import type { Category } from "./category";

export interface ProductImage {
  id?: string;
  url: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  label: string | null;
  options: Record<string, string> | null;
  price: number | null;
  comparePrice: number | null;
  stock: number;
  isActive?: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  hasVariants: boolean;
  isActive: boolean;
  isFeatured?: boolean;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  createdAt: string;
  images: Array<{ url: string }>;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  related: ProductListItem[];
}

export interface HomeData {
  categories: Category[];
  brands: Brand[];
  featured: ProductListItem[];
  newArrivals: ProductListItem[];
  bestSelling: ProductListItem[];
}

export interface AdminProduct extends ProductListItem {
  description: string | null;
  brandId: string | null;
  categoryId: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  _count?: { variants: number; orderItems: number };
}

/** Query params accepted by GET /products (public + admin variants). */
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  featured?: boolean;
}

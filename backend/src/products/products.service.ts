import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module.js";
import { pageMeta } from "../common/dto/pagination.dto.js";
import { ProductQueryDto } from "./dto/product.dto.js";

const LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  stock: true,
  hasVariants: true,
  isActive: true,
  ratingAvg: true,
  ratingCount: true,
  salesCount: true,
  createdAt: true,
  images: {
    take: 1,
    orderBy: { position: "asc" as const },
    select: { url: true },
  },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto) {
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: LIST_SELECT,
      }),
    ]);

    return { items, meta: pageMeta(total, query.page, query.limit) };
  }

  async detail(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        ...LIST_SELECT,
        description: true,
        images: { orderBy: { position: "asc" }, select: { id: true, url: true } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sku: true,
            label: true,
            options: true,
            price: true,
            comparePrice: true,
            stock: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException("Product not found");

    const related = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        OR: [
          { categoryId: product.category?.id ?? "" },
          { brandId: product.brand?.id ?? "" },
        ],
      },
      orderBy: { salesCount: "desc" },
      take: 8,
      select: LIST_SELECT,
    });

    return { ...product, related };
  }

  async home() {
    const base = { where: { isActive: true }, select: LIST_SELECT };
    const [categories, brands, featured, newArrivals, bestSelling] =
      await this.prisma.$transaction([
        this.prisma.category.findMany({
          where: { isActive: true, parentId: null },
          orderBy: { position: "asc" },
          take: 12,
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            _count: { select: { products: { where: { isActive: true } } } },
          },
        }),
        this.prisma.brand.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          take: 12,
          select: { id: true, name: true, slug: true, imageUrl: true },
        }),
        this.prisma.product.findMany({
          ...base,
          where: { isActive: true, isFeatured: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        this.prisma.product.findMany({
          ...base,
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        this.prisma.product.findMany({
          ...base,
          where: { isActive: true },
          orderBy: { salesCount: "desc" },
          take: 8,
        }),
      ]);

    return {
      categories: categories.map((c) => ({
        ...c,
        productCount: c._count.products,
        _count: undefined,
      })),
      brands,
      featured,
      newArrivals,
      bestSelling,
    };
  }

  private buildWhere(query: ProductQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { brand: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.featured) where.isFeatured = true;
    if (query.minRating) where.ratingAvg = { gte: query.minRating };

    const price: Prisma.DecimalFilter<"Product"> = {};
    if (query.minPrice !== undefined) price.gte = query.minPrice;
    if (query.maxPrice !== undefined) price.lte = query.maxPrice;
    if (Object.keys(price).length > 0) where.price = price;

    return where;
  }

  private buildOrderBy(
    query: ProductQueryDto,
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (query.sort) {
      case "price_asc":
        return [{ price: "asc" }, { id: "asc" }];
      case "price_desc":
        return [{ price: "desc" }, { id: "asc" }];
      case "popular":
        return [{ salesCount: "desc" }, { id: "asc" }];
      case "rating":
        return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { id: "asc" }];
      case "newest":
      default:
        return [{ createdAt: "desc" }, { id: "asc" }];
    }
  }
}

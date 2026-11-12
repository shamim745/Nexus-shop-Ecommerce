import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module.js";
import { pageMeta } from "../common/dto/pagination.dto.js";
import { slugify, uniqueSlug } from "../common/utils/slug.util.js";
import { AdminProductQueryDto, ProductDto } from "./dto/product.dto.js";

const ADMIN_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  stock: true,
  hasVariants: true,
  isActive: true,
  isFeatured: true,
  ratingAvg: true,
  ratingCount: true,
  salesCount: true,
  createdAt: true,
  images: {
    take: 1,
    orderBy: { position: "asc" as const },
    select: { url: true },
  },
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  _count: { select: { variants: true, orderItems: true } },
} satisfies Prisma.ProductSelect;

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminProductQueryDto) {
    const where: Prisma.ProductWhereInput = {};
    if (!query.includeInactive) where.isActive = true;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: ADMIN_LIST_SELECT,
      }),
    ]);
    return { items, meta: pageMeta(total, query.page, query.limit) };
  }

  async detail(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        ...ADMIN_LIST_SELECT,
        description: true,
        brandId: true,
        categoryId: true,
        images: { orderBy: { position: "asc" }, select: { id: true, url: true } },
        variants: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sku: true,
            label: true,
            options: true,
            price: true,
            comparePrice: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: ProductDto) {
    this.assertVariantShape(dto);
    const slug = await this.resolveSlug(dto);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          price: dto.price,
          comparePrice: dto.comparePrice,
          stock: dto.hasVariants
            ? this.sumVariantStock(dto)
            : (dto.stock ?? 0),
          hasVariants: dto.hasVariants ?? false,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          brandId: dto.brandId || null,
          categoryId: dto.categoryId || null,
        },
      });

      if (dto.images?.length) {
        await tx.productImage.createMany({
          data: dto.images.map((url, index) => ({
            productId: product.id,
            url,
            position: index,
          })),
        });
      }

      if (dto.hasVariants && dto.variants?.length) {
        await tx.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: product.id,
            sku: v.sku,
            label: v.label,
            options: v.options,
            price: v.price,
            comparePrice: v.comparePrice,
            stock: v.stock,
            isActive: v.isActive ?? true,
          })),
        });
      }

      return this.detail(product.id);
    });
  }

  async update(id: string, dto: ProductDto) {
    this.assertVariantShape(dto);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found");

    let slug = existing.slug;
    if (dto.slug && slugify(dto.slug) !== existing.slug) {
      slug = await this.resolveSlug({ ...dto, slug: dto.slug }, id);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          price: dto.price,
          comparePrice: dto.comparePrice,
          hasVariants: dto.hasVariants ?? existing.hasVariants,
          isActive: dto.isActive,
          isFeatured: dto.isFeatured,
          brandId: dto.brandId || null,
          categoryId: dto.categoryId || null,
          stock: dto.hasVariants
            ? this.sumVariantStock(dto)
            : (dto.stock ?? existing.stock),
        },
      });

      // Replace images wholesale (cheap & deterministic for admin uploads)
      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((url, index) => ({
              productId: id,
              url,
              position: index,
            })),
          });
        }
      }

      if (dto.hasVariants && dto.variants) {
        const incomingIds = dto.variants
          .map((v) => v.id)
          .filter((v): v is string => Boolean(v));

        // Remove variants that were dropped (order history keeps snapshots)
        await tx.productVariant.deleteMany({
          where: { productId: id, id: { notIn: incomingIds } },
        });

        for (const v of dto.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                label: v.label,
                options: v.options,
                price: v.price,
                comparePrice: v.comparePrice,
                stock: v.stock,
                isActive: v.isActive ?? true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                label: v.label,
                options: v.options,
                price: v.price,
                comparePrice: v.comparePrice,
                stock: v.stock,
                isActive: v.isActive ?? true,
              },
            });
          }
        }
      }

      return this.detail(id);
    });
  }

  /**
   * Products with order history are archived instead of hard-deleted
   * so past invoices stay intact.
   */
  async remove(id: string): Promise<{ archived: boolean }> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, _count: { select: { orderItems: true } } },
    });
    if (!existing) throw new NotFoundException("Product not found");

    if (existing._count.orderItems > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false, isFeatured: false },
      });
      return { archived: true };
    }
    await this.prisma.product.delete({ where: { id } });
    return { archived: false };
  }

  private assertVariantShape(dto: ProductDto): void {
    if (!dto.hasVariants) return;
    if (!dto.variants || dto.variants.length === 0) {
      throw new ConflictException("Products with variants need at least one variant");
    }
    const skus = new Set<string>();
    for (const v of dto.variants) {
      const key = v.sku.trim().toLowerCase();
      if (skus.has(key)) throw new ConflictException(`Duplicate SKU: ${v.sku}`);
      skus.add(key);
    }
  }

  private sumVariantStock(dto: ProductDto): number {
    return (dto.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }

  private async resolveSlug(dto: ProductDto, excludeId?: string): Promise<string> {
    const base = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    if (!base) throw new ConflictException("Could not derive a slug");
    const exists = async (slug: string) => {
      const count = await this.prisma.product.count({
        where: excludeId ? { slug, NOT: { id: excludeId } } : { slug },
      });
      return count > 0;
    };
    if (dto.slug && (await exists(base))) {
      throw new ConflictException("Slug already in use");
    }
    return uniqueSlug(base, exists);
  }
}

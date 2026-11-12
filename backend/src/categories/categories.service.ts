import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module.js";
import { slugify, uniqueSlug } from "../common/utils/slug.util.js";
import { CategoryDto } from "./dto/category.dto.js";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: full category tree (active only for customers). */
  async tree(includeInactive = false) {
    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parentId: true,
        isActive: true,
        position: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    const byId = new Map(
      categories.map((c) => [c.id, { ...c, productCount: c._count.products, children: [] as unknown[] }]),
    );
    const roots: unknown[] = [];
    for (const node of byId.values()) {
      const parent = node.parentId ? byId.get(node.parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  async create(dto: CategoryDto) {
    const slug = dto.slug
      ? slugify(dto.slug)
      : await uniqueSlug(dto.name, (s) => this.slugExists(s));
    if (await this.slugExists(slug)) {
      throw new ConflictException("Slug already in use");
    }
    if (dto.parentId) await this.assertExists(dto.parentId);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        isActive: dto.isActive ?? true,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: CategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Category not found");
    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException("A category cannot be its own parent");
      await this.assertExists(dto.parentId);
    }
    let slug = existing.slug;
    if (dto.slug && slugify(dto.slug) !== existing.slug) {
      slug = slugify(dto.slug);
      if (await this.slugExists(slug, id)) {
        throw new ConflictException("Slug already in use");
      }
    } else if (dto.name && dto.name !== existing.name && !dto.slug) {
      // keep existing slug stable — renaming does not change URL
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        isActive: dto.isActive,
        position: dto.position,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Category not found");
    const childCount = await this.prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ConflictException("Delete or move sub-categories first");
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async assertExists(id: string): Promise<void> {
    const found = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Parent category not found");
  }

  private async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.CategoryWhereInput = excludeId
      ? { slug, NOT: { id: excludeId } }
      : { slug };
    const count = await this.prisma.category.count({ where });
    return count > 0;
  }
}

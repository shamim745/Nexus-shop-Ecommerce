import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  ConflictException,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Public } from "../common/decorators/public.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { PrismaService } from "../prisma/prisma.module.js";
import { slugify, uniqueSlug } from "../common/utils/slug.util.js";
import { BrandDto } from "./dto/brand.dto.js";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeInactive = false) {
    return this.prisma.brand.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        isActive: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
  }

  async create(dto: BrandDto) {
    const slug = dto.slug
      ? slugify(dto.slug)
      : await uniqueSlug(dto.name, (s) => this.slugExists(s));
    if (await this.slugExists(slug)) throw new ConflictException("Slug already in use");
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: BrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Brand not found");
    let slug = existing.slug;
    if (dto.slug && slugify(dto.slug) !== existing.slug) {
      slug = slugify(dto.slug);
      if (await this.slugExists(slug, id)) {
        throw new ConflictException("Slug already in use");
      }
    }
    return this.prisma.brand.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Brand not found");
    await this.prisma.brand.delete({ where: { id } });
  }

  private async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.BrandWhereInput = excludeId
      ? { slug, NOT: { id: excludeId } }
      : { slug };
    return (await this.prisma.brand.count({ where })) > 0;
  }
}

@Controller("brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Public()
  @Get()
  list() {
    return this.brands.list(false);
  }
}

@Controller("admin/brands")
@Roles("ADMIN")
export class AdminBrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  listAll() {
    return this.brands.list(true);
  }

  @Post()
  create(@Body() dto: BrandDto) {
    return this.brands.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: BrandDto) {
    return this.brands.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.brands.remove(id);
    return { ok: true };
  }
}

@Module({
  controllers: [BrandsController, AdminBrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}

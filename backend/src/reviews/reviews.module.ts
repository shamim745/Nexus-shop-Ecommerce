import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Prisma } from "@prisma/client";
import { Public } from "../common/decorators/public.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator.js";
import { pageMeta } from "../common/dto/pagination.dto.js";
import { ReviewsQueryDto } from "./dto/reviews.dto.js";
import { PrismaService } from "../prisma/prisma.module.js";

class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

class UpdateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list(@Query() query: ReviewsQueryDto) {
    if (!query.productId) return { items: [], meta: pageMeta(0, query.page, query.limit) };
    const where: Prisma.ReviewWhereInput = { productId: query.productId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);
    return { items, meta: pageMeta(total, query.page, query.limit) };
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.prisma.review.findUnique({
      where: {
        userId_productId: { userId: user.id, productId: dto.productId },
      },
    });
    if (existing) {
      throw new ConflictException(
        "You have already reviewed this product — edit your existing review",
      );
    }

    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });
    await this.recomputeRating(dto.productId);
    return review;
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.prisma.review.findFirst({
      where: { id, userId: user.id },
    });
    if (!review) throw new NotFoundException("Review not found");
    const updated = await this.prisma.review.update({
      where: { id },
      data: { rating: dto.rating, comment: dto.comment },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true } },
      },
    });
    await this.recomputeRating(review.productId);
    return updated;
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, userId: user.id },
    });
    if (!review) throw new NotFoundException("Review not found");
    await this.prisma.review.delete({ where: { id } });
    await this.recomputeRating(review.productId);
    return { ok: true };
  }

  /** Admin: remove any review. */
  private async recomputeRating(productId: string): Promise<void> {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
        ratingCount: agg._count,
      },
    });
  }
}

@Controller("admin/reviews")
@Roles("ADMIN")
export class AdminReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: ReviewsQueryDto) {
    const where: Prisma.ReviewWhereInput = query.productId
      ? { productId: query.productId }
      : {};
    const [total, items] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    return { items, meta: pageMeta(total, query.page, query.limit) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException("Review not found");
    await this.prisma.review.delete({ where: { id } });
    const agg = await this.prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.product.update({
      where: { id: review.productId },
      data: {
        ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
        ratingCount: agg._count,
      },
    });
    return { ok: true };
  }
}

@Module({
  controllers: [ReviewsController, AdminReviewsController],
})
export class ReviewsModule {}

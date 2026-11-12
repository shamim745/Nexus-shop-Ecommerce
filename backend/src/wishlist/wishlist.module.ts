import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Module,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { IsString } from "class-validator";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator.js";
import { PrismaService } from "../prisma/prisma.module.js";
import { CartModule } from "../cart/cart.module.js";
import { CartService } from "../cart/cart.service.js";

class AddWishlistDto {
  @IsString()
  productId!: string;
}

const WISHLIST_INCLUDE = {
  items: {
    orderBy: { createdAt: "desc" as const },
    include: {
      product: {
        select: {
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
          images: {
            take: 1,
            orderBy: { position: "asc" as const },
            select: { url: true },
          },
        },
      },
    },
  },
};

@Controller("wishlist")
export class WishlistController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: WISHLIST_INCLUDE,
    });
    if (!wishlist) return { items: [] };
    return {
      items: wishlist.items
        .filter((i) => i.product.isActive)
        .map((i) => ({
          productId: i.productId,
          addedAt: i.createdAt,
          product: {
            ...i.product,
            price: Number(i.product.price),
            comparePrice:
              i.product.comparePrice !== null
                ? Number(i.product.comparePrice)
                : null,
          },
        })),
    };
  }

  @Post("items")
  @HttpCode(200)
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const wishlist = await this.prisma.wishlist.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: dto.productId,
        },
      },
      create: { wishlistId: wishlist.id, productId: dto.productId },
      update: {},
    });
    return { ok: true };
  }

  @Delete("items/:productId")
  async remove(@CurrentUser() user: AuthUser, @Param("productId") productId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (wishlist) {
      await this.prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id, productId },
      });
    }
    return { ok: true };
  }

  @Post("items/:productId/move-to-cart")
  @HttpCode(200)
  async moveToCart(
    @CurrentUser() user: AuthUser,
    @Param("productId") productId: string,
  ) {
    await this.cart.addItem(
      { userId: user.id },
      { productId, qty: 1 },
    );
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (wishlist) {
      await this.prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id, productId },
      });
    }
    return { ok: true };
  }
}

@Module({
  imports: [CartModule],
  controllers: [WishlistController],
})
export class WishlistModule {}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import type { Response } from "express";
import { PrismaService } from "../prisma/prisma.module.js";
import {
  GUEST_CART_COOKIE,
  guestCartCookieOptions,
} from "../common/cookies.js";
import {
  AddCartItemDto,
  UpdateCartItemDto,
} from "./dto/cart.dto.js";

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: "asc" as const },
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
          images: {
            take: 1,
            orderBy: { position: "asc" as const },
            select: { url: true },
          },
        },
      },
      variant: {
        select: {
          id: true,
          sku: true,
          label: true,
          price: true,
          comparePrice: true,
          stock: true,
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

interface CartContext {
  userId?: string;
  guestId?: string;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the cart for the caller, creating one on demand.
   * Guests get a signed cookie with their cart id.
   */
  async resolveCart(ctx: CartContext, res?: Response) {
    if (ctx.userId) {
      let cart = await this.prisma.cart.findUnique({
        where: { userId: ctx.userId },
        include: CART_INCLUDE,
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId: ctx.userId },
          include: CART_INCLUDE,
        });
        // Merge any guest cart that arrived with the request
        if (ctx.guestId) {
          await this.mergeGuestCart(ctx.guestId, ctx.userId);
          cart = await this.prisma.cart.findUnique({
            where: { userId: ctx.userId },
            include: CART_INCLUDE,
          });
        }
      }
      return cart!;
    }

    let guestId = ctx.guestId;
    let cart = guestId
      ? await this.prisma.cart.findUnique({
          where: { guestId },
          include: CART_INCLUDE,
        })
      : null;

    if (!cart) {
      guestId = randomUUID();
      cart = await this.prisma.cart.create({
        data: { guestId },
        include: CART_INCLUDE,
      });
      if (res) {
        const secure = process.env.COOKIE_SECURE === "true";
        res.cookie(
          GUEST_CART_COOKIE,
          guestId,
          guestCartCookieOptions(secure, process.env.COOKIE_SAME_SITE ?? "lax"),
        );
      }
    }
    return cart;
  }

  async getCart(ctx: CartContext, res?: Response) {
    const cart = await this.resolveCart(ctx, res);
    return this.serialize(cart);
  }

  async addItem(ctx: CartContext, dto: AddCartItemDto, res?: Response) {
    const cart = await this.resolveCart(ctx, res);

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      select: { id: true, hasVariants: true, stock: true, price: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    let variant: { id: string; stock: number; isActive: boolean } | null = null;
    if (dto.variantId) {
      variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, productId: product.id },
        select: { id: true, stock: true, isActive: true },
      });
      if (!variant || !variant.isActive) {
        throw new BadRequestException("Selected option is unavailable");
      }
    } else if (product.hasVariants) {
      throw new BadRequestException("Please choose an option");
    }

    const available = variant ? variant.stock : product.stock;
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: variant?.id ?? null,
      },
    });
    const desired = (existing?.qty ?? 0) + dto.qty;
    if (desired > available) {
      throw new BadRequestException(
        `Only ${available} left in stock`,
      );
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: desired },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: variant?.id ?? null,
          qty: dto.qty,
        },
      });
    }

    return this.getCart(ctx, res);
  }

  async updateItem(
    ctx: CartContext,
    itemId: string,
    dto: UpdateCartItemDto,
    res?: Response,
  ) {
    const cart = await this.resolveCart(ctx, res);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        product: { select: { stock: true, hasVariants: true, isActive: true } },
        variant: { select: { stock: true, isActive: true } },
      },
    });
    if (!item) throw new NotFoundException("Cart item not found");
    if (!item.product.isActive || !(item.variant?.isActive ?? true)) {
      throw new BadRequestException("This item is no longer available");
    }

    const available = item.variant ? item.variant.stock : item.product.stock;
    if (dto.qty > available) {
      throw new BadRequestException(`Only ${available} left in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { qty: dto.qty },
    });
    return this.getCart(ctx, res);
  }

  async removeItem(ctx: CartContext, itemId: string, res?: Response) {
    const cart = await this.resolveCart(ctx, res);
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    return this.getCart(ctx, res);
  }

  async clear(ctx: CartContext, res?: Response) {
    const cart = await this.resolveCart(ctx, res);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });
    return this.getCart(ctx, res);
  }

  /** Stores the coupon the customer picked (validated at checkout too). */
  async setCoupon(ctx: CartContext, code: string | null, res?: Response) {
    const cart = await this.resolveCart(ctx, res);
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: code },
    });
    return this.getCart(ctx, res);
  }

  private async mergeGuestCart(guestId: string, userId: string): Promise<void> {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!userCart) return;

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        (i) =>
          i.productId === guestItem.productId &&
          (i.variantId ?? null) === (guestItem.variantId ?? null),
      );
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty: existing.qty + guestItem.qty },
        });
      } else {
        await this.prisma.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: userCart.id },
        });
      }
    }
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
  }

  private serialize(cart: {
    id: string;
    couponCode: string | null;
    updatedAt: Date;
    items: Array<{
      id: string;
      qty: number;
      productId: string;
      variantId: string | null;
      product: {
        id: string;
        name: string;
        slug: string;
        price: Prisma.Decimal;
        comparePrice: Prisma.Decimal | null;
        stock: number;
        hasVariants: boolean;
        isActive: boolean;
        images: Array<{ url: string }>;
      };
      variant: {
        id: string;
        sku: string;
        label: string | null;
        price: Prisma.Decimal | null;
        comparePrice: Prisma.Decimal | null;
        stock: number;
        isActive: boolean;
      } | null;
    }>;
  }) {
    let subtotal = 0;
    let itemCount = 0;
    const items = cart.items
      .filter((item) => item.product.isActive && (item.variant?.isActive ?? true))
      .map((item) => {
        const unitPrice = item.variant?.price ?? item.product.price;
        const comparePrice =
          item.variant?.comparePrice ?? item.product.comparePrice;
        const lineTotal = Number(unitPrice) * item.qty;
        subtotal += lineTotal;
        itemCount += item.qty;
        const available = item.variant ? item.variant.stock : item.product.stock;
        return {
          id: item.id,
          qty: item.qty,
          productId: item.productId,
          variantId: item.variantId,
          unitPrice: Number(unitPrice),
          comparePrice: comparePrice !== null ? Number(comparePrice) : null,
          lineTotal,
          available,
          inStock: available >= item.qty,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0]?.url ?? null,
          variantLabel: item.variant?.label ?? null,
          sku: item.variant?.sku ?? null,
        };
      });

    return {
      items,
      itemCount,
      subtotal,
      couponCode: cart.couponCode,
      updatedAt: cart.updatedAt,
    };
  }
}

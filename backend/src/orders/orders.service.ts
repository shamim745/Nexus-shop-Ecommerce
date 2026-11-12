import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module.js";
import { CartService } from "../cart/cart.service.js";
import { CouponsService } from "../coupons/coupons.service.js";
import { pageMeta } from "../common/dto/pagination.dto.js";
import { CreateOrderDto, AdminOrderQueryDto } from "./dto/order.dto.js";

const ORDER_INCLUDE = {
  items: true,
  history: { orderBy: { createdAt: "asc" as const } },
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly coupons: CouponsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cartRow = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cartRow || cartRow.items.length === 0) {
      throw new BadRequestException("Your cart is empty");
    }

    // Resolve shipping address (saved or inline)
    let ship: {
      name: string;
      phone: string;
      line1: string;
      line2: string | null;
      area: string | null;
      city: string;
      postal: string | null;
      addressId: string | null;
    };

    if (dto.address.addressId) {
      const saved = await this.prisma.address.findFirst({
        where: { id: dto.address.addressId, userId },
      });
      if (!saved) throw new BadRequestException("Address not found");
      ship = {
        name: saved.name,
        phone: saved.phone,
        line1: saved.line1,
        line2: saved.line2,
        area: saved.area,
        city: saved.city,
        postal: saved.postalCode,
        addressId: saved.id,
      };
    } else {
      const a = dto.address;
      if (!a.name || !a.phone || !a.line1 || !a.city) {
        throw new BadRequestException(
          "Full shipping address is required (name, phone, street, city)",
        );
      }
      ship = {
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? null,
        area: a.area ?? null,
        city: a.city,
        postal: a.postalCode ?? null,
        addressId: null,
      };
    }

    const couponCode = (dto.couponCode ?? cartRow.couponCode)?.toUpperCase() ?? null;

    const order = await this.prisma.$transaction(
      async (tx) => {
        // Lock product rows to prevent overselling under concurrency.
        // (Postgres forbids locking the nullable side of a LEFT JOIN,
        // so variant rows are locked in a second pass.)
        const items = await tx.$queryRaw<
          Array<{
            id: string;
            product_id: string;
            variant_id: string | null;
            qty: number;
            p_stock: number;
            p_price: Prisma.Decimal;
            p_compare: Prisma.Decimal | null;
            p_name: string;
            p_slug: string;
            p_active: boolean;
            v_stock: number | null;
            v_price: Prisma.Decimal | null;
            v_compare: Prisma.Decimal | null;
            v_sku: string | null;
            v_label: string | null;
            v_active: boolean | null;
            image_url: string | null;
          }>
        >`
          SELECT ci.id, ci.product_id, ci.variant_id, ci.qty,
                 p.stock AS p_stock, p.price AS p_price, p.compare_price AS p_compare,
                 p.name AS p_name, p.slug AS p_slug, p.is_active AS p_active,
                 v.stock AS v_stock, v.price AS v_price, v.compare_price AS v_compare,
                 v.sku AS v_sku, v.label AS v_label, v.is_active AS v_active,
                 (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position LIMIT 1) AS image_url
          FROM cart_items ci
          JOIN products p ON p.id = ci.product_id
          LEFT JOIN product_variants v ON v.id = ci.variant_id
          WHERE ci.cart_id = ${cartRow.id}
          ORDER BY ci.created_at
          FOR UPDATE OF p
        `;

        if (items.length === 0) {
          throw new BadRequestException("Your cart is empty");
        }

        const variantIds = items
          .map((r) => r.variant_id)
          .filter((v): v is string => Boolean(v));
        if (variantIds.length > 0) {
          await tx.$queryRaw`
            SELECT id FROM product_variants
            WHERE id = ANY(${variantIds}::text[])
            FOR UPDATE
          `;
        }

        let subtotal = 0;
        const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

        for (const row of items) {
          if (!row.p_active || (row.v_active !== null && !row.v_active)) {
            throw new BadRequestException(`${row.p_name} is no longer available`);
          }
          const available = row.v_stock !== null ? Number(row.v_stock) : row.p_stock;
          if (available < row.qty) {
            throw new BadRequestException(
              `Only ${available} left of ${row.p_name}${row.v_label ? ` (${row.v_label})` : ""}`,
            );
          }

          const unit =
            row.v_price !== null ? Number(row.v_price) : Number(row.p_price);
          const compare =
            (row.v_compare !== null ? Number(row.v_compare) : row.p_compare !== null
              ? Number(row.p_compare)
              : null);
          const lineTotal = Math.round(unit * row.qty * 100) / 100;
          subtotal += lineTotal;

          // Decrement stock
          if (row.variant_id) {
            await tx.$executeRaw`
              UPDATE product_variants SET stock = stock - ${row.qty}, updated_at = NOW()
              WHERE id = ${row.variant_id}
            `;
          } else {
            await tx.$executeRaw`
              UPDATE products SET stock = stock - ${row.qty}, updated_at = NOW()
              WHERE id = ${row.product_id}
            `;
          }

          orderItems.push({
            productId: row.product_id,
            variantId: row.variant_id,
            name: row.p_name,
            variantLabel: row.v_label,
            sku: row.v_sku,
            imageUrl: row.image_url,
            unitPrice: unit,
            qty: row.qty,
            total: lineTotal,
            ...(compare !== null ? {} : {}),
          });
        }

        subtotal = Math.round(subtotal * 100) / 100;

        // Coupon (validated with usage limits inside this transaction)
        let discount = 0;
        let appliedCouponId: string | null = null;
        if (couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: couponCode },
          });
          if (!coupon) throw new BadRequestException("Coupon is not valid");
          discount = await this.coupons.quoteWithLimits(
            tx,
            coupon,
            subtotal,
            userId,
          );
          appliedCouponId = coupon.id;
        }

        // Shipping fee from admin settings
        const settings = await tx.setting.upsert({
          where: { id: 1 },
          create: { id: 1, shippingFee: 0 },
          update: {},
        });
        const threshold = settings.freeShippingThreshold
          ? Number(settings.freeShippingThreshold)
          : null;
        const shippingFee =
          threshold !== null && subtotal >= threshold
            ? 0
            : Number(settings.shippingFee);

        const total =
          Math.round((subtotal - discount + shippingFee) * 100) / 100;
        if (total < 0) throw new BadRequestException("Invalid order total");

        const orderNumber = await this.nextOrderNumber(tx);

        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: ship.addressId,
            status: "PENDING",
            paymentMethod: "COD",
            paymentStatus: "UNPAID",
            subtotal,
            shippingFee,
            discount,
            total,
            couponCode,
            shippingName: ship.name,
            shippingPhone: ship.phone,
            shippingLine1: ship.line1,
            shippingLine2: ship.line2,
            shippingArea: ship.area,
            shippingCity: ship.city,
            shippingPostal: ship.postal,
            note: dto.note,
            items: { create: orderItems },
            history: { create: { status: "PENDING", note: "Order placed" } },
          },
          include: ORDER_INCLUDE,
        });

        if (appliedCouponId) {
          await tx.couponUsage.create({
            data: {
              couponId: appliedCouponId,
              userId,
              orderId: order.id,
            },
          });
        }

        // Bump best-seller counters
        for (const row of items) {
          await tx.product.update({
            where: { id: row.product_id },
            data: { salesCount: { increment: row.qty } },
          });
        }

        // Clear cart
        await tx.cartItem.deleteMany({ where: { cartId: cartRow.id } });
        await tx.cart.update({
          where: { id: cartRow.id },
          data: { couponCode: null },
        });

        return order;
      },
      { timeout: 15_000 },
    );

    return order;
  }

  async myList(userId: string, page: number, limit: number) {
    const where: Prisma.OrderWhereInput = { userId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: { take: 1, select: { name: true, imageUrl: true, qty: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);
    return {
      items: items.map((o) => ({
        ...o,
        itemCount: o._count.items,
        _count: undefined,
      })),
      meta: pageMeta(total, page, limit),
    };
  }

  async detail(userId: string | undefined, role: Role, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Order not found");
    if (role !== "ADMIN" && order.userId !== userId) {
      throw new ForbiddenException("This order belongs to another customer");
    }
    return order;
  }

  async cancel(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.userId !== userId) {
      throw new ForbiddenException("This order belongs to another customer");
    }
    if (!["PENDING", "PROCESSING"].includes(order.status)) {
      throw new BadRequestException("This order can no longer be cancelled");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelReason: reason ?? "Cancelled by customer",
        },
        include: { history: true },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "CANCELLED", note: reason ?? "Cancelled by customer" },
      });
      await this.restock(tx, order.items);
    });

    return this.detail(userId, "CUSTOMER", orderId);
  }

  async reorder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.userId !== userId) {
      throw new ForbiddenException("This order belongs to another customer");
    }

    const added: string[] = [];
    const skipped: string[] = [];
    for (const item of order.items) {
      try {
        await this.cart.addItem(
          { userId },
          {
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            qty: item.qty,
          },
        );
        added.push(item.name);
      } catch {
        skipped.push(item.name);
      }
    }
    if (added.length === 0) {
      throw new BadRequestException(
        `None of these items are available right now${skipped.length ? `: ${skipped.join(", ")}` : ""}`,
      );
    }
    return { added, skipped };
  }

  // ---- Admin ----

  async adminList(query: AdminOrderQueryDto) {
    const where: Prisma.OrderWhereInput = {};
    if (query.status && query.status !== "ALL") {
      where.status = query.status as OrderStatus;
    }
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: "insensitive" } },
        { shippingName: { contains: query.search, mode: "insensitive" } },
        { shippingPhone: { contains: query.search } },
        { user: { email: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          items: { take: 1, select: { name: true, imageUrl: true } },
          _count: { select: { items: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      items: items.map((o) => ({
        ...o,
        itemCount: o._count.items,
        _count: undefined,
      })),
      meta: pageMeta(total, query.page, query.limit),
    };
  }

  async adminDetail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async adminUpdateStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    markPaid?: boolean,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    if (status !== order.status) {
      const allowed = TRANSITIONS[order.status];
      if (!allowed.includes(status)) {
        throw new BadRequestException(
          `Cannot move order from ${order.status} to ${status}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = { status };
      if (status === "DELIVERED") data.paymentStatus = "PAID";
      if (markPaid) data.paymentStatus = "PAID";
      if (status === "CANCELLED") {
        data.cancelReason = note ?? "Cancelled by admin";
        await this.restock(tx, order.items);
      }
      await tx.order.update({ where: { id: orderId }, data });
      if (status !== order.status) {
        await tx.orderStatusHistory.create({
          data: { orderId, status, note: note ?? undefined },
        });
      }
    });

    return this.adminDetail(orderId);
  }

  private async restock(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: string; variantId: string | null; qty: number }>,
  ): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
  }

  private async nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const candidate = `ORD-${ymd}-${rand}`;
      const existing = await tx.order.findUnique({
        where: { orderNumber: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    throw new BadRequestException("Could not allocate an order number");
  }
}

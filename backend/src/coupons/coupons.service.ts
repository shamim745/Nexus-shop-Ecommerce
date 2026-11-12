import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Coupon, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module.js";
import { pageMeta } from "../common/dto/pagination.dto.js";
import { CouponDto } from "./dto/coupon.dto.js";

export interface CouponQuote {
  valid: boolean;
  code?: string;
  discount?: number;
  message: string;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: validate a coupon against a subtotal (checkout preview). */
  async validate(
    code: string,
    subtotal: number,
    userId?: string,
  ): Promise<CouponQuote> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    if (!coupon || !coupon.isActive) {
      return { valid: false, message: "Coupon not found" };
    }
    return this.quote(coupon, subtotal, userId);
  }

  /**
   * Server-side authority for order placement. Returns the discount or throws.
   * Caller must run this inside the order transaction context via `assertUsable`.
   */
  async assertUsable(
    tx: Prisma.TransactionClient,
    code: string,
    subtotal: number,
    userId: string,
  ): Promise<{ coupon: Coupon; discount: number }> {
    const coupon = await tx.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Coupon is not valid");
    }
    const quote = this.quote(coupon, subtotal, userId);
    if (!quote.valid) throw new BadRequestException(quote.message);
    return { coupon, discount: quote.discount ?? 0 };
  }

  private quote(coupon: Coupon, subtotal: number, _userId?: string): CouponQuote {
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, message: "This coupon has expired" };
    }
    if (subtotal < Number(coupon.minPurchase)) {
      return {
        valid: false,
        message: `Minimum purchase of ${Number(coupon.minPurchase)} required`,
      };
    }

    // Usage limits are checked asynchronously by callers that pass counts;
    // here we only compute the discount for display.
    const discount =
      coupon.type === "PERCENT"
        ? Math.min(subtotal, (subtotal * Number(coupon.value)) / 100)
        : Math.min(subtotal, Number(coupon.value));

    return {
      valid: true,
      code: coupon.code,
      discount: Math.round(discount * 100) / 100,
      message: "Coupon applied",
    };
  }

  /** Full check including usage limits — used at checkout inside a transaction. */
  async quoteWithLimits(
    tx: Prisma.TransactionClient,
    coupon: Coupon,
    subtotal: number,
    userId: string,
  ): Promise<number> {
    if (coupon.usageLimit != null) {
      const used = await tx.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (used >= coupon.usageLimit) {
        throw new BadRequestException("This coupon has reached its usage limit");
      }
    }
    const userUsed = await tx.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsed >= coupon.perUserLimit) {
      throw new BadRequestException("You have already used this coupon");
    }
    const quote = this.quote(coupon, subtotal, userId);
    if (!quote.valid) throw new BadRequestException(quote.message);
    return quote.discount ?? 0;
  }

  // ---- Admin CRUD ----

  async adminList(page: number, limit: number) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.coupon.count(),
      this.prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { usages: true } } },
      }),
    ]);
    return {
      items: items.map((c) => ({ ...c, usedCount: c._count.usages, _count: undefined })),
      meta: pageMeta(total, page, limit),
    };
  }

  async adminCreate(dto: CouponDto) {
    const code = dto.code.toUpperCase();
    const exists = await this.prisma.coupon.findUnique({ where: { code } });
    if (exists) throw new ConflictException("Coupon code already exists");
    return this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase ?? 0,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async adminUpdate(id: string, dto: CouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Coupon not found");
    const code = dto.code.toUpperCase();
    if (code !== existing.code) {
      const clash = await this.prisma.coupon.findUnique({ where: { code } });
      if (clash) throw new ConflictException("Coupon code already exists");
    }
    return this.prisma.coupon.update({
      where: { id },
      data: {
        code,
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit,
        isActive: dto.isActive,
      },
    });
  }

  async adminRemove(id: string): Promise<void> {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Coupon not found");
    await this.prisma.coupon.delete({ where: { id } });
  }
}

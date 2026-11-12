export interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minPurchase: number;
  expiresAt: string | null;
  usageLimit: number | null;
  perUserLimit: number;
  isActive: boolean;
  createdAt: string;
  usedCount?: number;
}

export interface CouponQuote {
  valid: boolean;
  code?: string;
  discount?: number;
  message: string;
}

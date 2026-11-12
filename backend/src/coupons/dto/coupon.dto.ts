import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";

export enum CouponTypeInput {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export class CouponDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,30}$/, {
    message: "code must be 3-30 letters/numbers/hyphens",
  })
  code!: string;

  @IsEnum(CouponTypeInput)
  type!: CouponTypeInput;

  @IsNumber()
  @Min(0.01)
  value!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponBodyDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;
}

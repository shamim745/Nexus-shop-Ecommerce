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

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  qty!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  qty!: number;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Type(() => Number)
  @Min(0)
  subtotal!: number;
}

export class CartCouponDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code!: string | null;
}

import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  MinLength,
} from "class-validator";

export class CheckoutAddressDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  area?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  postalCode?: string;
}

export class CreateOrderDto {
  @IsNotEmpty()
  address!: CheckoutAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class AdminStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;
}

export class AdminOrderQueryDto {
  @IsOptional()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination.dto.js";

export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  sort?: "newest" | "price_asc" | "price_desc" | "popular" | "rating";

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;
}

export class AdminProductQueryDto extends ProductQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  includeInactive?: boolean;
}

export class ProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be lowercase letters, numbers and hyphens",
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

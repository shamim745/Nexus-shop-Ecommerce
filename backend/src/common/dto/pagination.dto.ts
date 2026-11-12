import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function pageMeta(total: number, page: number, limit: number): PageMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export class SlugParamDto {
  @IsString()
  slug!: string;
}

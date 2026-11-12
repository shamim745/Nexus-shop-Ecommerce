import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class BrandDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be lowercase letters, numbers and hyphens",
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

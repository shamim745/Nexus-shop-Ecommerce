import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination.dto.js";

export class AdminCustomersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class UpdateProfileDto {
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
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

export class AddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  area?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

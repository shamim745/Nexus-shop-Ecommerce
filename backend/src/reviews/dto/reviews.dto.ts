import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination.dto.js";

/** Query DTO for public + admin review lists. */
export class ReviewsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  productId?: string;
}

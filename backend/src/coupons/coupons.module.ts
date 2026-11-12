import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator.js";
import { PaginationQueryDto } from "../common/dto/pagination.dto.js";
import { CouponsService } from "./coupons.service.js";
import { CouponDto, ValidateCouponBodyDto } from "./dto/coupon.dto.js";

@Controller("coupons")
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Public()
  @Post("validate")
  validate(
    @Body() dto: ValidateCouponBodyDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.coupons.validate(dto.code, dto.subtotal, user?.id);
  }
}

@Controller("admin/coupons")
@Roles("ADMIN")
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.coupons.adminList(query.page, query.limit);
  }

  @Post()
  create(@Body() dto: CouponDto) {
    return this.coupons.adminCreate(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: CouponDto) {
    return this.coupons.adminUpdate(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.coupons.adminRemove(id);
    return { ok: true };
  }
}

@Module({
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}

import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator.js";
import { PaginationQueryDto } from "../common/dto/pagination.dto.js";
import { OrderStatus } from "@prisma/client";
import {
  AdminOrderQueryDto,
  AdminStatusDto,
  CancelOrderDto,
  CreateOrderDto,
} from "./dto/order.dto.js";
import { OrdersService } from "./orders.service.js";
import { CartModule } from "../cart/cart.module.js";
import { CouponsModule } from "../coupons/coupons.module.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.orders.myList(user.id, query.page, query.limit);
  }

  @Get(":id")
  detail(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.orders.detail(user.id, user.role, id);
  }

  @Post(":id/cancel")
  cancel(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancel(user.id, id, dto.reason);
  }

  @Post(":id/reorder")
  reorder(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.orders.reorder(user.id, id);
  }
}

@Controller("admin/orders")
@Roles("ADMIN")
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: AdminOrderQueryDto) {
    return this.orders.adminList(query);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.orders.adminDetail(id);
  }

  @Post(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: AdminStatusDto) {
    return this.orders.adminUpdateStatus(
      id,
      dto.status as OrderStatus,
      dto.note,
      dto.markPaid,
    );
  }
}

@Module({
  imports: [CartModule, CouponsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

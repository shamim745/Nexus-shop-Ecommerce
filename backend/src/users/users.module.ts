import { Controller, Get, Module, Param, Patch, Query } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { pageMeta } from "../common/dto/pagination.dto.js";
import { AdminCustomersQueryDto } from "./dto/user.dto.js";
import { UsersController } from "./users.controller.js";
import {
  AdminCustomersService,
  UsersService,
} from "./users.service.js";

@Controller("admin/customers")
@Roles("ADMIN")
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

  @Get()
  async list(@Query() query: AdminCustomersQueryDto) {
    const { items, total } = await this.customers.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
    return { items, meta: pageMeta(total, query.page, query.limit) };
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.customers.detail(id);
  }

  @Patch(":id/block")
  block(@Param("id") id: string) {
    return this.customers.setBlocked(id, true);
  }

  @Patch(":id/unblock")
  unblock(@Param("id") id: string) {
    return this.customers.setBlocked(id, false);
  }
}

@Module({
  controllers: [UsersController, AdminCustomersController],
  providers: [UsersService, AdminCustomersService],
  exports: [UsersService, AdminCustomersService],
})
export class UsersModule {}

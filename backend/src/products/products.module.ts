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
import { AdminProductsService } from "./admin-products.service.js";
import {
  AdminProductQueryDto,
  ProductDto,
  ProductQueryDto,
} from "./dto/product.dto.js";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.products.list(query);
  }

  @Public()
  @Get("home")
  home() {
    return this.products.home();
  }

  @Public()
  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.products.detail(slug);
  }
}

@Controller("admin/products")
@Roles("ADMIN")
export class AdminProductsController {
  constructor(private readonly products: AdminProductsService) {}

  @Get()
  list(@Query() query: AdminProductQueryDto) {
    return this.products.list(query);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.products.detail(id);
  }

  @Post()
  create(@Body() dto: ProductDto) {
    return this.products.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: ProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, AdminProductsService],
  exports: [ProductsService, AdminProductsService],
})
export class ProductsModule {}

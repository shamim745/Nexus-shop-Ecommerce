import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CategoriesService } from "./categories.service.js";
import { CategoryDto } from "./dto/category.dto.js";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  tree() {
    return this.categories.tree(false);
  }
}

@Controller("admin/categories")
@Roles("ADMIN")
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  treeAll() {
    return this.categories.tree(true);
  }

  @Post()
  create(@Body() dto: CategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: CategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.categories.remove(id);
    return { ok: true };
  }
}

@Module({
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

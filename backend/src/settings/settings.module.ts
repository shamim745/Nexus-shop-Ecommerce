import { Body, Controller, Get, Module, Put } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";
import { Public } from "../common/decorators/public.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { PrismaService } from "../prisma/prisma.module.js";

class ShippingSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  shippingFee!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number | null;
}

@Controller("settings")
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: checkout needs the current shipping fee. */
  @Public()
  @Get("shipping")
  async shipping() {
    const settings = await this.prisma.setting.upsert({
      where: { id: 1 },
      create: { id: 1, shippingFee: 0 },
      update: {},
    });
    return {
      shippingFee: Number(settings.shippingFee),
      freeShippingThreshold:
        settings.freeShippingThreshold !== null
          ? Number(settings.freeShippingThreshold)
          : null,
      updatedAt: settings.updatedAt,
    };
  }
}

@Controller("admin/settings")
@Roles("ADMIN")
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  get() {
    return new SettingsController(this.prisma).shipping();
  }

  @Put()
  async update(@Body() dto: ShippingSettingsDto) {
    const settings = await this.prisma.setting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        shippingFee: dto.shippingFee,
        freeShippingThreshold: dto.freeShippingThreshold ?? null,
      },
      update: {
        shippingFee: dto.shippingFee,
        freeShippingThreshold: dto.freeShippingThreshold ?? null,
      },
    });
    return {
      shippingFee: Number(settings.shippingFee),
      freeShippingThreshold:
        settings.freeShippingThreshold !== null
          ? Number(settings.freeShippingThreshold)
          : null,
      updatedAt: settings.updatedAt,
    };
  }
}

@Module({
  controllers: [SettingsController, AdminSettingsController],
})
export class SettingsModule {}

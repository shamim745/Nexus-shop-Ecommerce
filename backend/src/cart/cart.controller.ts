import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Public } from "../common/decorators/public.decorator.js";
import type { AuthUser } from "../common/decorators/current-user.decorator.js";
import { GUEST_CART_COOKIE } from "../common/cookies.js";
import { CartService } from "./cart.service.js";
import {
  AddCartItemDto,
  CartCouponDto,
  UpdateCartItemDto,
} from "./dto/cart.dto.js";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Public()
  @Get()
  get(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.cart.getCart(this.ctx(req), res);
  }

  @Public()
  @Post("items")
  @HttpCode(200)
  add(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.addItem(this.ctx(req), dto, res);
  }

  @Public()
  @Patch("items/:id")
  update(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(this.ctx(req), id, dto, res);
  }

  @Public()
  @Delete("items/:id")
  remove(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param("id") id: string,
  ) {
    return this.cart.removeItem(this.ctx(req), id, res);
  }

  @Public()
  @Delete()
  clear(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.cart.clear(this.ctx(req), res);
  }

  @Public()
  @Patch("coupon")
  @HttpCode(200)
  setCoupon(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: CartCouponDto,
  ) {
    return this.cart.setCoupon(
      this.ctx(req),
      dto.code ? dto.code.toUpperCase() : null,
      res,
    );
  }

  private ctx(req: Request): { userId?: string; guestId?: string } {
    const user = (req as Request & { user?: AuthUser }).user;
    const guestId = req.cookies?.[GUEST_CART_COOKIE] as string | undefined;
    return { userId: user?.id, guestId };
  }
}

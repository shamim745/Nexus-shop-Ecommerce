import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { Public } from "../common/decorators/public.decorator.js";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator.js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "../common/cookies.js";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { ForgotPasswordDto } from "./dto/forgot-password.dto.js";
import { ResetPasswordDto } from "./dto/reset-password.dto.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.register(dto);
    this.setAuthCookies(res, tokens, req);
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto);
    this.setAuthCookies(res, tokens, req);
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.refresh(
      req.cookies?.[REFRESH_COOKIE],
      req.headers["user-agent"],
    );
    this.setAuthCookies(res, tokens, req);
    return { ok: true };
  }

  @Public()
  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const origin = this.config.get<string>("CORS_ORIGIN") ?? "";
    await this.auth.forgotPassword(dto.email, origin);
    return { message: "If that email exists, a reset link has been sent" };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: "Password updated — you can now log in" };
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
    req: Request,
  ): void {
    const secure = this.config.get<boolean>("COOKIE_SECURE", false);
    const sameSite = this.config.get<string>("COOKIE_SAME_SITE", "lax");
    res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions(secure, sameSite));
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      refreshCookieOptions(secure, sameSite),
    );
    void req;
  }
}

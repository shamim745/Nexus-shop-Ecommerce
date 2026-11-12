import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { AuthUser } from "../decorators/current-user.decorator.js";
import { ACCESS_COOKIE } from "../cookies.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      const user: AuthUser = {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as AuthUser["role"],
      };
      request.user = user;
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException("Invalid or expired session");
    }
  }

  private extractToken(request: {
    cookies?: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const cookieToken = request.cookies?.[ACCESS_COOKIE];
    if (cookieToken) return cookieToken;
    const authHeader = request.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
    return undefined;
  }
}

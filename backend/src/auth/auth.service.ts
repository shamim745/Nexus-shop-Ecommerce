import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.module.js";
import { MailService } from "../mail/mail.module.js";
import { parseDuration } from "../common/utils/duration.util.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: User["role"];
  createdAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const PUBLIC_USER: Prisma.UserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        passwordHash,
        phone: dto.phone,
      },
      select: PUBLIC_USER,
    });

    return { user, tokens: await this.issueTokens(user.id, user.email, user.role) };
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (!user.isActive) {
      throw new ForbiddenException("This account has been blocked. Contact support.");
    }

    const safe: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
    return { user: safe, tokens: await this.issueTokens(user.id, user.email, user.role) };
  }

  async refresh(refreshToken?: string, userAgent?: string): Promise<TokenPair> {
    if (!refreshToken) throw new UnauthorizedException("Missing refresh token");

    const tokenHash = this.hash(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (stored.revokedAt) {
      // Token reuse detected — revoke all live sessions for this user.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Session revoked");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new UnauthorizedException("Invalid session");
    if (!user.isActive) throw new ForbiddenException("Account blocked");

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role, userAgent);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string, frontendOrigin: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });
    if (!user) return; // do not reveal whether the account exists

    const rawToken = randomBytes(32).toString("hex");
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: this.hash(rawToken),
        resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const url = `${frontendOrigin}/auth/reset-password?token=${rawToken}`;
    await this.mail.sendPasswordReset(user.email, user.name, url);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = this.hash(token);
    const user = await this.prisma.user.findUnique({
      where: { resetTokenHash: tokenHash },
      select: { id: true, resetTokenExpiresAt: true },
    });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException("Reset link is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: User["role"],
    userAgent?: string,
  ): Promise<TokenPair> {
    const accessTtl = this.config.get<string>("JWT_ACCESS_TTL", "15m");
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: parseDuration(accessTtl, 900),
      },
    );

    const refreshToken = randomBytes(48).toString("hex");
    const refreshTtl = parseDuration(
      this.config.get<string>("JWT_REFRESH_TTL", "7d"),
      7 * 86400,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
        userAgent,
      },
    });

    // Keep at most 10 live sessions per user.
    const overflow = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      skip: 10,
      select: { id: true },
    });
    if (overflow.length > 0) {
      await this.prisma.refreshToken.updateMany({
        where: { id: { in: overflow.map((t) => t.id) } },
        data: { revokedAt: new Date() },
      });
    }

    return { accessToken, refreshToken };
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}

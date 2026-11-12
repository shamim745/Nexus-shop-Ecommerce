import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.module.js";
import {
  AddressDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from "./dto/user.dto.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException("Current password is incorrect");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    // Revoke all other sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  async createAddress(userId: string, dto: AddressDto) {
    if (dto.isDefault) {
      await this.clearDefault(userId);
    }
    const count = await this.prisma.address.count({ where: { userId } });
    return this.prisma.address.create({
      data: {
        userId,
        ...dto,
        isDefault: dto.isDefault ?? count === 0,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: AddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException("Address not found");
    if (dto.isDefault) await this.clearDefault(userId);
    return this.prisma.address.update({
      where: { id: addressId },
      data: { ...dto, isDefault: dto.isDefault ?? address.isDefault },
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException("Address not found");
    await this.prisma.address.delete({ where: { id: addressId } });
    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  }

  private async clearDefault(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}

/** Admin: customer list + detail + block/unblock. */
@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; limit: number; search?: string }) {
    const where: Prisma.UserWhereInput = params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: "insensitive" } },
            { name: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search } },
          ],
        }
      : {};

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      items: users.map((u) => ({ ...u, orderCount: u._count.orders, _count: undefined })),
      total,
    };
  }

  async detail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException("Customer not found");
    return user;
  }

  async setBlocked(userId: string, blocked: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException("Customer not found");
    if (user.role === "ADMIN" && blocked) {
      throw new ForbiddenException("Admin accounts cannot be blocked");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !blocked },
    });
    if (blocked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { isActive: !blocked };
  }
}

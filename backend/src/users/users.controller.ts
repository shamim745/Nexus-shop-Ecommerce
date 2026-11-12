import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator.js";
import {
  AddressDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from "./dto/user.dto.js";
import { UsersService } from "./users.service.js";

@Controller("users/me")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post("password")
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.users.changePassword(user.id, dto);
    return { message: "Password updated" };
  }

  @Get("addresses")
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.users.listAddresses(user.id);
  }

  @Post("addresses")
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: AddressDto) {
    return this.users.createAddress(user.id, dto);
  }

  @Patch("addresses/:id")
  updateAddress(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddressDto,
  ) {
    return this.users.updateAddress(user.id, id, dto);
  }

  @Delete("addresses/:id")
  async deleteAddress(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    await this.users.deleteAddress(user.id, id);
    return { ok: true };
  }
}

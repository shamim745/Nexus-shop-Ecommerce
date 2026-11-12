import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./config/env.validation.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";
import { AuthModule } from "./auth/auth.module.js";
import { UsersModule } from "./users/users.module.js";
import { CategoriesModule } from "./categories/categories.module.js";
import { BrandsModule } from "./brands/brands.module.js";
import { ProductsModule } from "./products/products.module.js";
import { UploadsModule } from "./uploads/uploads.module.js";
import { CartModule } from "./cart/cart.module.js";
import { WishlistModule } from "./wishlist/wishlist.module.js";
import { CouponsModule } from "./coupons/coupons.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { ReviewsModule } from "./reviews/reviews.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { MailModule } from "./mail/mail.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 300,
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    UploadsModule,
    CartModule,
    WishlistModule,
    CouponsModule,
    OrdersModule,
    ReviewsModule,
    SettingsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}

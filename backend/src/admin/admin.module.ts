import { Controller, Get, Module } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { PrismaService } from "../prisma/prisma.module.js";

@Controller("admin/dashboard")
@Roles("ADMIN")
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async stats() {
    const [
      salesAgg,
      orderCount,
      customerCount,
      productCount,
      recentOrders,
      lowStock,
      statusCounts,
      monthly,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ["CANCELLED"] } },
      }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.product.count(),
      this.prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, hasVariants: false, stock: { lte: 10 } },
        orderBy: { stock: "asc" },
        take: 10,
        select: { id: true, name: true, slug: true, stock: true, images: { take: 1, select: { url: true } } },
      }),
      this.prisma.order.groupBy({ by: ["status"], _count: true }),
      this.prisma.$queryRaw<Array<{ month: string; revenue: bigint; orders: bigint }>>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
               COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'), 0) AS revenue,
               COUNT(*) AS orders
        FROM orders
        WHERE created_at >= date_trunc('month', NOW()) - interval '11 months'
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) statusMap[row.status] = row._count;

    return {
      totals: {
        sales: Number(salesAgg._sum.total ?? 0),
        orders: orderCount,
        customers: customerCount,
        products: productCount,
      },
      statusCounts: statusMap,
      recentOrders,
      lowStock,
      revenueChart: monthly.map((m) => ({
        month: m.month,
        revenue: Number(m.revenue),
        orders: Number(m.orders),
      })),
    };
  }
}

@Module({
  controllers: [AdminDashboardController],
})
export class AdminModule {}

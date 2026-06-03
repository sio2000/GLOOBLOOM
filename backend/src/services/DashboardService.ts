import { PrismaClient } from "@prisma/client";
import { OrganismService } from "./OrganismService.js";

export class DashboardService {
  constructor(
    private prisma: PrismaClient,
    private organism: OrganismService,
    private getOnlineCount: () => number
  ) {}

  async getStats() {
    const [
      state,
      leafCount,
      wateringCount,
      activityCount,
      creatureCount,
      payments,
      recentActivity,
      recentPayments,
      recentWaterings,
    ] = await Promise.all([
      this.organism.getState(),
      this.prisma.leaf.count(),
      this.prisma.watering.count(),
      this.prisma.activityLog.count(),
      this.prisma.creature.count({ where: { active: true } }),
      this.prisma.payment.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { amountCents: true },
      }),
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      this.prisma.watering.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { username: true, createdAt: true },
      }),
    ]);

    const paymentSummary = {
      pending: 0,
      paid: 0,
      consumed: 0,
      expired: 0,
      revenueCents: 0,
    };

    for (const row of payments) {
      const status = row.status as keyof typeof paymentSummary;
      if (status in paymentSummary && status !== "revenueCents") {
        paymentSummary[status] = row._count._all;
      }
      if (row.status === "paid" || row.status === "consumed") {
        paymentSummary.revenueCents += row._sum.amountCents ?? 0;
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      onlineNow: this.getOnlineCount(),
      organism: state,
      totals: {
        leaves: leafCount,
        waterings: wateringCount,
        activities: activityCount,
        activeCreatures: creatureCount,
      },
      payments: paymentSummary,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        username: a.username,
        createdAt: a.createdAt.toISOString(),
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        action: p.action,
        quantity: p.quantity,
        amountCents: p.amountCents,
        status: p.status,
        username: p.username,
        createdAt: p.createdAt.toISOString(),
      })),
      recentWaterings: recentWaterings.map((w) => ({
        username: w.username,
        createdAt: w.createdAt.toISOString(),
      })),
    };
  }
}

import prisma from "@/lib/prisma";
import { Role, RFQStatus, QuotationStatus, PurchaseOrderStatus, InvoiceStatus } from "@prisma/client";

export interface DashboardKPIs {
  rfqCount: number;
  activeRfqCount: number;
  quotationCount: number;
  poValue: number;
  recentActivity: any[];
}

export class AnalyticsService {
  /**
   * Get KPIs tailored to the user's role
   */
  static async getDashboardKPIs(userId: string, role: Role): Promise<DashboardKPIs> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (role === Role.ADMIN || role === Role.MANAGER) {
      // System-wide KPIs
      const [rfqCount, activeRfqCount, quotationCount, poStats, recentActivity] = await Promise.all([
        prisma.rFQ.count(),
        prisma.rFQ.count({ where: { status: RFQStatus.PUBLISHED } }),
        prisma.quotation.count(),
        prisma.purchaseOrder.aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: firstDayOfMonth } },
        }),
        prisma.activityLog.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        }),
      ]);

      return {
        rfqCount,
        activeRfqCount,
        quotationCount,
        poValue: poStats._sum.totalAmount || 0,
        recentActivity,
      };
    }

    if (role === Role.PROCUREMENT_OFFICER) {
      // Officer's own KPIs
      const [rfqCount, activeRfqCount, quotationCount, poStats, recentActivity] = await Promise.all([
        prisma.rFQ.count({ where: { createdById: userId } }),
        prisma.rFQ.count({ where: { createdById: userId, status: RFQStatus.PUBLISHED } }),
        prisma.quotation.count({ where: { rfq: { createdById: userId } } }),
        prisma.purchaseOrder.aggregate({
          _sum: { totalAmount: true },
          where: { quotation: { rfq: { createdById: userId } }, createdAt: { gte: firstDayOfMonth } },
        }),
        prisma.activityLog.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        rfqCount,
        activeRfqCount,
        quotationCount,
        poValue: poStats._sum.totalAmount || 0,
        recentActivity,
      };
    }

    if (role === Role.VENDOR) {
      // Vendor's own KPIs
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) throw new Error("Vendor profile not found");

      const [rfqCount, activeRfqCount, quotationCount, poStats, recentActivity] = await Promise.all([
        prisma.rFQVendor.count({ where: { vendorId: vendor.id } }),
        prisma.rFQVendor.count({ where: { vendorId: vendor.id, rfq: { status: RFQStatus.PUBLISHED } } }),
        prisma.quotation.count({ where: { vendorId: vendor.id } }),
        prisma.purchaseOrder.aggregate({
          _sum: { totalAmount: true },
          where: { vendorId: vendor.id, createdAt: { gte: firstDayOfMonth } },
        }),
        prisma.activityLog.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        rfqCount, // Total RFQs invited to
        activeRfqCount, // Active open RFQs invited to
        quotationCount, // Total quotations submitted
        poValue: poStats._sum.totalAmount || 0, // Total PO value this month
        recentActivity,
      };
    }

    return {
      rfqCount: 0,
      activeRfqCount: 0,
      quotationCount: 0,
      poValue: 0,
      recentActivity: [],
    };
  }

  /**
   * RFQ trends by month for the past 12 months
   */
  static async getRFQTrends() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const rfqs = await prisma.rFQ.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    });

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }).reverse();

    const counts = rfqs.reduce((acc: any, rfq) => {
      const monthStr = `${rfq.createdAt.getFullYear()}-${String(rfq.createdAt.getMonth() + 1).padStart(2, "0")}`;
      acc[monthStr] = (acc[monthStr] || 0) + 1;
      return acc;
    }, {});

    return months.map(m => ({
      month: m,
      count: counts[m] || 0,
    }));
  }

  /**
   * Spending analysis: Top 5 vendors by spend, and recent monthly spend
   */
  static async getSpendingAnalysis() {
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { not: "DRAFT" } },
      include: { vendor: { select: { companyName: true } } },
    });

    const vendorSpendMap: any = {};
    const monthlySpendMap: any = {};

    pos.forEach((po) => {
      // Vendor Spend
      const vName = po.vendor.companyName;
      vendorSpendMap[vName] = (vendorSpendMap[vName] || 0) + po.totalAmount;

      // Monthly Spend
      const monthStr = `${po.createdAt.getFullYear()}-${String(po.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlySpendMap[monthStr] = (monthlySpendMap[monthStr] || 0) + po.totalAmount;
    });

    const byVendor = Object.keys(vendorSpendMap)
      .map((name) => ({ name, value: vendorSpendMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // Get last 6 months for spend trend
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }).reverse();

    const byMonth = months.map(m => ({
      month: m,
      amount: monthlySpendMap[m] || 0,
    }));

    return { byVendor, byMonth };
  }

  /**
   * Vendor performance: Win rate, average delivery reliability, etc.
   */
  static async getVendorPerformance() {
    const vendors = await prisma.vendor.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        companyName: true,
        rating: true,
        quotations: { select: { status: true } },
      },
    });

    return vendors.map((v) => {
      const totalQuotes = v.quotations.length;
      const wonQuotes = v.quotations.filter(q => q.status === QuotationStatus.ACCEPTED).length;
      const winRate = totalQuotes > 0 ? (wonQuotes / totalQuotes) * 100 : 0;

      return {
        id: v.id,
        name: v.companyName,
        rating: v.rating,
        totalQuotes,
        winRate: Number(winRate.toFixed(1)),
      };
    }).sort((a, b) => b.winRate - a.winRate);
  }
}

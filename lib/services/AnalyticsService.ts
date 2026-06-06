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
}

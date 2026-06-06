import prisma from "@/lib/prisma";
import { RFQStatus, Role } from "@prisma/client";
import { ActivityLogService } from "./ActivityLogService";
import { RFQFormData } from "../validations/rfq";

export class RFQService {
  /**
   * Generates a unique RFQ number (e.g., RFQ-20231024-001)
   */
  private static async generateRFQNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    
    // Find the latest RFQ created today to increment the counter
    const latestRFQ = await prisma.rFQ.findFirst({
      where: { rfqNumber: { startsWith: `RFQ-${dateStr}-` } },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (latestRFQ) {
      const parts = latestRFQ.rfqNumber.split("-");
      sequence = parseInt(parts[2], 10) + 1;
    }

    const sequenceStr = sequence.toString().padStart(3, "0");
    return `RFQ-${dateStr}-${sequenceStr}`;
  }

  /**
   * Fetch paginated RFQs based on user role and filters.
   */
  static async getRFQs(params: {
    userId: string;
    role: Role;
    page?: number;
    limit?: number;
    status?: RFQStatus;
  }) {
    const { userId, role, page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    // RBAC logic for fetching RFQs
    if (role === Role.VENDOR) {
      // Vendor only sees RFQs they are invited to and are PUBLISHED
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) throw new Error("Vendor profile not found");
      
      where.status = status || RFQStatus.PUBLISHED; // Ensure they only see published
      where.vendors = { some: { vendorId: vendor.id } };
    } else if (role === Role.PROCUREMENT_OFFICER) {
      // Officer only sees their own RFQs
      where.createdById = userId;
    }
    // Admin & Manager can see everything

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { items: true, vendors: true, quotations: true } },
        },
      }),
      prisma.rFQ.count({ where }),
    ]);

    return {
      data: rfqs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new RFQ (Draft)
   */
  static async createRFQ(data: RFQFormData, creatorId: string) {
    const rfqNumber = await this.generateRFQNumber();

    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        createdById: creatorId,
        status: RFQStatus.DRAFT,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      },
      include: { items: true },
    });

    await ActivityLogService.log(creatorId, "RFQ_CREATED", "RFQ", rfq.id, { rfqNumber });

    return rfq;
  }

  /**
   * Get complete RFQ details
   */
  static async getRFQById(id: string) {
    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        items: true,
        attachments: true,
        vendors: {
          include: {
            vendor: { 
              select: { 
                id: true, 
                companyName: true, 
                status: true, 
                user: { select: { email: true } } 
              } 
            },
          },
        },
        quotations: {
          select: { id: true, status: true, totalAmount: true, vendor: { select: { companyName: true } } },
        },
      },
    });

    if (!rfq) throw new Error("RFQ not found");
    return rfq;
  }

  /**
   * Assign vendors to an RFQ
   */
  static async assignVendors(rfqId: string, vendorIds: string[], actorId: string) {
    // Prevent duplicate assignments
    const existing = await prisma.rFQVendor.findMany({
      where: { rfqId, vendorId: { in: vendorIds } },
    });
    
    const existingVendorIds = existing.map(e => e.vendorId);
    const newVendorIds = vendorIds.filter(id => !existingVendorIds.includes(id));

    if (newVendorIds.length === 0) return { count: 0 };

    const result = await prisma.rFQVendor.createMany({
      data: newVendorIds.map(vid => ({
        rfqId,
        vendorId: vid,
      })),
    });

    await ActivityLogService.log(
      actorId, 
      "VENDORS_ASSIGNED_TO_RFQ", 
      "RFQ", 
      rfqId, 
      { vendorIds: newVendorIds }
    );

    // Notify Vendors
    for (const vendorId of newVendorIds) {
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (vendor?.userId) {
        const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
        await prisma.notification.create({
          data: {
            userId: vendor.userId,
            title: "RFQ Invitation",
            message: `You have been invited to submit a quotation for RFQ: ${rfq?.title || rfqId}`,
            link: `/rfqs/${rfqId}`,
          }
        });
      }
    }

    return { count: result.count };
  }

  /**
   * Update RFQ Status (e.g., Publish)
   */
  static async updateStatus(rfqId: string, status: RFQStatus, actorId: string) {
    const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new Error("RFQ not found");

    // Basic state machine validation
    if (rfq.status === RFQStatus.CLOSED || rfq.status === RFQStatus.CANCELLED) {
      throw new Error(`Cannot change status of a ${rfq.status} RFQ`);
    }

    const updatedRfq = await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status },
    });

    await ActivityLogService.log(
      actorId,
      `RFQ_STATUS_UPDATED_${status}`,
      "RFQ",
      rfq.id,
      { oldStatus: rfq.status, newStatus: status }
    );

    return updatedRfq;
  }
}

import prisma from "@/lib/prisma";
import { VendorStatus } from "@prisma/client";
import { ActivityLogService } from "./ActivityLogService";
import { VendorFormData } from "../validations/vendor";
import bcrypt from "bcryptjs";

export class VendorService {
  /**
   * Retrieves paginated vendors with optional search and filter parameters.
   */
  static async getVendors(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: VendorStatus;
  }) {
    const { page = 1, limit = 10, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, isActive: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Creates a new vendor. Note: Usually a user is created first or concurrently.
   * In this system, Vendor is linked to a User via userId.
   */
  static async registerVendor(data: VendorFormData, actorId: string, customUserId?: string) {
    // If no custom user ID is provided, create a user
    let userId = customUserId;
    if (!userId) {
      const passwordHash = await bcrypt.hash("Vendor@123", 10);
      const newUser = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "VENDOR",
          name: data.contactName,
        },
      });
      userId = newUser.id;
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId,
        companyName: data.companyName,
        category: data.categories.join(", "),
        gstNumber: data.taxId,
        phone: data.phone,
        address: data.address,
        status: VendorStatus.PENDING,
      },
    });

    await ActivityLogService.log(
      actorId,
      "VENDOR_REGISTERED",
      "Vendor",
      vendor.id,
      { companyName: vendor.companyName }
    );

    return vendor;
  }

  /**
   * Retrieves a single vendor by ID, including their performance metrics.
   */
  static async getVendorById(id: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true } },
        rfqVendors: {
          include: {
            rfq: { select: { title: true, status: true, deadline: true } },
          },
        },
        quotations: {
          select: { id: true, status: true, totalAmount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        purchaseOrders: {
          select: { id: true, status: true, totalAmount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!vendor) throw new Error("Vendor not found");

    return vendor;
  }

  /**
   * Update vendor status (e.g., APPROVE, REJECT, BLACKLIST).
   */
  static async updateStatus(vendorId: string, status: VendorStatus, actorId: string) {
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status },
    });

    await ActivityLogService.log(
      actorId,
      `VENDOR_STATUS_UPDATED_${status}`,
      "Vendor",
      vendor.id,
      { oldStatus: vendor.status, newStatus: status }
    );

    return vendor;
  }

  /**
   * Update vendor details.
   */
  static async updateVendor(vendorId: string, data: Partial<VendorFormData>, actorId: string) {
    const updateData: any = { ...data };
    if (data.categories) updateData.category = data.categories.join(", ");
    if (data.taxId) updateData.gstNumber = data.taxId;
    delete updateData.categories;
    delete updateData.taxId;
    delete updateData.contactName;

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    await ActivityLogService.log(
      actorId,
      "VENDOR_UPDATED",
      "Vendor",
      vendor.id,
      { updatedFields: Object.keys(data) }
    );

    return vendor;
  }
}

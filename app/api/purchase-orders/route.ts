import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";

export const GET = withRBAC(
  async (req) => {
    try {
      // Vendors only see their own POs
      const isVendor = req.user.role === Role.VENDOR;
      let vendorId = undefined;

      if (isVendor) {
        const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
        if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        vendorId = vendor.id;
      }

      const pos = await prisma.purchaseOrder.findMany({
        where: vendorId ? { vendorId } : undefined,
        include: {
          vendor: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ data: pos });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to fetch POs" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          vendor: { select: { companyName: true, phone: true, address: true, user: { select: { email: true } } } },
          quotation: {
            include: { items: true, rfq: { select: { title: true, rfqNumber: true } } },
          },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
      });

      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

      // Vendor authorization check
      if (req.user.role === Role.VENDOR) {
        const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
        if (po.vendorId !== vendor?.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      return NextResponse.json({ data: po });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to fetch PO" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

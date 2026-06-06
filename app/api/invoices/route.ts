import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { InvoiceService } from "@/lib/services/InvoiceService";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const GET = withRBAC(
  async (req) => {
    try {
      const session = await auth();
      const user = session?.user;
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      let vendorId = undefined;
      if (user.role === "VENDOR") {
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.id } });
        if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
        vendorId = vendor.id;
      }

      const invoices = await InvoiceService.getInvoices(vendorId);
      return NextResponse.json({ data: invoices });
    } catch (error: any) {
      console.error("[GET /api/invoices]", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

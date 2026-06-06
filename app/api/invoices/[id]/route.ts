import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { InvoiceService } from "@/lib/services/InvoiceService";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const invoice = await InvoiceService.getInvoiceById(resolvedParams.id);
      return NextResponse.json({ data: invoice });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to fetch invoice" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER]
);

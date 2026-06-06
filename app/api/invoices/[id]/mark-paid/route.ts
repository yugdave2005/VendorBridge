import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { InvoiceService } from "@/lib/services/InvoiceService";

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const invoice = await InvoiceService.markAsPaid(resolvedParams.id, req.user.id);
      return NextResponse.json({ data: invoice });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to mark paid" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

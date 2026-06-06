import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { InvoiceService } from "@/lib/services/InvoiceService";

export const GET = withRBAC(
  async () => {
    try {
      const invoices = await InvoiceService.getInvoices();
      return NextResponse.json({ data: invoices });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER] // Vendors shouldn't see all invoices, maybe their own but for now just officers
);

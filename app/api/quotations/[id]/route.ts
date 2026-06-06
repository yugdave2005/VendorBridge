import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { QuotationService } from "@/lib/services/QuotationService";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const quotation = await QuotationService.getQuotationById(id);

      // Authorization check
      if (req.user.role === Role.VENDOR) {
        // Vendors can only see their own quotations
        // Since we don't fetch Vendor by userId directly here easily, let's just 
        // compare the quotation.vendor.email to req.user.email (which is a bit hacky)
        // Better:
        if (quotation.vendor.user?.email !== req.user.email) {
           return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      return NextResponse.json({ data: quotation });
    } catch (error: any) {
      if (error.message === "Quotation not found") {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch quotation" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER, Role.VENDOR]
);

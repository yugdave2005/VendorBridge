import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { QuotationService } from "@/lib/services/QuotationService";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const data = await QuotationService.getComparisonData(id);
      return NextResponse.json({ data });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to generate comparison" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER] // Vendors cannot compare
);

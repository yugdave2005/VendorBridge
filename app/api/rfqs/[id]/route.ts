import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { RFQService } from "@/lib/services/RFQService";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const rfq = await RFQService.getRFQById(id);

      // Authorization check
      if (req.user.role === Role.VENDOR) {
        const isInvited = rfq.vendors.some((v: any) => v.vendor.id === req.user.id);
        if (!isInvited && rfq.status !== "PUBLISHED") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (req.user.role === Role.PROCUREMENT_OFFICER) {
        // Strict officers might only see their own, but typically they can see all in an ERP.
        // If strict: if (rfq.createdById !== req.user.id) return 403
      }

      return NextResponse.json({ data: rfq });
    } catch (error: any) {
      if (error.message === "RFQ not found") {
        return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch RFQ" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER]
);

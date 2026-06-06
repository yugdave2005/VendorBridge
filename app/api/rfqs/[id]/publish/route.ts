import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role, RFQStatus } from "@prisma/client";
import { RFQService } from "@/lib/services/RFQService";

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const updatedRfq = await RFQService.updateStatus(id, RFQStatus.PUBLISHED, req.user.id);
      return NextResponse.json({ data: updatedRfq });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to publish RFQ" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

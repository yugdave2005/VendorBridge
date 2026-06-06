import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { ApprovalService } from "@/lib/services/ApprovalService";
import { resolveApprovalSchema } from "@/lib/validations/approval";

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const body = await req.json();
      const parsed = resolveApprovalSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      const result = await ApprovalService.resolveApproval(id, "APPROVED", req.user.id, parsed.data.remarks);
      return NextResponse.json({ data: result });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to approve quotation" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER] // Only Managers and Admins can approve
);

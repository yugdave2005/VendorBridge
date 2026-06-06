import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { ApprovalService } from "@/lib/services/ApprovalService";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const approval = await ApprovalService.getApprovalById(id);
      return NextResponse.json({ data: approval });
    } catch (error: any) {
      if (error.message === "Approval not found") {
        return NextResponse.json({ error: "Approval not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch approval" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER]
);

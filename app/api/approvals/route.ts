import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { ApprovalService } from "@/lib/services/ApprovalService";
import { initiateApprovalSchema } from "@/lib/validations/approval";

export const GET = withRBAC(
  async (req) => {
    try {
      // If MANAGER, we could filter by their ID. Here we'll just fetch all pending approvals.
      // In a very strict app, `approverId: req.user.id` would be used.
      const approvals = await ApprovalService.getPendingApprovals();
      return NextResponse.json({ data: approvals });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to fetch approvals" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER]
);

export const POST = withRBAC(
  async (req) => {
    try {
      const body = await req.json();
      const parsed = initiateApprovalSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      const approval = await ApprovalService.initiateApproval(
        parsed.data.quotationId,
        parsed.data.approverId,
        req.user.id,
        parsed.data.remarks
      );

      return NextResponse.json({ data: approval }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to initiate approval" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

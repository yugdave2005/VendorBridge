import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { NotificationService } from "@/lib/services/NotificationService";

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      await NotificationService.markAsRead(resolvedParams.id, req.user.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

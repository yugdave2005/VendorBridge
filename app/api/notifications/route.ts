import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { NotificationService } from "@/lib/services/NotificationService";

export const GET = withRBAC(
  async (req) => {
    try {
      const notifications = await NotificationService.getUnreadNotifications(req.user.id);
      return NextResponse.json({ data: notifications });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

export const PATCH = withRBAC(
  async (req) => {
    try {
      const body = await req.json();
      if (body.action === "markAllRead") {
        await NotificationService.markAllAsRead(req.user.id);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

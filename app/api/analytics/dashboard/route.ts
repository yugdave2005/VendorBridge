import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { AnalyticsService } from "@/lib/services/AnalyticsService";

export const GET = withRBAC(
  async (req) => {
    try {
      const { id, role } = req.user;
      const kpis = await AnalyticsService.getDashboardKPIs(id, role);
      
      return NextResponse.json({ data: kpis });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch dashboard KPIs" },
        { status: 500 }
      );
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER]
);

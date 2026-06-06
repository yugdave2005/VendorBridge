import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { AnalyticsService } from "@/lib/services/AnalyticsService";

export const GET = withRBAC(
  async (req) => {
    try {
      const kpis = await AnalyticsService.getDashboardKPIs(req.user.id, req.user.role);
      return NextResponse.json({ data: kpis }, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59",
        },
      });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to fetch dashboard KPIs" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { AnalyticsService } from "@/lib/services/AnalyticsService";

export const GET = withRBAC(
  async () => {
    try {
      const data = await AnalyticsService.getRFQTrends();
      return NextResponse.json({ data }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59" },
      });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to fetch RFQ trends" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER]
);

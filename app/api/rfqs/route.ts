import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role, RFQStatus } from "@prisma/client";
import { RFQService } from "@/lib/services/RFQService";
import { rfqSchema } from "@/lib/validations/rfq";

export const GET = withRBAC(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const status = (searchParams.get("status") as RFQStatus) || undefined;

      const result = await RFQService.getRFQs({
        userId: req.user.id,
        role: req.user.role,
        page,
        limit,
        status,
      });

      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to fetch RFQs" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER]
);

export const POST = withRBAC(
  async (req) => {
    try {
      const body = await req.json();
      const parsed = rfqSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      const rfq = await RFQService.createRFQ(parsed.data, req.user.id);
      return NextResponse.json({ data: rfq }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to create RFQ" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

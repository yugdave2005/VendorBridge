import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { RFQService } from "@/lib/services/RFQService";
import { z } from "zod";

const vendorAssignmentSchema = z.object({
  vendorIds: z.array(z.string()).min(1, "Select at least one vendor to assign"),
});

export const POST = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const body = await req.json();
      const parsed = vendorAssignmentSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      const result = await RFQService.assignVendors(id, parsed.data.vendorIds, req.user.id);
      return NextResponse.json({ data: result });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to assign vendors" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

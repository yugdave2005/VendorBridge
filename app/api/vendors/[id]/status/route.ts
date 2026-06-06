import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { VendorService } from "@/lib/services/VendorService";
import { vendorUpdateStatusSchema } from "@/lib/validations/vendor";

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;
      
      const body = await req.json();
      const parsed = vendorUpdateStatusSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid status data", details: parsed.error.format() }, { status: 400 });
      }

      const updatedVendor = await VendorService.updateStatus(id, parsed.data.status, req.user.id);
      return NextResponse.json({ data: updatedVendor });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to update vendor status" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER] // VENDOR cannot change their own status
);

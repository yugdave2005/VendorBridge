import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { VendorService } from "@/lib/services/VendorService";
import { vendorSchema } from "@/lib/validations/vendor";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      // In Next.js 16, params is a Promise in Route Handlers
      const resolvedParams = await params;
      const { id } = resolvedParams;
      
      const vendor = await VendorService.getVendorById(id);
      
      // VENDORs can only view themselves
      if (req.user.role === Role.VENDOR && vendor.userId !== req.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ data: vendor });
    } catch (error: any) {
      if (error.message === "Vendor not found") {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER, Role.VENDOR]
);

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;
      
      const body = await req.json();
      const parsed = vendorSchema.partial().safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      // VENDORs can only update themselves
      if (req.user.role === Role.VENDOR) {
         const vendor = await VendorService.getVendorById(id);
         if (vendor.userId !== req.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
         }
      }

      const updatedVendor = await VendorService.updateVendor(id, parsed.data, req.user.id);
      return NextResponse.json({ data: updatedVendor });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

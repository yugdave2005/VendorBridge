import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role, VendorStatus } from "@prisma/client";
import { VendorService } from "@/lib/services/VendorService";
import { vendorSchema } from "@/lib/validations/vendor";

export const GET = withRBAC(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const search = searchParams.get("search") || undefined;
      const status = (searchParams.get("status") as VendorStatus) || undefined;

      const result = await VendorService.getVendors({ page, limit, search, status });
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER] // Vendor shouldn't list all vendors
);

export const POST = withRBAC(
  async (req) => {
    try {
      const body = await req.json();
      const parsed = vendorSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      // If actor is VENDOR, maybe restrict creation, but here officers can create vendors manually
      const vendor = await VendorService.registerVendor(parsed.data, req.user.id);
      return NextResponse.json({ data: vendor }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to create vendor" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

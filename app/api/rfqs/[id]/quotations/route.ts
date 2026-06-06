import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { QuotationService } from "@/lib/services/QuotationService";
import { quotationSchema } from "@/lib/validations/quotation";
import prisma from "@/lib/prisma";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const quotations = await QuotationService.getQuotationsForRFQ(id);

      // If vendor, only return their own quotation
      if (req.user.role === Role.VENDOR) {
        const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
        if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        
        const myQuotes = quotations.filter((q: any) => q.vendorId === vendor.id);
        return NextResponse.json({ data: myQuotes });
      }

      return NextResponse.json({ data: quotations });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to fetch quotations" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER, Role.VENDOR]
);

export const POST = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const body = await req.json();
      const parsed = quotationSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
      }

      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
      if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

      const quotation = await QuotationService.submitQuotation(id, vendor.id, parsed.data, req.user.id);
      return NextResponse.json({ data: quotation }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to submit quotation" }, { status: 500 });
    }
  },
  [Role.VENDOR] // Only vendors can submit quotations
);

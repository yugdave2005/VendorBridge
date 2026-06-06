import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id } = session.user;

    let quotations;

    if (role === "VENDOR") {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: id },
      });

      if (!vendor) {
        return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
      }

      quotations = await prisma.quotation.findMany({
        where: { vendorId: vendor.id },
        include: {
          rfq: { select: { id: true, title: true, rfqNumber: true } },
          vendor: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Admins & Officers can see all quotations
      quotations = await prisma.quotation.findMany({
        include: {
          rfq: { select: { id: true, title: true, rfqNumber: true } },
          vendor: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ data: quotations });
  } catch (error) {
    console.error("[GET /api/quotations]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

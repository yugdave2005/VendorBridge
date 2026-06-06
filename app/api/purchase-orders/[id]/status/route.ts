import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role, PurchaseOrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ActivityLogService } from "@/lib/services/ActivityLogService";
import { InvoiceService } from "@/lib/services/InvoiceService";

export const PATCH = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const body = await req.json();
      const status = body.status as PurchaseOrderStatus;

      if (!Object.values(PurchaseOrderStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const po = await prisma.purchaseOrder.update({
        where: { id },
        data: { status },
      });

      await ActivityLogService.log(req.user.id, "PO_STATUS_UPDATED", "PurchaseOrder", id, { newStatus: status });

      // Automatically generate invoice when PO is marked DELIVERED
      if (status === "DELIVERED") {
        try {
          await InvoiceService.createFromPO(id, req.user.id);
        } catch (e: any) {
          console.error("Failed to auto-generate invoice:", e);
        }
      }

      return NextResponse.json({ data: po });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to update PO status" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

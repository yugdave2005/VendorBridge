import prisma from "@/lib/prisma";
import { PurchaseOrderStatus } from "@prisma/client";
import { ActivityLogService } from "./ActivityLogService";

export class PurchaseOrderService {
  private static async generatePONumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const latestPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: `PO-${dateStr}-` } },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (latestPO) {
      const parts = latestPO.poNumber.split("-");
      sequence = parseInt(parts[2], 10) + 1;
    }

    const sequenceStr = sequence.toString().padStart(3, "0");
    return `PO-${dateStr}-${sequenceStr}`;
  }

  /**
   * Generates a draft PO automatically from an accepted quotation.
   */
  static async createFromQuotation(quotationId: string, actorId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { rfq: true },
    });

    if (!quotation) throw new Error("Quotation not found");

    const poNumber = await this.generatePONumber();

    // Default delivery date: quotation validity date + delivery days (very rough heuristic)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + quotation.deliveryDays);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        quotationId: quotation.id,
        vendorId: quotation.vendorId,
        status: PurchaseOrderStatus.DRAFT,
        totalAmount: quotation.totalAmount,
        deliveryDate,
        terms: "Standard vendor terms apply.",
      },
    });

    await ActivityLogService.log(actorId, "PO_GENERATED_FROM_QUOTATION", "PurchaseOrder", po.id, { poNumber, quotationId });

    return po;
  }
}

import prisma from "@/lib/prisma";
import { QuotationStatus, RFQStatus } from "@prisma/client";
import { ActivityLogService } from "./ActivityLogService";
import { QuotationFormData } from "../validations/quotation";

export class QuotationService {
  /**
   * Generates a unique quotation number (e.g. QT-20241024-001)
   */
  private static async generateQuotationNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const latestQT = await prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: `QT-${dateStr}-` } },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (latestQT) {
      const parts = latestQT.quotationNumber.split("-");
      sequence = parseInt(parts[2], 10) + 1;
    }

    const sequenceStr = sequence.toString().padStart(3, "0");
    return `QT-${dateStr}-${sequenceStr}`;
  }

  /**
   * Submit a new quotation
   */
  static async submitQuotation(rfqId: string, vendorId: string, data: QuotationFormData, actorId: string) {
    // 1. Verify RFQ exists and is PUBLISHED
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { items: true, vendors: true },
    });

    if (!rfq) throw new Error("RFQ not found");
    if (rfq.status !== RFQStatus.PUBLISHED) throw new Error(`Cannot quote on ${rfq.status} RFQ`);
    if (!rfq.vendors.some((v: any) => v.vendorId === vendorId)) {
      throw new Error("You are not invited to this RFQ");
    }

    // 2. Prevent duplicate quotations
    const existing = await prisma.quotation.findFirst({
      where: { rfqId, vendorId },
    });
    if (existing) throw new Error("You have already submitted a quotation for this RFQ");

    // 3. Calculate totals
    let subtotal = 0;
    const itemsData = [];

    for (const itemData of data.items) {
      const rfqItem = rfq.items.find((i: any) => i.id === itemData.rfqItemId);
      if (!rfqItem) throw new Error(`Invalid RFQ Item ID: ${itemData.rfqItemId}`);

      const totalPrice = itemData.unitPrice * rfqItem.quantity;
      subtotal += totalPrice;

      itemsData.push({
        rfqItemId: rfqItem.id,
        name: rfqItem.name,
        quantity: rfqItem.quantity,
        unitPrice: itemData.unitPrice,
        totalPrice,
      });
    }

    const taxAmount = (subtotal * data.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const quotationNumber = await this.generateQuotationNumber();

    // 4. Save to database
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        rfqId,
        vendorId,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        totalAmount,
        deliveryDays: data.deliveryDays,
        validUntil: new Date(data.validUntil),
        notes: data.notes,
        status: QuotationStatus.SUBMITTED,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });

    await ActivityLogService.log(actorId, "QUOTATION_SUBMITTED", "Quotation", quotation.id, { rfqId, quotationNumber });

    return quotation;
  }

  /**
   * Fetch all quotations for a specific RFQ
   */
  static async getQuotationsForRFQ(rfqId: string) {
    return prisma.quotation.findMany({
      where: { rfqId },
      include: {
        vendor: { select: { companyName: true, rating: true, status: true } },
        items: true,
      },
      orderBy: { totalAmount: "asc" },
    });
  }

  /**
   * Fetch a single quotation by ID
   */
  static async getQuotationById(id: string) {
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        vendor: { select: { companyName: true, phone: true, user: { select: { email: true } } } },
        rfq: { select: { rfqNumber: true, title: true, status: true } },
        items: true,
      },
    });
    if (!quote) throw new Error("Quotation not found");
    return quote;
  }

  /**
   * Generate comparison data for an RFQ
   */
  static async getComparisonData(rfqId: string) {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { items: true },
    });

    if (!rfq) throw new Error("RFQ not found");

    const quotations = await this.getQuotationsForRFQ(rfqId);

    // Prepare comparison matrix
    const comparison = {
      rfq: { id: rfq.id, title: rfq.title, rfqNumber: rfq.rfqNumber },
      items: rfq.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        lowestPrice: null as number | null,
        vendorPrices: {} as Record<string, number>,
      })),
      vendors: quotations.map((q: any) => ({
        quotationId: q.id,
        vendorId: q.vendorId,
        companyName: q.vendor.companyName,
        rating: q.vendor.rating,
        totalAmount: q.totalAmount,
        deliveryDays: q.deliveryDays,
        validUntil: q.validUntil,
        status: q.status,
      })),
    };

    // Populate prices and find lowest
    for (const item of comparison.items) {
      let lowest = Infinity;
      for (const q of quotations) {
        const qItem = q.items.find((i: any) => i.rfqItemId === item.id);
        const price = qItem ? qItem.unitPrice : 0;
        item.vendorPrices[q.vendorId] = price;
        if (price > 0 && price < lowest) lowest = price;
      }
      item.lowestPrice = lowest === Infinity ? null : lowest;
    }

    return comparison;
  }
}

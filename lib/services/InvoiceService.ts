import prisma from "@/lib/prisma";
import { InvoiceStatus, PurchaseOrderStatus } from "@prisma/client";
import { ActivityLogService } from "./ActivityLogService";
import nodemailer from "nodemailer";

export class InvoiceService {
  /**
   * Generates a unique invoice number (e.g. INV-20241024-001)
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const latestInv = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `INV-${dateStr}-` } },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (latestInv) {
      const parts = latestInv.invoiceNumber.split("-");
      sequence = parseInt(parts[2], 10) + 1;
    }

    const sequenceStr = sequence.toString().padStart(3, "0");
    return `INV-${dateStr}-${sequenceStr}`;
  }

  /**
   * Automatically generate an invoice from a Purchase Order.
   */
  static async createFromPO(purchaseOrderId: string, actorId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { quotation: true },
    });

    if (!po) throw new Error("Purchase Order not found");

    const existing = await prisma.invoice.findUnique({
      where: { purchaseOrderId },
    });
    if (existing) throw new Error("Invoice already exists for this PO");

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        purchaseOrderId,
        status: InvoiceStatus.DRAFT,
        subtotal: po.quotation.subtotal,
        taxRate: po.quotation.taxRate,
        taxAmount: po.quotation.taxAmount,
        totalAmount: po.quotation.totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default +30 days
        notes: "Generated automatically from Purchase Order.",
      },
    });

    await ActivityLogService.log(actorId, "INVOICE_GENERATED", "Invoice", invoice.id, { invoiceNumber, purchaseOrderId });

    return invoice;
  }

  static async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: { select: { companyName: true, phone: true, address: true, gstNumber: true, panNumber: true, user: { select: { email: true } } } },
            quotation: { include: { items: true } },
          },
        },
      },
    });

    if (!invoice) throw new Error("Invoice not found");
    return invoice;
  }

  static async getInvoices() {
    return prisma.invoice.findMany({
      include: {
        purchaseOrder: {
          select: { poNumber: true, vendor: { select: { companyName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async markAsPaid(id: string, actorId: string) {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
      include: { purchaseOrder: { include: { quotation: { include: { rfq: true } } } } }
    });
    await ActivityLogService.log(actorId, "INVOICE_PAID", "Invoice", id, {});

    // Notify Officer
    if (invoice.purchaseOrder.quotation.rfq.createdById) {
      await prisma.notification.create({
        data: {
          userId: invoice.purchaseOrder.quotation.rfq.createdById,
          title: "Invoice Paid",
          message: `Invoice ${invoice.invoiceNumber} has been marked as paid.`,
          link: `/invoices/${id}`,
        }
      });
    }

    return invoice;
  }

  static async sendEmail(id: string, toEmail: string, subject: string, bodyText: string, actorId: string) {
    // In a real app, we'd render the PDF to a buffer and attach it here.
    // For demo purposes, we will simulate the email via NodeMailer to a trap or console.

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || "test",
        pass: process.env.SMTP_PASS || "test",
      },
    });

    try {
      await transporter.sendMail({
        from: '"VendorBridge Procurement" <no-reply@vendorbridge.com>',
        to: toEmail,
        subject,
        text: bodyText,
        html: `<p>${bodyText.replace(/\n/g, "<br>")}</p><p><em>This is an automated message from VendorBridge.</em></p>`,
        // attachments: [{ filename: "invoice.pdf", content: pdfBuffer }]
      });

      await prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.SENT, emailSentAt: new Date() },
      });

      await ActivityLogService.log(actorId, "INVOICE_EMAILED", "Invoice", id, { to: toEmail });
      return true;
    } catch (e: any) {
      console.error("Email failed", e);
      throw new Error("Failed to send email. Check SMTP settings.");
    }
  }
}

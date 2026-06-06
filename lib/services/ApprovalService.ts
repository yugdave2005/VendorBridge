import prisma from "@/lib/prisma";
import { ApprovalStatus, QuotationStatus, RFQStatus } from "@prisma/client";
import { ActivityLogService } from "./ActivityLogService";
import { PurchaseOrderService } from "./PurchaseOrderService";

export class ApprovalService {
  /**
   * Initiate an approval request for a specific quotation.
   */
  static async initiateApproval(quotationId: string, approverId: string, actorId: string, remarks?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) throw new Error("Quotation not found");
    if (quotation.status !== QuotationStatus.SUBMITTED) {
      throw new Error("Quotation must be in SUBMITTED state to request approval");
    }

    const existing = await prisma.approval.findUnique({
      where: { quotationId },
    });

    if (existing) throw new Error("Approval request already exists for this quotation");

    // Transaction to create approval and update quotation state
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.approval.create({
        data: {
          quotationId,
          approverId,
          remarks,
          status: ApprovalStatus.PENDING,
        },
      });

      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.UNDER_REVIEW },
      });

      return approval;
    });

    await ActivityLogService.log(actorId, "APPROVAL_REQUESTED", "Approval", result.id, { quotationId, approverId });

    // Notify Manager
    await prisma.notification.create({
      data: {
        userId: approverId,
        title: "Approval Request",
        message: `You have a new quotation approval request pending.`,
        link: `/approvals/${result.id}`,
      }
    });

    return result;
  }

  /**
   * Resolve (Approve or Reject) an approval request. This triggers the massive state machine cascade.
   */
  static async resolveApproval(approvalId: string, status: "APPROVED" | "REJECTED", actorId: string, remarks: string) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: { include: { rfq: true, vendor: true } } },
    });

    if (!approval) throw new Error("Approval not found");
    if (approval.status !== ApprovalStatus.PENDING) throw new Error("Approval is already resolved");

    const quotationId = approval.quotationId;
    const rfqId = approval.quotation.rfqId;

    await prisma.$transaction(async (tx) => {
      // 1. Update the Approval record
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: status === "APPROVED" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          remarks,
          resolvedAt: new Date(),
        },
      });

      // 2. State cascade based on decision
      if (status === "APPROVED") {
        // Approve this quote
        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: QuotationStatus.ACCEPTED },
        });

        // Reject all other quotes for this RFQ
        await tx.quotation.updateMany({
          where: { rfqId: rfqId, id: { not: quotationId } },
          data: { status: QuotationStatus.REJECTED },
        });

        // Close the RFQ
        await tx.rFQ.update({
          where: { id: rfqId },
          data: { status: RFQStatus.CLOSED },
        });
      } else {
        // Just reject this quote
        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: QuotationStatus.REJECTED },
        });
      }
    });

    await ActivityLogService.log(
      actorId, 
      `APPROVAL_${status}`, 
      "Approval", 
      approval.id, 
      { quotationId, remarks }
    );

    // 3. Post-transaction triggers (e.g. creating PO if approved)
    if (status === "APPROVED") {
      try {
        const po = await PurchaseOrderService.createFromQuotation(quotationId, actorId);
        
        // Notify Vendor about PO
        if (approval.quotation.vendor.userId) {
          await prisma.notification.create({
            data: {
              userId: approval.quotation.vendor.userId,
              title: "Quotation Accepted & PO Issued",
              message: `Your quotation has been accepted. A Purchase Order has been issued.`,
              link: `/purchase-orders/${po.id}`,
            }
          });
        }
      } catch (error) {
        console.error("Failed to generate PO after approval:", error);
      }
    } else {
       // Notify Vendor of rejection
       if (approval.quotation.vendor.userId) {
         await prisma.notification.create({
           data: {
             userId: approval.quotation.vendor.userId,
             title: "Quotation Rejected",
             message: `Your quotation for RFQ ${approval.quotation.rfq.rfqNumber} was rejected.`,
             link: `/rfqs/${approval.quotation.rfqId}`,
           }
         });
       }
    }

    // Notify original POfficer who requested
    if (approval.quotation.rfq.createdById) {
       await prisma.notification.create({
         data: {
           userId: approval.quotation.rfq.createdById,
           title: `Approval ${status}`,
           message: `Your approval request for quotation ${approval.quotation.quotationNumber} was ${status.toLowerCase()}.`,
           link: `/approvals/${approvalId}`,
         }
       });
    }

    return await prisma.approval.findUnique({ where: { id: approvalId } });
  }

  /**
   * Get pending approvals (typically for Manager/Admin)
   */
  static async getPendingApprovals(approverId?: string) {
    const where: any = { status: ApprovalStatus.PENDING };
    if (approverId) where.approverId = approverId;

    return prisma.approval.findMany({
      where,
      include: {
        quotation: {
          include: {
            rfq: { select: { rfqNumber: true, title: true } },
            vendor: { select: { companyName: true } },
          },
        },
      },
      orderBy: { requestedAt: "asc" }, // oldest first (most urgent)
    });
  }

  /**
   * Get approval detail
   */
  static async getApprovalById(id: string) {
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        approver: { select: { name: true, email: true } },
        quotation: {
          include: {
            rfq: { select: { rfqNumber: true, title: true, description: true } },
            vendor: { select: { companyName: true, rating: true, phone: true } },
            items: true,
          },
        },
      },
    });

    if (!approval) throw new Error("Approval not found");
    return approval;
  }
}

import { z } from "zod";

export const initiateApprovalSchema = z.object({
  quotationId: z.string().uuid("Invalid Quotation ID"),
  approverId: z.string().uuid("Select an approver"),
  remarks: z.string().optional(),
});

export const resolveApprovalSchema = z.object({
  remarks: z.string().min(1, "Remarks are required for approval decisions"),
});

export type InitiateApprovalData = z.infer<typeof initiateApprovalSchema>;
export type ResolveApprovalData = z.infer<typeof resolveApprovalSchema>;

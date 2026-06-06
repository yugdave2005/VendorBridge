import { z } from "zod";

export const quotationItemSchema = z.object({
  rfqItemId: z.string().uuid("Invalid RFQ Item ID"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
});

export const quotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  taxRate: z.number().min(0).max(100),
  deliveryDays: z.number().min(1, "Delivery days must be at least 1"),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid validity date",
  }),
  notes: z.string().optional(),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;
export type QuotationItemData = z.infer<typeof quotationItemSchema>;

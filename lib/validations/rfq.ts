import { z } from "zod";
import { RFQStatus } from "@prisma/client";

export const rfqItemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit of measure is required"),
});

export const rfqSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid deadline date",
  }),
  items: z.array(rfqItemSchema).min(1, "At least one item is required"),
});

export type RFQFormData = z.infer<typeof rfqSchema>;
export type RFQItemData = z.infer<typeof rfqItemSchema>;

export const rfqUpdateStatusSchema = z.object({
  status: z.nativeEnum(RFQStatus),
});

import { z } from "zod";

export const vendorSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  taxId: z.string().min(5, "Tax ID (GST/PAN/EIN) is required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  address: z.string().min(10, "Address is required"),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

export const vendorUpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "BLACKLISTED"]),
});

export type VendorUpdateStatusData = z.infer<typeof vendorUpdateStatusSchema>;

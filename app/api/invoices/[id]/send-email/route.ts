import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { InvoiceService } from "@/lib/services/InvoiceService";

export const POST = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const body = await req.json();
      const { toEmail, subject, message } = body;

      if (!toEmail || !subject || !message) {
        return NextResponse.json({ error: "Missing email fields" }, { status: 400 });
      }

      await InvoiceService.sendEmail(id, toEmail, subject, message, req.user.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

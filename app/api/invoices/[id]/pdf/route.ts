import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { InvoiceService } from "@/lib/services/InvoiceService";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import React from "react";

export const GET = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const invoice = await InvoiceService.getInvoiceById(resolvedParams.id);

      // Generate PDF Stream
      const stream = await renderToStream(React.createElement(InvoicePDF, { invoice }) as React.ReactElement<any>);

      // Convert Node stream to Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
        },
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.MANAGER, Role.PROCUREMENT_OFFICER, Role.VENDOR]
);

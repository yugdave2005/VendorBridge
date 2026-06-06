import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { StorageService } from "@/lib/services/StorageService";
import prisma from "@/lib/prisma";
import { ActivityLogService } from "@/lib/services/ActivityLogService";

export const POST = withRBAC(
  async (req, { params }) => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Read file into Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload file locally
      const { path: fileUrl, filename } = await StorageService.uploadFile(buffer, file.name);

      // Save attachment record in DB
      const attachment = await prisma.attachment.create({
        data: {
          rfqId: id,
          filename: file.name,
          path: fileUrl,
          mimeType: file.type,
          size: file.size,
        },
      });

      await ActivityLogService.log(req.user.id, "ATTACHMENT_ADDED", "RFQ", id, { attachmentId: attachment.id });

      return NextResponse.json({ data: attachment }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to upload attachment" }, { status: 500 });
    }
  },
  [Role.ADMIN, Role.PROCUREMENT_OFFICER]
);

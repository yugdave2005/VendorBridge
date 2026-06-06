import { NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";

export const GET = withRBAC(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const entityType = searchParams.get("entityType");
      const action = searchParams.get("action");
      const userId = searchParams.get("userId");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");

      const where: any = {};
      if (entityType) where.entityType = entityType;
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.activityLog.count({ where }),
      ]);

      return NextResponse.json({
        data: logs,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
    }
  },
  [Role.ADMIN] // Only ADMIN can view full audit logs
);

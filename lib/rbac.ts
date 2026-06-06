import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import logger from "@/lib/logger";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * RBAC middleware wrapper for API route handlers.
 * Every API route MUST use this — no unprotected routes allowed.
 *
 * Usage:
 * ```ts
 * export const GET = withRBAC(
 *   async (req, ctx) => { ... },
 *   [Role.ADMIN, Role.PROCUREMENT_OFFICER]
 * );
 * ```
 */
export function withRBAC(
  handler: (
    req: AuthenticatedRequest,
    ctx: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse>,
  allowedRoles: Role[]
) {
  return async (
    req: Request,
    ctx: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const session = await auth();

      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(session.user.role as Role)) {
        logger.warn("RBAC access denied", {
          userId: session.user.id,
          role: session.user.role,
          requiredRoles: allowedRoles,
          path: req.url,
        });
        return NextResponse.json(
          { error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" },
          { status: 403 }
        );
      }

      // Attach user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role as Role,
        name: session.user.name,
      };

      return handler(authenticatedReq, ctx);
    } catch (error) {
      logger.error("RBAC middleware error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Internal Server Error", code: "RBAC_ERROR" },
        { status: 500 }
      );
    }
  };
}

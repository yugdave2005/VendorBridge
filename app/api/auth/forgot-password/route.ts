import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { forgotPasswordSchema, verifyOtpSchema } from "@/lib/validations/auth";
import logger from "@/lib/logger";

// Rate limiting for OTP requests
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Request OTP
export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If the email exists, an OTP has been sent.",
      });
    }

    // Generate OTP with 15-min expiry
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate old OTPs
    await prisma.oTP.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.oTP.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "USER",
        entityId: user.id,
        ipAddress: ip,
      },
    });

    // In production, send email with OTP. For dev, log it.
    logger.info("OTP generated for password reset", {
      userId: user.id,
      email: user.email,
      otp: process.env.NODE_ENV === "development" ? otpCode : "[REDACTED]",
    });

    // TODO: Send OTP via email using Nodemailer when SMTP is configured

    return NextResponse.json({
      message: "If the email exists, an OTP has been sent.",
      // Include OTP in dev mode for testing
      ...(process.env.NODE_ENV === "development" && { _devOtp: otpCode }),
    });
  } catch (error) {
    logger.error("Forgot password error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PUT: Verify OTP and reset password
export async function PUT(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid OTP or email", code: "INVALID_OTP" },
        { status: 400 }
      );
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code: otp,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP", code: "INVALID_OTP" },
        { status: 400 }
      );
    }

    // Update password and mark OTP as used
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "USER",
          entityId: user.id,
          ipAddress: ip,
        },
      }),
    ]);

    logger.info("Password reset completed", { userId: user.id });

    return NextResponse.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    logger.error("Verify OTP error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

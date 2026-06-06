import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("VendorBridge <noreply@vendorbridge.com>"),
  NEXT_PUBLIC_APP_NAME: z.string().default("VendorBridge"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    const errors = Object.entries(formatted)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => {
        const errorValue = value as { _errors?: string[] };
        return `  ${key}: ${errorValue._errors?.join(", ") ?? "Invalid"}`;
      })
      .join("\n");

    throw new Error(`❌ Environment validation failed:\n${errors}`);
  }

  return parsed.data;
}

export const env = validateEnv();

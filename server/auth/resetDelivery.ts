import { createPasswordUser, getUserByEmail } from "../db";
import { hashPassword } from "./passwords";

const DEMO_EMAIL = "demo@projectpolaris.local";
const DEMO_PASSWORD = "PolarisDemo!2026";

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function developmentDemoCredentials() {
  return isProductionEnvironment() ? null : { email: DEMO_EMAIL, password: DEMO_PASSWORD };
}

/** Seeds an explicitly non-production Explorer account. It never runs in the deployed app. */
export async function ensureDevelopmentDemoAccount() {
  if (isProductionEnvironment() || process.env.POLARIS_SEED_DEMO_ACCOUNT === "false") return null;
  const existing = await getUserByEmail(DEMO_EMAIL);
  if (existing) return developmentDemoCredentials();
  await createPasswordUser({ name: "Polaris Demo Explorer", email: DEMO_EMAIL, passwordHash: await hashPassword(DEMO_PASSWORD) });
  return developmentDemoCredentials();
}

export async function sendPasswordResetEmail({ email, resetUrl, expiresAt }: { email: string; resetUrl: string; expiresAt: Date }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESET_EMAIL_FROM;
  if (!isProductionEnvironment()) {
    console.info("[Auth] Development password reset link generated", { email, expiresAt: expiresAt.toISOString() });
    return { debugResetUrl: resetUrl };
  }
  if (!apiKey || !from) throw new Error("Password reset email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your Project Polaris password",
      html: `<p>Use the link below to reset your Project Polaris password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Password reset email could not be delivered");
  return { debugResetUrl: null };
}

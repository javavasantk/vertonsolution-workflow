function parseOrigin(value: string) {
  const url = new URL(value.trim());
  if (url.origin !== value.trim() || url.protocol !== "https:") throw new Error("Allowed production origins must be exact HTTPS origins");
  return url.origin;
}

export function allowedPasswordResetOrigins() {
  const configured = (process.env.POLARIS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .map(parseOrigin);
  if (process.env.NODE_ENV !== "production") {
    configured.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return new Set(configured);
}

export function validatePasswordResetOrigin(origin: string, requestOrigin?: string | null) {
  const parsed = new URL(origin);
  if (parsed.origin !== origin) throw new Error("Invalid password reset origin");
  const allowed = allowedPasswordResetOrigins();
  if (!allowed.has(parsed.origin)) throw new Error("Password reset origin is not allowed");
  if (requestOrigin && requestOrigin !== parsed.origin) throw new Error("Password reset request origin does not match");
  return parsed.origin;
}

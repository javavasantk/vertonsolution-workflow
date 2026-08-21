import { describe, expect, it } from "vitest";
import { allowedPasswordResetOrigins, validatePasswordResetOrigin } from "./auth/resetOrigins";

describe("password reset allowed origins configuration", () => {
  it("accepts configured HTTPS origins and rejects untrusted reset targets", () => {
    const configured = process.env.POLARIS_ALLOWED_ORIGINS;
    expect(configured).toBeTruthy();
    const origins = allowedPasswordResetOrigins();
    expect(origins.size).toBeGreaterThan(0);
    const firstOrigin = Array.from(origins).find(origin => origin.startsWith("https://"));
    expect(firstOrigin).toBeTruthy();
    expect(validatePasswordResetOrigin(firstOrigin!, firstOrigin)).toBe(firstOrigin);
    expect(() => validatePasswordResetOrigin("https://attacker.example", "https://attacker.example")).toThrow("not allowed");
  });
});

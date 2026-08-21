import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  createPasswordUser: vi.fn(),
  getUserByEmail: vi.fn(),
}));

import { developmentDemoCredentials, isProductionEnvironment, sendPasswordResetEmail } from "./auth/resetDelivery";

describe("auth reset delivery", () => {
  it("exposes demo credentials only outside production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    expect(developmentDemoCredentials()).toEqual({ email: "demo@projectpolaris.local", password: "PolarisDemo!2026" });
    process.env.NODE_ENV = "production";
    expect(isProductionEnvironment()).toBe(true);
    expect(developmentDemoCredentials()).toBeNull();
    process.env.NODE_ENV = original;
  });

  it("returns a development reset URL when transactional email is not configured", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const result = await sendPasswordResetEmail({ email: "learner@example.com", resetUrl: "http://localhost/auth?reset=token", expiresAt: new Date("2030-01-01T00:00:00Z") });
    expect(result.debugResetUrl).toBe("http://localhost/auth?reset=token");
    process.env.NODE_ENV = original;
  });
});

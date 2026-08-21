import { describe, expect, it } from "vitest";
import { shouldShowDevelopmentDemo } from "./demoAccess";

describe("development demo UI guard", () => {
  const credentials = { email: "demo@projectpolaris.local", password: "PolarisDemo!2026" };

  it("renders demo access only in development", () => {
    expect(shouldShowDevelopmentDemo(credentials, true)).toBe(true);
    expect(shouldShowDevelopmentDemo(credentials, false)).toBe(false);
    expect(shouldShowDevelopmentDemo(null, true)).toBe(false);
  });
});

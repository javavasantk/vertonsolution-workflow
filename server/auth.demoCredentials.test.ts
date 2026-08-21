import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context() {
  return {
    user: null,
    req: { protocol: "http", hostname: "localhost", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } satisfies TrpcContext;
}

describe("auth.demoCredentials", () => {
  it("shows the demo credentials only outside production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    await expect(appRouter.createCaller(context()).auth.demoCredentials()).resolves.toMatchObject({ email: "demo@projectpolaris.local" });
    process.env.NODE_ENV = "production";
    await expect(appRouter.createCaller(context()).auth.demoCredentials()).resolves.toBeNull();
    process.env.NODE_ENV = original;
  });
});

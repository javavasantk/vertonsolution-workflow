import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function explorerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 987,
    openId: "explorer-validation",
    name: "Explorer Validation",
    email: "explorer@example.invalid",
    loginMethod: "password",
    role: "user",
    planId: "explorer",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("membership access gates", () => {
  it("does not let Explorer save an AeroForge trial", async () => {
    const caller = appRouter.createCaller(explorerContext());
    await expect(caller.aeroforge.save({ challengeId: "transonic-airfoil", mach: 0.62, alphaDeg: 4, altitudeKm: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not let Explorer open the Squad Pro Co-Pilot history", async () => {
    const caller = appRouter.createCaller(explorerContext());
    await expect(caller.workspace.copilotMessages()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

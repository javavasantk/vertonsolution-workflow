import { beforeEach, describe, expect, it, vi } from "vitest";

const { createPasswordUser, getUserByEmail } = vi.hoisted(() => ({
  createPasswordUser: vi.fn(),
  getUserByEmail: vi.fn(),
}));

vi.mock("./db", () => ({ createPasswordUser, getUserByEmail }));

import { ensureDevelopmentDemoAccount } from "./auth/resetDelivery";

describe("development demo provisioning", () => {
  beforeEach(() => { createPasswordUser.mockReset(); getUserByEmail.mockReset(); });

  it("never reads or seeds the demo account in production mode", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    await expect(ensureDevelopmentDemoAccount()).resolves.toBeNull();
    expect(getUserByEmail).not.toHaveBeenCalled();
    expect(createPasswordUser).not.toHaveBeenCalled();
    process.env.NODE_ENV = original;
  });

  it("seeds a demo account only in a non-production process", async () => {
    const original = process.env.NODE_ENV;
    const originalSeedFlag = process.env.POLARIS_SEED_DEMO_ACCOUNT;
    process.env.NODE_ENV = "test";
    delete process.env.POLARIS_SEED_DEMO_ACCOUNT;
    getUserByEmail.mockResolvedValue(null);
    await ensureDevelopmentDemoAccount();
    expect(createPasswordUser).toHaveBeenCalledWith(expect.objectContaining({ email: "demo@projectpolaris.local", name: "Polaris Demo Explorer" }));
    process.env.NODE_ENV = original;
    if (originalSeedFlag === undefined) delete process.env.POLARIS_SEED_DEMO_ACCOUNT;
    else process.env.POLARIS_SEED_DEMO_ACCOUNT = originalSeedFlag;
  });
});

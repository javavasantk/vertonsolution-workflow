import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users } from "../drizzle/schema";
import {
  authenticateDemoCredentials,
  getDb,
  requestDemoPasswordReset,
  resetDemoPassword,
} from "./db";

const runWithDatabase = process.env.DATABASE_URL ? it : it.skip;
const email = "finance@demo.vertonsolutions.com";
const defaultPassword = "VertonDemo!2026";
const replacementPassword = "LifecycleReset!2026";

describe("demo password reset lifecycle", () => {
  runWithDatabase("rejects an expired token, accepts a valid token, and restores the shared demo credential", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is not available for demo reset lifecycle validation");

    try {
      const expiredToken = await requestDemoPasswordReset(email);
      expect(expiredToken).toBeTruthy();
      await db.update(users).set({ resetTokenExpiresAt: new Date(Date.now() - 1) }).where(eq(users.email, email));
      await expect(resetDemoPassword(expiredToken!, replacementPassword)).resolves.toBe(false);

      const validToken = await requestDemoPasswordReset(email);
      expect(validToken).toBeTruthy();
      await expect(resetDemoPassword(validToken!, replacementPassword)).resolves.toBe(true);
      await expect(authenticateDemoCredentials(email, replacementPassword)).resolves.toMatchObject({ role: "finance", isDemo: true });
    } finally {
      const restoreToken = await requestDemoPasswordReset(email);
      if (restoreToken) await resetDemoPassword(restoreToken, defaultPassword);
    }

    await expect(authenticateDemoCredentials(email, defaultPassword)).resolves.toMatchObject({ role: "finance", isDemo: true });
  }, 30_000);
});

import { chromium } from "playwright-core";
import { describe, expect, it } from "vitest";

const runBrowserJourney = process.env.RUN_BROWSER_TESTS === "1" ? it : it.skip;
const baseUrl = process.env.WORKFORCE_HUB_URL ?? "http://localhost:3000";

async function completeRecoveryJourney(page: import("playwright-core").Page, suffix: "desktop" | "mobile") {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByText("Consultant", { exact: true }).first().click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Reset email").fill("consultant@demo.vertonsolutions.com");
  await page.getByRole("button", { name: "Generate demo reset code" }).click();
  await page.getByLabel("New demo password").fill("VertonDemo!2026");
  await page.getByLabel("Confirm demo password").fill("VertonDemo!2026");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect.poll(() => page.getByText(/Password reset successfully/).count()).toBe(1);
  await page.screenshot({ path: `/home/ubuntu/auth-journey-reset-success-${suffix}.png`, fullPage: true });

  await page.getByText("Consultant", { exact: true }).first().click();
  await page.getByRole("button", { name: /Open assigned workspace/ }).click();
  await page.waitForURL(`${baseUrl}/workspace`);
  await expect.poll(() => page.getByText("Consultant workspace").count()).toBe(1);
  await expect.poll(() => page.getByText("Readiness", { exact: true }).count()).toBe(0);
  await page.screenshot({ path: `/home/ubuntu/auth-journey-workspace-${suffix}.png`, fullPage: true });
}

describe("real browser demo authentication journey", () => {
  runBrowserJourney("recovers the consultant demo password and enters the assigned workspace", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

    try {
      await completeRecoveryJourney(await browser.newPage({ viewport: { width: 1280, height: 900 } }), "desktop");
      await completeRecoveryJourney(await browser.newPage({ viewport: { width: 390, height: 844 } }), "mobile");
    } finally {
      await browser.close();
    }
  }, 45_000);
});

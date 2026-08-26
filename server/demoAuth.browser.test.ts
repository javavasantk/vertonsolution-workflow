import { chromium } from "playwright-core";
import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";

const runBrowserJourney = process.env.RUN_BROWSER_TESTS === "1" ? it : it.skip;
const baseUrl = process.env.WORKFORCE_HUB_URL ?? "http://localhost:3000";

async function completeRecoveryJourney(page: import("playwright-core").Page, suffix: "desktop" | "mobile") {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Reset email").fill("consultant@demo.vertonsolutions.com");
  await page.getByRole("button", { name: "Generate reset code" }).click();
  await page.getByLabel("New password").fill("VertonDemo!2026");
  await page.getByLabel("Confirm password").fill("VertonDemo!2026");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect.poll(() => page.getByText(/Password reset successfully/).count()).toBe(1);
  await page.screenshot({ path: `/home/ubuntu/auth-journey-reset-success-${suffix}.png`, fullPage: true });

  await page.getByLabel("Email address").fill("consultant@demo.vertonsolutions.com");
  await page.getByLabel("Password").fill("VertonDemo!2026");
  await page.getByRole("button", { name: /Enter Workforce Hub/ }).click();
  await page.waitForURL(`${baseUrl}/workspace`);
  await expect.poll(() => page.getByText("Consultant workspace").count()).toBe(1);
  await expect.poll(() => page.getByText("Readiness", { exact: true }).count()).toBe(0);
  await page.screenshot({ path: `/home/ubuntu/auth-journey-workspace-${suffix}.png`, fullPage: true });
}

function signedUploadResumeFixture() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(12);
  doc.text([
    "Alex Morgan", "alex.morgan@example.com | Austin, TX | 555-0100", "Full-stack engineer with six years of TypeScript, React, AWS, and cloud delivery experience.", "Skills: TypeScript, React, Node.js, AWS, PostgreSQL", "Experience: Software Engineer — Northstar Digital — 2020 to Present", "Education: B.S. Computer Science — University of Texas",
  ], 48, 72, { maxWidth: 500, lineHeightFactor: 1.55 });
  return Buffer.from(doc.output("arraybuffer"));
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

  runBrowserJourney("opens the signed-upload recruiter workflow only after credential authentication", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

    try {
      for (const [suffix, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
        await page.getByLabel("Email address").fill("recruiter@demo.vertonsolutions.com");
        await page.getByLabel("Password").fill("VertonDemo!2026");
        await page.getByRole("button", { name: /Enter Workforce Hub/ }).click();
        await page.waitForURL(`${baseUrl}/workspace`);
        await page.goto(`${baseUrl}/workspace/recruiting`, { waitUntil: "networkidle" });
        await expect.poll(() => page.getByText("AI resume parser").count()).toBe(1);
        await expect.poll(() => page.getByText("Recruiter workspace").count()).toBeGreaterThan(0);
        await expect.poll(() => page.getByLabel("Resume file upload").count()).toBe(1);
        await expect.poll(() => page.getByLabel("Search candidates").count()).toBe(1);
        await expect.poll(() => page.getByLabel("Filter by skill").count()).toBe(1);
        await page.getByLabel("Resume file upload").setInputFiles({ name: "alex-morgan.pdf", mimeType: "application/pdf", buffer: signedUploadResumeFixture() });
        await page.getByRole("button", { name: /Upload & parse resume/ }).click();
        await expect.poll(() => page.getByText(/Parsed profile will appear here/).count(), { timeout: 50_000 }).toBe(0);
        await expect.poll(() => page.getByRole("button", { name: "CSV" }).count(), { timeout: 50_000 }).toBe(1);
        await expect.poll(() => page.getByRole("button", { name: "PDF" }).count(), { timeout: 50_000 }).toBe(1);
        await page.screenshot({ path: `/home/ubuntu/signed-upload-recruiter-workflow-${suffix}.png`, fullPage: true });
      }
    } finally {
      await browser.close();
    }
  }, 120_000);

  runBrowserJourney("opens the role-aware bottom-right assistant only after authentication", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    try {
      for (const [suffix, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
        await expect.poll(() => page.getByRole("button", { name: "Open AI assistant" }).count()).toBe(0);
        await page.getByLabel("Email address").fill("consultant@demo.vertonsolutions.com");
        await page.getByLabel("Password").fill("VertonDemo!2026");
        await page.getByRole("button", { name: /Enter Workforce Hub/ }).click();
        await page.waitForURL(`${baseUrl}/workspace`);
        await page.getByRole("button", { name: "Open AI assistant" }).click();
        await expect.poll(() => page.getByText("Workforce Hub assistant").count()).toBe(1);
        await page.screenshot({ path: `/home/ubuntu/workspace-assistant-${suffix}.png`, fullPage: true });
      }
    } finally {
      await browser.close();
    }
  }, 45_000);

  runBrowserJourney("renders seeded database-backed overview, delivery, and time-billing records with role-scoped masking", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    try {
      for (const [suffix, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
        await page.getByLabel("Email address").fill("consultant@demo.vertonsolutions.com");
        await page.getByLabel("Password").fill("VertonDemo!2026");
        await page.getByRole("button", { name: /Enter Workforce Hub/ }).click();
        await page.waitForURL(`${baseUrl}/workspace`);
        await expect.poll(() => page.getByText(/MySQL-compatible TiDB via Drizzle ORM/).count()).toBe(1);
        await page.screenshot({ path: `/home/ubuntu/database-overview-${suffix}.png`, fullPage: true });
        if (viewport.width < 640) {
          await page.getByRole("button", { name: "Open navigation" }).click();
          await page.getByRole("button", { name: "Delivery" }).last().click();
        } else {
          await page.getByRole("button", { name: "Delivery" }).first().click();
        }
        await expect.poll(() => page.getByText("Protected database-backed staffing demand, assignment, and capacity records.").count()).toBe(1);
        await page.screenshot({ path: `/home/ubuntu/database-delivery-${suffix}.png`, fullPage: true });
        if (viewport.width < 640) {
          await page.getByRole("button", { name: "Open navigation" }).click();
          await page.getByRole("button", { name: "Time & billing" }).last().click();
        } else {
          await page.getByRole("button", { name: "Time & billing" }).first().click();
        }
        await expect.poll(() => page.getByText("Database-backed timesheet entries").count()).toBe(1);
        await expect.poll(() => page.getByText("••••••").count()).toBeGreaterThan(0);
        await page.screenshot({ path: `/home/ubuntu/database-time-billing-${suffix}.png`, fullPage: true });
      }
    } finally {
      await browser.close();
    }
  }, 45_000);
});

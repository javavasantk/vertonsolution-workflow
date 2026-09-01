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

  await page.goto(`${baseUrl}/workspace/my-work`, { waitUntil: "networkidle" });
  await expect.poll(() => page.getByRole("heading", { name: "My work" }).count()).toBe(1);
  await expect.poll(() => page.getByText("Own-record view").count()).toBe(1);
  await expect.poll(() => page.getByText(/does not expose colleague records, client documents, restricted readiness content/i).count()).toBe(1);
  await page.screenshot({ path: `/home/ubuntu/consultant-my-work-${suffix}.png`, fullPage: true });

  await page.goto(`${baseUrl}/workspace/my-activity`, { waitUntil: "networkidle" });
  await expect.poll(() => page.getByRole("heading", { name: "My activity" }).count()).toBe(1);
  await expect.poll(() => page.getByText(/factual history of your own workflow events/i).count()).toBe(1);
  await expect.poll(() => page.getByText(/excludes colleague activity, task content, reviewer identity, document content, storage keys/i).count()).toBe(1);
  await expect.poll(() => page.getByText("Northstar Retail · Demo", { exact: true }).count()).toBe(0);
  await page.screenshot({ path: `/home/ubuntu/consultant-my-activity-${suffix}.png`, fullPage: true });

  await page.goto(`${baseUrl}/workspace/my-engagement`, { waitUntil: "networkidle" });
  await expect.poll(() => page.getByRole("heading", { name: "Current assignment" }).count()).toBe(1);
  await expect.poll(() => page.getByText("Source: assignment record").count()).toBe(1);
  await expect.poll(() => page.getByText(/No time entry, approval, invoice, payroll, payment, or commercial action is available/i).count()).toBe(1);
  await page.screenshot({ path: `/home/ubuntu/consultant-my-engagement-${suffix}.png`, fullPage: true });

  await page.goto(`${baseUrl}/workspace/onboarding`, { waitUntil: "networkidle" });
  await expect.poll(() => page.getByRole("heading", { name: "Your assigned tasks" }).count()).toBe(1);
  await expect.poll(() => page.getByText("Protected personal tasks").count()).toBe(1);
  await expect.poll(() => page.getByText(/acknowledgement records that you have seen a task/i).count()).toBe(1);
    await expect.poll(() => page.getByRole("button", { name: "Send reminder" }).count()).toBe(0);
    await page.screenshot({ path: `/home/ubuntu/consultant-onboarding-tasks-${suffix}.png`, fullPage: true });

    await page.goto(`${baseUrl}/workspace/check-ins`, { waitUntil: "networkidle" });
    await expect.poll(() => page.getByRole("heading", { name: "Consultant check-ins" }).count()).toBe(1);
    await expect.poll(() => page.getByText("Human follow-up owner").count()).toBe(1);
    await expect.poll(() => page.getByText(/does not automatically route, notify, or decide anything/i).count()).toBe(1);
    await page.screenshot({ path: `/home/ubuntu/consultant-check-ins-${suffix}.png`, fullPage: true });

    await page.goto(`${baseUrl}/workspace/time-submission`, { waitUntil: "networkidle" });
    await expect.poll(() => page.getByRole("heading", { name: "Your time entries" }).count()).toBe(1);
    await expect.poll(() => page.getByText("Selected-period work hours").count()).toBe(1);
    await expect.poll(() => page.getByLabel("Time total period start").count()).toBe(1);
    await expect.poll(() => page.getByLabel("Time total period end").count()).toBe(1);
    await expect.poll(() => page.getByText("Total entered work hours").count()).toBe(1);
    await expect.poll(() => page.getByText(/cannot approve time, calculate payroll, create an invoice, issue payment, or connect to accounting/i).count()).toBe(1);
    await expect.poll(() => page.getByText("Client-approved timesheet evidence").count()).toBeGreaterThan(0);
    await expect.poll(() => page.getByLabel("Timesheet evidence upload").count()).toBe(1);
    await expect.poll(() => page.getByText(/The OCR result is an extraction aid only/i).count()).toBe(1);
    await expect.poll(() => page.getByText(/documents are private and are not stored in the database/i).count()).toBe(1);
    await page.screenshot({ path: `/home/ubuntu/consultant-time-submission-${suffix}.png`, fullPage: true });

    await page.goto(`${baseUrl}/workspace/time-reconciliation`, { waitUntil: "networkidle" });
    await expect.poll(() => page.getByRole("heading", { name: "Time reconciliation" }).count()).toBe(1);
    await expect.poll(() => page.getByLabel("Reconciliation period start").count()).toBe(1);
    await expect.poll(() => page.getByLabel("Reconciliation period end").count()).toBe(1);
    await expect.poll(() => page.getByLabel("Reconciliation status filter").count()).toBe(1);
    await expect.poll(() => page.getByText(/factual sum only/i).count()).toBe(1);
    await expect.poll(() => page.getByText(/never changes a time-entry, review, approval, or financial state/i).count()).toBe(1);
    await expect.poll(() => page.getByText(/billable amount|invoice|margin|utilization/i).count()).toBe(0);
    await page.screenshot({ path: `/home/ubuntu/consultant-time-reconciliation-${suffix}.png`, fullPage: true });

    await page.goto(`${baseUrl}/workspace/action-inbox`, { waitUntil: "networkidle" });
    await expect.poll(() => page.getByRole("heading", { name: "Action Inbox" }).count()).toBe(1);
    await expect.poll(() => page.getByText("Your active reminders").count()).toBe(1);
    await expect.poll(() => page.getByText(/Source:/).count()).toBeGreaterThan(0);
    await expect.poll(() => page.getByText(/does not send external messages or make decisions/i).count()).toBe(1);
    await expect.poll(() => page.getByText("Northstar Retail · Demo", { exact: true }).count()).toBe(0);
    await page.screenshot({ path: `/home/ubuntu/consultant-action-inbox-${suffix}.png`, fullPage: true });
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

  runBrowserJourney("opens only a Consultant's private timesheet source through the no-store attachment handoff", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    try {
      for (const [suffix, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
        await page.getByLabel("Email address").fill("consultant@demo.vertonsolutions.com");
        await page.getByLabel("Password").fill("VertonDemo!2026");
        await page.getByRole("button", { name: /Enter Workforce Hub/ }).click();
        await page.waitForURL(`${baseUrl}/workspace`);
        await page.goto(`${baseUrl}/workspace/time-submission`, { waitUntil: "networkidle" });
        await expect.poll(() => page.getByLabel("Timesheet evidence entry").count()).toBe(1);
        await page.getByLabel("Timesheet evidence entry").selectOption({ index: 1 });
        await page.getByLabel("Timesheet evidence upload").setInputFiles({ name: `consultant-private-source-${suffix}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nprivate consultant source\n%%EOF") });
        await page.getByLabel("Confirm client-approved timesheet").check();
        await page.getByRole("button", { name: "Upload & extract total hours" }).click();
        await expect.poll(() => page.getByRole("link", { name: /Open your private source/ }).count(), { timeout: 60_000 }).toBeGreaterThan(0);
        const privateSource = page.getByRole("link", { name: /Open your private source/ }).last();
        expect(await privateSource.isVisible()).toBe(true);
        const [download] = await Promise.all([page.waitForEvent("download"), privateSource.press("Enter")]);
        expect(download.suggestedFilename()).toMatch(/consultant-private-source-(desktop|mobile)\.pdf/);
        await expect.poll(() => page.getByText(/storage locations|presigned links|file digests/i).count()).toBeGreaterThan(0);
        await page.screenshot({ path: `/home/ubuntu/consultant-private-timesheet-source-${suffix}.png`, fullPage: true });
      }
    } finally {
      await browser.close();
    }
  }, 150_000);

  runBrowserJourney("opens the signed-upload recruiter workflow only after credential authentication", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

    try {
      for (const [suffix, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
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

  runBrowserJourney("queries recruiter-visible candidates and saves an inline candidate edit through protected workspace controls", async () => {
    const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
      await page.getByLabel("Email address").fill("recruiter@demo.vertonsolutions.com");
      await page.getByLabel("Password").fill("VertonDemo!2026");
      await page.getByRole("button", { name: /Enter Workforce Hub/ }).click();
      await page.waitForURL(`${baseUrl}/workspace`);
      await page.goto(`${baseUrl}/workspace/recruiting`, { waitUntil: "networkidle" });
      await expect.poll(() => page.getByRole("button", { name: /Edit Alex Morgan/ }).count(), { timeout: 20_000 }).toBeGreaterThan(0);
      await page.getByRole("button", { name: /Edit Alex Morgan/ }).first().click();
      await page.getByLabel("Edit candidate location").first().fill("Austin, TX");
      await page.getByRole("button", { name: "Save candidate edit" }).first().click();
      await page.getByRole("button", { name: "Open AI assistant" }).click();
      await page.getByPlaceholder("Ask about this workspace…").fill("Find candidate profiles with TypeScript skills");
      await page.getByPlaceholder("Ask about this workspace…").press("Enter");
      await expect.poll(() => page.getByText(/Database matches \(candidate\)/).count(), { timeout: 50_000 }).toBeGreaterThan(0);
      await page.screenshot({ path: "/home/ubuntu/database-aware-assistant-inline-edit.png", fullPage: true });

      const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await mobilePage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
      await mobilePage.getByLabel("Email address").fill("recruiter@demo.vertonsolutions.com");
      await mobilePage.getByLabel("Password").fill("VertonDemo!2026");
      await mobilePage.getByRole("button", { name: /Enter Workforce Hub/ }).click();
      await mobilePage.waitForURL(`${baseUrl}/workspace`);
      await mobilePage.getByRole("button", { name: "Open navigation" }).click();
      await mobilePage.getByRole("button", { name: "Talent pipeline" }).last().click();
      await expect.poll(() => mobilePage.getByRole("button", { name: /Open candidate profile/ }).count(), { timeout: 20_000 }).toBeGreaterThan(0);
      await mobilePage.getByRole("button", { name: /Open candidate profile/ }).first().click();
      await mobilePage.waitForURL(/\/workspace\/talent\/\d+$/);
      await mobilePage.screenshot({ path: "/home/ubuntu/protected-candidate-detail-mobile-diagnostic.png", fullPage: true });
      await expect.poll(() => mobilePage.getByText("Recruiter-visible candidate profile for human review.").count(), { timeout: 20_000 }).toBe(1);
      await mobilePage.screenshot({ path: "/home/ubuntu/protected-candidate-detail-mobile.png", fullPage: true });
    } finally {
      await browser.close();
    }
  }, 75_000);

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
        if (viewport.width < 640) {
          const mobileDashboardLogo = page.locator('header a[aria-label="Verton Solution Inc. Workforce Hub dashboard"]');
          expect(await mobileDashboardLogo.count()).toBe(1);
          expect(await mobileDashboardLogo.getAttribute("href")).toBe("/workspace");
        }
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
        await expect.poll(() => page.getByText("Time & billing readiness").count()).toBe(1);
        await expect.poll(() => page.getByText("••••••").count()).toBeGreaterThan(0);
        await page.screenshot({ path: `/home/ubuntu/database-time-billing-${suffix}.png`, fullPage: true });
      }
    } finally {
      await browser.close();
    }
  }, 45_000);
});

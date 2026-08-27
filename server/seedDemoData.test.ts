import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("internal demonstration data seed contract", () => {
  it("uses stable demo keys and idempotent upserts for all protected lifecycle record domains", async () => {
    const seed = await readFile(new URL("../scripts/seed-demo-data.mjs", import.meta.url), "utf8");
    expect(seed).toContain("ON DUPLICATE KEY UPDATE");
    for (const table of ["client_accounts", "client_projects", "staffing_demands", "consultant_assignments", "timesheet_entries", "operational_activities"]) {
      expect(seed).toContain(`\"${table}\"`);
      expect(seed).toContain("demoKey");
    }
    expect(seed).toContain("· Demo");
    expect(seed).not.toMatch(/real candidate document|confidential client/i);
    expect(seed).not.toMatch(/customer review|testimonial|rating/i);
  });
});

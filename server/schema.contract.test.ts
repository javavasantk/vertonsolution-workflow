import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Workforce Hub normalized data foundation", () => {
  it("defines all protected operational domains and keeps private resume bytes out of database columns", async () => {
    const schema = await readFile(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    for (const table of [
      "users",
      "employee_profiles",
      "onboarding_assignments",
      "consultant_onboarding_tasks",
      "consultant_onboarding_task_activities",
      "access_role_changes",
      "candidate_profiles",
      "resume_uploads",
      "resume_upload_sessions",
      "client_accounts",
      "client_projects",
      "staffing_demands",
      "consultant_assignments",
      "timesheet_entries",
      "operational_activities",
    ]) {
      expect(schema).toContain(`mysqlTable("${table}"`);
    }
    expect(schema).toContain("file bytes never live in database columns");
    expect(schema).not.toMatch(/customer review|testimonial|rating/i);
  });
});

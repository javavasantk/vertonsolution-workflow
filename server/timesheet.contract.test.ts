import { describe, expect, it } from "vitest";
import { timesheetEntries } from "../drizzle/schema";
import { appRouter } from "./routers";

describe("timesheet billing-readiness contract", () => {
  it("limits persisted timesheet workflow values to the approved billing-readiness states", () => {
    expect(timesheetEntries.status.enumValues).toEqual(["draft", "submitted", "approved", "exception"]);
  });

  it("does not expose a timesheet approval, invoice, payroll, or payment mutation", () => {
    const portalProcedures = Object.keys(appRouter._def.procedures);
    expect(portalProcedures).not.toContain("portal.approveTimesheet");
    expect(portalProcedures).not.toContain("portal.createInvoice");
    expect(portalProcedures).not.toContain("portal.runPayroll");
    expect(portalProcedures).not.toContain("portal.createPayment");
  });
});

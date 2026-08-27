import { describe, expect, it } from "vitest";
import { timesheetEntries } from "../drizzle/schema";

describe("timesheet billing-readiness contract", () => {
  it("limits persisted timesheet workflow values to the approved billing-readiness states", () => {
    expect(timesheetEntries.status.enumValues).toEqual(["draft", "submitted", "approved", "exception"]);
  });
});

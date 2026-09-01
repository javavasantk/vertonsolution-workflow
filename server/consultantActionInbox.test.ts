import { describe, expect, it } from "vitest";
import { deduplicateConsultantActionInboxItems, getConsultantActionInboxAgingLabel, type ConsultantActionInboxItem } from "./db";

const item = (dedupKey: string, updatedAt: Date | null): ConsultantActionInboxItem => ({ dedupKey, source: "time_entry", title: "Draft time entry is ready for your review", status: "action_needed", designatedHumanOwner: "Designated time reviewer", destination: "/workspace/time-submission", updatedAt, agingLabel: "Updated today", state: "unread", dismissedAt: null, restoredAt: null, stateUpdatedAt: null });

describe("Consultant Action Inbox recovery helpers", () => {
  it("deduplicates by stable derived key and orders only by source update timestamp", () => {
    const result = deduplicateConsultantActionInboxItems([item("time-entry:72:draft", new Date("2026-08-25")), item("time-entry:72:draft", new Date("2026-08-26")), item("onboarding-task:41:pending", new Date("2026-08-27"))]);
    expect(result.map(row => row.dedupKey)).toEqual(["onboarding-task:41:pending", "time-entry:72:draft"]);
    expect(result).toHaveLength(2);
  });

  it("derives neutral aging solely from the existing source update time", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    expect(getConsultantActionInboxAgingLabel(new Date("2026-09-01T01:00:00.000Z"), now)).toBe("Updated today");
    expect(getConsultantActionInboxAgingLabel(new Date("2026-08-28T12:00:00.000Z"), now)).toBe("Updated this week");
    expect(getConsultantActionInboxAgingLabel(new Date("2026-08-24T11:59:59.000Z"), now)).toBe("Older than seven days");
    expect(getConsultantActionInboxAgingLabel(null, now)).toBe("Update date unavailable");
  });
});

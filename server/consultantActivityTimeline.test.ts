import { describe, expect, it } from "vitest";
import { paginateConsultantPersonalActivityEvents, type ConsultantPersonalTimelineEvent } from "./db";

function event(overrides: Partial<ConsultantPersonalTimelineEvent> & Pick<ConsultantPersonalTimelineEvent, "eventId">): ConsultantPersonalTimelineEvent {
  return {
    eventType: "check_in_submitted",
    source: "check_in",
    summary: "You recorded a factual check-in.",
    occurredAt: new Date("2026-09-01T10:00:00.000Z"),
    destination: "/workspace/check-ins",
    ...overrides,
  };
}

describe("Consultant Personal Activity Timeline pagination", () => {
  it("deduplicates event identifiers, sorts deterministically newest first, and exposes only safe projected fields", () => {
    const events = [
      event({ eventId: "time-entry-7-submitted", eventType: "time_entry_submitted", source: "time_submission", summary: "You submitted a time entry for designated human review.", occurredAt: new Date("2026-09-01T12:00:00.000Z"), destination: "/workspace/time-submission" }),
      event({ eventId: "task-7-acknowledged", eventType: "onboarding_task_acknowledged", source: "onboarding", summary: "You acknowledged an onboarding task.", occurredAt: new Date("2026-09-01T12:00:00.000Z"), destination: "/workspace/onboarding" }),
      event({ eventId: "check-in-5", occurredAt: new Date("2026-08-31T12:00:00.000Z") }),
      event({ eventId: "check-in-5", summary: "A duplicate row must not be shown.", occurredAt: new Date("2026-08-30T12:00:00.000Z") }),
    ];

    const first = paginateConsultantPersonalActivityEvents(events, { limit: 2 });
    const repeated = paginateConsultantPersonalActivityEvents(events, { limit: 2 });

    expect(first).toEqual(repeated);
    expect(first.items).toHaveLength(2);
    expect(first.items.map(item => item.summary)).toContain("You submitted a time entry for designated human review.");
    expect(first.nextCursor).toBeTruthy();
    expect(Object.keys(first.items[0] ?? {}).sort()).toEqual(["cursor", "destination", "eventType", "occurredAt", "source", "summary"]);
    expect(JSON.stringify(first)).not.toContain("time-entry-7-submitted");
    expect(JSON.stringify(first)).not.toContain("A duplicate row must not be shown.");
  });

  it("uses a stable opaque cursor to return the next non-overlapping page and respects bounded page sizes", () => {
    const events = [
      event({ eventId: "newest", occurredAt: new Date("2026-09-03T10:00:00.000Z") }),
      event({ eventId: "middle", occurredAt: new Date("2026-09-02T10:00:00.000Z") }),
      event({ eventId: "oldest", occurredAt: new Date("2026-09-01T10:00:00.000Z") }),
    ];

    const first = paginateConsultantPersonalActivityEvents(events, { limit: 2 });
    const second = paginateConsultantPersonalActivityEvents(events, { cursor: first.nextCursor ?? undefined, limit: 2 });
    const limited = paginateConsultantPersonalActivityEvents(events, { limit: 999 });

    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(1);
    expect(new Set([...first.items, ...second.items].map(item => item.cursor)).size).toBe(3);
    expect(second.nextCursor).toBeNull();
    expect(limited.items).toHaveLength(3);
    expect(() => paginateConsultantPersonalActivityEvents(events, { cursor: "not-a-valid-timeline-cursor" })).toThrow("Timeline cursor is invalid");
  });
});

import { describe, expect, it } from "vitest";
import {
  AnalyticsService,
  AnalyticsValidationError,
} from "../src/analytics/analytics.service";

const accountId = "11111111-1111-4111-8111-111111111111";

describe("AnalyticsService", () => {
  it("does not collect product analytics without explicit consent", () => {
    const service = new AnalyticsService();
    expect(
      service.recordIfAllowed(accountId, {
        name: "assistant_draft_requested",
        properties: { capability: "TASK_EXTRACTION", outcome: "success" },
      })
    ).toBe(false);
  });

  it("allows only documented allow-list properties after consent", () => {
    const service = new AnalyticsService();
    service.setConsent({
      accountId,
      state: "GRANTED",
      noticeVersion: "analytics-v1",
      recordedAt: new Date(),
    });

    expect(
      service.recordIfAllowed(accountId, {
        name: "assistant_draft_reviewed",
        properties: { capability: "TASK_BREAKDOWN", outcome: "rejected" },
      })
    ).toBe(true);
  });

  it("rejects unapproved and content-like properties even after consent", () => {
    const service = new AnalyticsService();
    service.setConsent({
      accountId,
      state: "GRANTED",
      noticeVersion: "analytics-v1",
      recordedAt: new Date(),
    });

    expect(() =>
      service.recordIfAllowed(accountId, {
        name: "assistant_draft_requested",
        properties: { taskTitle: "private assignment text" },
      })
    ).toThrow(AnalyticsValidationError);
  });
});

import { describe, expect, it } from "vitest";
import { detectConsultantAssistantLookupIntent } from "./db";

describe("Consultant assistant lookup intent detection", () => {
  it.each([
    ["Show my onboarding tasks", "consultant_onboarding"],
    ["What are my submitted time records?", "consultant_time_records"],
    ["How many hours are in my selected period?", "consultant_period_hours"],
    ["What is my current engagement assignment?", "consultant_engagement"],
    ["Show my Action Inbox reminders", "consultant_action_inbox"],
    ["What is my profile request status?", "consultant_profile_request"],
  ] as const)("detects %s as %s", (prompt, expected) => {
    expect(detectConsultantAssistantLookupIntent(prompt)).toBe(expected);
  });

  it("keeps unrelated and restricted questions outside the own-record lookup surface", () => {
    expect(detectConsultantAssistantLookupIntent("Find a candidate with Java skills")).toBe("none");
    expect(detectConsultantAssistantLookupIntent("What is another consultant's pay rate?")).toBe("none");
    expect(detectConsultantAssistantLookupIntent("Send a message to my client")).toBe("none");
  });
});

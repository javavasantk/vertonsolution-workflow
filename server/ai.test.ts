import { describe, expect, it, vi } from "vitest";
import { generateAiBriefing } from "./aiService";

function providerResponse(briefing: string) {
  return {
    id: "ai-test-response",
    created: 0,
    model: "claude-haiku-4-5",
    choices: [{ index: 0, message: { role: "assistant" as const, content: briefing }, finish_reason: "stop" }],
  };
}

describe("ai.assist", () => {
  it("returns a recruiter handoff briefing for a recruiter with bounded context", async () => {
    const callModel = vi.fn().mockResolvedValue(providerResponse("Summary\nHuman follow-up\nBoundary"));

    const result = await generateAiBriefing("recruiter_summary", "Two onboarding handoffs await a manager confirmation and an assignment follow-up.", callModel);

    expect(result.briefing).toContain("Human follow-up");
    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ model: "claude-haiku-4-5", maxTokens: 500 }));
  });

  it("returns an onboarding guidance briefing for a consultant", async () => {
    const callModel = vi.fn().mockResolvedValue(providerResponse("Summary\nHuman follow-up\nBoundary"));

    await expect(generateAiBriefing("onboarding_guidance", "The employee has completed two onboarding tasks and needs a manager confirmation.", callModel)).resolves.toMatchObject({ task: "onboarding_guidance", model: "claude-haiku-4-5" });
  });

  it("returns an access review briefing for an administrator", async () => {
    const callModel = vi.fn().mockResolvedValue(providerResponse("Summary\nHuman follow-up\nBoundary"));

    await expect(generateAiBriefing("access_review", "One administrator account and no role-change events are currently recorded.", callModel)).resolves.toMatchObject({ task: "access_review" });
  });

  it("returns a safe human-review fallback when the managed model is unavailable", async () => {
    const callModel = vi.fn().mockImplementation(async () => {
      throw new Error("provider unavailable");
    });

    await expect(generateAiBriefing("access_review", "One administrator account and no role-change events are currently recorded.", callModel)).resolves.toMatchObject({ unavailable: true, model: "unavailable" });
  });
});

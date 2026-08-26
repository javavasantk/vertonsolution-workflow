import { describe, expect, it } from "vitest";
import { parseRecruiterResume } from "./resumeParserService";

const parsedProfile = {
  candidateName: "Alex Morgan",
  email: "alex@example.com",
  phone: "555-0100",
  location: "Austin, TX",
  professionalSummary: "Full-stack engineer with cloud delivery experience.",
  yearsExperience: "6 years",
  skills: ["TypeScript", "React"],
  recentRoles: [{ title: "Software Engineer", company: "Northstar", period: "2022-present" }],
  education: ["B.S. Computer Science"],
  recruiterNotes: ["Confirm project availability with the candidate."],
  confidence: "high",
};

describe("parseRecruiterResume", () => {
  it("returns strictly structured recruiter-visible resume details", async () => {
    const result = await parseRecruiterResume("Alex Morgan resume content that is longer than the minimum validation threshold.", async () => ({
      model: "test-model",
      choices: [{ message: { content: JSON.stringify(parsedProfile) } }],
    }) as any);

    expect(result).toMatchObject({ model: "test-model", unavailable: false, profile: { candidateName: "Alex Morgan", skills: ["TypeScript", "React"] } });
  });

  it("returns a human-review fallback when structured extraction is unavailable", async () => {
    const result = await parseRecruiterResume("Alex Morgan resume content that is longer than the minimum validation threshold.", async () => {
      throw new Error("provider unavailable");
    });

    expect(result).toMatchObject({ model: "unavailable", unavailable: true, profile: { confidence: "low" } });
    expect(result.profile.recruiterNotes.join(" ")).toMatch(/No automated candidate decision/);
  });
});

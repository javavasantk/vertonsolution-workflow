import { describe, expect, it } from "vitest";

describe("Resend password-reset delivery configuration", () => {
  it("accepts the configured server-side API key without exposing it", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESET_EMAIL_FROM;
    expect(apiKey).toBeTruthy();
    expect(from).toBeTruthy();

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    // A restricted send-only key can return 403 for domain listing, but 401 means
    // the supplied credential is malformed or invalid.
    expect(response.status).not.toBe(401);
    expect(response.status).toBeLessThan(500);
  }, 20_000);
});

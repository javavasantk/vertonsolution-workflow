import { describe, expect, it } from "vitest";

/**
 * The authorization-code endpoint returns `invalid_grant` when client
 * credentials are accepted but the deliberately fake code is rejected. It
 * returns `invalid_client` / HTTP 401 when the client ID/secret is wrong.
 * No user account information or tokens are requested or persisted.
 */
describe("Google OAuth credential configuration", () => {
  it("accepts the configured client credentials at Google's token endpoint", async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    expect(clientId, "GOOGLE_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "GOOGLE_CLIENT_SECRET must be configured").toBeTruthy();

    const body = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code: "polaris-credential-validation-probe",
      grant_type: "authorization_code",
      redirect_uri: "http://localhost/polaris-validation-probe",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = (await response.json()) as { error?: string };

    // Valid configured clients reject only the fake authorization code.
    expect(response.status).not.toBe(401);
    expect(payload.error).toBe("invalid_grant");
  }, 15_000);
});

import { describe, expect, it } from "vitest";
import { PrivacyService } from "../src/privacy/privacy.service";

const accountId = "11111111-1111-4111-8111-111111111111";

describe("PrivacyService", () => {
  it("describes a guest workspace without implying cloud data exists", () => {
    const service = new PrivacyService();
    expect(service.dashboard()).toMatchObject({
      accountMode: "GUEST",
      aiDataUse: "OFF_UNTIL_CONSENTED",
      productAnalytics: "NOT_ASKED",
    });
  });

  it("creates tenant-scoped export and deletion requests with separate local-data choice", () => {
    const service = new PrivacyService();
    const exportRequest = service.requestExport(accountId);
    const deletionRequest = service.requestDeletion(accountId);

    expect(exportRequest.accountId).toBe(accountId);
    expect(exportRequest.state).toBe("REQUESTED");
    expect(deletionRequest.accountId).toBe(accountId);
    expect(deletionRequest.localDataIsSeparate).toBe(true);
    expect(service.dashboard(accountId).latestExport?.state).toBe("REQUESTED");
    expect(
      service.dashboard(accountId).latestDeletion?.localDataIsSeparate
    ).toBe(true);
  });
});

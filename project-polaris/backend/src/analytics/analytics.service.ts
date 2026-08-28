import { Injectable } from "@nestjs/common";

export type AnalyticsConsentState =
  "NOT_ASKED" | "DECLINED" | "GRANTED" | "WITHDRAWN";

export interface AnalyticsConsent {
  readonly accountId: string;
  readonly state: AnalyticsConsentState;
  readonly noticeVersion: string;
  readonly recordedAt: Date;
}

export interface AnalyticsEvent {
  readonly name:
    | "onboarding_completed"
    | "language_selected"
    | "assistant_consent_changed"
    | "assistant_draft_requested"
    | "assistant_draft_reviewed"
    | "privacy_control_opened"
    | "export_request_state_changed"
    | "sync_status_observed";
  readonly properties: Readonly<Record<string, string | number | boolean>>;
}

const eventProperties: Readonly<
  Record<AnalyticsEvent["name"], readonly string[]>
> = {
  onboarding_completed: ["appVersion", "locale"],
  language_selected: ["locale", "selectionSource"],
  assistant_consent_changed: ["decision", "noticeVersion", "capability"],
  assistant_draft_requested: [
    "capability",
    "outcome",
    "latencyBucket",
    "appVersion",
  ],
  assistant_draft_reviewed: ["capability", "outcome"],
  privacy_control_opened: ["control"],
  export_request_state_changed: ["state"],
  sync_status_observed: ["state"],
};

const forbiddenPropertyFragments = [
  "task",
  "note",
  "course",
  "text",
  "content",
  "prompt",
  "output",
  "token",
  "email",
  "phone",
  "address",
  "deadline",
  "availability",
  "device",
  "identifier",
  "export",
  "url",
  "accountid",
];

export class AnalyticsValidationError extends Error {}

@Injectable()
export class AnalyticsService {
  private readonly consentByAccount = new Map<string, AnalyticsConsent>();

  public setConsent(consent: AnalyticsConsent): void {
    this.consentByAccount.set(consent.accountId, consent);
  }

  public canCollect(accountId: string): boolean {
    return this.consentByAccount.get(accountId)?.state === "GRANTED";
  }

  public validateEvent(event: AnalyticsEvent): void {
    const allowed = eventProperties[event.name];
    for (const property of Object.keys(event.properties)) {
      if (!allowed.includes(property)) {
        throw new AnalyticsValidationError("Unknown analytics property.");
      }
      if (
        forbiddenPropertyFragments.some(fragment =>
          property.toLowerCase().includes(fragment)
        )
      ) {
        throw new AnalyticsValidationError(
          "A sensitive analytics property was rejected."
        );
      }
    }
  }

  /**
   * This foundation validates but deliberately does not forward product events.
   * A production sink needs separate consent, vendor, retention, and review approval.
   */
  public recordIfAllowed(accountId: string, event: AnalyticsEvent): boolean {
    if (!this.canCollect(accountId)) return false;
    this.validateEvent(event);
    return true;
  }
}

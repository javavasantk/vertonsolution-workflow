import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

export type ExportState =
  | "REQUESTED"
  | "GENERATING"
  | "READY"
  | "EXPIRED"
  | "FAILED_RETRYABLE"
  | "FAILED_NEEDS_SUPPORT";

export type DeletionState =
  | "REQUESTED"
  | "CONFIRMED"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIALLY_RETAINED_PER_POLICY"
  | "CANCELLED_WITHIN_WINDOW"
  | "FAILED_NEEDS_SUPPORT";

export interface ExportRequest {
  readonly id: string;
  readonly accountId: string;
  readonly state: ExportState;
  readonly requestedAt: Date;
  readonly artifactExpiresAt?: Date;
}

export interface DeletionRequest {
  readonly id: string;
  readonly accountId: string;
  readonly state: DeletionState;
  readonly requestedAt: Date;
  readonly localDataIsSeparate: true;
}

export interface PrivacyDashboardSnapshot {
  readonly accountMode: "GUEST" | "SIGNED_IN";
  readonly localWorkspaceData: "LOCAL_ONLY_OR_SYNCED";
  readonly aiDataUse: "OFF_UNTIL_CONSENTED" | "CONSENTED" | "WITHDRAWN";
  readonly productAnalytics: "NOT_ASKED" | "DECLINED" | "GRANTED" | "WITHDRAWN";
  readonly latestExport?: Pick<
    ExportRequest,
    "state" | "requestedAt" | "artifactExpiresAt"
  >;
  readonly latestDeletion?: Pick<
    DeletionRequest,
    "state" | "requestedAt" | "localDataIsSeparate"
  >;
}

@Injectable()
export class PrivacyService {
  private readonly exports = new Map<string, ExportRequest>();
  private readonly deletions = new Map<string, DeletionRequest>();

  public requestExport(accountId: string): ExportRequest {
    const request: ExportRequest = {
      id: randomUUID(),
      accountId,
      state: "REQUESTED",
      requestedAt: new Date(),
    };
    this.exports.set(request.id, request);
    return request;
  }

  public requestDeletion(accountId: string): DeletionRequest {
    const request: DeletionRequest = {
      id: randomUUID(),
      accountId,
      state: "REQUESTED",
      requestedAt: new Date(),
      localDataIsSeparate: true,
    };
    this.deletions.set(request.id, request);
    return request;
  }

  public dashboard(accountId?: string): PrivacyDashboardSnapshot {
    if (!accountId) {
      return {
        accountMode: "GUEST",
        localWorkspaceData: "LOCAL_ONLY_OR_SYNCED",
        aiDataUse: "OFF_UNTIL_CONSENTED",
        productAnalytics: "NOT_ASKED",
      };
    }

    const latestExport = [...this.exports.values()]
      .filter(request => request.accountId === accountId)
      .sort(
        (left, right) =>
          right.requestedAt.getTime() - left.requestedAt.getTime()
      )[0];
    const latestDeletion = [...this.deletions.values()]
      .filter(request => request.accountId === accountId)
      .sort(
        (left, right) =>
          right.requestedAt.getTime() - left.requestedAt.getTime()
      )[0];

    return {
      accountMode: "SIGNED_IN",
      localWorkspaceData: "LOCAL_ONLY_OR_SYNCED",
      aiDataUse: "OFF_UNTIL_CONSENTED",
      productAnalytics: "NOT_ASKED",
      latestExport,
      latestDeletion,
    };
  }
}

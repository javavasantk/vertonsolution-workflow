import { Inject, Injectable } from "@nestjs/common";

export const POLARIS_CONFIG = Symbol("POLARIS_CONFIG");

export type EnvironmentName = "development" | "staging" | "production" | "test";

export interface PolarisConfig {
  readonly environment: EnvironmentName;
  readonly port: number;
  readonly assistantEnabled: boolean;
  readonly analyticsEnabled: boolean;
  readonly maxAssistantInputCharacters: number;
  readonly assistantDraftTtlSeconds: number;
  readonly confirmationTtlSeconds: number;
}

const supportedEnvironments = new Set<EnvironmentName>([
  "development",
  "staging",
  "production",
  "test",
]);

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("Expected a boolean environment value.");
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("Expected a positive integer environment value.");
  }
  return parsed;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env
): PolarisConfig {
  const candidate = env.NODE_ENV ?? "development";
  if (!supportedEnvironments.has(candidate as EnvironmentName)) {
    throw new Error("Unsupported NODE_ENV.");
  }

  const environment = candidate as EnvironmentName;
  const assistantEnabled = readBoolean(env.POLARIS_ASSISTANT_ENABLED, false);
  const analyticsEnabled = readBoolean(env.POLARIS_ANALYTICS_ENABLED, false);

  if (
    environment === "production" &&
    env.POLARIS_ALLOW_TEST_ADAPTERS === "true"
  ) {
    throw new Error("Test adapters are forbidden in production.");
  }

  return {
    environment,
    port: readPositiveInteger(env.PORT, 3000),
    assistantEnabled,
    analyticsEnabled,
    maxAssistantInputCharacters: readPositiveInteger(
      env.POLARIS_ASSISTANT_MAX_INPUT_CHARACTERS,
      12_000
    ),
    assistantDraftTtlSeconds: readPositiveInteger(
      env.POLARIS_ASSISTANT_DRAFT_TTL_SECONDS,
      1_800
    ),
    confirmationTtlSeconds: readPositiveInteger(
      env.POLARIS_ASSISTANT_CONFIRMATION_TTL_SECONDS,
      600
    ),
  };
}

@Injectable()
export class FeatureGateService {
  public constructor(
    @Inject(POLARIS_CONFIG) private readonly config: PolarisConfig
  ) {}

  public isAssistantEnabled(): boolean {
    return this.config.assistantEnabled;
  }

  public isAnalyticsEnabled(): boolean {
    return this.config.analyticsEnabled;
  }
}

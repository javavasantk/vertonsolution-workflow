import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import YAML from "yaml";

interface OpenApiDocument {
  openapi?: string;
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
}

const contractPath = resolve(
  __dirname,
  "../../contracts/project-polaris-v1.yaml"
);
const document = YAML.parse(
  readFileSync(contractPath, "utf8")
) as OpenApiDocument;
const requiredPaths = [
  "/v1/assistant/drafts",
  "/v1/assistant/drafts/{draftId}/confirmation",
  "/v1/assistant/drafts/{draftId}/approvals",
];
const requiredSchemas = [
  "TaskExtractionRequest",
  "TaskBreakdownRequest",
  "AssistantDraft",
  "ConfirmationReceipt",
  "AssistantApproval",
  "SafeError",
];

if (document.openapi !== "3.1.0") {
  throw new Error("Project Polaris contract must use OpenAPI 3.1.0.");
}
for (const path of requiredPaths) {
  if (!document.paths?.[path])
    throw new Error(`Required contract path is missing: ${path}`);
}
for (const schema of requiredSchemas) {
  if (!document.components?.schemas?.[schema]) {
    throw new Error(`Required contract schema is missing: ${schema}`);
  }
}

console.log("Project Polaris OpenAPI contract validation passed.");

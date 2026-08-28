import { Injectable } from "@nestjs/common";
import {
  AssistantRequest,
  PolicyDecision,
  SUPPORTED_ASSISTANT_CAPABILITIES,
} from "./assistant.types";

export interface PolicyEvaluation {
  readonly decision: PolicyDecision;
  readonly safeMessageKey: string;
}

const assessmentAnswerPatterns = [
  /(?:give|write|solve|complete|answer)\s+(?:my|the)\s+(?:graded|exam|quiz|assignment|take[- ]home|dissertation)/i,
  /submit[- ]ready/i,
  /answer\s+(?:this|my)\s+(?:exam|quiz|assessment)/i,
];

const unsupportedCapabilityPatterns = [
  /\b(?:browse|search the web|email|contact|calendar|send reminder|delete my|change my plan)\b/i,
];

const sensitiveContentPatterns = [
  /\b(?:password|api[ _-]?key|secret|credit card|social security)\b/i,
];

@Injectable()
export class AssistantPolicyService {
  public evaluate(
    request: AssistantRequest,
    maxInputCharacters: number
  ): PolicyEvaluation {
    if (!SUPPORTED_ASSISTANT_CAPABILITIES.includes(request.capability)) {
      return {
        decision: "REFUSE_UNSUPPORTED_CAPABILITY",
        safeMessageKey: "assistant_error_unsupported_capability",
      };
    }

    const selectedContent = this.selectedContent(request);
    if (
      selectedContent.trim().length === 0 ||
      selectedContent.length > maxInputCharacters
    ) {
      return {
        decision: "REQUEST_TOO_LARGE_OR_INVALID",
        safeMessageKey: "assistant_error_invalid_or_large_request",
      };
    }

    if (
      assessmentAnswerPatterns.some(pattern => pattern.test(selectedContent))
    ) {
      return {
        decision: "REFUSE_ASSESSMENT_ANSWER",
        safeMessageKey: "assistant_error_assessment_alternative",
      };
    }

    if (
      unsupportedCapabilityPatterns.some(pattern =>
        pattern.test(selectedContent)
      )
    ) {
      return {
        decision: "REFUSE_UNSUPPORTED_CAPABILITY",
        safeMessageKey: "assistant_error_unsupported_capability",
      };
    }

    if (
      sensitiveContentPatterns.some(pattern => pattern.test(selectedContent))
    ) {
      return {
        decision: "REFUSE_SENSITIVE_OR_UNSAFE_CONTENT",
        safeMessageKey: "assistant_error_sensitive_content",
      };
    }

    return { decision: "ALLOW", safeMessageKey: "assistant_policy_allow" };
  }

  public selectedContent(request: AssistantRequest): string {
    return request.capability === "TASK_EXTRACTION"
      ? request.source.content
      : [request.sourceTask.title, request.sourceTask.notes]
          .filter((value): value is string => Boolean(value))
          .join("\n");
  }
}

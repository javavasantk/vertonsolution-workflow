import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  AuthenticatedRequest,
  PolarisAuthGuard,
  requirePrincipal,
} from "../auth/principal";
import { AssistantService } from "./assistant.service";
import { ApprovedDraftMutation, AssistantRequest } from "./assistant.types";

class ExtractionSourceDto {
  @IsIn(["INBOX_ITEM", "SELECTED_TEXT"])
  public readonly kind!: "INBOX_ITEM" | "SELECTED_TEXT";

  @IsOptional()
  @IsUUID()
  public readonly id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  public readonly content!: string;
}

class TaskSourceDto {
  @IsUUID()
  public readonly taskId!: string;

  public readonly taskRevision!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  public readonly title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  public readonly notes?: string;

  @IsOptional()
  @IsIn(["TINY", "SMALL", "MEDIUM", "LARGE"])
  public readonly effortEstimate?: "TINY" | "SMALL" | "MEDIUM" | "LARGE";

  @IsOptional()
  @IsString()
  @MaxLength(128)
  public readonly dueContext?: string;
}

class AssistantDraftRequestDto {
  @IsUUID()
  public readonly requestId!: string;

  @IsUUID()
  public readonly workspaceId!: string;

  @IsIn(["TASK_EXTRACTION", "TASK_BREAKDOWN"])
  public readonly capability!: "TASK_EXTRACTION" | "TASK_BREAKDOWN";

  @IsString()
  @MaxLength(35)
  public readonly assistantResponseLocale!: string;

  public readonly source?: ExtractionSourceDto;
  public readonly sourceTask?: TaskSourceDto;

  @IsString()
  @MaxLength(128)
  public readonly consentReceiptVersion!: string;

  @IsString()
  @MaxLength(256)
  public readonly contextFingerprint!: string;

  @IsUUID()
  public readonly clientRequestIdempotencyKey!: string;
}

class ApprovalDto {
  @IsUUID()
  public readonly receiptId!: string;

  @IsArray()
  @IsUUID("4", { each: true })
  public readonly selectedCandidateIds!: string[];

  @IsString()
  @MaxLength(256)
  public readonly contextFingerprint!: string;
}

@Controller("v1/assistant")
@UseGuards(PolarisAuthGuard)
export class AssistantController {
  public constructor(private readonly assistant: AssistantService) {}

  @Post("drafts")
  public async createDraft(
    @Req() request: AuthenticatedRequest,
    @Body() body: AssistantDraftRequestDto
  ) {
    this.validateCapabilityShape(body);
    return this.assistant.requestDraft(
      requirePrincipal(request),
      body as AssistantRequest
    );
  }

  @Post("drafts/:draftId/confirmation")
  public async createConfirmation(
    @Req() request: AuthenticatedRequest,
    @Param("draftId") draftId: string
  ) {
    return this.assistant.issueConfirmationReceipt(
      requirePrincipal(request),
      draftId
    );
  }

  @Post("drafts/:draftId/approvals")
  @HttpCode(200)
  public async approveDraft(
    @Req() request: AuthenticatedRequest,
    @Param("draftId") draftId: string,
    @Body() body: ApprovalDto
  ) {
    const receipt = await this.assistant.consumeApprovedDraft(
      requirePrincipal(request),
      body as ApprovedDraftMutation
    );
    if (receipt.draftId !== draftId) {
      throw new Error("Assistant approval receipt does not match draft.");
    }
    return {
      approvalReceiptId: receipt.receiptId,
      workspaceId: receipt.workspaceId,
      capability: receipt.capability,
      selectedCandidateIds: body.selectedCandidateIds,
      requiresLocalDomainMutation: true,
    };
  }

  @Get("capabilities")
  public capabilities() {
    return {
      capabilities: ["TASK_EXTRACTION", "TASK_BREAKDOWN"],
      draftOnly: true,
      requiresAuthenticatedConsent: true,
    };
  }

  private validateCapabilityShape(body: AssistantDraftRequestDto): void {
    if (body.capability === "TASK_EXTRACTION" && !body.source) {
      throw new Error("TASK_EXTRACTION needs selected source content.");
    }
    if (body.capability === "TASK_BREAKDOWN" && !body.sourceTask) {
      throw new Error("TASK_BREAKDOWN needs a selected source task.");
    }
  }
}

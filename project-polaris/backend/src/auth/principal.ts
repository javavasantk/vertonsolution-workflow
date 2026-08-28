import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedPrincipal } from "../assistant/assistant.types";

export const FIREBASE_TOKEN_VERIFIER = Symbol("FIREBASE_TOKEN_VERIFIER");

export interface FirebaseTokenVerifier {
  verifyAuthorizationHeader(
    header: string | undefined
  ): Promise<AuthenticatedPrincipal | undefined>;
}

/**
 * Default-safe verifier. Production must bind a Firebase Admin adapter through
 * Secret Manager/workload identity. No fallback accepts a client supplied user.
 */
@Injectable()
export class RejectingTokenVerifier implements FirebaseTokenVerifier {
  public async verifyAuthorizationHeader(): Promise<
    AuthenticatedPrincipal | undefined
  > {
    return undefined;
  }
}

export interface AuthenticatedRequest extends Request {
  polarisPrincipal?: AuthenticatedPrincipal;
}

@Injectable()
export class PolarisAuthGuard implements CanActivate {
  public constructor(
    @Inject(FIREBASE_TOKEN_VERIFIER)
    private readonly verifier: FirebaseTokenVerifier
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.verifier.verifyAuthorizationHeader(
      request.header("authorization")
    );
    if (!principal) {
      throw new UnauthorizedException({
        code: "AUTHENTICATION_REQUIRED",
        messageKey: "error_authentication_required",
        retryable: false,
      });
    }
    request.polarisPrincipal = principal;
    return true;
  }
}

export function requirePrincipal(
  request: AuthenticatedRequest
): AuthenticatedPrincipal {
  if (!request.polarisPrincipal) {
    throw new UnauthorizedException({
      code: "AUTHENTICATION_REQUIRED",
      messageKey: "error_authentication_required",
      retryable: false,
    });
  }
  return request.polarisPrincipal;
}

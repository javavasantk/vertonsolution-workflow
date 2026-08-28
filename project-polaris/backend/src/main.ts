import "reflect-metadata";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Request, Response } from "express";
import { AppModule } from "./app.module";
import { loadConfig } from "./config/config";

@Catch()
class SafeExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const safePayload =
      typeof payload === "object" && payload !== null ? payload : {};
    const requestId = request.header("x-request-id") ?? crypto.randomUUID();

    response.status(status).json({
      code: "code" in safePayload ? safePayload.code : "INTERNAL_ERROR",
      messageKey:
        "messageKey" in safePayload
          ? safePayload.messageKey
          : "error_unavailable",
      retryable: status >= 500,
      requestId,
    });
  }
}

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    })
  );
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.listen(config.port, "0.0.0.0");
}

void bootstrap();

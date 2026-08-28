import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get("live")
  public live() {
    return { status: "ok" };
  }

  @Get("ready")
  public ready() {
    return {
      status: "ready",
      dependencies: { database: "not-configured-in-foundation" },
    };
  }
}

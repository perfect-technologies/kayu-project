import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      name: "@kayu/backend",
      status: "ok",
    };
  }
}

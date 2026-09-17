import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { TestSessionService } from "./test-session.service";

const bodySchema = z.union([
  z.object({ email: z.string().email() }),
  z.object({ phone: z.string().regex(/^\+[1-9]\d{6,14}$/) }),
]);

export type TestSessionBody = z.infer<typeof bodySchema>;

@Controller("test")
export class TestSessionController {
  constructor(private readonly sessions: TestSessionService) {}

  @Post("session")
  @HttpCode(200)
  create(@Body(new ZodValidationPipe(bodySchema)) body: TestSessionBody) {
    return "email" in body ? this.sessions.forEmail(body.email) : this.sessions.forPhone(body.phone);
  }
}

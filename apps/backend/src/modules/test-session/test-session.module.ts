import { Module } from "@nestjs/common";
import { TestSessionController } from "./test-session.controller";
import { TestSessionService } from "./test-session.service";

@Module({
  controllers: [TestSessionController],
  providers: [TestSessionService],
})
export class TestSessionModule {}

// Decided at import time from process.env: outside test mode the route does not exist.
export function testSessionModules(env: NodeJS.ProcessEnv): Array<typeof TestSessionModule> {
  return env.E2E_TEST_MODE === "true" && env.NODE_ENV !== "production" ? [TestSessionModule] : [];
}

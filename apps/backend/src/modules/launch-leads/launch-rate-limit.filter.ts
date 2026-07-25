import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from "@nestjs/common";
import { LaunchRateLimitException } from "./launch-intake-protection.service";

@Catch(LaunchRateLimitException)
export class LaunchRateLimitFilter implements ExceptionFilter {
  catch(exception: LaunchRateLimitException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      setHeader: (name: string, value: string) => void;
      status: (status: number) => { json: (body: unknown) => unknown };
    }>();
    response.setHeader("Retry-After", String(exception.retryAfterSeconds));
    const status = exception.getStatus();
    const body = exception.getResponse();
    response.status(status).json(
      typeof body === "string"
        ? { statusCode: status, message: body }
        : body,
    );
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  constructor(private readonly nodeEnv = process.env.NODE_ENV ?? "development") {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<{ status: (c: number) => { json: (b: unknown) => unknown } }>();
    const req = http.getRequest<{ url: string; method: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === "string" ? { statusCode: status, message: body } : body,
      );
      return;
    }

    const message = exception instanceof Error ? exception.message : String(exception);
    this.logger.error(`${req.method} ${req.url} -> ${message}`);
    res.status(500).json({
      statusCode: 500,
      message: this.nodeEnv === "production" ? "Internal server error" : message,
    });
  }
}

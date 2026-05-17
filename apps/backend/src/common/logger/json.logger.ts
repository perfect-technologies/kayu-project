import { ConsoleLogger, LoggerService } from "@nestjs/common";

class JsonLogger extends ConsoleLogger {
  private emit(level: string, message: unknown, context?: string) {
    process.stdout.write(
      `${JSON.stringify({
        level,
        time: new Date().toISOString(),
        context: context ?? this.context,
        message: typeof message === "string" ? message : JSON.stringify(message),
      })}\n`,
    );
  }
  log(m: unknown, c?: string) { this.emit("info", m, c); }
  error(m: unknown, _stack?: string, c?: string) { this.emit("error", m, c); }
  warn(m: unknown, c?: string) { this.emit("warn", m, c); }
  debug(m: unknown, c?: string) { this.emit("debug", m, c); }
  verbose(m: unknown, c?: string) { this.emit("verbose", m, c); }
}

export function createLogger(): LoggerService {
  return process.env.NODE_ENV === "production"
    ? new JsonLogger()
    : new ConsoleLogger();
}

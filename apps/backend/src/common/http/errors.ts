import { HttpException, HttpStatus } from "@nestjs/common";

export type ApiErrorCode =
  | "ACCOUNT_SUSPENDED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BLOCKED"
  | "FEATURE_DISABLED"
  | "SELF_ACTION"
  | "SLOT_TAKEN"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_TRANSITION"
  | "REASON_REQUIRED"
  | "BOOKING_NOT_COMPLETED"
  | "ALREADY_EXISTS"
  | "LAST_ADMIN"
  | "ADMIN_ACCOUNT"
  | "ROLE_CHANGE_NOT_ALLOWED"
  | "REFERENCED"
  | "INVALID_REFERENCE"
  | "INVALID_MEDIA"
  | "RATE_LIMITED"
  | "RECIPIENT_UNAVAILABLE"
  | "LIMIT_REACHED"
  | "DOCS_MISSING";

export function apiError(
  status: HttpStatus,
  code: ApiErrorCode,
  message: string,
  extra: Record<string, unknown> = {},
): HttpException {
  return new HttpException({ statusCode: status, code, message, ...extra }, status);
}

export const notFound = (message = "Introuvable") =>
  apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", message);

export const forbidden = (message = "Accès refusé") =>
  apiError(HttpStatus.FORBIDDEN, "FORBIDDEN", message);

export function errorCode(error: unknown): string | undefined {
  if (!(error instanceof HttpException)) return undefined;
  const body = error.getResponse();
  return typeof body === "object" && body !== null && "code" in body
    ? String((body as { code: unknown }).code)
    : undefined;
}

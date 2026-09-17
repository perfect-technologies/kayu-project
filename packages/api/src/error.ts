import type { ApiErrorCode } from "@kayu/schemas";

export class ApiError extends Error {
  body?: unknown;

  constructor(
    public readonly status: number,
    message: string,
    public readonly error?: string,
    // Machine code from the backend (`SLOT_TAKEN`, `BLOCKED`, …); match on this, not on `message`.
    public readonly code?: ApiErrorCode | (string & {}),
  ) {
    super(message);
    this.name = "ApiError";
  }
}

import { authCopy } from "@/copy/auth";

type SupabaseLikeError = { code?: string | null; status?: number; message?: string };

/** Maps Supabase auth errors (codes first, then message patterns) to French copy. */
export function supabaseErrorMessage(error: unknown): string {
  const copy = authCopy.errors;
  const err = (error ?? {}) as SupabaseLikeError;
  const code = err.code ?? "";
  const message = err.message ?? "";
  if (code === "otp_expired" || /expired/i.test(message)) return copy.expiredCode;
  if (code === "over_sms_send_rate_limit" || code === "over_request_rate_limit" || err.status === 429 || /rate limit|security purposes/i.test(message)) {
    return copy.rateLimited;
  }
  if (code === "sms_send_failed" || /sms|twilio|messagebird|vonage/i.test(message)) return copy.smsFailed;
  if (code === "validation_failed" || /invalid.*phone|phone.*invalid|phone_provider_disabled/i.test(message)) return copy.invalidPhone;
  if (code === "otp_disabled" || /token|otp|invalid/i.test(message)) return copy.wrongCode;
  return copy.generic;
}

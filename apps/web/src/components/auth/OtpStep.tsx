"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatPhone } from "@kayu/utils";
import { authCopy } from "@/copy/auth";
import { FormError, Spinner } from "@/components/forms/Field";
import { cn } from "@/lib/utils";

const LENGTH = 6;
const RESEND_SECONDS = 32;

export type OtpStepProps = {
  phone: string;
  busy: boolean;
  error: string | null;
  /** Bumped by the parent on each wrong code so the boxes shake again. */
  errorNonce: number;
  onSubmit: (code: string) => void;
  onResend: () => Promise<void>;
  onChangeNumber: () => void;
  submitLabel?: string;
};

/** Six digit boxes with auto-advance, paste, a 32 s resend countdown and a shake on a wrong code. */
export function OtpStep({ phone, busy, error, errorNonce, onSubmit, onResend, onChangeNumber, submitLabel }: OtpStepProps) {
  const copy = authCopy.otp;
  const reduceMotion = useReducedMotion();
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: LENGTH }, () => ""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (errorNonce > 0) {
      setDigits(Array.from({ length: LENGTH }, () => ""));
      inputs.current[0]?.focus();
    }
  }, [errorNonce]);

  const setAt = (index: number, value: string) => {
    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const handleInput = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    setLocalError(null);
    if (clean.length > 1) {
      const chars = clean.slice(0, LENGTH - index).split("");
      setDigits((current) => {
        const next = [...current];
        chars.forEach((char, offset) => {
          next[index + offset] = char;
        });
        return next;
      });
      inputs.current[Math.min(index + chars.length, LENGTH - 1)]?.focus();
      return;
    }
    setAt(index, clean);
    if (clean && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKey = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setAt(index - 1, "");
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const submit = () => {
    if (code.length < LENGTH) {
      setLocalError(copy.incomplete);
      return;
    }
    onSubmit(code);
  };

  const resend = async () => {
    setResent(false);
    await onResend();
    setResent(true);
    setCountdown(RESEND_SECONDS);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div>
        <p className="text-sm font-bold">{copy.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{copy.sentTo(formatPhone(phone))}</p>
      </div>
      <fieldset>
        <legend className="sr-only">{copy.label}</legend>
        <motion.div
          key={errorNonce}
          animate={errorNonce > 0 && !reduceMotion ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex justify-between gap-2"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              pattern="[0-9]*"
              maxLength={LENGTH}
              aria-label={copy.digit(index + 1)}
              aria-invalid={error ? true : undefined}
              value={digit}
              disabled={busy}
              onChange={(event) => handleInput(index, event.target.value)}
              onKeyDown={(event) => handleKey(index, event)}
              onFocus={(event) => event.target.select()}
              className={cn(
                "h-14 w-full min-w-0 rounded-[14px] border bg-white text-center font-heading text-xl font-extrabold text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_#0a3d3618]",
                error ? "border-destructive" : "border-input",
              )}
            />
          ))}
        </motion.div>
      </fieldset>
      <FormError message={error ?? localError} />
      {resent && !error && (
        <p role="status" className="text-xs font-semibold text-emerald-700">
          {copy.resent}
        </p>
      )}
      <button type="submit" disabled={busy} aria-busy={busy} className="primary-action">
        {busy ? (
          <>
            <Spinner /> {copy.verifying}
          </>
        ) : (
          <>
            {submitLabel ?? copy.submit} <ArrowRight size={18} aria-hidden />
          </>
        )}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          disabled={busy || countdown > 0}
          onClick={() => void resend()}
          className="inline-flex min-h-9 items-center font-bold text-primary disabled:text-muted-foreground"
        >
          {countdown > 0 ? copy.resendIn(countdown) : copy.resend}
        </button>
        <button type="button" disabled={busy} onClick={onChangeNumber} className="inline-flex min-h-9 items-center font-semibold text-muted-foreground underline underline-offset-4">
          {copy.changeNumber}
        </button>
      </div>
    </form>
  );
}

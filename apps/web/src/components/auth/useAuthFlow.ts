"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toE164 } from "@kayu/utils";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { authCopy, type PhoneCountryCode } from "@/copy/auth";
import { errorMessage } from "@/copy/errors";
import { clearSignupIntent, postAuthDestination, readSignupIntent, roleLanding, usableReturnTo } from "@/lib/auth-return-to";
import type { NameStepValue } from "./NameStep";
import { supabaseErrorMessage } from "./supabase-errors";

export type AuthPhase = "phone" | "otp" | "name" | "terms";

export const AUTH_PHASES: AuthPhase[] = ["phone", "otp", "name", "terms"];

/**
 * The OTP state machine shared by /login and /register: phone → code → (name) → (terms) → route.
 * Name and terms only appear when `GET /me` says they are missing.
 */
export function useAuthFlow(returnTo: string | null) {
  const router = useRouter();
  const { status, user, loginWithPhone, verifyOtp, updateProfile, acceptTerms } = useAuth();
  const [country, setCountry] = useState<PhoneCountryCode>("CD");
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<AuthPhase>("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);
  const routed = useRef(false);
  const arrivedSignedIn = useRef<boolean | null>(null);

  const route = useCallback(
    (target: AuthUser) => {
      if (routed.current) return;
      routed.current = true;
      const destination = postAuthDestination(target, { returnTo, signupIntent: readSignupIntent() });
      clearSignupIntent();
      router.replace(destination);
    },
    [returnTo, router],
  );

  const continueWith = useCallback(
    (target: AuthUser) => {
      if (!target.firstName) setPhase("name");
      else if (!target.termsAcceptedAt) setPhase("terms");
      else route(target);
    },
    [route],
  );

  // A visitor who arrives already signed in goes to `returnTo` or their role home; one who abandoned
  // the name or terms step resumes there. Sign-ins made on this screen route themselves.
  useEffect(() => {
    if (status === "loading" || routed.current) return;
    if (arrivedSignedIn.current === null) arrivedSignedIn.current = user !== null;
    if (!arrivedSignedIn.current || phase !== "phone" || busy || !user) return;
    if (status === "ready") {
      routed.current = true;
      router.replace(usableReturnTo(returnTo) ?? roleLanding(user));
    } else if (status === "needs-terms") {
      arrivedSignedIn.current = false;
      continueWith(user);
    }
  }, [status, user, phase, busy, returnTo, router, continueWith]);

  const sendCode = useCallback(async () => {
    const e164 = toE164(number, country);
    if (!e164) {
      setError(authCopy.phone.invalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await loginWithPhone(e164);
      setPhone(e164);
      setPhase("otp");
    } catch (err) {
      setError(supabaseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [country, number, loginWithPhone]);

  const resend = useCallback(async () => {
    setError(null);
    try {
      await loginWithPhone(phone);
    } catch (err) {
      setError(supabaseErrorMessage(err));
    }
  }, [phone, loginWithPhone]);

  const verify = useCallback(
    async (code: string) => {
      setBusy(true);
      setError(null);
      try {
        const target = await verifyOtp(phone, code);
        if (!target) throw new Error(authCopy.errors.sessionMissing);
        continueWith(target);
      } catch (err) {
        setError(err instanceof Error && err.message === authCopy.errors.sessionMissing ? err.message : supabaseErrorMessage(err));
        setErrorNonce((value) => value + 1);
      } finally {
        setBusy(false);
      }
    },
    [phone, verifyOtp, continueWith],
  );

  const submitName = useCallback(
    async (value: NameStepValue) => {
      setBusy(true);
      setError(null);
      try {
        const target = await updateProfile({
          firstName: value.firstName,
          lastName: value.lastName,
          ...(value.placeId ? { placeId: value.placeId } : {}),
          ...(value.country ? { country: value.country } : {}),
        });
        continueWith(target);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [updateProfile, continueWith],
  );

  const submitTerms = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const target = await acceptTerms();
      route(target);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [acceptTerms, route]);

  const changeNumber = useCallback(() => {
    setError(null);
    setPhase("phone");
  }, []);

  return {
    user,
    country,
    setCountry,
    number,
    setNumber,
    phone,
    phase,
    busy,
    error,
    errorNonce,
    sendCode,
    resend,
    verify,
    submitName,
    submitTerms,
    changeNumber,
  };
}

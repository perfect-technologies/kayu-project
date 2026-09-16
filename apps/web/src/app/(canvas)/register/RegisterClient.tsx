"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountTypeSelector } from "@/components/auth/AccountTypeSelector";
import { AuthCardHeader } from "@/components/auth/AuthCardHeader";
import { AuthCardMotion } from "@/components/auth/AuthCardMotion";
import { DemoAccountsPanel } from "@/components/auth/DemoAccountsPanel";
import { OtpFlow } from "@/components/auth/OtpFlow";
import { useAuthFlow } from "@/components/auth/useAuthFlow";
import { authCopy } from "@/copy/auth";
import { loginPath } from "@/lib/auth-redirects";
import { readSignupIntent, writeSignupIntent, type SignupIntent } from "@/lib/auth-return-to";

export function RegisterClient({ returnTo, initialIntent }: { returnTo: string | null; initialIntent: SignupIntent | null }) {
  const flow = useAuthFlow(returnTo);
  const copy = authCopy.register;
  const [intent, setIntent] = useState<SignupIntent>(initialIntent ?? "client");

  useEffect(() => {
    const stored = readSignupIntent();
    if (!initialIntent && stored) setIntent(stored);
  }, [initialIntent]);

  useEffect(() => {
    writeSignupIntent(intent);
  }, [intent]);

  return (
    <AuthCardMotion>
      <AuthCardHeader eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />
      <OtpFlow flow={flow} beforePhone={<AccountTypeSelector value={intent} onChange={setIntent} disabled={flow.busy} />} />
      <p className="mt-6 text-center text-sm">
        {copy.footerQuestion}{" "}
        <Link href={loginPath(returnTo)} className="font-bold text-primary">
          {copy.footerAction}
        </Link>
      </p>
      <DemoAccountsPanel returnTo={returnTo} />
    </AuthCardMotion>
  );
}

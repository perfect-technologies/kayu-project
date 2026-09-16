"use client";

import Link from "next/link";
import { AuthCardHeader } from "@/components/auth/AuthCardHeader";
import { AuthCardMotion } from "@/components/auth/AuthCardMotion";
import { DemoAccountsPanel } from "@/components/auth/DemoAccountsPanel";
import { OtpFlow } from "@/components/auth/OtpFlow";
import { useAuthFlow } from "@/components/auth/useAuthFlow";
import { authCopy } from "@/copy/auth";
import { registerPath } from "@/lib/auth-redirects";

export function LoginClient({ returnTo }: { returnTo: string | null }) {
  const flow = useAuthFlow(returnTo);
  const copy = authCopy.login;
  return (
    <AuthCardMotion>
      <AuthCardHeader title={copy.title} subtitle={copy.subtitle} />
      <OtpFlow flow={flow} />
      <p className="mt-6 text-center text-sm">
        {copy.footerQuestion}{" "}
        <Link href={registerPath(returnTo)} className="font-bold text-primary">
          {copy.footerAction}
        </Link>
      </p>
      <DemoAccountsPanel returnTo={returnTo} />
    </AuthCardMotion>
  );
}

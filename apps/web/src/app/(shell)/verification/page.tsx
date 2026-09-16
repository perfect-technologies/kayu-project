import type { Metadata } from "next";
import { RequireRole } from "@/components/guards";
import { verificationCopy } from "@/copy/verification";
import { VerificationClient } from "./VerificationClient";

export const metadata: Metadata = { title: verificationCopy.meta.title, description: verificationCopy.meta.description };

/** PROVIDER only; clients are sent to /mes-reservations by the guard. */
export default function Page() {
  return (
    <RequireRole role="PROVIDER">
      <VerificationClient />
    </RequireRole>
  );
}

import type { Metadata } from "next";
import { AuthCanvas } from "@/components/layout/AuthCanvas";
import { authCopy } from "@/copy/auth";
import { WelcomeClient } from "./WelcomeClient";

export const metadata: Metadata = { title: authCopy.welcome.title };

/** Outside the (canvas) group because the welcome carousel is the one canvas with the top bar. */
export default function Page() {
  return (
    <AuthCanvas topBar skipHref="/login" className="max-w-[480px]">
      <WelcomeClient />
    </AuthCanvas>
  );
}

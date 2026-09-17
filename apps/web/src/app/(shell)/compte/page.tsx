import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/guards";
import { compteCopy } from "@/copy/compte";
import { CompteClient } from "./CompteClient";

export const metadata: Metadata = { title: compteCopy.meta.title, description: compteCopy.meta.description };

/** Any signed-in user; anonymous visitors are sent to /login?returnTo= by the guard. */
export default function Page() {
  return (
    <ProtectedRoute>
      <CompteClient />
    </ProtectedRoute>
  );
}

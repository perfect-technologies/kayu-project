import type { Metadata } from "next";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/guards";
import { AuthBootScreen } from "@/components/guards/AuthBootScreen";
import { messagerieCopy } from "@/copy/messagerie";
import { MessagerieClient } from "./MessagerieClient";

export const metadata: Metadata = { title: messagerieCopy.meta.title, description: messagerieCopy.meta.description };

/** Any signed-in user; `?c=<conversationId>` opens a thread. */
export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<AuthBootScreen />}>
        <MessagerieClient />
      </Suspense>
    </ProtectedRoute>
  );
}

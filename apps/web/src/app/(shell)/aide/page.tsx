import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/guards";
import { aideCopy } from "@/copy/aide";
import { AideClient } from "./AideClient";

export const metadata: Metadata = { title: aideCopy.meta.title, description: aideCopy.meta.description };

export default function Page() {
  return (
    <ProtectedRoute>
      <AideClient />
    </ProtectedRoute>
  );
}

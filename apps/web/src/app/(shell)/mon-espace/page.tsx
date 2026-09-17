import type { Metadata } from "next";
import { RequireRole } from "@/components/guards";
import { espaceCopy } from "@/copy/espace";
import { MonEspaceClient } from "./MonEspaceClient";

export const metadata: Metadata = { title: espaceCopy.meta.title, description: espaceCopy.meta.description };

/** PROVIDER only; clients are sent to /mes-reservations by the guard. */
export default function Page() {
  return (
    <RequireRole role="PROVIDER">
      <MonEspaceClient />
    </RequireRole>
  );
}

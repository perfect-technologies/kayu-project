import type { Metadata } from "next";
import { RequireRole } from "@/components/guards";
import { revenusCopy } from "@/copy/revenus";
import { RevenusClient } from "./RevenusClient";

export const metadata: Metadata = { title: revenusCopy.meta.title, description: revenusCopy.meta.description };

/** PROVIDER only; clients are sent to /mes-reservations by the guard. */
export default function Page() {
  return (
    <RequireRole role="PROVIDER">
      <RevenusClient />
    </RequireRole>
  );
}

import type { Metadata } from "next";
import { RequireClientOnly } from "@/components/guards";
import { avisCopy } from "@/copy/avis";
import { AvisClient } from "./AvisClient";

export const metadata: Metadata = { title: avisCopy.meta.title, description: avisCopy.meta.description };

/** CLIENT only; providers go to /mon-espace and admins to /admin (the endpoints answer 403 for admins). */
export default function Page() {
  return (
    <RequireClientOnly>
      <AvisClient />
    </RequireClientOnly>
  );
}

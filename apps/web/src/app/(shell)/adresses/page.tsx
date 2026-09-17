import type { Metadata } from "next";
import { RequireClientOnly } from "@/components/guards";
import { adressesCopy } from "@/copy/adresses";
import { AdressesClient } from "./AdressesClient";

export const metadata: Metadata = { title: adressesCopy.meta.title, description: adressesCopy.meta.description };

/** CLIENT only (GET /addresses is 403 for admins); providers → /mon-espace, admins → /admin. */
export default function Page() {
  return (
    <RequireClientOnly>
      <AdressesClient />
    </RequireClientOnly>
  );
}

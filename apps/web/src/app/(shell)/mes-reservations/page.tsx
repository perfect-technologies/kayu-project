import type { Metadata } from "next";
import { RequireClientOnly } from "@/components/guards";
import { bookingsCopy } from "@/copy/bookings";
import { MesReservationsClient } from "./MesReservationsClient";

export const metadata: Metadata = { title: bookingsCopy.meta.title, description: bookingsCopy.meta.description };

/** CLIENT only; providers go to /mon-espace and admins to /admin (the endpoints answer 403 for admins). */
export default function Page() {
  return (
    <RequireClientOnly>
      <MesReservationsClient />
    </RequireClientOnly>
  );
}

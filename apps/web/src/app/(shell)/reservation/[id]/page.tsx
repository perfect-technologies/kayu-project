import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/guards";
import { bookingsCopy } from "@/copy/bookings";
import { ReservationDetailClient } from "./ReservationDetailClient";

export const metadata: Metadata = { title: bookingsCopy.detail.meta.title, description: bookingsCopy.detail.meta.description };

/** Any signed-in user; the API answers 404 when the viewer is not a participant. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <ReservationDetailClient id={id} />
    </ProtectedRoute>
  );
}

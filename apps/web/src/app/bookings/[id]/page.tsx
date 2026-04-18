import type { Metadata } from "next";
import { BookingDetailPageClient } from "./BookingDetailPageClient";

export const metadata: Metadata = {
  title: "Réservation · KAYOU",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetailPageClient id={id} />;
}

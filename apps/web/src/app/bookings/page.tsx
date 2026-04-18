import type { Metadata } from "next";
import { MyBookingsClient } from "./MyBookingsClient";

export const metadata: Metadata = {
  title: "Mes réservations · KAYOU",
  description: "Toutes vos missions KAYOU — passées, en cours, à venir.",
};

export default function BookingsPage() {
  return <MyBookingsClient />;
}

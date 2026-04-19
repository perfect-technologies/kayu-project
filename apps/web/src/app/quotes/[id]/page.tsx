import type { Metadata } from "next";
import { QuoteDetailClient } from "./QuoteDetailClient";

export const metadata: Metadata = {
  title: "Devis · KAYOU",
  description: "Consultez le devis reçu et acceptez ou refusez.",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuoteDetailClient id={id} />;
}

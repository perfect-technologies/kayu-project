import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { launchFlags } from "@/lib/launch-flags";
import { JobRequestsClient } from "./JobRequestsClient";

export const metadata: Metadata = {
  title: "Demandes · KAYOU",
  description:
    "Boîte de réception des demandes client et liste des missions actives.",
};

export default function JobRequestsPage() {
  if (!launchFlags.enableJobRequests) {
    redirect("/pro");
  }

  return <JobRequestsClient />;
}

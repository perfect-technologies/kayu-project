import type { Metadata } from "next";
import { JobRequestsClient } from "./JobRequestsClient";

export const metadata: Metadata = {
  title: "Demandes · KAYOU",
  description:
    "Boîte de réception des demandes client et liste des missions actives.",
};

export default function JobRequestsPage() {
  return <JobRequestsClient />;
}

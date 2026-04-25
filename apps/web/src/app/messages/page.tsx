import type { Metadata } from "next";
import { MessagesClient } from "./MessagesClient";

export const metadata: Metadata = {
  title: "Messages · KAYOU",
  description: "Vos conversations KAYOU — missions, offres finales et suivis.",
};

export default function MessagesPage() {
  return <MessagesClient />;
}

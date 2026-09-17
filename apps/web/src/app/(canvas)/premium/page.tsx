import type { Metadata } from "next";
import { premiumCopy } from "@/copy/premium";
import { PremiumCard } from "./PremiumCard";

export const metadata: Metadata = {
  title: premiumCopy.meta.title,
  description: premiumCopy.meta.description,
};

export default function Page() {
  return <PremiumCard />;
}

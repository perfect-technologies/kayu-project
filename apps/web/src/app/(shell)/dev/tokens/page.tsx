import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shellCopy } from "@/copy/shell";
import { TokensShowcase } from "./TokensShowcase";

export const metadata: Metadata = {
  title: shellCopy.screenTitles.devTokens,
  robots: { index: false, follow: false },
};

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TokensShowcase />;
}

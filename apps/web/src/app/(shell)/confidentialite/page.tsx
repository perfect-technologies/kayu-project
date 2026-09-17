import type { Metadata } from "next";
import { PrivacyArticle } from "./PrivacyArticle";
import { privacyCopy } from "@/copy/legal";

export const metadata: Metadata = {
  title: privacyCopy.meta.title,
  description: privacyCopy.meta.description,
};

export default function Page() {
  return <PrivacyArticle />;
}

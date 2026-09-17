import type { Metadata } from "next";
import { privacyCopy } from "@/copy/legal";
import { PrivacyArticle } from "../confidentialite/PrivacyArticle";

export const metadata: Metadata = {
  title: privacyCopy.meta.title,
  description: privacyCopy.meta.description,
};

export default function Page() {
  return <PrivacyArticle />;
}

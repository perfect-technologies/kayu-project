import type { Metadata } from "next";
import { contactCopy } from "@/copy/contact";
import { ContactClient } from "./ContactClient";

export const metadata: Metadata = {
  title: contactCopy.meta.title,
  description: contactCopy.meta.description,
};

export default function Page() {
  return <ContactClient />;
}

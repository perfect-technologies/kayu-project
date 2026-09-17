import type { Metadata } from "next";
import { adminCopy } from "@/copy/admin";
import { AdminConsole } from "./AdminConsole";

export const metadata: Metadata = { title: adminCopy.meta.title, description: adminCopy.meta.description };

export default function Page() {
  return <AdminConsole system={{ webMode: process.env.KAYOU_PUBLIC_WEB_MODE ?? "", nodeVersion: process.version }} />;
}

import type { Metadata } from "next";
import { RequireAdmin } from "@/components/guards";
import { shellCopy } from "@/copy/shell";
import { AdminPlaceholder } from "./AdminPlaceholder";

export const metadata: Metadata = { title: shellCopy.screenTitles.admin };

export default function Page() {
  return (
    <RequireAdmin>
      <AdminPlaceholder />
    </RequireAdmin>
  );
}

import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/guards";
import { notificationsCopy } from "@/copy/notifications";
import { NotificationsClient } from "./NotificationsClient";

export const metadata: Metadata = { title: notificationsCopy.meta.title, description: notificationsCopy.meta.description };

export default function Page() {
  return (
    <ProtectedRoute>
      <NotificationsClient />
    </ProtectedRoute>
  );
}

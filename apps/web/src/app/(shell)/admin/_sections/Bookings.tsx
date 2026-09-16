"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminBooking, BookingStatus } from "@kayu/schemas";
import { CalendarCheck, ExternalLink, XCircle } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { AdminTable } from "../_components/AdminTable";
import { ConfirmAction } from "../_components/ConfirmAction";
import { FilterSelect } from "../_components/FilterSelect";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { formatSlot } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";

const copy = adminCopy.bookings;
const LIMIT = 50;
const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const COLUMNS = [
  { key: "client", label: copy.columns.client },
  { key: "provider", label: copy.columns.provider },
  { key: "when", label: copy.columns.when },
  { key: "status", label: copy.columns.status },
  { key: "actions", label: "", className: "text-right" },
];

export function Bookings() {
  const { q, page, set } = useAdminParams();
  const [status, setStatus] = useState("");
  const params = { q: q || undefined, status: (status || undefined) as BookingStatus | undefined, page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.admin.bookings(params),
    queryFn: () => adminApi(apiClient).bookings(params),
    placeholderData: keepPreviousData,
  });
  const cancel = useAdminMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) => adminApi(apiClient).cancelBooking(bookingId, { reason }),
    invalidate: [["admin", "bookings"], ["bookings"]],
    success: copy.toasts.cancelled,
    silent: true,
  });

  const actions = (booking: AdminBooking) => (
    <div className="flex flex-wrap justify-end gap-2">
      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <ConfirmAction
          className="h-9 px-3 text-xs"
          destructive
          sheet={{ title: copy.sheets.cancel.title, description: copy.sheets.cancel.description, confirmLabel: copy.sheets.cancel.confirm, reason: { label: copy.sheets.cancel.reason, placeholder: copy.sheets.cancel.placeholder, required: true } }}
          onConfirm={(reason) => cancel.mutateAsync({ bookingId: booking.id, reason })}
        >
          <XCircle size={14} aria-hidden /> {copy.cancel}
        </ConfirmAction>
      )}
      <a href={`/reservation/${encodeURIComponent(booking.id)}`} target="_blank" rel="noreferrer" className="secondary-action h-9 px-3 text-xs" aria-label={copy.open}>
        <ExternalLink size={14} aria-hidden /> {adminCopy.common.view}
      </a>
    </div>
  );

  const person = (name: string, phone: string | null) => (
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-foreground">{name}</p>
      {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
    </div>
  );

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <AdminTable
        columns={COLUMNS}
        rows={query.data?.items ?? []}
        keyOf={(booking) => booking.id}
        cells={(booking) => [
          person(booking.client.name, booking.clientPhone || booking.client.phone),
          person(booking.provider.displayName, booking.provider.phone),
          <span key="when" className="text-sm whitespace-nowrap">{formatSlot(booking.scheduledAt, booking.timezone)}</span>,
          <AdminStatusPill key="status" status={booking.status} />,
          actions(booking),
        ]}
        card={(booking) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{booking.client.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {booking.provider.displayName} · {formatSlot(booking.scheduledAt, booking.timezone)}
                </p>
              </div>
              <AdminStatusPill status={booking.status} />
            </div>
            {actions(booking)}
          </div>
        )}
        toolbar={
          <>
            <SearchBox placeholder={copy.searchPlaceholder} />
            <FilterSelect label={copy.statusFilter} value={status} onChange={(value) => { setStatus(value); set({ page: null }); }} allLabel={adminCopy.common.all} options={STATUSES.map((value) => ({ value, label: adminCopy.pills[value] }))} />
          </>
        }
        pagination={{ page, total: query.data?.total ?? 0, limit: LIMIT, onPage: (next) => set({ page: next }) }}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        empty={{ icon: CalendarCheck, title: copy.empty }}
      />
    </section>
  );
}

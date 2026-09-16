"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { ContactMessage, ContactStatus } from "@kayu/schemas";
import { CheckCheck, Mail, MailOpen, Trash2, XCircle } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { ConfirmAction } from "../_components/ConfirmAction";
import { FilterSelect } from "../_components/FilterSelect";
import { Pagination } from "../_components/Pagination";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { SplitPane } from "../_components/SplitPane";
import { formatDateTime, formatRelative } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";

const copy = adminCopy.contacts;
const LIMIT = 50;
const STATUSES: ContactStatus[] = ["NEW", "READ", "REPLIED", "CLOSED"];

function ContactDetail({ contact, busy, onStatus, onDelete }: { contact: ContactMessage; busy: boolean; onStatus: (status: ContactStatus) => void; onDelete: () => Promise<unknown> }) {
  return (
    <article className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-foreground">{contact.subject}</h3>
          <p className="text-sm text-foreground">{contact.name}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
            <a href={`mailto:${contact.email}`} className="font-bold text-primary">{contact.email}</a>
            {contact.phone && <a href={`tel:${contact.phone}`} className="font-bold text-primary">{contact.phone}</a>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.receivedOn(formatDateTime(contact.createdAt))}</p>
        </div>
        <AdminStatusPill status={contact.status} />
      </div>
      <p className="mt-4 rounded-2xl bg-secondary/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">{contact.message}</p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {contact.status !== "REPLIED" && contact.status !== "CLOSED" && (
          <button type="button" disabled={busy} onClick={() => onStatus("REPLIED")} className="secondary-action h-9 px-3 text-xs text-emerald-700">
            <CheckCheck size={14} aria-hidden /> {copy.markReplied}
          </button>
        )}
        {contact.status === "CLOSED" ? (
          <button type="button" disabled={busy} onClick={() => onStatus("READ")} className="secondary-action h-9 px-3 text-xs">
            <MailOpen size={14} aria-hidden /> {copy.reopen}
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => onStatus("CLOSED")} className="secondary-action h-9 px-3 text-xs">
            <XCircle size={14} aria-hidden /> {copy.close}
          </button>
        )}
        <ConfirmAction className="h-9 px-3 text-xs" destructive disabled={busy} sheet={{ title: copy.sheets.delete.title, description: copy.sheets.delete.description, confirmLabel: copy.sheets.delete.confirm }} onConfirm={onDelete}>
          <Trash2 size={14} aria-hidden /> {copy.delete}
        </ConfirmAction>
      </div>
    </article>
  );
}

export function Contacts() {
  const { q, page, id, set } = useAdminParams();
  const [status, setStatus] = useState("");
  const params = { q: q || undefined, status: (status || undefined) as ContactStatus | undefined, page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.admin.contacts(params),
    queryFn: () => adminApi(apiClient).contacts(params),
    placeholderData: keepPreviousData,
  });
  const update = useAdminMutation({
    mutationFn: ({ contactId, status: next }: { contactId: string; status: ContactStatus }) => adminApi(apiClient).updateContact(contactId, { status: next }),
    invalidate: [["admin", "contacts"]],
  });
  const remove = useAdminMutation({
    mutationFn: (contactId: string) => adminApi(apiClient).deleteContact(contactId),
    invalidate: [["admin", "contacts"]],
    success: copy.toasts.deleted,
    silent: true,
    onSuccess: () => set({ id: null }),
  });
  const items = query.data?.items ?? [];
  const selected = items.find((contact) => contact.id === id) ?? null;

  // Opening a NEW item marks it READ, once.
  useEffect(() => {
    if (selected?.status === "NEW" && !update.isPending) update.mutate({ contactId: selected.id, status: "READ" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.status]);

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox placeholder={copy.searchPlaceholder} />
        <FilterSelect label={copy.statusFilter} value={status} onChange={(value) => { setStatus(value); set({ page: null, id: null }); }} allLabel={adminCopy.common.all} options={STATUSES.map((value) => ({ value, label: adminCopy.pills[value] }))} />
      </div>
      <SplitPane
        open={selected !== null}
        onBack={() => set({ id: null })}
        placeholder={{ icon: Mail, title: adminCopy.common.selectPrompt }}
        list={
          <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={items.length === 0} empty={{ icon: Mail, title: copy.empty }}>
            <ul className="space-y-2">
              {items.map((contact) => (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => set({ id: contact.id }, { push: true })}
                    aria-current={contact.id === id ? "true" : undefined}
                    className={cn("flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition", contact.id === id ? "border-primary bg-secondary/60" : "border-border bg-white hover:bg-secondary/40")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm text-foreground", contact.status === "NEW" ? "font-extrabold" : "font-semibold")}>{contact.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{contact.subject}</p>
                      <p className="text-[11px] text-muted-foreground">{formatRelative(contact.createdAt)}</p>
                    </div>
                    <AdminStatusPill status={contact.status} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
            <Pagination page={page} total={query.data?.total ?? 0} limit={LIMIT} onPage={(next) => set({ page: next, id: null })} />
          </QueryState>
        }
        detail={selected && (
          <ContactDetail
            contact={selected}
            busy={update.isPending || remove.isPending}
            onStatus={(next) => update.mutate({ contactId: selected.id, status: next }, { onSuccess: () => undefined })}
            onDelete={() => remove.mutateAsync(selected.id)}
          />
        )}
      />
    </section>
  );
}

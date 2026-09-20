"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Archive, ArchiveRestore, ChevronDown, MessageSquarePlus, MessagesSquare, MoreHorizontal, PenLine, RotateCcw, Trash2 } from "lucide-react";
import { assistantApi, queryKeys } from "@kayu/api";
import type { AssistantConversationListItem } from "@kayu/schemas";
import { formatRelativeFr } from "@kayu/utils";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { assistantCopy } from "@/copy/assistant";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = assistantCopy.conversations;
const PAGE_SIZE = 20;
const TITLE_MAX = 80;
const PILL =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-white px-4 text-xs font-bold text-foreground active:scale-[.975] disabled:opacity-55";
// Hidden until the row is hovered or focused, but only in the desktop sidebar with a real pointer:
// the drawer and touch tablets have no hover to reveal it with.
const HOVER_ONLY =
  "[@media(min-width:1024px)_and_(hover:hover)]:size-9 [@media(min-width:1024px)_and_(hover:hover)]:opacity-0 [@media(min-width:1024px)_and_(hover:hover)]:group-hover:opacity-100 [@media(min-width:1024px)_and_(hover:hover)]:group-focus-within:opacity-100 [@media(min-width:1024px)_and_(hover:hover)]:data-[state=open]:opacity-100";
const MENU_ITEM = "min-h-11 gap-2.5 rounded-xl px-3 text-sm font-semibold text-foreground focus:bg-secondary focus:text-foreground";

export type ConversationActions = {
  archive: (id: string) => void;
  unarchive: (id: string) => void;
  rename: (id: string, title: string | null) => void;
  remove: (id: string) => void;
  busy: boolean;
};

function useConversationList(status: "active" | "archived", enabled: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.assistant.conversationList(status),
    queryFn: ({ pageParam }) => assistantApi(apiClient).listConversations({ status, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.reduce((count, page) => count + page.items.length, 0) < last.total ? last.page + 1 : undefined),
    enabled,
  });
}

function RowSkeletons() {
  return (
    <div role="status" aria-label={copy.loading} className="space-y-4 py-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function RenameForm({ item, busy, onSubmit, onCancel }: { item: AssistantConversationListItem; busy: boolean; onSubmit: (title: string | null) => void; onCancel: () => void }) {
  const [value, setValue] = useState(item.title ?? "");
  const fieldId = useId();
  const trimmed = value.trim();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(trimmed === "" ? null : trimmed);
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-xs font-semibold text-foreground">
          {copy.rename.label}
        </label>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {copy.rename.counter(value.length, TITLE_MAX)}
        </span>
      </div>
      <input
        id={fieldId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          onCancel();
        }}
        maxLength={TITLE_MAX}
        autoFocus
        autoComplete="off"
        enterKeyHint="done"
        className="mt-1 min-h-11 w-full rounded-[14px] border border-input bg-white px-3 text-sm text-foreground"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-55">
          {copy.rename.save}
        </button>
        <button type="button" onClick={onCancel} className={PILL}>
          {copy.rename.cancel}
        </button>
        <button type="button" onClick={() => onSubmit(null)} disabled={busy} className={PILL}>
          <RotateCcw size={14} aria-hidden /> {copy.rename.reset}
        </button>
      </div>
    </form>
  );
}

function ConversationRow({
  item,
  current,
  actions,
  onOpen,
  onDelete,
}: {
  item: AssistantConversationListItem;
  current: boolean;
  actions: ConversationActions;
  onOpen: () => void;
  onDelete: (returnTo: HTMLElement | null) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  // Radix hands the focus back to the trigger when the menu closes, which would pull it out of the rename field.
  const keepFocus = useRef(false);
  const title = item.title ?? copy.untitled;
  const archived = item.status === "ARCHIVED";

  const leaveRename = () => {
    setRenaming(false);
    requestAnimationFrame(() => menuButton.current?.focus());
  };

  if (renaming) {
    return (
      <li className="py-0.5">
        <div className="rounded-2xl bg-secondary p-2.5">
          <RenameForm
            item={item}
            busy={actions.busy}
            onCancel={leaveRename}
            onSubmit={(next) => {
              actions.rename(item.id, next);
              leaveRename();
            }}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="py-0.5">
      <div
        className={cn(
          "group relative rounded-2xl transition-colors has-[[data-state=open]]:bg-secondary/70",
          current ? "bg-secondary" : "hover:bg-secondary/60",
        )}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-current={current ? "true" : undefined}
          className="block w-full min-w-0 rounded-2xl py-2.5 pr-12 pl-3 text-left active:scale-[.99]"
        >
          <span className="block truncate text-sm font-bold text-foreground">{title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.preview ?? copy.noPreview}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatRelativeFr(item.lastMessageAt)}</span>
        </button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              ref={menuButton}
              type="button"
              aria-label={copy.rowMenu(title)}
              className={cn(
                "absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-opacity",
                "hover:bg-white hover:text-foreground data-[state=open]:bg-white data-[state=open]:text-foreground",
                HOVER_ONLY,
              )}
            >
              <MoreHorizontal size={18} aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            collisionPadding={12}
            onCloseAutoFocus={(event) => {
              if (!keepFocus.current) return;
              keepFocus.current = false;
              event.preventDefault();
            }}
            className="z-[80] min-w-48 rounded-2xl border-border bg-white p-1.5 shadow-soft-lg"
          >
            <DropdownMenuItem onSelect={onOpen} className={MENU_ITEM}>
              <MessagesSquare aria-hidden /> {copy.actions.open}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                keepFocus.current = true;
                setRenaming(true);
              }}
              className={MENU_ITEM}
            >
              <PenLine aria-hidden /> {copy.actions.rename}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={actions.busy}
              onSelect={() => (archived ? actions.unarchive(item.id) : actions.archive(item.id))}
              className={MENU_ITEM}
            >
              {archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
              {archived ? copy.actions.unarchive : copy.actions.archive}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-1 my-1 bg-border" />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                keepFocus.current = true;
                onDelete(menuButton.current);
              }}
              className={MENU_ITEM}
            >
              <Trash2 aria-hidden /> {copy.actions.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function ConversationList({
  enabled,
  currentId,
  actions,
  newDisabled,
  onNew,
  onOpenConversation,
  onCompose,
}: {
  enabled: boolean;
  currentId: string | null;
  actions: ConversationActions;
  newDisabled: boolean;
  onNew: () => void;
  onOpenConversation: (id: string) => void;
  onCompose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const archivedId = useId();
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [deleting, setDeleting] = useState<{ item: AssistantConversationListItem; returnTo: HTMLElement | null } | null>(null);

  const active = useConversationList("active", enabled);
  const archived = useConversationList("archived", enabled && archivedOpen);
  const activeItems = active.data?.pages.flatMap((page) => page.items) ?? [];
  const archivedItems = archived.data?.pages.flatMap((page) => page.items) ?? [];

  // A row that held the focus can vanish (deleted, archived); inside the drawer the trap and Escape would stop answering.
  useEffect(() => {
    if (document.activeElement === document.body) root.current?.closest<HTMLElement>("[role=dialog]")?.focus();
  });

  // The confirm sheet restores the focus to whatever opened it, which is the menu item that has since unmounted.
  const closeDelete = (confirmed: boolean) => {
    const returnTo = deleting?.returnTo;
    if (confirmed && deleting) actions.remove(deleting.item.id);
    setDeleting(null);
    requestAnimationFrame(() => {
      if (!confirmed && returnTo?.isConnected) return returnTo.focus();
      const first = root.current?.querySelector<HTMLElement>("button:not([disabled])");
      (first ?? root.current?.closest<HTMLElement>("[role=dialog]"))?.focus();
    });
  };

  const rows = (items: AssistantConversationListItem[]) => (
    <ul>
      {items.map((item) => (
        <ConversationRow
          key={item.id}
          item={item}
          current={item.id === currentId}
          actions={actions}
          onOpen={() => onOpenConversation(item.id)}
          onDelete={(returnTo) => setDeleting({ item, returnTo })}
        />
      ))}
    </ul>
  );

  const more = (list: ReturnType<typeof useConversationList>) =>
    list.hasNextPage && (
      <button type="button" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage} className={cn(PILL, "mt-2 w-full justify-center")}>
        {copy.more}
      </button>
    );

  const failed = (list: ReturnType<typeof useConversationList>) => (
    <div role="alert" className="px-1 py-3">
      <p className="text-xs font-semibold text-destructive">{copy.loadError}</p>
      <button type="button" onClick={() => void list.refetch()} className={cn(PILL, "mt-2")}>
        <RotateCcw size={14} aria-hidden /> {copy.retry}
      </button>
    </div>
  );

  return (
    <div ref={root}>
      <button
        type="button"
        onClick={onNew}
        disabled={newDisabled}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground active:scale-[.975] disabled:opacity-45"
      >
        <MessageSquarePlus size={16} aria-hidden /> {copy.new}
      </button>

      <section aria-label={copy.active} className="mt-5">
        <h3 className="px-1 text-[10px] font-extrabold tracking-[0.19em] text-muted-foreground uppercase">{copy.active}</h3>
        {!enabled || active.isPending ? (
          <RowSkeletons />
        ) : active.isError ? (
          failed(active)
        ) : activeItems.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title={copy.empty.title}
            description={copy.empty.body}
            className="mt-3 p-5"
            action={
              <button type="button" onClick={onCompose} className="secondary-action">
                {copy.empty.action}
              </button>
            }
          />
        ) : (
          <div className="mt-1">
            {rows(activeItems)}
            {more(active)}
          </div>
        )}
      </section>

      <section aria-label={copy.archived} className="mt-4 border-t border-border pt-1">
        <h3>
          <button
            type="button"
            onClick={() => setArchivedOpen((value) => !value)}
            aria-expanded={archivedOpen}
            aria-controls={archivedId}
            className="flex min-h-11 w-full items-center justify-between gap-2 px-1 text-[10px] font-extrabold tracking-[0.19em] text-muted-foreground uppercase"
          >
            {copy.archived}
            <ChevronDown size={16} aria-hidden className={cn("transition-transform", archivedOpen && "rotate-180")} />
          </button>
        </h3>
        <div id={archivedId}>
          {archivedOpen &&
            (archived.isPending ? (
              <RowSkeletons />
            ) : archived.isError ? (
              failed(archived)
            ) : archivedItems.length === 0 ? (
              <div className="empty-state mb-2 flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                <Archive size={15} aria-hidden /> {copy.archivedEmpty}
              </div>
            ) : (
              <>
                {rows(archivedItems)}
                {more(archived)}
              </>
            ))}
        </div>
      </section>

      <ConfirmSheet
        open={deleting !== null}
        onClose={() => closeDelete(false)}
        title={copy.delete.title}
        description={copy.delete.body}
        confirmLabel={copy.delete.confirm}
        cancelLabel={copy.delete.cancel}
        tone="danger"
        onConfirm={() => closeDelete(true)}
      />
    </div>
  );
}

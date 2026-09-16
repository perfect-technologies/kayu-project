"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminUpdateUserDto, AdminUser, UserRole } from "@kayu/schemas";
import { Eye, ShieldCheck, ShieldOff, UserCog, Users as UsersIcon } from "lucide-react";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { AdminTable } from "../_components/AdminTable";
import { ConfirmAction } from "../_components/ConfirmAction";
import { FilterSelect } from "../_components/FilterSelect";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { formatDate } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";
import { UserSheet } from "./UserSheet";

const copy = adminCopy.users;
const LIMIT = 50;
const ROLES: UserRole[] = ["CLIENT", "PROVIDER", "ADMIN"];
const COLUMNS = [
  { key: "member", label: copy.columns.member },
  { key: "role", label: copy.columns.role },
  { key: "place", label: copy.columns.place },
  { key: "joined", label: copy.columns.joined },
  { key: "actions", label: "", className: "text-right" },
];

export function Users() {
  const { q, page, id, set } = useAdminParams();
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [suspended, setSuspended] = useState("");

  const params = {
    q: q || undefined,
    role: (role || undefined) as UserRole | undefined,
    suspended: suspended === "" ? undefined : suspended === "true",
    page,
    limit: LIMIT,
  };
  const query = useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminApi(apiClient).users(params),
    placeholderData: keepPreviousData,
  });
  const update = useAdminMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: AdminUpdateUserDto }) => adminApi(apiClient).updateUser(userId, dto),
    invalidate: [["admin", "users"], ["admin", "providers"]],
    success: (_result, { dto }) =>
      dto.role !== undefined ? (dto.role === "ADMIN" ? copy.toasts.promoted : copy.toasts.demoted) : dto.suspended ? copy.toasts.suspended : copy.toasts.unsuspended,
    silent: true,
  });

  const actions = (user: AdminUser) => {
    const self = user.id === me?.id;
    const roleLocked = self || user.role === "PROVIDER" || user.provider !== null;
    const isAdmin = user.role === "ADMIN";
    const roleSheet = isAdmin ? copy.sheets.demote : copy.sheets.promote;
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <ConfirmAction
          className="h-9 px-3 text-xs"
          disabled={roleLocked}
          title={self ? adminCopy.common.self : user.role === "PROVIDER" || user.provider ? copy.roleLocked : undefined}
          sheet={{ title: roleSheet.title, description: roleSheet.description, confirmLabel: roleSheet.confirm }}
          onConfirm={() => update.mutateAsync({ userId: user.id, dto: { role: isAdmin ? "CLIENT" : "ADMIN" } })}
        >
          <UserCog size={14} aria-hidden /> {isAdmin ? copy.demote : copy.promote}
        </ConfirmAction>
        {user.isActive ? (
          <ConfirmAction
            className="h-9 px-3 text-xs"
            destructive
            disabled={self}
            title={self ? adminCopy.common.self : undefined}
            sheet={{
              title: copy.sheets.suspend.title,
              description: copy.sheets.suspend.description,
              confirmLabel: copy.sheets.suspend.confirm,
              reason: { label: copy.sheets.suspend.reason, placeholder: copy.sheets.suspend.placeholder, required: true },
            }}
            onConfirm={(reason) => update.mutateAsync({ userId: user.id, dto: { suspended: true, suspendedReason: reason } })}
          >
            <ShieldOff size={14} aria-hidden /> {copy.suspend}
          </ConfirmAction>
        ) : (
          <ConfirmAction
            className="h-9 px-3 text-xs"
            disabled={self}
            sheet={{ title: copy.sheets.unsuspend.title, description: copy.sheets.unsuspend.description, confirmLabel: copy.sheets.unsuspend.confirm }}
            onConfirm={() => update.mutateAsync({ userId: user.id, dto: { suspended: false, suspendedReason: null } })}
          >
            <ShieldCheck size={14} aria-hidden /> {copy.unsuspend}
          </ConfirmAction>
        )}
        <button type="button" onClick={() => set({ id: user.id }, { push: true })} className="secondary-action h-9 px-3 text-xs">
          <Eye size={14} aria-hidden /> {adminCopy.common.view}
        </button>
      </div>
    );
  };

  const member = (user: AdminUser) => (
    <div className="flex min-w-0 items-center gap-3">
      <MiniAvatar src={user.avatar} name={user.name} size={40} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
          <span className="truncate">{user.name}</span>
          {user.id === me?.id && <span className="text-[11px] font-semibold text-muted-foreground">({adminCopy.common.me})</span>}
          {!user.isActive && <AdminStatusPill status="SUSPENDED" className="h-6" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.phone ?? user.email ?? adminCopy.common.none}</p>
        {user.provider?.hidden && !user.isActive && <p className="text-[11px] text-muted-foreground italic">{copy.hiddenProvider}</p>}
      </div>
    </div>
  );

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <AdminTable
        columns={COLUMNS}
        rows={query.data?.items ?? []}
        keyOf={(user) => user.id}
        rowClassName={(user) => (user.isActive ? undefined : "bg-red-50/40")}
        cells={(user) => [
          member(user),
          <AdminStatusPill key="role" status={user.role} />,
          <span key="place" className="text-sm text-muted-foreground">{user.placeLabel ?? adminCopy.common.none}</span>,
          <span key="joined" className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(user.createdAt)}</span>,
          actions(user),
        ]}
        card={(user) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              {member(user)}
              <AdminStatusPill status={user.role} />
            </div>
            <p className="text-xs text-muted-foreground">
              {user.placeLabel ?? adminCopy.common.none} · {formatDate(user.createdAt)}
            </p>
            {actions(user)}
          </div>
        )}
        toolbar={
          <>
            <SearchBox placeholder={copy.searchPlaceholder} />
            <FilterSelect label={copy.roleFilter} value={role} onChange={(value) => { setRole(value); set({ page: null }); }} allLabel={adminCopy.common.all} options={ROLES.map((value) => ({ value, label: adminCopy.pills[value] }))} />
            <FilterSelect label={copy.suspendedFilter} value={suspended} onChange={(value) => { setSuspended(value); set({ page: null }); }} allLabel={adminCopy.common.all} options={[{ value: "false", label: copy.activeOnly }, { value: "true", label: copy.suspendedOnly }]} />
          </>
        }
        pagination={{ page, total: query.data?.total ?? 0, limit: LIMIT, onPage: (next) => set({ page: next }) }}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        empty={{ icon: UsersIcon, title: copy.empty }}
      />
      <UserSheet userId={id} onClose={() => set({ id: null })} />
    </section>
  );
}

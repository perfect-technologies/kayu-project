"use client";

import { Phone, ShieldCheck, User } from "lucide-react";
import type { MeUser } from "@kayu/schemas";
import { formatMonthYear } from "@/components/bookings/format";
import type { AuthUser } from "@/contexts/AuthContext";
import { compteCopy } from "@/copy/compte";
import { cn } from "@/lib/utils";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";

const copy = compteCopy.header;

function displayName(user: AuthUser): string {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || copy.unnamed;
}

/** Emerald→teal cover, overlapping avatar, name, phone / role chips and "Membre depuis". */
export function ProfileHeaderCard({ user, me }: { user: AuthUser; me: MeUser | undefined }) {
  const name = displayName(user);
  const isProvider = user.role === "PROVIDER";
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
      <div aria-hidden className="h-16 bg-gradient-to-r from-emerald-700 to-teal-700" />
      <div className="px-5 pb-6 text-center">
        <div className="-mt-12">
          <ProfilePhotoUploader src={user.avatar} name={name} />
        </div>
        <h2 className="mt-3 text-xl font-extrabold text-foreground">{name}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {user.phone && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold text-foreground">
              <Phone size={13} aria-hidden /> {user.phone}
            </span>
          )}
          <span
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
              isProvider ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground",
            )}
          >
            <User size={13} aria-hidden /> {isProvider ? copy.roles.PROVIDER : copy.roles.CLIENT}
          </span>
          {user.role === "ADMIN" && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-50 px-3 text-xs font-semibold text-amber-700">
              <ShieldCheck size={13} aria-hidden /> {copy.roles.ADMIN}
            </span>
          )}
        </div>
        {me?.createdAt && <p className="mt-3 text-xs text-muted-foreground">{copy.memberSince(formatMonthYear(me.createdAt))}</p>}
      </div>
    </section>
  );
}

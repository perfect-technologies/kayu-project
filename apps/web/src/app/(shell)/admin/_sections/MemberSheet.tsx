import type { AdminUserCvResponse, BookingStatus } from "@kayu/schemas";
import { BadgeCheck, CalendarDays, Mail, MapPin, Phone, ShieldOff, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { adminCopy } from "@/copy/admin";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { formatCdf, formatDateTime, formatLongDate } from "../_components/format";

const copy = adminCopy.sheet;
const BOOKING_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

function Row({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-emerald-100">
      <Icon size={14} aria-hidden className="mt-0.5 shrink-0 text-accent" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function Chip({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "gold" }) {
  return (
    <span className={tone === "gold" ? "rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground" : "rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white"}>
      {children}
    </span>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="text-[11px] font-bold tracking-wider text-primary uppercase">{title}</h3>
      <div className="mt-2 space-y-1.5 text-sm text-foreground">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="flex flex-wrap justify-between gap-x-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </p>
  );
}

function bookingsLine(counts: Record<BookingStatus, number>): string {
  const parts = BOOKING_STATUSES.filter((status) => counts[status] > 0).map((status) => `${counts[status]} ${adminCopy.pills[status].toLowerCase()}`);
  return parts.length > 0 ? parts.join(" · ") : "0";
}

function scheduleLine(summary: NonNullable<AdminUserCvResponse["provider"]>["scheduleSummary"]): string {
  return summary
    .map((day) => `${copy.days[day.dayOfWeek]} ${day.ranges.length > 0 ? day.ranges.map((range) => `${range.startTime}–${range.endTime}`).join(", ") : copy.closed}`)
    .join(" · ");
}

/** The printable member sheet (`#member-sheet`): emerald banner, dark sidebar, detail column. */
export function MemberSheet({ data }: { data: AdminUserCvResponse }) {
  const { user, provider, activity } = data;
  const job = provider ? (provider.categoryChain[provider.categoryChain.length - 1]?.name ?? copy.jobFallback.provider) : copy.jobFallback.member;
  const place = (provider?.placeChain.length ? provider.placeChain : user.placeChain).map((item) => item.label).reverse().join(", ");
  const verified = provider?.verificationStatus === "VERIFIED";

  return (
    <article id="member-sheet" className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="relative h-24 bg-primary bg-[radial-gradient(ellipse_at_100%_0%,var(--color-teal-700)_0,transparent_60%)]">
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          <Sparkles size={12} aria-hidden /> {copy.brand}
        </span>
      </div>
      <div className="grid md:grid-cols-3">
        <aside className="relative -mt-12 bg-primary p-6 text-emerald-50">
          <div className="flex flex-col items-center text-center">
            <MiniAvatar src={provider?.profilePhoto ?? user.avatar} name={user.name} size={96} className="rounded-2xl ring-4 ring-white/20" />
            <h2 className="mt-3 text-xl font-extrabold text-white">{provider?.displayName ?? user.name}</h2>
            <p className="mt-1 text-sm font-medium text-accent">{job}</p>
            {provider && provider.effectivePremiumTier !== "FREE" && <AdminStatusPill status={provider.effectivePremiumTier} className="mt-2" />}
          </div>
          <div className="mt-6 space-y-2.5">
            <Row icon={Phone}>{user.phone ?? adminCopy.common.none}</Row>
            <Row icon={Mail}>{user.email ?? adminCopy.common.none}</Row>
            <Row icon={MapPin}>{place || user.placeLabel || user.country}</Row>
            <Row icon={CalendarDays}>{copy.memberSince(formatLongDate(user.createdAt))}</Row>
          </div>
          <div className="mt-6">
            <p className="text-[11px] font-bold tracking-wider text-emerald-300/80 uppercase">{copy.identity}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>{adminCopy.pills[provider ? "PROVIDER" : "CLIENT"]}</Chip>
              {user.role === "ADMIN" && <Chip tone="gold">{adminCopy.pills.ADMIN}</Chip>}
              {verified && (
                <Chip>
                  <BadgeCheck size={12} aria-hidden className="mr-1 inline" />
                  {copy.verified}
                </Chip>
              )}
            </div>
          </div>
        </aside>
        <div className="space-y-6 p-6 md:col-span-2">
          <Block title={copy.about}>
            <p className="leading-relaxed whitespace-pre-line">{provider?.description ?? user.bio ?? copy.noAbout}</p>
            {provider?.yearsExperience != null && <p className="text-muted-foreground">{copy.years(provider.yearsExperience)}</p>}
            {provider && provider.skills.length + provider.freeSkills.length > 0 && (
              <p>
                <span className="text-muted-foreground">{copy.skills} : </span>
                {[...provider.skills.map((skill) => skill.label), ...provider.freeSkills].join(", ")}
              </p>
            )}
            {provider && provider.languages.length > 0 && (
              <p>
                <span className="text-muted-foreground">{copy.languages} : </span>
                {provider.languages.map((item) => item.label).join(", ")}
              </p>
            )}
          </Block>
          <Block title={copy.location}>
            <Line label={copy.phone} value={provider?.contacts.phone ?? user.phone ?? adminCopy.common.none} />
            {provider && <Line label={copy.whatsapp} value={provider.contacts.whatsapp ?? adminCopy.common.none} />}
            <Line label={copy.place} value={place || adminCopy.common.none} />
            {provider && <Line label={copy.address} value={provider.contacts.addressLine ?? adminCopy.common.none} />}
            {provider && provider.interventionModes.length > 0 && <Line label={copy.modes} value={provider.interventionModes.map((item) => item.label).join(", ")} />}
            {provider?.pricing && (
              <Line label={copy.pricing} value={`${provider.pricing.amount} ${provider.pricing.currency?.label ?? ""} ${provider.pricing.unit ? `/ ${provider.pricing.unit.label}` : ""}`.trim()} />
            )}
            {provider && <p className="text-xs text-muted-foreground">{copy.schedule} : {scheduleLine(provider.scheduleSummary)}</p>}
            {provider && <Line label={copy.verification} value={<AdminStatusPill status={provider.verificationStatus} className="h-6" />} />}
          </Block>
          <Block title={copy.activity}>
            <Line label={copy.bookingsAsClient} value={bookingsLine(activity.bookingsAsClient)} />
            {provider && <Line label={copy.bookingsAsProvider} value={bookingsLine(activity.bookingsAsProvider)} />}
            <Line label={copy.reviewsGiven} value={activity.reviewsGiven} />
            {provider && <Line label={copy.reviewsReceived} value={`★ ${activity.reviewsReceived.avg.toFixed(1)} · ${activity.reviewsReceived.count}`} />}
            <Line label={copy.clientRating} value={`★ ${activity.clientRating.avg.toFixed(1)} · ${activity.clientRating.count}`} />
            <Line label={copy.reports} value={copy.reportsLine(activity.reportsFiled, activity.reportsAgainst)} />
            {provider && <Line label={copy.earnings} value={formatCdf(activity.earningsNet)} />}
            <Line label={copy.lastLogin} value={activity.lastLoginAt ? formatDateTime(activity.lastLoginAt) : copy.never} />
          </Block>
          <Block title={copy.security}>
            {user.isActive ? (
              <p className="inline-flex items-center gap-2 text-emerald-700">
                <BadgeCheck size={16} aria-hidden /> {copy.activeAccount}
              </p>
            ) : (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <ShieldOff size={16} aria-hidden /> {copy.suspendedSince(formatLongDate(user.suspendedAt))}
                </p>
                {user.suspendedReason && <p className="mt-1 text-sm">{user.suspendedReason}</p>}
              </div>
            )}
          </Block>
        </div>
      </div>
    </article>
  );
}

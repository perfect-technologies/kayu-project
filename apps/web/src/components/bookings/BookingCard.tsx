"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { tokens } from "@kayu/ui";
import { I } from "@kayu/ui/web";
import { useRouter } from "next/navigation";
import {
  categoryFromTitle,
  formatWhen,
  fullAddress,
  initialsFromName,
  priceLabelFor,
  toV2Status,
  type V2Status,
} from "@/lib/booking-v2";
import { BookingStatusChip } from "./BookingStatusChip";

export interface BookingCardData {
  id: string;
  title: string;
  status: string;
  scheduledDate?: string | Date | null;
  address?: string | null;
  city?: string | null;
  price?: number | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  providerId?: string | null;
  provider?: {
    profession?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      isVerified?: boolean | null;
    } | null;
  } | null;
  client?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  // client-only overlays — synthesized by caller for "live" missions
  progress?: string | null;
  myRating?: number | null;
  reviewed?: boolean | null;
  cancelledBy?: "provider" | "client" | null;
}

export function BookingCard({
  booking,
  perspective = "client",
  compact = false,
}: {
  booking: BookingCardData;
  perspective?: "client" | "pro";
  compact?: boolean;
}) {
  const router = useRouter();
  const v2Status = toV2Status(booking.status);
  const categorySlug = categoryFromTitle(booking.title);
  const portfolio = tokens.portfolio[categorySlug];
  const when = formatWhen(booking.scheduledDate);
  const address = fullAddress(booking);

  const counterparty =
    perspective === "client"
      ? {
          first: booking.provider?.user?.firstName ?? "",
          last: booking.provider?.user?.lastName ?? "",
          verified: !!booking.provider?.user?.isVerified,
        }
      : {
          first: booking.client?.firstName ?? "",
          last: booking.client?.lastName ?? "",
          verified: false,
        };
  const counterName = `${counterparty.first} ${counterparty.last}`.trim() || "—";

  const onOpen = () => {
    router.push(`/bookings/${booking.id}`);
  };

  const padding = compact ? 14 : 18;

  return (
    <button
      onClick={onOpen}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--k-surface)",
        border: "1px solid var(--k-border-subtle)",
        borderRadius: 16,
        padding,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        transition: "box-shadow 160ms var(--k-ease-std), transform 120ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 8px 24px -12px rgba(15,23,42,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 1px 2px rgba(15,23,42,0.03)";
      }}
    >
      {/* Header: when + status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <I.calendar size={14} strokeColor="var(--k-text-muted)" />
          <span
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--k-text-body)",
            }}
          >
            {when}
          </span>
        </div>
        <BookingStatusChip status={v2Status} />
      </div>

      {/* Body: work-tile + content */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <WorkTile category={categorySlug} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 600,
              fontSize: 15.5,
              color: "var(--k-text-primary)",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {booking.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Avatar style={{ width: 18, height: 18 }}>
              <AvatarFallback
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  background: portfolio.accent,
                  color: "#fff",
                }}
              >
                {initialsFromName(counterparty.first, counterparty.last)}
              </AvatarFallback>
            </Avatar>
            <span
              className="k-body-m"
              style={{ color: "var(--k-text-muted)", fontSize: 13 }}
            >
              {counterName}
            </span>
            {counterparty.verified && (
              <I.badgeCheck size={12} strokeColor="var(--k-success)" />
            )}
          </div>
          <div
            className="k-caption"
            style={{
              color: "var(--k-text-muted)",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <I.mapPin size={11} />
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {address}
            </span>
          </div>
        </div>
      </div>

      {/* Progress banner (active only) */}
      {booking.progress && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "var(--k-success-subtle)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#047857",
            fontWeight: 500,
          }}
        >
          <I.mapPin size={14} />
          {booking.progress}
        </div>
      )}

      {/* Footer: price + context action */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px dashed var(--k-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div>
          <span
            className="k-price"
            style={{ fontSize: 15, color: "var(--k-text-primary)" }}
          >
            {(booking.price ?? 0).toLocaleString("fr-FR")} FC
          </span>
          <span
            className="k-caption"
            style={{ marginLeft: 6, color: "var(--k-text-muted)" }}
          >
            · {priceLabelFor(booking)}
          </span>
        </div>
        <FooterAction
          v2Status={v2Status}
          reviewed={booking.reviewed}
          myRating={booking.myRating}
          cancelledBy={booking.cancelledBy}
          perspective={perspective}
        />
      </div>
    </button>
  );
}

function FooterAction({
  v2Status,
  reviewed,
  myRating,
  cancelledBy,
  perspective,
}: {
  v2Status: V2Status;
  reviewed?: boolean | null;
  myRating?: number | null;
  cancelledBy?: "provider" | "client" | null;
  perspective: "client" | "pro";
}) {
  if (v2Status === "completed" && perspective === "client" && !reviewed) {
    return (
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--k-primary-hover)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Laisser un avis <I.arrowRight size={12} />
      </span>
    );
  }
  if (v2Status === "completed" && reviewed && myRating != null) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color: "var(--k-warning)",
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        <I.star size={12} />
        <span className="k-num" style={{ color: "var(--k-text-primary)" }}>
          {myRating.toFixed(1)}
        </span>
      </span>
    );
  }
  if (v2Status === "cancelled" && cancelledBy) {
    return (
      <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>
        {cancelledBy === "provider"
          ? perspective === "client"
            ? "Par le pro"
            : "Par vous"
          : perspective === "client"
            ? "Par vous"
            : "Par le client"}
      </span>
    );
  }
  return null;
}

function WorkTile({ category }: { category: keyof typeof tokens.portfolio }) {
  const p = tokens.portfolio[category];
  const IconCmp = I[p.iconName as keyof typeof I] ?? I.wrench;
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        flexShrink: 0,
        position: "relative",
        background: p.bg,
        backgroundImage: `radial-gradient(circle at 25% 25%, ${p.accent}2a 0%, transparent 60%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: p.accent,
      }}
    >
      <IconCmp size={24} />
    </div>
  );
}

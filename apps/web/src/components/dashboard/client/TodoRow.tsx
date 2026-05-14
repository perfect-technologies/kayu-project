import Link from "next/link";
import { I } from "@kayu/ui/web";
import { formatMoneyFc } from "@kayu/ui";
import { formatRelativeShort, type TodoItem } from "./dashboardHelpers";

export function TodoRow({ item, isFirst }: { item: TodoItem; isFirst: boolean }) {
  const isReview = item.kind === "review";
  const Icon = isReview ? I.star : I.messageCircle;
  const iconBg = isReview ? "#FEF3C7" : "#E0E7FF";
  const iconFg = isReview ? "#92400E" : "#4338CA";

  let title: string;
  let meta: string;
  let href: string;
  let cta: string;

  if (item.kind === "review") {
    title = `Note ton ${item.data.title.toLowerCase()} avec ${item.data.provider.firstName}`;
    meta = `Terminé ${formatRelativeShort(item.data.completedAt)} · ${formatMoneyFc(item.data.price)}`;
    href = `/bookings/${item.data.bookingId}`;
    cta = "Noter →";
  } else {
    const n = item.data.unreadCount;
    title =
      n > 1
        ? `${item.data.provider.firstName} t'a écrit · ${n} messages`
        : `${item.data.provider.firstName} t'a envoyé un message`;
    meta = item.data.lastMessagePreview
      ? `« ${item.data.lastMessagePreview} »`
      : `Conversation · ${formatRelativeShort(item.data.lastMessageAt)}`;
    href = `/messages?conversation=${item.data.conversationId}`;
    cta = "Répondre →";
  }

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: iconBg,
          color: iconFg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {meta}
        </div>
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          background: "#F1F5F9",
          padding: "6px 10px",
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        {cta}
      </span>
    </Link>
  );
}

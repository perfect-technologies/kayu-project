"use client";

import { I } from "@kayu/ui/web";

export type TodoRowItem =
  | {
      key: string;
      kind: "extra_pending";
      title: string;
      meta: string;
      href: string;
      cta: string;
    }
  | {
      key: string;
      kind: "close_overdue";
      title: string;
      meta: string;
      href: string;
      cta: string;
    }
  | {
      key: string;
      kind: "unread_message";
      title: string;
      meta: string;
      href: string;
      cta: string;
    };

const KIND_STYLE: Record<
  TodoRowItem["kind"],
  { bg: string; color: string; icon: keyof typeof I }
> = {
  close_overdue: { bg: "#FEE2E2", color: "#B91C1C", icon: "alertTriangle" },
  extra_pending: { bg: "#FEF3C7", color: "#92400E", icon: "clock" },
  unread_message: { bg: "#E0E7FF", color: "#4338CA", icon: "messageCircle" },
};

export function TodoRow({ item, isFirst }: { item: TodoRowItem; isFirst: boolean }) {
  const palette = KIND_STYLE[item.kind];
  const Icon = (I as Record<string, React.ComponentType<{ size?: number }>>)[palette.icon] ?? I.check;

  return (
    <a
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        color: "var(--k-text-primary)",
        textDecoration: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: palette.bg,
          color: palette.color,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.meta}
        </div>
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          padding: "6px 10px",
          background: "#F1F5F9",
          borderRadius: "var(--k-r-md)",
          flexShrink: 0,
          color: "var(--k-text-primary)",
        }}
      >
        {item.cta} →
      </span>
    </a>
  );
}

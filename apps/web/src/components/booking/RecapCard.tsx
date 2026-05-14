"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
  onEdit: () => void;
  children: ReactNode;
}

export function RecapCard({ title, icon: Icon, onEdit, children }: Props) {
  return (
    <div
      className="mb-3"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "14px 16px",
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="k-overline inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--k-text-body)" }} />
          {title}
        </div>
        <button
          onClick={onEdit}
          className="text-[12px] font-semibold"
          style={{ color: "var(--k-primary)", background: "none", border: 0, cursor: "pointer" }}
        >
          Modifier
        </button>
      </div>
      <div className="text-[14px]" style={{ color: "var(--k-text-primary)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

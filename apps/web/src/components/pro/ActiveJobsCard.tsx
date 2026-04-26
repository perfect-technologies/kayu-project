"use client";

import { Avatar, I } from "@kayu/ui/web";
import type { ActiveJob, ActiveJobStatus } from "./types";

const STATUS_COPY: Record<
  ActiveJobStatus,
  { label: string; color: string; bg: string; pulse?: boolean }
> = {
  scheduled: {
    label: "Planifié",
    color: "var(--k-primary)",
    bg: "var(--k-primary-subtle)",
  },
  in_progress: {
    label: "Confirmé",
    color: "var(--k-success)",
    bg: "var(--k-success-subtle)",
    pulse: true,
  },
};

export function ActiveJobsCard({
  jobs,
  mobile = false,
  onSelect,
}: {
  jobs: ActiveJob[];
  mobile?: boolean;
  onSelect?: (job: ActiveJob) => void;
}) {
  if (jobs.length === 0) return null;
  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-md)",
        boxShadow: "var(--k-e1)",
        overflow: "hidden",
      }}
    >
      {jobs.map((job, idx) => {
        const st = STATUS_COPY[job.status];
        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect?.(job)}
            style={{
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: 0,
              borderTop:
                idx === 0 ? "none" : "1px solid var(--k-border-subtle)",
              padding: mobile ? "12px 14px" : "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "var(--font-body)",
            }}
          >
            <Avatar
              name={job.client.name}
              bg={job.client.bg}
              size={40}
              initials={job.client.initials}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 14.5,
                  color: "var(--k-ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {job.service}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--k-text-muted)",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {job.client.name} · {job.when}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: st.bg,
                  color: st.color,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {st.pulse && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: st.color,
                      animation: "kpulse 1.4s ease-in-out infinite",
                    }}
                  />
                )}
                {st.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--k-ink)",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {job.payout.toLocaleString("fr-FR")} FC
              </span>
            </div>
            <I.chevronRight
              size={16}
              strokeColor="var(--k-text-subtle)"
              style={{ flexShrink: 0 }}
            />
          </button>
        );
      })}
    </div>
  );
}

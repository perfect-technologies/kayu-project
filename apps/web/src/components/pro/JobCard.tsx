"use client";

import { Avatar, Chip, I } from "@kayu/ui/web";
import type { DashboardJob, JobStatus } from "./types";

function StatusPill({ status }: { status: JobStatus }) {
  if (status === "en_route") {
    return (
      <Chip variant="warning" size="sm" leadingIcon={<I.clock size={11} />}>
        En route
      </Chip>
    );
  }
  if (status === "confirmed") {
    return (
      <Chip variant="success" size="sm">
        Confirmé
      </Chip>
    );
  }
  return (
    <Chip variant="neutral" size="sm">
      Terminé
    </Chip>
  );
}

export function JobCard({
  job,
  mobile = false,
  onClick,
}: {
  job: DashboardJob;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-md)",
        padding: mobile ? 14 : 18,
        display: "grid",
        gridTemplateColumns: mobile ? "auto 1fr" : "auto 1fr auto",
        gap: mobile ? 12 : 18,
        alignItems: "center",
        boxShadow: "var(--k-e1)",
        transition:
          "box-shadow 140ms var(--k-ease-std), transform 140ms var(--k-ease-std)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "var(--k-e2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "var(--k-e1)";
      }}
    >
      {/* Time block */}
      <div
        style={{
          width: 60,
          textAlign: "center",
          paddingRight: 12,
          borderRight: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 19,
            color: "var(--k-text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {job.time}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--k-text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {job.duration}
        </div>
      </div>

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--k-text-primary)",
            }}
          >
            {job.kind}
          </span>
          <StatusPill status={job.status} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            name={job.client.name}
            bg={job.client.bg}
            size={22}
            initials={job.client.initials}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--k-text-body)",
            }}
          >
            {job.client.name}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--k-text-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontFamily: "var(--font-body)",
            }}
          >
            <I.mapPin size={11} /> {job.address} · {job.distance} km
          </span>
        </div>
      </div>

      {/* Fee + CTA (web only) */}
      {!mobile && (
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--k-text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {job.fee.toLocaleString("fr-FR")} FC
          </div>
          <button
            type="button"
            className="k-btn k-btn-primary k-btn-sm"
            style={{ marginTop: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Détails <I.chevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

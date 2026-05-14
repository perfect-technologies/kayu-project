"use client";

import { MessageCircle, Phone } from "lucide-react";

interface MobileStickyBarProps {
  hourlyFormatted: string | null;
  phone: string | null;
  allowMessages: boolean;
  isOwnProfile: boolean;
  onBook: () => void;
  onContact: () => void;
  onDashboard: () => void;
}

export function MobileStickyBar(props: MobileStickyBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 md:hidden"
      style={{
        background: "var(--k-surface)",
        borderTop: "1px solid var(--k-border)",
        boxShadow: "0 -4px 20px -8px rgba(15,23,42,0.1)",
      }}
    >
      <div className="min-w-0 flex-shrink">
        {props.hourlyFormatted ? (
          <>
            <div style={{ fontSize: 9, color: "var(--k-text-muted)" }}>À partir de</div>
            <div>
              <span
                style={{
                  fontFamily: "var(--k-font-mono)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--k-text-primary)",
                }}
              >
                {props.hourlyFormatted} FC
              </span>
              <span style={{ fontSize: 9, color: "var(--k-text-muted)", marginLeft: 2 }}>/h</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--k-text-primary)" }}>À convenir</div>
            <div style={{ fontSize: 10, color: "var(--k-text-muted)" }}>Discussion puis offre finale</div>
          </>
        )}
      </div>
      <div className="flex-1" />

      {props.isOwnProfile ? (
        <button
          type="button"
          onClick={props.onDashboard}
          className="k-btn"
          style={{ height: 44, padding: "0 22px", background: "var(--k-surface)", border: "1px solid var(--k-border)" }}
        >
          Tableau de bord
        </button>
      ) : (
        <>
          {props.phone && (
            <a
              href={`tel:${props.phone}`}
              aria-label="Appeler"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--k-text-primary)",
              }}
            >
              <Phone className="h-[16px] w-[16px]" aria-hidden="true" />
            </a>
          )}
          {props.allowMessages && (
            <button
              type="button"
              onClick={props.onContact}
              aria-label="Message"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--k-text-primary)",
              }}
            >
              <MessageCircle className="h-[16px] w-[16px]" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="k-btn k-btn-primary"
            style={{ height: 40, padding: "0 18px", borderRadius: 999, fontWeight: 600 }}
            onClick={props.onBook}
          >
            Réserver
          </button>
        </>
      )}
    </div>
  );
}

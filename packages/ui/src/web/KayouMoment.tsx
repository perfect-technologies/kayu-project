"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { Button } from "./Button.js";
import { I } from "./Icon.js";

// localStorage key — mirrored by mobile's secure-store key.
export const FIRST_BOOKING_KEY = "kayou:firstBookingShown";

export const hasSeenKayouMoment = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FIRST_BOOKING_KEY) === "1";
  } catch {
    return false;
  }
};

export const markKayouMomentSeen = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FIRST_BOOKING_KEY, "1");
  } catch {
    /* storage disabled — arc still runs, just re-runs next time */
  }
};

export type KayouMomentProps = {
  provider: {
    firstName: string;
    initials?: string;
    avatarBg?: string;
    response?: string;
  };
  client?: {
    initials?: string;
    bg?: string;
    name?: string;
  };
  reference?: string;
  dateLabel?: string;
  /** Force arc on/off. If omitted, auto-detects first booking via localStorage. */
  showArc?: boolean;
  onMessage?: () => void;
  onViewBooking?: () => void;
};

const W = 320;
const H = 120;
const CLIENT_X = 40;
const PROV_X = W - 40;
const END_Y = H - 30;
const CTRL_X = W / 2;
const CTRL_Y = 10;
const ARC_PATH = `M ${CLIENT_X} ${END_Y} Q ${CTRL_X} ${CTRL_Y} ${PROV_X} ${END_Y}`;

export const KayouMoment: React.FC<KayouMomentProps> = ({
  provider,
  client = { initials: "AM", bg: tokens.color.accent },
  reference = "#KY-4829-AM",
  dateLabel = "Mer. 18 avril · 10:00",
  showArc: showArcProp,
  onMessage,
  onViewBooking,
}) => {
  const [phase, setPhase] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [showArc, setShowArc] = React.useState<boolean>(showArcProp ?? true);

  React.useEffect(() => {
    if (showArcProp !== undefined) {
      setShowArc(showArcProp);
      return;
    }
    if (hasSeenKayouMoment()) setShowArc(false);
    else {
      setShowArc(true);
      markKayouMomentSeen();
    }
  }, [showArcProp]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) {
      setPhase(2);
      return;
    }
    const t1 = window.setTimeout(() => setPhase(1), 300);
    const t2 = window.setTimeout(() => setPhase(2), 2300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reducedMotion]);

  const animate = !reducedMotion;
  const renderArc = showArc && !reducedMotion;
  const providerResponse = provider.response ?? "15 min";

  return (
    <div
      style={{
        background: tokens.color.bg,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* success circle */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: tokens.color.successSubtle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          animation: animate ? "kmPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both" : undefined,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: tokens.color.success,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: animate ? `kmPulse 2400ms ${tokens.ease.standard} infinite` : undefined,
          }}
        >
          <I.check size={36} stroke={2.5} />
        </div>
      </div>

      <h1
        style={{
          fontFamily: tokens.font.display,
          fontWeight: 700,
          fontSize: 36,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: tokens.color.textPrimary,
          margin: "0 0 10px",
          animation: animate ? "kmRise 500ms 200ms both" : undefined,
        }}
      >
        C&apos;est noté&nbsp;!
      </h1>
      <p
        style={{
          fontFamily: tokens.font.body,
          fontWeight: 400,
          fontSize: 17,
          lineHeight: 1.5,
          color: tokens.color.textBody,
          margin: "0 0 28px",
          maxWidth: 420,
          animation: animate ? "kmRise 500ms 320ms both" : undefined,
        }}
      >
        <b style={{ color: tokens.color.textPrimary }}>{provider.firstName}</b> te recontacte sous{" "}
        <b
          style={{
            fontFamily: tokens.font.mono,
            fontVariantNumeric: "tabular-nums",
            color: tokens.color.textPrimary,
          }}
        >
          ~{providerResponse}
        </b>{" "}
        pour confirmer les détails.
      </p>

      {renderArc ? (
        <div
          style={{
            position: "relative",
            width: W,
            height: H,
            animation: animate ? "kmRise 600ms 440ms both" : undefined,
          }}
        >
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }} aria-hidden>
            <path
              d={ARC_PATH}
              fill="none"
              stroke={tokens.color.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="400"
              strokeDashoffset="400"
              style={{
                animation:
                  phase >= 1 ? "kmPath 2000ms cubic-bezier(0.3, 0, 0, 1) forwards" : undefined,
              }}
            />
            {phase >= 1 ? (
              <circle
                r={6}
                fill={tokens.color.accent}
                style={{
                  offsetPath: `path('${ARC_PATH}')`,
                  animation: "kmDot 2000ms cubic-bezier(0.3, 0, 0, 1) forwards",
                  filter: "drop-shadow(0 0 8px rgba(251,113,133,0.7))",
                }}
              />
            ) : null}
          </svg>

          <div style={{ position: "absolute", left: CLIENT_X - 28, top: END_Y - 28 }}>
            <Avatar name={client.name} bg={client.bg} size={56} initials={client.initials} />
            <div
              style={{
                fontFamily: tokens.font.body,
                fontSize: 12,
                fontWeight: 600,
                color: tokens.color.textPrimary,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Toi
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: PROV_X - 28,
              top: END_Y - 28,
              animation:
                phase >= 2 ? "kmPulse 900ms cubic-bezier(0.34, 1.56, 0.64, 1)" : undefined,
            }}
          >
            <Avatar
              name={provider.firstName}
              bg={provider.avatarBg}
              size={56}
              initials={provider.initials}
              online
            />
            <div
              style={{
                fontFamily: tokens.font.body,
                fontSize: 12,
                fontWeight: 600,
                color: tokens.color.textPrimary,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {provider.firstName}
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: renderArc ? 36 : 4,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 16,
          width: "min(420px, 100%)",
          animation: animate ? "kmRise 600ms 600ms both" : undefined,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            textAlign: "left",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: tokens.font.body,
                fontSize: 12,
                fontWeight: 500,
                color: tokens.color.textMuted,
              }}
            >
              Référence
            </div>
            <div
              style={{
                fontFamily: tokens.font.mono,
                fontSize: 14,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: tokens.color.textPrimary,
                marginTop: 2,
              }}
            >
              {reference}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: tokens.font.body,
                fontSize: 12,
                fontWeight: 500,
                color: tokens.color.textMuted,
              }}
            >
              Date
            </div>
            <div
              style={{
                fontFamily: tokens.font.body,
                fontSize: 14,
                fontWeight: 600,
                color: tokens.color.textPrimary,
                marginTop: 2,
              }}
            >
              {dateLabel}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 24,
          width: "min(420px, 100%)",
          animation: animate ? "kmRise 600ms 720ms both" : undefined,
        }}
      >
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          leadingIcon={<I.messageCircle size={16} />}
          onClick={onMessage}
        >
          Message
        </Button>
        <Button
          variant="primary"
          style={{ flex: 1.2 }}
          onClick={onViewBooking}
        >
          Voir ma réservation
        </Button>
      </div>
    </div>
  );
};

const KEYFRAMES = `
@keyframes kmDot { 0% { offset-distance: 0%; opacity: 0; } 10% { opacity: 1 } 90% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0; } }
@keyframes kmPath { 0% { stroke-dashoffset: 400; opacity: 0.8 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes kmPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
@keyframes kmPop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes kmRise { 0% { transform: translateY(12px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
`;

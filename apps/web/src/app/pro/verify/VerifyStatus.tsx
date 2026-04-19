"use client";

import { I } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import type {
  VerificationDocKind,
  VerificationState,
  VerificationStateResponse,
} from "@kayu/schemas";
import {
  STATUS_CONFIG,
  VERIFIED_TIPS,
  VERIFY_BENEFITS,
  VERIFY_STEPS,
  type VerifyStep,
} from "./fixtures";

type VerifyStatusProps = {
  state: VerificationState;
  liveState: VerificationStateResponse;
  hasDispute: boolean;
  onStart: () => void;
  onOpenDispute: () => void;
  onRemoveDoc: (id: string) => void;
  showDebug: boolean;
  debugState: VerificationState | null;
  onDebugState: (s: VerificationState | null) => void;
};

export function VerifyStatus({
  state,
  liveState,
  hasDispute,
  onStart,
  onOpenDispute,
  onRemoveDoc,
  showDebug,
  debugState,
  onDebugState,
}: VerifyStatusProps) {
  const cfg = STATUS_CONFIG[state];
  const StatusIcon = I[cfg.icon] ?? I.shieldCheck;
  const uploadedByKind = new Map(liveState.docs.map((d) => [d.kind, d]));

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 0 40px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.01em",
            color: tokens.color.textPrimary,
          }}
        >
          Vérification
        </div>
        {showDebug && (
          <DebugStateSwitch state={debugState} setState={onDebugState} />
        )}
      </div>

      {hasDispute && <DisputeBanner onOpen={onOpenDispute} />}

      {/* Hero status card */}
      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          padding: 32,
          boxShadow: tokens.shadow.e1,
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 300,
            height: 300,
            background: `radial-gradient(circle at top right, ${cfg.tintBg}, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: cfg.tintBg,
              color: cfg.tint,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StatusIcon size={36} stroke={2} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: "-0.02em",
                color: tokens.color.textPrimary,
                margin: "0 0 8px",
                lineHeight: 1.15,
              }}
            >
              {cfg.title}
            </h1>
            <p
              style={{
                fontSize: 15,
                color: tokens.color.textMuted,
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 520,
              }}
            >
              {state === "REJECTED" && liveState.rejectionReason
                ? liveState.rejectionReason
                : cfg.sub}
            </p>
          </div>
          {liveState.progress > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: tokens.color.textMuted,
                }}
              >
                <span>Progression</span>
                <span style={{ fontFamily: tokens.font.mono }}>
                  {liveState.progress}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: tokens.color.borderSubtle,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${liveState.progress}%`,
                    background: cfg.tint,
                    transition: "width 500ms cubic-bezier(0.2, 0, 0, 1)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          )}
          {cfg.cta && (
            <button
              type="button"
              onClick={onStart}
              className="k-btn k-btn-primary k-btn-lg"
              style={{ alignSelf: "flex-start" }}
            >
              {cfg.cta} <I.arrowRight size={15} />
            </button>
          )}
          {state === "IN_REVIEW" && (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: 12,
                background: tokens.color.bg,
                borderRadius: 10,
                fontSize: 13,
                color: tokens.color.textBody,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: cfg.tint,
                  animation: "kayu-verify-pulse 2s infinite",
                }}
              />
              Nous vous notifierons dès qu'une décision est prise.
            </div>
          )}
        </div>
      </div>

      {/* Doc status list */}
      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 22,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: 14,
            margin: "0 0 4px",
            color: tokens.color.textMuted,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Vos documents
        </h3>
        <div
          style={{
            fontSize: 12,
            color: tokens.color.textMuted,
            marginBottom: 14,
          }}
        >
          {state === "VERIFIED"
            ? "Tous vos documents ont été approuvés"
            : "4 documents demandés (dont 3 obligatoires)"}
        </div>
        {VERIFY_STEPS.map((step, i) => (
          <DocStatusRow
            key={step.id}
            step={step}
            state={state}
            uploadedDoc={pickUploadedForStep(step, uploadedByKind)}
            onRemove={onRemoveDoc}
            last={i === VERIFY_STEPS.length - 1}
          />
        ))}
      </div>

      {/* Benefits or tips */}
      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 22,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: 16,
            margin: "0 0 14px",
          }}
        >
          {state === "VERIFIED"
            ? "Décroche plus de missions"
            : "Pourquoi se vérifier ?"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          {(state === "VERIFIED" ? VERIFIED_TIPS : VERIFY_BENEFITS).map((b) => {
            const Icon = I[b.icon] ?? I.check;
            return (
              <div
                key={b.label}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: tokens.color.primarySubtle,
                    color: tokens.color.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5,
                      color: tokens.color.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {b.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: tokens.color.textMuted,
                      lineHeight: 1.4,
                    }}
                  >
                    {b.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 14,
          background: tokens.color.surfacePrimary,
          borderRadius: 12,
          alignItems: "flex-start",
        }}
      >
        <I.lock
          size={16}
          strokeColor={tokens.color.primary}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <div
          style={{
            fontSize: 12.5,
            color: tokens.color.textBody,
            lineHeight: 1.5,
          }}
        >
          <strong>Vos données sont sécurisées.</strong>
          <div style={{ color: tokens.color.textMuted, marginTop: 2 }}>
            Chiffrées et stockées conformément aux réglementations RDC et
            Congo-B. Seule notre équipe ops y accède.
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes kayu-verify-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}

function pickUploadedForStep(
  step: VerifyStep,
  map: Map<VerificationDocKind, VerificationStateResponse["docs"][number]>,
) {
  for (const kind of step.kinds) {
    const doc = map.get(kind);
    if (doc) return doc;
  }
  return null;
}

function DisputeBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#FEF3C7",
        border: "1px solid #FDE68A",
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "#F59E0B",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <I.alertTriangle size={19} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#78350F" }}>
          Un client a ouvert un litige
        </div>
        <div style={{ fontSize: 12.5, color: "#92400E", marginTop: 2 }}>
          Réponse attendue — ouvrez le litige pour répondre
        </div>
      </div>
      <I.chevronRight size={16} strokeColor="#92400E" />
    </button>
  );
}

function DocStatusRow({
  step,
  state,
  uploadedDoc,
  onRemove,
  last,
}: {
  step: VerifyStep;
  state: VerificationState;
  uploadedDoc: VerificationStateResponse["docs"][number] | null;
  onRemove: (id: string) => void;
  last: boolean;
}) {
  const Icon = I[step.icon] ?? I.fileText;
  const isApproved =
    uploadedDoc?.decision === "APPROVED" || state === "VERIFIED";
  const isUploaded = Boolean(uploadedDoc);
  const isUnderReview = isUploaded && state === "IN_REVIEW";

  const tag = isApproved
    ? { bg: "#ECFDF5", fg: "#047857", label: "Vérifié" }
    : isUnderReview
      ? { bg: "#EDE9FE", fg: "#6D28D9", label: "En cours" }
      : isUploaded
        ? { bg: "#E0F2FE", fg: "#0369A1", label: "Téléversé" }
        : {
            bg: tokens.color.surfaceMuted,
            fg: tokens.color.textMuted,
            label: "À fournir",
          };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderBottom: last ? "none" : `1px solid ${tokens.color.borderSubtle}`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: tag.bg,
          color: tag.fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: tokens.color.textPrimary,
            }}
          >
            {step.label}
          </span>
          {!step.required && (
            <span
              style={{
                fontSize: 10.5,
                color: tokens.color.textMuted,
                background: tokens.color.surfaceMuted,
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              Optionnel
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: tokens.color.textMuted }}>
          {step.caption}
        </div>
      </div>
      {isUploaded && !isApproved && state !== "IN_REVIEW" && (
        <button
          type="button"
          className="k-btn k-btn-ghost k-btn-sm"
          onClick={() => uploadedDoc && onRemove(uploadedDoc.id)}
          style={{ marginRight: 6 }}
        >
          Retirer
        </button>
      )}
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: tag.fg,
          background: tag.bg,
          padding: "4px 10px",
          borderRadius: 999,
        }}
      >
        {tag.label}
      </span>
    </div>
  );
}

function DebugStateSwitch({
  state,
  setState,
}: {
  state: VerificationState | null;
  setState: (s: VerificationState | null) => void;
}) {
  return (
    <select
      value={state ?? ""}
      onChange={(e) =>
        setState((e.target.value || null) as VerificationState | null)
      }
      title="État (debug)"
      style={{
        fontSize: 11,
        padding: "6px 8px",
        borderRadius: 6,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        color: tokens.color.textMuted,
        cursor: "pointer",
        fontFamily: tokens.font.mono,
      }}
    >
      <option value="">live</option>
      <option value="NOT_STARTED">NOT_STARTED</option>
      <option value="IN_PROGRESS">IN_PROGRESS</option>
      <option value="IN_REVIEW">IN_REVIEW</option>
      <option value="VERIFIED">VERIFIED</option>
      <option value="REJECTED">REJECTED</option>
    </select>
  );
}

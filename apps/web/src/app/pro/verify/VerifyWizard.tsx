"use client";

import { useState } from "react";
import { I, StepIndicator, type StepIndicatorStep, type IconName } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { VERIFY_STEPS } from "./fixtures";

const INDICATOR_STEPS: StepIndicatorStep[] = VERIFY_STEPS.map((s, i) => ({
  key: s.id,
  n: i + 1,
  label: s.label,
  icon: s.icon,
}));

type WizardProps = {
  onDone: () => void;
  onExit: () => void;
};

export function VerifyWizard({ onDone, onExit }: WizardProps) {
  const [step, setStep] = useState(0);
  const total = VERIFY_STEPS.length;
  const current = VERIFY_STEPS[step];

  const next = () => {
    if (step < total - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onDone();
    }
  };
  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onExit();
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "8px 0 60px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={back}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <I.arrowLeft size={17} />
        </button>
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 700,
            fontSize: 17,
            flex: 1,
          }}
        >
          Étape {step + 1} sur {total}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="k-btn k-btn-ghost k-btn-sm"
        >
          Continuer plus tard
        </button>
      </div>

      <div style={{ marginBottom: 28 }}>
        <StepIndicator steps={INDICATOR_STEPS} step={step + 1} />
      </div>

      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          padding: 32,
          boxShadow: tokens.shadow.e1,
        }}
      >
        {step === 0 && <StepDocIdentity />}
        {step === 1 && <StepDocSelfie />}
        {step === 2 && <StepDocAddress />}
        {step === 3 && <StepDocCert />}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="k-btn k-btn-secondary"
          onClick={back}
        >
          <I.arrowLeft size={14} /> Retour
        </button>
        <div style={{ flex: 1 }} />
        {current && !current.required && step < total - 1 && (
          <button
            type="button"
            className="k-btn k-btn-ghost"
            onClick={next}
          >
            Passer
          </button>
        )}
        <button
          type="button"
          className="k-btn k-btn-primary k-btn-lg"
          onClick={next}
        >
          {step === total - 1 ? "Soumettre pour examen" : "Continuer"}
          <I.arrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2
        style={{
          fontFamily: tokens.font.display,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
          color: tokens.color.textPrimary,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: tokens.color.textMuted,
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        {sub}
      </p>
    </>
  );
}

function UploadTarget({
  label,
  sub,
  icon,
  initialDone,
}: {
  label: string;
  sub: string;
  icon: IconName;
  initialDone?: boolean;
}) {
  const [done, setDone] = useState(initialDone ?? false);
  const Icon = I[icon] ?? I.upload;
  return (
    <button
      type="button"
      onClick={() => setDone((d) => !d)}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        borderRadius: 12,
        border: done
          ? `1px solid ${tokens.color.success}`
          : `1.5px dashed ${tokens.color.border}`,
        background: done ? tokens.color.successSubtle : tokens.color.surface,
        marginBottom: 10,
        transition: "border-color 120ms",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: done ? tokens.color.success : tokens.color.surfaceMuted,
          color: done ? tokens.color.textInverse : tokens.color.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {done ? <I.check size={20} stroke={2.5} /> : <Icon size={19} />}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: tokens.color.textPrimary,
            marginBottom: 2,
          }}
        >
          {done ? `✓ ${label}` : label}
        </div>
        <div style={{ fontSize: 12, color: tokens.color.textMuted }}>
          {done ? "Photo enregistrée · cliquez pour remplacer" : sub}
        </div>
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: tokens.color.surfaceMuted,
          color: tokens.color.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <I.camera size={15} />
      </div>
    </button>
  );
}

function StepDocIdentity() {
  const [docType, setDocType] = useState<"id" | "passport" | "permit">("id");
  return (
    <div>
      <StepHeading
        title="Votre pièce d'identité"
        sub="Prenez une photo claire du recto et verso. Assurez-vous que toutes les informations sont lisibles."
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(
          [
            { id: "id", label: "Carte nationale" },
            { id: "passport", label: "Passeport" },
            { id: "permit", label: "Permis de conduire" },
          ] as const
        ).map((t) => {
          const isSel = docType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setDocType(t.id)}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 10,
                border: isSel
                  ? `1px solid ${tokens.color.primary}`
                  : `1px solid ${tokens.color.border}`,
                background: isSel
                  ? tokens.color.primarySubtle
                  : tokens.color.surface,
                color: isSel
                  ? tokens.color.primaryHover
                  : tokens.color.textBody,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <UploadTarget
        label="Photo du recto"
        sub="Cliquez pour ouvrir l'appareil photo"
        icon="idCard"
      />
      <UploadTarget
        label="Photo du verso"
        sub="Retournez votre pièce et photographiez l'autre face"
        icon="idCard"
      />
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 12,
          background: "#FFFBEB",
          borderRadius: 10,
          border: "1px solid #FDE68A",
          marginTop: 16,
        }}
      >
        <I.info
          size={15}
          strokeColor="#B45309"
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ fontSize: 12.5, color: "#78350F", lineHeight: 1.5 }}>
          Évitez les reflets. Posez le document sur une surface sombre et unie.
        </div>
      </div>
    </div>
  );
}

function StepDocSelfie() {
  return (
    <div>
      <StepHeading
        title="Selfie avec votre pièce"
        sub="Tenez votre pièce d'identité à côté de votre visage. Cela nous permet de confirmer que c'est bien vous."
      />
      <div
        style={{
          aspectRatio: "3 / 4",
          maxHeight: 360,
          width: "100%",
          background: "linear-gradient(135deg, #1E293B, #0F172A)",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 160,
            height: 200,
            borderRadius: "50%",
            border: "3px dashed rgba(255,255,255,0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            padding: "8px 14px",
            borderRadius: 999,
            color: "white",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Tenez votre ID sous votre menton
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="k-btn k-btn-secondary" style={{ flex: 1 }}>
          <I.refresh size={14} /> Reprendre
        </button>
        <button
          className="k-btn k-btn-primary"
          style={{ flex: 2, justifyContent: "center" }}
        >
          <I.camera size={14} /> Prendre la photo
        </button>
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: tokens.color.textMuted,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Une photo floue, sombre ou partiellement cachée sera rejetée. Prenez le
        temps de bien cadrer.
      </div>
    </div>
  );
}

function StepDocAddress() {
  return (
    <div>
      <StepHeading
        title="Justificatif de domicile"
        sub="Une facture SNEL, REGIDESO ou internet récente (moins de 3 mois) à votre nom."
      />
      <UploadTarget
        label="Photo de la facture"
        sub="JPEG, PNG ou PDF · max 10 Mo"
        icon="fileText"
      />
      <div style={{ marginTop: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: tokens.color.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 6,
          }}
        >
          Ou confirmez votre adresse
        </label>
        <input
          type="text"
          defaultValue="Av. Kasa-Vubu 42, Gombe, Kinshasa"
          className="k-input"
        />
      </div>
      <div
        style={{
          marginTop: 20,
          padding: 14,
          background: tokens.color.bg,
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: tokens.color.textPrimary,
            marginBottom: 8,
          }}
        >
          Documents acceptés :
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 12.5,
            color: tokens.color.textBody,
            lineHeight: 1.7,
          }}
        >
          <li>Facture SNEL ou REGIDESO</li>
          <li>Facture internet (Afrimobile, Vodacom)</li>
          <li>Attestation de résidence signée</li>
          <li>Contrat de bail en cours</li>
        </ul>
      </div>
    </div>
  );
}

function StepDocCert() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h2
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "-0.02em",
            margin: 0,
            color: tokens.color.textPrimary,
          }}
        >
          Certificat métier
        </h2>
        <span
          style={{
            fontSize: 11,
            padding: "3px 8px",
            background: tokens.color.surfaceMuted,
            color: tokens.color.textMuted,
            borderRadius: 6,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Optionnel
        </span>
      </div>
      <p
        style={{
          fontSize: 14,
          color: tokens.color.textMuted,
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        Si vous avez un diplôme, une certification INPP, ou une licence
        professionnelle, ajoutez-la ici. Cela augmente significativement votre
        taux de conversion.
      </p>
      <UploadTarget
        label="Photo de votre certificat"
        sub="Diplôme, attestation, licence… un seul document à la fois"
        icon="award"
      />
      <div style={{ marginTop: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: tokens.color.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 6,
          }}
        >
          Nom de la certification
        </label>
        <input
          type="text"
          placeholder="Ex: Diplôme INPP Plomberie 2018"
          className="k-input"
        />
      </div>
      <div
        style={{
          marginTop: 20,
          padding: 14,
          background: tokens.color.primarySubtle,
          borderRadius: 10,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: tokens.color.surface,
            color: tokens.color.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <I.sparkles size={15} />
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: tokens.color.textBody,
            lineHeight: 1.5,
          }}
        >
          <strong>Les pros certifiés ont 60% de conversion en plus.</strong>
          <div style={{ color: tokens.color.textMuted, marginTop: 2 }}>
            Ils reçoivent le badge « Expert » et accèdent aux missions premium.
          </div>
        </div>
      </div>
    </div>
  );
}

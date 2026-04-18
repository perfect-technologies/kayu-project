"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { tokens } from "../tokens.js";
import { Button } from "./Button.js";

export type ErrorStateCTA = {
  label: string;
  onClick?: () => void;
};

export type ErrorStateProps = {
  title: string;
  subtitle?: string;
  cta?: ErrorStateCTA;
  className?: string;
  style?: React.CSSProperties;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  subtitle,
  cta,
  className,
  style,
}) => (
  <div
    role="alert"
    className={className}
    style={{
      display: "flex",
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px 20px",
      ...style,
    }}
  >
    <div
      aria-hidden
      style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: tokens.color.dangerSubtle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <AlertCircle size={44} strokeWidth={1.75} color={tokens.color.danger} />
    </div>
    <h3
      style={{
        fontFamily: tokens.font.display,
        fontWeight: 600,
        fontSize: 24,
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
        color: tokens.color.textPrimary,
        margin: 0,
      }}
    >
      {title}
    </h3>
    {subtitle ? (
      <p
        style={{
          fontFamily: tokens.font.body,
          fontSize: 15,
          lineHeight: 1.5,
          color: tokens.color.textBody,
          margin: "10px 0 0",
          maxWidth: 380,
        }}
      >
        {subtitle}
      </p>
    ) : null}
    {cta ? (
      <div style={{ marginTop: 24 }}>
        <Button onClick={cta.onClick}>{cta.label}</Button>
      </div>
    ) : null}
  </div>
);

type VariantProps = {
  onRetry?: () => void;
  onHome?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export const NetworkErrorState: React.FC<VariantProps> = ({ onRetry, ...rest }) => (
  <ErrorState
    title="Connexion perdue."
    subtitle="Vérifie ton internet et réessaie."
    cta={onRetry ? { label: "Réessayer", onClick: onRetry } : undefined}
    {...rest}
  />
);

export const NotFoundState: React.FC<VariantProps> = ({ onHome, ...rest }) => (
  <ErrorState
    title="Introuvable."
    subtitle="Cette page ou ce pro n'existe plus."
    cta={onHome ? { label: "Retour à l'accueil", onClick: onHome } : undefined}
    {...rest}
  />
);

export const GenericErrorState: React.FC<VariantProps> = ({ onRetry, ...rest }) => (
  <ErrorState
    title="Une erreur est survenue."
    subtitle="On travaille dessus. Réessaie dans un instant."
    cta={onRetry ? { label: "Réessayer", onClick: onRetry } : undefined}
    {...rest}
  />
);

export const PermissionDeniedState: React.FC<Omit<VariantProps, "onRetry">> = (props) => (
  <ErrorState
    title="Accès restreint."
    subtitle="Tu n'as pas les droits pour voir cette page."
    {...props}
  />
);

// ─── Inline form error banner ───────────────────────────────────────────────

export type FormErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export const FormErrorBanner: React.FC<FormErrorBannerProps> = ({
  message,
  onRetry,
  className,
  style,
}) => (
  <div
    role="alert"
    className={className}
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      background: tokens.color.dangerSubtle,
      borderLeft: `2px solid ${tokens.color.danger}`,
      borderRadius: tokens.radius.md,
      padding: "12px 14px",
      ...style,
    }}
  >
    <AlertCircle size={18} color={tokens.color.danger} strokeWidth={1.75} />
    <span
      style={{
        flex: 1,
        fontFamily: tokens.font.body,
        fontWeight: 500,
        fontSize: 14,
        lineHeight: 1.45,
        color: tokens.color.textPrimary,
      }}
    >
      {message}
    </span>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        style={{
          background: "transparent",
          border: 0,
          color: tokens.color.danger,
          fontFamily: tokens.font.body,
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Réessayer
      </button>
    ) : null}
  </div>
);

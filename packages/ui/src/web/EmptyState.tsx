"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Heart as HeartIcon,
  Inbox as InboxIcon,
  Search as SearchIcon,
  Star as StarIcon,
  type LucideProps,
} from "lucide-react";
import { tokens } from "../tokens.js";
import { Button } from "./Button.js";

type LucideIcon = React.ComponentType<LucideProps>;

export type EmptyStateCTA = {
  label: string;
  onClick?: () => void;
};

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  cta?: EmptyStateCTA;
  className?: string;
  style?: React.CSSProperties;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  cta,
  className,
  style,
}) => (
  <div
    role="status"
    aria-live="polite"
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
    {Icon ? (
      <div
        aria-hidden
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: tokens.color.surfaceMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon size={44} strokeWidth={1.5} color={tokens.color.textSubtle} />
      </div>
    ) : null}
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
          color: tokens.color.textMuted,
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

// ─── Preset variants (D08 §Required empty states) ───────────────────────────

type VariantProps = {
  onCtaClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export const NoBookingsEmpty: React.FC<VariantProps> = ({ onCtaClick, ...rest }) => (
  <EmptyState
    icon={CalendarIcon}
    title="Pas encore de réservations."
    subtitle="Trouve un pro et réserve un service en quelques clics."
    cta={onCtaClick ? { label: "Trouver un pro", onClick: onCtaClick } : undefined}
    {...rest}
  />
);

export const NoFavoritesEmpty: React.FC<VariantProps> = ({ onCtaClick, ...rest }) => (
  <EmptyState
    icon={HeartIcon}
    title="Aucun favori pour l'instant."
    subtitle="Enregistre les pros qui t'intéressent pour les retrouver ici."
    cta={onCtaClick ? { label: "Explorer", onClick: onCtaClick } : undefined}
    {...rest}
  />
);

export const NoMessagesEmpty: React.FC<VariantProps> = (props) => (
  <EmptyState
    icon={InboxIcon}
    title="Aucun message."
    subtitle="Tes échanges avec les pros apparaîtront ici."
    {...props}
  />
);

export const NoSearchResultsEmpty: React.FC<VariantProps> = ({ onCtaClick, ...rest }) => (
  <EmptyState
    icon={SearchIcon}
    title="Aucun pro trouvé."
    subtitle="Ajuste tes filtres ou élargis ta zone de recherche."
    cta={onCtaClick ? { label: "Effacer les filtres", onClick: onCtaClick } : undefined}
    {...rest}
  />
);

export const NoReviewsYetEmpty: React.FC<VariantProps> = ({ onCtaClick, ...rest }) => (
  <EmptyState
    icon={StarIcon}
    title="Pas encore d'avis."
    subtitle="Sois le premier à évaluer ce pro."
    cta={onCtaClick ? { label: "Laisser un avis", onClick: onCtaClick } : undefined}
    {...rest}
  />
);

import * as React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import {
  Calendar as CalendarIcon,
  Heart as HeartIcon,
  Inbox as InboxIcon,
  Search as SearchIcon,
  Star as StarIcon,
} from "lucide-react-native";
import { tokens } from "../tokens.js";
import { Button } from "./Button.js";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type EmptyStateCTA = {
  label: string;
  onPress?: () => void;
};

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  cta?: EmptyStateCTA;
  style?: ViewStyle;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  cta,
  style,
}) => (
  <View
    accessibilityLiveRegion="polite"
    style={[styles.root, style]}
  >
    {Icon ? (
      <View style={styles.iconWrap}>
        <Icon size={44} color={tokens.color.textSubtle} strokeWidth={1.5} />
      </View>
    ) : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {cta ? (
      <View style={{ marginTop: 24 }}>
        <Button onPress={cta.onPress} title={cta.label} />
      </View>
    ) : null}
  </View>
);

// ─── Preset variants (D08 §Required empty states) ───────────────────────────

type VariantProps = {
  onCtaPress?: () => void;
  style?: ViewStyle;
};

export const NoBookingsEmpty: React.FC<VariantProps> = ({ onCtaPress, ...rest }) => (
  <EmptyState
    icon={CalendarIcon}
    title="Pas encore de réservations."
    subtitle="Trouve un pro et réserve un service en quelques clics."
    cta={onCtaPress ? { label: "Trouver un pro", onPress: onCtaPress } : undefined}
    {...rest}
  />
);

export const NoFavoritesEmpty: React.FC<VariantProps> = ({ onCtaPress, ...rest }) => (
  <EmptyState
    icon={HeartIcon}
    title="Aucun favori pour l'instant."
    subtitle="Enregistre les pros qui t'intéressent pour les retrouver ici."
    cta={onCtaPress ? { label: "Explorer", onPress: onCtaPress } : undefined}
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

export const NoSearchResultsEmpty: React.FC<VariantProps> = ({ onCtaPress, ...rest }) => (
  <EmptyState
    icon={SearchIcon}
    title="Aucun pro trouvé."
    subtitle="Ajuste tes filtres ou élargis ta zone de recherche."
    cta={onCtaPress ? { label: "Effacer les filtres", onPress: onCtaPress } : undefined}
    {...rest}
  />
);

export const NoReviewsYetEmpty: React.FC<VariantProps> = ({ onCtaPress, ...rest }) => (
  <EmptyState
    icon={StarIcon}
    title="Pas encore d'avis."
    subtitle="Sois le premier à évaluer ce pro."
    cta={onCtaPress ? { label: "Laisser un avis", onPress: onCtaPress } : undefined}
    {...rest}
  />
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tokens.color.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontWeight: "600",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: tokens.color.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    lineHeight: 22,
    color: tokens.color.textMuted,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 360,
  },
});

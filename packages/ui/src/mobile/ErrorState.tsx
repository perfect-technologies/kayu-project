import * as React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { tokens } from "../tokens.js";
import { Button } from "./Button.js";

export type ErrorStateCTA = {
  label: string;
  onPress?: () => void;
};

export type ErrorStateProps = {
  title: string;
  subtitle?: string;
  cta?: ErrorStateCTA;
  style?: ViewStyle;
};

export const ErrorState: React.FC<ErrorStateProps> = ({ title, subtitle, cta, style }) => (
  <View accessibilityLiveRegion="polite" style={[styles.root, style]}>
    <View style={styles.iconWrap}>
      <AlertCircle size={44} color={tokens.color.danger} strokeWidth={1.75} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {cta ? (
      <View style={{ marginTop: 24 }}>
        <Button onPress={cta.onPress} title={cta.label} />
      </View>
    ) : null}
  </View>
);

type VariantProps = {
  onRetry?: () => void;
  onHome?: () => void;
  style?: ViewStyle;
};

export const NetworkErrorState: React.FC<VariantProps> = ({ onRetry, ...rest }) => (
  <ErrorState
    title="Connexion perdue."
    subtitle="Vérifie ton internet et réessaie."
    cta={onRetry ? { label: "Réessayer", onPress: onRetry } : undefined}
    {...rest}
  />
);

export const NotFoundState: React.FC<VariantProps> = ({ onHome, ...rest }) => (
  <ErrorState
    title="Introuvable."
    subtitle="Cette page ou ce pro n'existe plus."
    cta={onHome ? { label: "Retour à l'accueil", onPress: onHome } : undefined}
    {...rest}
  />
);

export const GenericErrorState: React.FC<VariantProps> = ({ onRetry, ...rest }) => (
  <ErrorState
    title="Une erreur est survenue."
    subtitle="On travaille dessus. Réessaie dans un instant."
    cta={onRetry ? { label: "Réessayer", onPress: onRetry } : undefined}
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
  style?: ViewStyle;
};

export const FormErrorBanner: React.FC<FormErrorBannerProps> = ({ message, onRetry, style }) => (
  <View accessibilityLiveRegion="polite" style={[bannerStyles.root, style]}>
    <AlertCircle size={18} color={tokens.color.danger} strokeWidth={1.75} />
    <Text style={bannerStyles.message}>{message}</Text>
    {onRetry ? (
      <Text accessibilityRole="button" onPress={onRetry} style={bannerStyles.retry}>
        Réessayer
      </Text>
    ) : null}
  </View>
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
    backgroundColor: tokens.color.dangerSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontWeight: "600",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: tokens.color.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    lineHeight: 22,
    color: tokens.color.textBody,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 360,
  },
});

const bannerStyles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: tokens.color.dangerSubtle,
    borderLeftWidth: 2,
    borderLeftColor: tokens.color.danger,
    borderRadius: tokens.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  message: {
    flex: 1,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    color: tokens.color.textPrimary,
  },
  retry: {
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
    fontSize: 14,
    color: tokens.color.danger,
  },
});

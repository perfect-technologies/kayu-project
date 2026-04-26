import * as React from "react";
import {
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { tokens } from "../tokens.js";
import { I, type IconProps } from "./Icon.js";

export type InlineAlertVariant = "info" | "success" | "warning" | "error";

export type InlineAlertAction = {
  label: string;
  onPress?: () => void;
};

export type InlineAlertProps = {
  variant?: InlineAlertVariant;
  title?: string;
  description: string;
  action?: InlineAlertAction;
  icon?: React.ComponentType<IconProps>;
  style?: ViewStyle;
};

const VARIANT: Record<
  InlineAlertVariant,
  {
    surface: string;
    border: string;
    icon: string;
    Icon: React.ComponentType<IconProps>;
  }
> = {
  info: {
    surface: tokens.color.primarySubtle,
    border: "rgba(14,165,233,0.22)",
    icon: tokens.color.primaryHover,
    Icon: I.info,
  },
  success: {
    surface: tokens.color.successSubtle,
    border: "rgba(16,185,129,0.24)",
    icon: "#047857",
    Icon: I.checkCircle,
  },
  warning: {
    surface: tokens.color.warningSubtle,
    border: "rgba(245,158,11,0.28)",
    icon: "#B45309",
    Icon: I.alertTriangle,
  },
  error: {
    surface: tokens.color.dangerSubtle,
    border: "rgba(225,29,72,0.22)",
    icon: tokens.color.danger,
    Icon: I.alertCircle,
  },
};

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = "info",
  title,
  description,
  action,
  icon,
  style,
}) => {
  const v = VARIANT[variant];
  const Icon = icon ?? v.Icon;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        { backgroundColor: v.surface, borderColor: v.border },
        style,
      ]}
    >
      <Icon size={18} stroke={v.icon} strokeWidth={1.85} />
      <View style={styles.copy}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={[styles.description, title ? styles.descriptionWithTitle : null]}>
          {description}
        </Text>
      </View>
      {action ? (
        <Text
          accessibilityRole="button"
          onPress={action.onPress}
          style={[styles.action, { color: v.icon }]}
        >
          {action.label}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 19,
    color: tokens.color.textPrimary,
  },
  description: {
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    color: tokens.color.textPrimary,
  },
  descriptionWithTitle: {
    color: tokens.color.textBody,
    marginTop: 2,
  } satisfies TextStyle,
  action: {
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
  },
});

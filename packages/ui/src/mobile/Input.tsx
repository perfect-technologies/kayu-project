import * as React from "react";
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { AlertCircle } from "lucide-react-native";
import { tokens } from "../tokens.js";

export type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leadingIcon,
  trailingIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  const hasError = Boolean(error);

  const borderColor = hasError
    ? tokens.color.danger
    : focused
      ? tokens.color.primary
      : tokens.color.border;

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontFamily: "Inter-Medium",
            fontSize: 13,
            fontWeight: "500",
            color: tokens.color.textBody,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 44,
          borderRadius: tokens.radius.md,
          backgroundColor: tokens.color.surface,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: 14,
          gap: 8,
          // RN can't layer a soft ring the way CSS can; a tighter border is
          // sufficient focus affordance for our touch-first audience.
        }}
      >
        {leadingIcon}
        <TextInput
          placeholderTextColor={tokens.color.textSubtle}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              color: tokens.color.textPrimary,
              fontSize: 15,
              fontFamily: "Inter-Regular",
              paddingVertical: 0,
            },
            style,
          ]}
          {...rest}
        />
        {trailingIcon}
      </View>
      <View
        style={{
          minHeight: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {hasError ? (
          <AlertCircle size={14} color={tokens.color.danger} strokeWidth={2} />
        ) : null}
        {helperText || error ? (
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Inter-Medium",
              color: hasError ? tokens.color.danger : tokens.color.textMuted,
            }}
          >
            {error ?? helperText}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

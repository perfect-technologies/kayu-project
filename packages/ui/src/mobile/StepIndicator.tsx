import * as React from "react";
import { View, type ViewStyle } from "react-native";
import { tokens } from "../tokens.js";
import { I, type IconName } from "./Icon.js";

export type StepIndicatorStep = {
  key: string;
  n: number;
  icon?: IconName;
  label?: string;
};

export type StepIndicatorProps = {
  steps: StepIndicatorStep[];
  /** Current step number (1-based, matches step.n) */
  step: number;
  /** Compact mobile layout (smaller circles, tighter gaps) */
  compact?: boolean;
  style?: ViewStyle;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  step,
  compact = true,
  style,
}) => {
  const circle = compact ? 28 : 36;
  const icon = compact ? 13 : 16;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? 4 : 8,
        },
        style,
      ]}
    >
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const IconC = s.icon ? I[s.icon] : I.check;
        const circleBg = done
          ? tokens.color.success
          : active
            ? tokens.color.primary
            : tokens.color.surface;
        const circleBorder = done
          ? tokens.color.success
          : active
            ? tokens.color.primary
            : tokens.color.border;
        const circleFg =
          done || active ? tokens.color.textInverse : tokens.color.textMuted;

        return (
          <React.Fragment key={s.key}>
            <View
              style={{
                width: circle,
                height: circle,
                borderRadius: circle / 2,
                backgroundColor: circleBg,
                borderWidth: 2,
                borderColor: circleBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {done ? (
                <I.check size={icon} strokeWidth={2.5} color={circleFg} />
              ) : (
                <IconC size={icon} color={circleFg} />
              )}
            </View>
            {i < steps.length - 1 && (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  minWidth: compact ? 10 : 24,
                  backgroundColor: done ? tokens.color.success : tokens.color.border,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

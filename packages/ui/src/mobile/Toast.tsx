import * as React from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react-native";
import { tokens } from "../tokens.js";

export type ToastVariant = "success" | "info" | "error";

export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
  durationMs?: number;
  dismissible?: boolean;
};

type ShowToastInput = Omit<Toast, "id"> & { id?: string };

type ToastContextValue = {
  show: (t: ShowToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

export type ToastProviderProps = {
  children: React.ReactNode;
  /** Space above the top safe-inset. Callers pass `insets.top + extra` when needed. */
  topOffset?: number;
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, topOffset = 24 }) => {
  const [current, setCurrent] = React.useState<Toast | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-8)).current;

  const animateOut = React.useCallback(
    (after: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start(after);
    },
    [opacity, translateY],
  );

  const animateIn = React.useCallback(() => {
    opacity.setValue(0);
    translateY.setValue(-8);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.3, 0, 0, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.3, 0, 0, 1),
      }),
    ]).start();
  }, [opacity, translateY]);

  const dismiss = React.useCallback(
    (id: string) => {
      setCurrent((c) => {
        if (!c || c.id !== id) return c;
        animateOut(() => setCurrent(null));
        return c;
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [animateOut],
  );

  const show = React.useCallback(
    (t: ShowToastInput): string => {
      const id = t.id ?? `t_${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { dismissible: true, durationMs: 4000, ...t, id };
      setCurrent(toast);
      animateIn();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (toast.durationMs && toast.durationMs > 0) {
        timerRef.current = setTimeout(() => dismiss(id), toast.durationMs);
      }
      return id;
    },
    [animateIn, dismiss],
  );

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const value = React.useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current ? (
        <ToastViewport
          toast={current}
          onDismiss={dismiss}
          topOffset={topOffset}
          opacity={opacity}
          translateY={translateY}
        />
      ) : null}
    </ToastContext.Provider>
  );
};

const VARIANT_ICON = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
} as const;

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: tokens.color.success,
  info: tokens.color.primary,
  error: tokens.color.danger,
};

type ViewportProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
  topOffset: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
};

const ToastViewport: React.FC<ViewportProps> = ({
  toast,
  onDismiss,
  topOffset,
  opacity,
  translateY,
}) => {
  const Icon = VARIANT_ICON[toast.variant];
  const tint = VARIANT_COLOR[toast.variant];
  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={[
        styles.overlay,
        { top: topOffset, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.card}>
        <Icon size={18} color={tint} strokeWidth={2} />
        <Text style={styles.message} numberOfLines={3}>
          {toast.message}
        </Text>
        {toast.dismissible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={() => onDismiss(toast.id)}
            hitSlop={8}
          >
            <X size={16} color={tokens.color.textMuted} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 360,
    width: "100%",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    color: tokens.color.textPrimary,
  },
});

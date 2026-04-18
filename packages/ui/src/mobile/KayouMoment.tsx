import * as React from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { Button } from "./Button.js";
import { I } from "./Icon.js";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const W = 320;
const H = 120;
const CLIENT_X = 40;
const PROV_X = W - 40;
const END_Y = H - 30;
const CTRL_X = W / 2;
const CTRL_Y = 10;
const ARC_D = `M ${CLIENT_X} ${END_Y} Q ${CTRL_X} ${CTRL_Y} ${PROV_X} ${END_Y}`;

// Sample the quadratic bezier once so Animated can interpolate cx/cy per t.
const SAMPLES = 41;
const SAMPLE_TS: number[] = Array.from({ length: SAMPLES }, (_, i) => i / (SAMPLES - 1));
const quadAt = (t: number, p0: number, p1: number, p2: number): number =>
  (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
const CX_SAMPLES = SAMPLE_TS.map((t) => quadAt(t, CLIENT_X, CTRL_X, PROV_X));
const CY_SAMPLES = SAMPLE_TS.map((t) => quadAt(t, END_Y, CTRL_Y, END_Y));

export type KayouMomentProps = {
  provider: {
    firstName: string;
    initials?: string;
    avatarBg?: string;
    response?: string;
  };
  client?: {
    initials?: string;
    bg?: string;
    name?: string;
  };
  reference?: string;
  dateLabel?: string;
  showArc?: boolean;
  onMessage?: () => void;
  onViewBooking?: () => void;
  style?: ViewStyle;
};

export const KayouMoment: React.FC<KayouMomentProps> = ({
  provider,
  client = { initials: "AM", bg: tokens.color.accent },
  reference = "#KY-4829-AM",
  dateLabel = "Mer. 18 avril · 10:00",
  showArc = true,
  onMessage,
  onViewBooking,
  style,
}) => {
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [arcArrived, setArcArrived] = React.useState(false);

  const popScale = React.useRef(new Animated.Value(0.6)).current;
  const popOpacity = React.useRef(new Animated.Value(0)).current;
  const pulseScale = React.useRef(new Animated.Value(1)).current;
  const riseTitle = useRiseValues();
  const riseSubtitle = useRiseValues();
  const riseArc = useRiseValues();
  const riseSummary = useRiseValues();
  const riseButtons = useRiseValues();

  const dotProgress = React.useRef(new Animated.Value(0)).current;
  const pathOpacity = React.useRef(new Animated.Value(0.8)).current;
  const dashOffset = React.useRef(new Animated.Value(400)).current;
  const dotOpacity = React.useRef(new Animated.Value(0)).current;
  const providerPulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (!cancelled) setReducedMotion(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) =>
      setReducedMotion(v),
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const renderArc = showArc && !reducedMotion;

  React.useEffect(() => {
    if (reducedMotion) {
      popScale.setValue(1);
      popOpacity.setValue(1);
      riseTitle.snapToEnd();
      riseSubtitle.snapToEnd();
      riseArc.snapToEnd();
      riseSummary.snapToEnd();
      riseButtons.snapToEnd();
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(popScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 160,
          overshootClamping: false,
        }),
        Animated.timing(popOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
    ]).start();

    // Continuous success-circle pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    );
    pulseLoop.start();

    // Staggered rise-in of text, arc, summary, buttons.
    Animated.stagger(120, [
      riseTitle.run(200),
      riseSubtitle.run(120),
      riseArc.run(120),
      riseSummary.run(160),
      riseButtons.run(120),
    ]).start();

    let arcTimer: ReturnType<typeof setTimeout> | undefined;
    let arriveTimer: ReturnType<typeof setTimeout> | undefined;

    if (renderArc) {
      arcTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(dashOffset, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
            easing: Easing.bezier(0.3, 0, 0, 1),
          }),
          Animated.timing(pathOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
            easing: Easing.bezier(0.3, 0, 0, 1),
          }),
          Animated.sequence([
            Animated.timing(dotOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.delay(1600),
            Animated.timing(dotOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]),
          Animated.timing(dotProgress, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
            easing: Easing.bezier(0.3, 0, 0, 1),
          }),
        ]).start();
      }, 300);

      arriveTimer = setTimeout(() => {
        setArcArrived(true);
        Animated.sequence([
          Animated.timing(providerPulse, {
            toValue: 1.08,
            duration: 450,
            useNativeDriver: true,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          }),
          Animated.timing(providerPulse, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          }),
        ]).start();
      }, 2300);
    }

    return () => {
      pulseLoop.stop();
      if (arcTimer) clearTimeout(arcTimer);
      if (arriveTimer) clearTimeout(arriveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, renderArc]);

  const dotCx = dotProgress.interpolate({
    inputRange: SAMPLE_TS,
    outputRange: CX_SAMPLES,
  });
  const dotCy = dotProgress.interpolate({
    inputRange: SAMPLE_TS,
    outputRange: CY_SAMPLES,
  });

  const providerResponse = provider.response ?? "15 min";
  void arcArrived;

  return (
    <View style={[styles.root, style]}>
      <Animated.View
        style={[
          styles.successOuter,
          {
            transform: [{ scale: popScale }],
            opacity: popOpacity,
          },
        ]}
      >
        <Animated.View style={[styles.successInner, { transform: [{ scale: pulseScale }] }]}>
          <I.check size={36} color={tokens.color.textInverse} strokeWidth={2.5} />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.title, riseTitle.style]}>C&apos;est noté&nbsp;!</Animated.Text>

      <Animated.Text style={[styles.body, riseSubtitle.style]}>
        <Text style={styles.bodyBold}>{provider.firstName}</Text> te recontacte sous{" "}
        <Text style={styles.bodyMono}>~{providerResponse}</Text> pour confirmer les détails.
      </Animated.Text>

      {renderArc ? (
        <Animated.View style={[styles.arcWrap, riseArc.style]}>
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <AnimatedPath
              d={ARC_D}
              fill="none"
              stroke={tokens.color.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="400"
              strokeDashoffset={dashOffset as unknown as number}
              opacity={pathOpacity as unknown as number}
            />
            <AnimatedCircle
              r={6}
              fill={tokens.color.accent}
              cx={dotCx as unknown as number}
              cy={dotCy as unknown as number}
              opacity={dotOpacity as unknown as number}
            />
          </Svg>
          <View style={[styles.avatarSlot, { left: CLIENT_X - 28, top: END_Y - 28 }]}>
            <Avatar name={client.name} bg={client.bg} size={56} initials={client.initials} />
            <Text style={styles.avatarLabel}>Toi</Text>
          </View>
          <Animated.View
            style={[
              styles.avatarSlot,
              { left: PROV_X - 28, top: END_Y - 28, transform: [{ scale: providerPulse }] },
            ]}
          >
            <Avatar
              name={provider.firstName}
              bg={provider.avatarBg}
              size={56}
              initials={provider.initials}
              online
            />
            <Text style={styles.avatarLabel}>{provider.firstName}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.summaryCard, renderArc ? { marginTop: 36 } : null, riseSummary.style]}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Référence</Text>
          <Text style={styles.summaryValueMono}>{reference}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Date</Text>
          <Text style={styles.summaryValue}>{dateLabel}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.actions, riseButtons.style]}>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          leadingIcon={<I.messageCircle size={16} color={tokens.color.textPrimary} />}
          onPress={onMessage ? () => onMessage() : undefined}
          accessibilityLabel="Message"
        >
          Message
        </Button>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir ma réservation"
          onPress={onViewBooking}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.primaryBtnText}>Voir ma réservation</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

function useRiseValues() {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(12)).current;
  const snapToEnd = React.useCallback(() => {
    opacity.setValue(1);
    translateY.setValue(0);
  }, [opacity, translateY]);
  const run = React.useCallback(
    (delay: number) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
    [opacity, translateY],
  );
  return {
    style: { opacity, transform: [{ translateY }] } as const,
    snapToEnd,
    run,
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  successOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tokens.color.successSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: tokens.color.success,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "PlusJakartaSans-Bold",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 32,
    color: tokens.color.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    lineHeight: 24,
    color: tokens.color.textBody,
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 420,
  },
  bodyBold: {
    fontFamily: "Inter-SemiBold",
    fontWeight: "700",
    color: tokens.color.textPrimary,
  },
  bodyMono: {
    fontFamily: "JetBrainsMono-Medium",
    fontWeight: "700",
    color: tokens.color.textPrimary,
  },
  arcWrap: {
    position: "relative",
    width: W,
    height: H,
  },
  avatarSlot: {
    position: "absolute",
    alignItems: "center",
  },
  avatarLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    fontWeight: "600",
    color: tokens.color.textPrimary,
    marginTop: 6,
    textAlign: "center",
  },
  summaryCard: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 420,
    padding: 16,
    gap: 12,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  summaryCell: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    fontWeight: "500",
    color: tokens.color.textMuted,
  },
  summaryValueMono: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 14,
    fontWeight: "600",
    color: tokens.color.textPrimary,
    marginTop: 2,
  },
  summaryValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    fontWeight: "600",
    color: tokens.color.textPrimary,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    width: "100%",
    maxWidth: 420,
  },
  primaryBtn: {
    flex: 1.2,
    height: 48,
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  primaryBtnText: {
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
    fontSize: 15,
    color: tokens.color.textInverse,
  },
});

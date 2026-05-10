import * as React from "react";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import {
  formatMoneyFc,
  portfolioSlug,
  type ProviderCardData,
} from "../cards.js";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { I, type IconName } from "./Icon.js";
import { PhotoTile } from "./PhotoTile.js";

export type FeaturedProviderCardProps = {
  provider: ProviderCardData;
  favorited?: boolean;
  onFavorite?: (id: string) => void;
  onPress?: (id: string) => void;
  /** Width override; default 78% (matches mobile-shell carousels). */
  width?: number | string;
  style?: ViewStyle;
};

const FONTS = {
  display: "PlusJakartaSans-SemiBold",
  body: "Inter-Regular",
  bodyMed: "Inter-Medium",
  bodySemi: "Inter-SemiBold",
  mono: "JetBrainsMono-Medium",
};

// FeaturedProviderCard — 4:5 photo, mobile carousel item.
export const FeaturedProviderCard: React.FC<FeaturedProviderCardProps> = ({
  provider,
  favorited = false,
  onFavorite,
  onPress,
  width,
  style,
}) => {
  const slug = portfolioSlug(provider.categories);
  const portfolio = tokens.portfolio[slug];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${provider.firstName} ${provider.lastName}, ${provider.profession}`}
      onPress={onPress ? () => onPress(provider.id) : undefined}
      style={({ pressed }) => [
        {
          width: (width ?? "78%") as ViewStyle["width"],
          maxWidth: typeof width === "number" ? undefined : 320,
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          overflow: "hidden",
          transform: [{ scale: pressed ? 0.98 : 1 }],
          // Two-layer shadow approximation — RN can only set one shadow object.
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 14,
          elevation: 6,
        },
        style,
      ]}
    >
      <PhotoTile category={slug} aspect="4/5">
        <SpecialtyTag accent={portfolio.accent} label={portfolio.label} iconName={portfolio.iconName} />
        {onFavorite ? (
          <HeartButton
            favorited={favorited}
            onPress={() => onFavorite(provider.id)}
          />
        ) : null}
        {provider.topRated ? <TopRatedPill /> : null}
        <View style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Avatar
            name={`${provider.firstName} ${provider.lastName}`}
            initials={provider.initials}
            bg={provider.avatarBg}
            src={provider.avatarUrl}
            size={42}
            online={provider.online}
          />
        </View>
      </PhotoTile>

      <View style={{ padding: 14, paddingBottom: 16 }}>
        <CardMetaRow1 provider={provider} showReviewCount={false} />
        <Text
          numberOfLines={1}
          style={{
            color: tokens.color.textMuted,
            fontFamily: FONTS.bodyMed,
            fontSize: 14,
            marginTop: 1,
          }}
        >
          {provider.profession}
          {provider.commune ? ` · ${provider.commune}` : ""}
        </Text>
        <ResponseLine response={provider.response} />
        <PriceLine hourly={provider.hourly} suffix="/h" />
      </View>
    </Pressable>
  );
};

// ─── Sub-components reused across the card variants ─────────────────────────

const SpecialtyTag: React.FC<{
  accent: string;
  label: string;
  iconName: string;
}> = ({ accent, label, iconName }) => {
  const Icon = I[iconName as IconName];
  return (
    <View
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      {Icon ? <Icon size={11} color={accent} strokeWidth={1.75} /> : null}
      <Text
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10,
          fontWeight: "600",
          color: accent,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const HeartButton: React.FC<{
  favorited: boolean;
  onPress: (e: GestureResponderEvent) => void;
}> = ({ favorited, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    accessibilityState={{ selected: favorited }}
    onPress={(e) => {
      e.stopPropagation?.();
      onPress(e);
    }}
    hitSlop={8}
    style={{
      position: "absolute",
      top: 10,
      right: 10,
      padding: 6,
    }}
  >
    <I.heart
      size={22}
      color={favorited ? tokens.color.accent : "#FFFFFF"}
      fill={favorited ? tokens.color.accent : "rgba(15,23,42,0.25)"}
      strokeWidth={2}
    />
  </Pressable>
);

const TopRatedPill: React.FC = () => (
  <View
    style={{
      position: "absolute",
      left: 12,
      bottom: 12,
      backgroundColor: "rgba(15,23,42,0.88)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    }}
  >
    <I.award size={11} color="#FFFFFF" strokeWidth={2} />
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 11,
        fontFamily: FONTS.bodySemi,
        fontWeight: "600",
      }}
    >
      Top rated
    </Text>
  </View>
);

const CardMetaRow1: React.FC<{
  provider: ProviderCardData;
  showReviewCount: boolean;
}> = ({ provider, showReviewCount }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        minWidth: 0,
        flexShrink: 1,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FONTS.display,
          fontWeight: "600",
          fontSize: 16,
          color: tokens.color.textPrimary,
          flexShrink: 1,
        }}
      >
        {provider.firstName} {provider.lastName}
      </Text>
      {provider.verified ? (
        <I.badgeCheck size={14} color={tokens.color.success} strokeWidth={1.75} />
      ) : null}
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 }}>
      <I.star size={13} color={tokens.color.warning} fill={tokens.color.warning} />
      <Text
        style={{
          color: tokens.color.textPrimary,
          fontWeight: "600",
          fontSize: 13,
          fontFamily: FONTS.bodySemi,
          fontVariant: ["tabular-nums"],
        }}
      >
        {provider.rating.toFixed(1)}
      </Text>
      {showReviewCount ? (
        <Text
          style={{
            color: tokens.color.textMuted,
            fontSize: 12,
            fontFamily: FONTS.body,
            fontVariant: ["tabular-nums"],
          }}
        >
          ({provider.reviews})
        </Text>
      ) : null}
    </View>
  </View>
);

const ResponseLine: React.FC<{ response: string }> = ({ response }) => {
  if (response === "À confirmer") {
    return (
      <Text
        style={{
          fontFamily: FONTS.bodyMed,
          fontSize: 12,
          color: tokens.color.textMuted,
          marginTop: 4,
        }}
      >
        Délai de réponse à confirmer
      </Text>
    );
  }

  const isFast = response.includes("min");
  return (
    <Text
      style={{
        fontFamily: FONTS.bodyMed,
        fontSize: 12,
        color: isFast ? tokens.color.success : tokens.color.textMuted,
        marginTop: 4,
      }}
    >
      Répond en ~{response}
    </Text>
  );
};

const PriceLine: React.FC<{ hourly: number; suffix: string }> = ({
  hourly,
  suffix,
}) => (
  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "baseline" }}>
    <Text
      style={{
        color: tokens.color.textMuted,
        fontSize: 12,
        fontFamily: FONTS.body,
        fontWeight: "500",
        marginRight: 5,
      }}
    >
      À partir de
    </Text>
    <Text
      style={{
        fontFamily: FONTS.mono,
        fontSize: 15,
        fontWeight: "600",
        color: tokens.color.textPrimary,
        textDecorationLine: "underline",
        fontVariant: ["tabular-nums"],
      }}
    >
      {formatMoneyFc(hourly)}
    </Text>
    <Text
      style={{
        color: tokens.color.textMuted,
        fontSize: 14,
        fontFamily: FONTS.body,
      }}
    >
      {" "}
      {suffix}
    </Text>
  </View>
);

export const _featuredInternals = {
  SpecialtyTag,
  HeartButton,
  TopRatedPill,
  CardMetaRow1,
  ResponseLine,
  PriceLine,
};

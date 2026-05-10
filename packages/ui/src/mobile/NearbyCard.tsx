import * as React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import {
  formatHourlyCompact,
  portfolioSlug,
  type ProviderCardData,
} from "../cards.js";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { I, type IconName } from "./Icon.js";
import { PhotoTile } from "./PhotoTile.js";

const FONTS = {
  display: "PlusJakartaSans-SemiBold",
  body: "Inter-Regular",
  bodyMed: "Inter-Medium",
  bodySemi: "Inter-SemiBold",
  mono: "JetBrainsMono-Medium",
};

export type NearbyRowProps = {
  provider: ProviderCardData;
  onPress?: (id: string) => void;
  last?: boolean;
};

export const NearbyRow: React.FC<NearbyRowProps> = ({ provider, onPress, last }) => {
  const slug = portfolioSlug(provider.categories);
  const portfolio = tokens.portfolio[slug];
  const TileIcon = I[portfolio.iconName as IconName];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${provider.firstName} ${provider.lastName}, ${provider.profession}`}
      onPress={onPress ? () => onPress(provider.id) : undefined}
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: 12,
        paddingVertical: 12,
        alignItems: "center",
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: tokens.color.borderSubtle,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 14,
          overflow: "hidden",
          // Per spec, the mini tile carries its own elev.e1 lift inside the card.
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <PhotoTile category={slug} aspect="1/1" radius={14} showAmbient={false}>
          <View style={{ position: "absolute", left: 6, top: 6 }}>
            {TileIcon ? (
              <TileIcon size={14} color={portfolio.accent} strokeWidth={1.75} />
            ) : null}
          </View>
          <View style={{ position: "absolute", right: 6, bottom: 6 }}>
            <Avatar
              name={`${provider.firstName} ${provider.lastName}`}
              initials={provider.initials}
              bg={provider.avatarBg}
              src={provider.avatarUrl}
              size={28}
            />
          </View>
        </PhotoTile>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONTS.display,
              fontWeight: "600",
              fontSize: 15,
              color: tokens.color.textPrimary,
              flexShrink: 1,
            }}
          >
            {provider.firstName} {provider.lastName}
          </Text>
          {provider.verified ? (
            <I.badgeCheck size={13} color={tokens.color.success} strokeWidth={1.75} />
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={{
            color: tokens.color.textMuted,
            fontFamily: FONTS.bodyMed,
            fontSize: 13,
            marginTop: 1,
          }}
        >
          {provider.profession}
          {provider.distance != null ? ` · ${provider.distance} km` : ""}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 5,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <I.star size={11} color={tokens.color.warning} fill={tokens.color.warning} />
            <Text
              style={{
                color: tokens.color.textPrimary,
                fontWeight: "600",
                fontSize: 12,
                fontFamily: FONTS.bodySemi,
                fontVariant: ["tabular-nums"],
              }}
            >
              {provider.rating.toFixed(1)}
            </Text>
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
          </View>
          <Text
            style={{
              fontSize: 12,
              fontFamily: FONTS.bodyMed,
              color: provider.response.includes("min")
                ? tokens.color.success
                : tokens.color.textMuted,
            }}
          >
            ~{provider.response}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Text
          style={{
            color: tokens.color.textMuted,
            fontSize: 11,
            fontFamily: FONTS.bodyMed,
            marginBottom: 2,
          }}
        >
          À partir de
        </Text>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            fontWeight: "600",
            color: tokens.color.textPrimary,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatHourlyCompact(provider.hourly)}
        </Text>
        <Text
          style={{
            color: tokens.color.textMuted,
            fontSize: 12,
            fontFamily: FONTS.bodyMed,
            marginTop: 2,
          }}
        >
          /h
        </Text>
      </View>
    </Pressable>
  );
};

export type NearbyCardProps = {
  providers: ProviderCardData[];
  onSelect?: (id: string) => void;
  style?: ViewStyle;
};

export const NearbyCard: React.FC<NearbyCardProps> = ({
  providers,
  onSelect,
  style,
}) => (
  <View
    style={[
      {
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 4,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 6,
      },
      style,
    ]}
  >
    {providers.map((p, i) => (
      <NearbyRow
        key={p.id}
        provider={p}
        onPress={onSelect}
        last={i === providers.length - 1}
      />
    ))}
  </View>
);

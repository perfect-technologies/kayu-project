import * as React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { portfolioSlug, type ProviderCardData } from "../cards.js";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { _featuredInternals } from "./FeaturedProviderCard.js";
import { PhotoTile } from "./PhotoTile.js";

const {
  SpecialtyTag,
  HeartButton,
  TopRatedPill,
  CardMetaRow1,
  ResponseLine,
  PriceLine,
  SecondaryCategoryRow,
} = _featuredInternals;

const FONTS = {
  bodyMed: "Inter-Medium",
};

export type WideProviderCardProps = {
  provider: ProviderCardData;
  favorited?: boolean;
  onFavorite?: (id: string) => void;
  onPress?: (id: string) => void;
  style?: ViewStyle;
};

// WideProviderCard — 16:11 photo, full-width search result.
export const WideProviderCard: React.FC<WideProviderCardProps> = ({
  provider,
  favorited = false,
  onFavorite,
  onPress,
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
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          overflow: "hidden",
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 14,
          elevation: 6,
        },
        style,
      ]}
    >
      <PhotoTile
        category={slug}
        accent={provider.categoryColor}
        iconName={provider.categoryIconName}
        aspect="16/11"
      >
        <SpecialtyTag
          accent={provider.categoryColor ?? portfolio.accent}
          label={provider.categoryName ?? portfolio.label}
          iconName={provider.categoryIconName ?? portfolio.iconName}
        />
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
            size={44}
            online={provider.online}
          />
        </View>
      </PhotoTile>

      <View style={{ padding: 14, paddingBottom: 16 }}>
        <CardMetaRow1 provider={provider} showReviewCount />
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
          {provider.distance != null ? ` · ${provider.distance} km` : ""}
        </Text>
        <SecondaryCategoryRow categories={provider.secondaryCategories} />
        <ResponseLine response={provider.response} />
        <PriceLine hourly={provider.hourly} />
      </View>
    </Pressable>
  );
};

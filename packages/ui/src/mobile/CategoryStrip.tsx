import * as React from "react";
import { Pressable, ScrollView, Text, View, type ViewStyle } from "react-native";
import { tokens, type CategorySlug } from "../tokens.js";
import { I, type IconName } from "./Icon.js";

export type CategoryStripItem = {
  slug: CategorySlug;
  label?: string;
  iconName?: IconName;
};

export type CategoryStripProps = {
  items: CategoryStripItem[];
  active?: CategorySlug;
  onSelect?: (slug: CategorySlug) => void;
  style?: ViewStyle;
};

const FONTS = {
  body: "Inter-Regular",
  bodyMed: "Inter-Medium",
  bodySemi: "Inter-SemiBold",
};

// CategoryStrip — horizontal-scroll category icon row (mobile home/search).
// 22px Lucide icon + 11px label + 2px ink underline on the active item.
export const CategoryStrip: React.FC<CategoryStripProps> = ({
  items,
  active,
  onSelect,
  style,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={style}
    contentContainerStyle={{
      gap: 28,
      paddingHorizontal: 20,
      paddingBottom: 12,
    }}
  >
    {items.map((item) => {
      const portfolio = tokens.portfolio[item.slug];
      const Icon = I[(item.iconName ?? portfolio.iconName) as IconName];
      const isActive = active === item.slug;
      return (
        <Pressable
          key={item.slug}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          onPress={onSelect ? () => onSelect(item.slug) : undefined}
          style={{
            minWidth: 52,
            alignItems: "center",
            paddingTop: 10,
            paddingBottom: 8,
            borderBottomWidth: 2,
            borderBottomColor: isActive
              ? tokens.color.textPrimary
              : "transparent",
            opacity: isActive ? 1 : 0.64,
          }}
        >
          {Icon ? (
            <Icon
              size={22}
              color={tokens.color.textPrimary}
              strokeWidth={1.75}
            />
          ) : null}
          <Text
            style={{
              fontFamily: isActive ? FONTS.bodySemi : FONTS.bodyMed,
              fontSize: 11,
              color: tokens.color.textPrimary,
              marginTop: 6,
            }}
            numberOfLines={1}
          >
            {item.label ?? portfolio.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);


import * as React from "react";
import { Pressable, ScrollView, Text, type ViewStyle } from "react-native";
import { tokens, type CategorySlug } from "../tokens.js";
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
} from "./Icon.js";

export type CategoryStripItem = {
  slug: string;
  label?: string;
  iconName?: string;
  color?: string;
};

export type CategoryStripProps = {
  items: CategoryStripItem[];
  active?: string;
  onSelect?: (slug: string) => void;
  style?: ViewStyle;
};

const FONTS = {
  body: "Inter-Regular",
  bodyMed: "Inter-Medium",
  bodySemi: "Inter-SemiBold",
};

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
      const portfolio =
        item.slug in tokens.portfolio
          ? tokens.portfolio[item.slug as CategorySlug]
          : undefined;
      const Icon =
        resolveLucideIcon(item.iconName) ??
        (portfolio ? I[portfolio.iconName as IconName] : null) ??
        FallbackCategoryIcon;
      const label = item.label ?? portfolio?.label ?? item.slug;
      const isActive = active === item.slug;
      const iconColor = item.color ?? tokens.color.textPrimary;
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
          <Icon size={22} color={iconColor} strokeWidth={1.75} />
          <Text
            style={{
              fontFamily: isActive ? FONTS.bodySemi : FONTS.bodyMed,
              fontSize: 11,
              color: tokens.color.textPrimary,
              marginTop: 6,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

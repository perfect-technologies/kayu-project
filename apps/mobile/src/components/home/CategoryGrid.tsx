import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

interface CategoryGridProps {
  categories: Category[];
  onPress?: (category: Category) => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  plomberie: 'water',
  electricite: 'flash',
  menuiserie: 'hammer',
  peinture: 'color-palette',
  coiffure: 'cut',
  couture: 'shirt',
  cuisine: 'restaurant',
  nettoyage: 'sparkles',
  mecanique: 'car',
  jardinage: 'leaf',
  informatique: 'laptop',
  beaute: 'heart',
};

function getCategoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return 'construct';
}

export function CategoryGrid({ categories, onPress }: CategoryGridProps) {
  return (
    <FlatList
      data={categories}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.card, shadowStyles.sm]}
          activeOpacity={0.7}
          onPress={() => onPress?.(item)}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getCategoryIcon(item.name)}
              size={28}
              color={colors.primary.DEFAULT}
            />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
});

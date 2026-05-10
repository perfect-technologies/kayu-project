import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FallbackCategoryIcon, I, resolveLucideIcon } from '@kayu/ui/mobile';
import { tokens } from '@kayu/ui';
import { theme } from '@/lib/theme';

export type MobileSortOption =
  | 'recommended'
  | 'newest'
  | 'price_low'
  | 'price_high';

export const MOBILE_SORT_LABELS: Record<MobileSortOption, string> = {
  recommended: 'Recommandés',
  newest: 'Plus récents',
  price_low: 'Prix croissant',
  price_high: 'Prix décroissant',
};

export type MobileFilters = {
  category: string | null;
  subcategory: string | null;
  q: string;
  city: string;
  available: boolean;
  verified: boolean;
  minRating: number | null;
  minPrice: string;
  maxPrice: string;
  sort: MobileSortOption;
};

export const EMPTY_FILTERS: MobileFilters = {
  category: null,
  subcategory: null,
  q: '',
  city: '',
  available: false,
  verified: false,
  minRating: null,
  minPrice: '',
  maxPrice: '',
  sort: 'recommended',
};

export type MobileFilterCategory = {
  slug: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  count?: number;
  subcategories?: Array<{ slug: string; label: string }>;
};

type MobileFilterSheetProps = {
  open: boolean;
  initial: MobileFilters;
  onApply: (next: MobileFilters) => void;
  onClose: () => void;
  categoriesAvailable: MobileFilterCategory[];
  categoriesLoading?: boolean;
};

export function MobileFilterSheet({
  open,
  initial,
  onApply,
  onClose,
  categoriesAvailable,
  categoriesLoading = false,
}: MobileFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = React.useState<MobileFilters>(initial);

  React.useEffect(() => {
    if (open) setLocal(initial);
  }, [open, initial]);

  const categories = categoriesAvailable;
  const selectedCategory = local.category
    ? categories.find((c) => c.slug === local.category)
    : undefined;
  const subcategories = selectedCategory?.subcategories ?? [];

  const toggleCategory = (slug: string) =>
    setLocal((f) => ({
      ...f,
      category: f.category === slug ? null : slug,
      subcategory: f.category === slug ? null : null,
    }));

  const toggleSubcategory = (slug: string) =>
    setLocal((f) => ({
      ...f,
      subcategory: f.subcategory === slug ? null : slug,
    }));

  const reset = () => setLocal(EMPTY_FILTERS);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} pointerEvents="box-none">
        <View style={styles.grabHandle} />

        <View style={styles.header}>
          <Text style={styles.heading}>Filtres</Text>
          <Pressable
            hitSlop={10}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer les filtres"
          >
            <I.x size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <FilterSection title="Catégorie">
            <View style={{ gap: 2 }}>
              {categoriesLoading && categories.length === 0 ? (
                <Text style={styles.catLabel}>Chargement…</Text>
              ) : categories.length === 0 ? (
                <Text style={styles.catLabel}>Aucune catégorie disponible.</Text>
              ) : (
                categories.map((c) => {
                  const selected = local.category === c.slug;
                  const Icon =
                    resolveLucideIcon(c.icon ?? undefined) ?? FallbackCategoryIcon;
                  const accent = c.color ?? tokens.color.textBody;
                  return (
                    <Pressable
                      key={c.slug}
                      style={styles.catRow}
                      onPress={() => toggleCategory(c.slug)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                        {selected ? (
                          <I.check size={13} color={theme.colors.textInverse} />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.catTint,
                          { backgroundColor: `${accent}20` },
                        ]}
                      >
                        <Icon size={14} color={accent} strokeWidth={1.75} />
                      </View>
                      <Text style={styles.catLabel}>{c.label}</Text>
                      {c.count != null ? (
                        <Text style={styles.catCount}>{c.count}</Text>
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </FilterSection>

          {subcategories.length > 0 ? (
            <FilterSection title="Spécialité">
              <View style={{ gap: 2 }}>
                {subcategories.map((sub) => {
                  const selected = local.subcategory === sub.slug;
                  return (
                    <Pressable
                      key={sub.slug}
                      style={styles.catRow}
                      onPress={() => toggleSubcategory(sub.slug)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                        {selected ? (
                          <I.check size={13} color={theme.colors.textInverse} />
                        ) : null}
                      </View>
                      <Text style={styles.catLabel}>{sub.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </FilterSection>
          ) : null}

          <FilterSection title="Recherche">
            <TextInput
              value={local.q}
              onChangeText={(value) => setLocal((f) => ({ ...f, q: value }))}
              placeholder="Service, compétence ou nom du pro"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <TextInput
              value={local.city}
              onChangeText={(value) => setLocal((f) => ({ ...f, city: value }))}
              placeholder="Ville ou commune"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.inputSpacing]}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </FilterSection>

          <FilterSection title="Budget">
            <View style={styles.inputRow}>
              <TextInput
                value={local.minPrice}
                onChangeText={(value) =>
                  setLocal((f) => ({ ...f, minPrice: value.replace(/[^0-9]/g, '') }))
                }
                placeholder="Min FC"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.inputHalf]}
                keyboardType="numeric"
              />
              <TextInput
                value={local.maxPrice}
                onChangeText={(value) =>
                  setLocal((f) => ({ ...f, maxPrice: value.replace(/[^0-9]/g, '') }))
                }
                placeholder="Max FC"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.inputHalf]}
                keyboardType="numeric"
              />
            </View>
          </FilterSection>

          <FilterSection title="Note minimale">
            <View style={styles.optionRow}>
              {[4, 4.5].map((value) => {
                const selected = local.minRating === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.optionChip, selected && styles.optionChipActive]}
                    onPress={() =>
                      setLocal((f) => ({
                        ...f,
                        minRating: f.minRating === value ? null : value,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selected && styles.optionChipTextActive,
                      ]}
                    >
                      {`${value.toFixed(1)}+`}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.clearChip}
                onPress={() => setLocal((f) => ({ ...f, minRating: null }))}
              >
                <Text style={styles.clearChipText}>Tout</Text>
              </Pressable>
            </View>
          </FilterSection>

          <FilterSection title="Disponibilité">
            <ToggleRow
              label="Accepte les demandes"
              value={local.available}
              onChange={(v) => setLocal((f) => ({ ...f, available: v }))}
            />
          </FilterSection>

          <FilterSection title="Confiance">
            <ToggleRow
              label="Vérifié"
              value={local.verified}
              onChange={(v) => setLocal((f) => ({ ...f, verified: v }))}
            />
          </FilterSection>

          <FilterSection title="Tri" last>
            <View style={{ gap: 8 }}>
              {(Object.entries(MOBILE_SORT_LABELS) as Array<[MobileSortOption, string]>).map(
                ([value, label]) => {
                  const selected = local.sort === value;
                  return (
                    <Pressable
                      key={value}
                      style={[styles.sortRow, selected && styles.sortRowActive]}
                      onPress={() => setLocal((f) => ({ ...f, sort: value }))}
                    >
                      <Text style={[styles.sortLabel, selected && styles.sortLabelActive]}>
                        {label}
                      </Text>
                      {selected ? (
                        <I.check size={16} color={theme.colors.primaryHover} />
                      ) : null}
                    </Pressable>
                  );
                },
              )}
            </View>
          </FilterSection>

          <Pressable hitSlop={6} onPress={reset} style={styles.reset}>
            <Text style={styles.resetText}>Effacer les filtres</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            style={styles.cta}
            onPress={() => {
              onApply(local);
              onClose();
            }}
          >
            <Text style={styles.ctaText}>Appliquer les filtres</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.section, last && styles.sectionLast]}>
      <Text style={styles.overline}>{title}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.borderStrong,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heading: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 20,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 20,
  },
  section: {
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  sectionLast: {
    paddingBottom: 4,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  overline: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkboxOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catTint: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  catCount: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  inputSpacing: {
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    minWidth: 68,
    height: 36,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  optionChipText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  optionChipTextActive: {
    color: theme.colors.primaryHover,
    fontWeight: '600',
  },
  clearChip: {
    height: 36,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearChipText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  sortRow: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
  },
  sortRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  sortLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  sortLabelActive: {
    color: theme.colors.primaryHover,
    fontWeight: '600',
  },
  reset: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  resetText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.primaryHover,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  cta: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
});

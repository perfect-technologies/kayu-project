import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I } from '@kayu/ui/mobile';
import { tokens, type CategorySlug } from '@kayu/ui';
import { theme } from '@/lib/theme';

export type MobileFilters = {
  category: CategorySlug | null;
  available: boolean;
  verified: boolean;
  topRated: boolean;
  expert: boolean;
  maxDistanceKm: number;
};

export const EMPTY_FILTERS: MobileFilters = {
  category: null,
  available: false,
  verified: false,
  topRated: false,
  expert: false,
  maxDistanceKm: 20,
};

type MobileFilterSheetProps = {
  open: boolean;
  initial: MobileFilters;
  resultCount: number;
  onApply: (next: MobileFilters) => void;
  onClose: () => void;
  categoriesAvailable?: { slug: CategorySlug; label: string; count?: number }[];
};

const DEFAULT_CATEGORIES: { slug: CategorySlug; label: string; count?: number }[] = [
  { slug: 'plomberie', label: 'Plomberie' },
  { slug: 'electricite', label: 'Électricité' },
  { slug: 'menage', label: 'Ménage' },
  { slug: 'coiffure', label: 'Coiffure' },
  { slug: 'jardinage', label: 'Jardinage' },
  { slug: 'informatique', label: 'Informatique' },
];

export function MobileFilterSheet({
  open,
  initial,
  resultCount,
  onApply,
  onClose,
  categoriesAvailable,
}: MobileFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = React.useState<MobileFilters>(initial);

  React.useEffect(() => {
    if (open) setLocal(initial);
  }, [open, initial]);

  const categories = categoriesAvailable?.length ? categoriesAvailable : DEFAULT_CATEGORIES;

  const toggleCategory = (slug: CategorySlug) =>
    setLocal((f) => ({ ...f, category: f.category === slug ? null : slug }));

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
          {/* Catégorie */}
          <FilterSection title="Catégorie">
            <View style={{ gap: 2 }}>
              {categories.map((c) => {
                const portfolio = tokens.portfolio[c.slug];
                const selected = local.category === c.slug;
                return (
                  <Pressable
                    key={c.slug}
                    style={styles.catRow}
                    onPress={() => toggleCategory(c.slug)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                      {selected ? <I.check size={13} color={theme.colors.textInverse} /> : null}
                    </View>
                    <View
                      style={[
                        styles.catTint,
                        { backgroundColor: `${portfolio.accent}20` },
                      ]}
                    >
                      <View
                        style={[styles.catDot, { backgroundColor: portfolio.accent }]}
                      />
                    </View>
                    <Text style={styles.catLabel}>{c.label}</Text>
                    {c.count != null ? (
                      <Text style={styles.catCount}>{c.count}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </FilterSection>

          {/* Distance */}
          <FilterSection title="Distance">
            <View style={styles.rangeHead}>
              <Text style={styles.caption}>0 km</Text>
              <Text style={styles.caption}>{`< ${local.maxDistanceKm} km`}</Text>
            </View>
            <View style={styles.rangeTrack}>
              <View
                style={[
                  styles.rangeFill,
                  { width: `${Math.min(100, (local.maxDistanceKm / 50) * 100)}%` },
                ]}
              />
              {[5, 10, 20, 30, 50].map((v) => (
                <Pressable
                  key={v}
                  style={styles.rangeStep}
                  onPress={() => setLocal((f) => ({ ...f, maxDistanceKm: v }))}
                  accessibilityLabel={`Distance maximum ${v} km`}
                >
                  <Text
                    style={[
                      styles.rangeStepText,
                      local.maxDistanceKm === v && styles.rangeStepTextActive,
                    ]}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FilterSection>

          {/* Disponibilité */}
          <FilterSection title="Disponibilité">
            <ToggleRow
              label="Disponible maintenant"
              value={local.available}
              onChange={(v) => setLocal((f) => ({ ...f, available: v }))}
            />
          </FilterSection>

          {/* Confiance */}
          <FilterSection title="Confiance" last>
            <ToggleRow
              label="Vérifié"
              value={local.verified}
              onChange={(v) => setLocal((f) => ({ ...f, verified: v }))}
            />
            <ToggleRow
              label="Top rated"
              value={local.topRated}
              onChange={(v) => setLocal((f) => ({ ...f, topRated: v }))}
            />
            <ToggleRow
              label="Expert"
              value={local.expert}
              onChange={(v) => setLocal((f) => ({ ...f, expert: v }))}
            />
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
            <Text style={styles.ctaText}>Voir {resultCount} résultats</Text>
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
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  rangeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  caption: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  rangeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rangeFill: {
    position: 'absolute',
    left: 0,
    top: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  rangeStep: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeStepText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  rangeStepTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
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

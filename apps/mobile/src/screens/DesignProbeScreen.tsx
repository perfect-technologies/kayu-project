import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens, type CategorySlug, type ProviderCardData } from '@kayu/ui';
import {
  Avatar,
  Button,
  CategoryStrip,
  Chip,
  FeaturedProviderCard,
  FeaturedProviderCardSkeleton,
  I,
  Input,
  NearbyCard,
  NearbyCardSkeleton,
  PhotoTile,
  Shimmer,
  StarRating,
  TopRatedRibbon,
  TrustChip,
  WideProviderCard,
  WideProviderCardSkeleton,
} from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';

// D01 smoke-test — renders the v2 token layer on mobile.
// Delete after D09 passes.

const COLOR_GROUPS: { title: string; keys: (keyof typeof tokens.color)[] }[] = [
  {
    title: 'Surfaces',
    keys: [
      'bg',
      'surface',
      'surfaceMuted',
      'surfacePrimary',
      'surfaceEmerald',
      'surfaceCoral',
      'surfaceAmber',
      'surfaceRose',
      'surfaceExpert',
    ],
  },
  {
    title: 'Text',
    keys: ['textPrimary', 'textBody', 'textMuted', 'textSubtle', 'textInverse'],
  },
  { title: 'Borders', keys: ['border', 'borderSubtle', 'borderStrong'] },
  {
    title: 'Intent',
    keys: [
      'primary',
      'primaryHover',
      'primarySubtle',
      'accent',
      'accentSubtle',
      'success',
      'successSubtle',
      'warning',
      'warningSubtle',
      'danger',
      'dangerSubtle',
      'expert',
      'expertSubtle',
    ],
  },
];

const SAMPLE_PROVIDERS: ProviderCardData[] = [
  {
    id: 'p1',
    firstName: 'Jean',
    lastName: 'Mubake',
    initials: 'JM',
    profession: 'Plombier certifié',
    commune: 'Gombe',
    categories: ['plomberie'],
    avatarBg: '#0EA5E9',
    rating: 4.9,
    reviews: 127,
    response: '15 min',
    hourly: 15000,
    distance: 2.3,
    verified: true,
    topRated: true,
    online: true,
  },
  {
    id: 'p2',
    firstName: 'Grâce',
    lastName: 'Tshilumba',
    initials: 'GT',
    profession: 'Électricienne',
    commune: 'Lemba',
    categories: ['electricite'],
    avatarBg: '#FB7185',
    rating: 4.8,
    reviews: 89,
    response: '1h',
    hourly: 12000,
    distance: 4.1,
    verified: true,
    online: true,
  },
  {
    id: 'p3',
    firstName: 'Lucie',
    lastName: 'Kabasele',
    initials: 'LK',
    profession: 'Coiffeuse à domicile',
    commune: 'Kamalondo',
    categories: ['coiffure'],
    avatarBg: '#F59E0B',
    rating: 4.9,
    reviews: 203,
    response: '20 min',
    hourly: 10000,
    distance: 1.2,
    verified: true,
    topRated: true,
  },
  {
    id: 'p4',
    firstName: 'Bernadette',
    lastName: 'Mupenda',
    initials: 'BM',
    profession: 'Agent de ménage',
    commune: 'Tié-Tié',
    categories: ['menage'],
    avatarBg: '#BE185D',
    rating: 4.8,
    reviews: 156,
    response: '30 min',
    hourly: 5000,
    distance: 2.9,
    verified: true,
  },
];

const STRIP_ITEMS: { slug: CategorySlug }[] = [
  { slug: 'plomberie' },
  { slug: 'electricite' },
  { slug: 'menage' },
  { slug: 'coiffure' },
  { slug: 'informatique' },
  { slug: 'jardinage' },
  { slug: 'peinture' },
  { slug: 'transport' },
  { slug: 'menuiserie' },
];

const RADII: (keyof typeof tokens.radius)[] = ['sm', 'md', 'lg', 'xl', 'xxl'];
const SHADOWS: (keyof typeof theme.shadow)[] = ['e1', 'e2', 'e3', 'e4', 'brand'];
const TYPE: (keyof typeof theme.text)[] = [
  'displayXL',
  'displayL',
  'displayM',
  'heading',
  'bodyL',
  'body',
  'bodyM',
  'caption',
  'price',
  'overline',
];

const DARK_FG_KEYS = new Set<keyof typeof tokens.color>([
  'textPrimary',
  'textBody',
  'primary',
  'primaryHover',
  'accent',
  'success',
  'danger',
  'expert',
]);

export function DesignProbeScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={[theme.text.overline]}>KAYOU Design v2 · D01 probe</Text>
      <Text style={[theme.text.displayL, styles.title]}>
        Trust travels light.
      </Text>
      <Text style={[theme.text.body, styles.subtitle]}>
        Heading = Plus Jakarta Sans · this line = Inter ·{' '}
        <Text style={theme.text.price}>15 000 FC/h</Text> = JetBrains Mono.
      </Text>

      <Section title="Colors">
        {COLOR_GROUPS.map((g) => (
          <View key={g.title} style={styles.group}>
            <Text style={[theme.text.heading, styles.groupTitle]}>{g.title}</Text>
            <View style={styles.swatchGrid}>
              {g.keys.map((k) => (
                <View
                  key={k}
                  style={[
                    styles.swatch,
                    { backgroundColor: tokens.color[k] },
                  ]}
                >
                  <Text
                    style={[
                      styles.swatchLabel,
                      {
                        color: DARK_FG_KEYS.has(k)
                          ? '#FFFFFF'
                          : tokens.color.textPrimary,
                      },
                    ]}
                  >
                    {k}
                  </Text>
                  <Text
                    style={[
                      styles.swatchHex,
                      {
                        color: DARK_FG_KEYS.has(k)
                          ? '#FFFFFF'
                          : tokens.color.textPrimary,
                      },
                    ]}
                  >
                    {tokens.color[k]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Section>

      <Section title="Radius">
        <View style={styles.rowWrap}>
          {RADII.map((r) => (
            <View key={r} style={styles.radiusCell}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  backgroundColor: tokens.color.surface,
                  borderWidth: 1,
                  borderColor: tokens.color.border,
                  borderRadius: tokens.radius[r],
                  ...theme.shadow.e1,
                }}
              />
              <Text style={styles.mono}>
                {r} · {tokens.radius[r]}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Elevation">
        <View style={styles.rowWrap}>
          {SHADOWS.map((s) => (
            <View key={s} style={styles.shadowCell}>
              <View
                style={[
                  {
                    width: 140,
                    height: 96,
                    backgroundColor: tokens.color.surface,
                    borderRadius: tokens.radius.lg,
                  },
                  theme.shadow[s],
                ]}
              />
              <Text style={styles.mono}>shadow.{s}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type scale">
        <View
          style={[
            {
              backgroundColor: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              borderWidth: 1,
              borderColor: tokens.color.border,
              padding: 16,
            },
            theme.shadow.e1,
          ]}
        >
          {TYPE.map((t, i) => (
            <View
              key={t}
              style={[
                styles.typeRow,
                i < TYPE.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.color.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.mono, styles.typeLabel]}>{t}</Text>
              <Text style={theme.text[t]}>
                {t === 'price'
                  ? '15 000 FC /h'
                  : t === 'overline'
                    ? 'Top rated cette semaine'
                    : 'Trouvez la bonne personne.'}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Primitives">
        <Text style={[theme.text.heading, styles.groupTitle]}>Button · variants × sizes</Text>
        <View style={{ gap: 10, marginBottom: 20 }}>
          {(['primary', 'secondary', 'ghost'] as const).map((v) => (
            <View
              key={v}
              style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
            >
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <Button key={s} variant={v} size={s} title="Réserver" />
              ))}
            </View>
          ))}
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>Button · states</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <Button
            title="Ajouter"
            leadingIcon={<I.plus size={16} color={tokens.color.textOnPrimary} />}
          />
          <Button
            variant="secondary"
            title="Continuer"
            trailingIcon={<I.arrowRight size={16} color={tokens.color.textPrimary} />}
          />
          <Button variant="ghost" title="Annuler" />
          <Button title="Envoi…" loading />
          <Button title="Indisponible" disabled />
        </View>
        <Button title="Pleine largeur" fullWidth />

        <Text style={[theme.text.heading, styles.groupTitle, { marginTop: 24 }]}>Input</Text>
        <View style={{ gap: 12, marginBottom: 20 }}>
          <Input label="Nom" placeholder="Jean Mubake" />
          <Input
            label="Téléphone"
            placeholder="+243 999 000 000"
            helperText="Code envoyé par SMS."
          />
          <Input
            label="Mot de passe"
            placeholder="Votre mot de passe"
            secureTextEntry
            error="Mot de passe trop court (min. 8 caractères)."
          />
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>Avatar</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Avatar name="Jean Mubake" size={32} />
          <Avatar name="Grâce Tshilumba" size={48} />
          <Avatar name="Patrick Nzeba" size={64} online />
          <Avatar name="Lucie Kabasele" size={72} ring online />
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>Chip · variants</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {(['neutral', 'success', 'warning', 'primary', 'accent', 'expert'] as const).map((v) => (
            <Chip key={v} variant={v}>
              {v}
            </Chip>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {(['neutral', 'success', 'warning', 'primary', 'accent', 'expert'] as const).map((v) => (
            <Chip key={v} size="sm" variant={v}>
              {v.toUpperCase()}
            </Chip>
          ))}
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>TrustChip</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <TrustChip trust="NEWCOMER" />
          <TrustChip trust="ESTABLISHED" />
          <TrustChip trust="TRUSTED" />
          <TrustChip trust="EXPERT" />
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>Icon · sizes + stroke</Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
          }}
        >
          <I.search size={16} color={tokens.color.textPrimary} />
          <I.search size={20} color={tokens.color.textPrimary} />
          <I.search size={24} color={tokens.color.textPrimary} />
          <I.heart size={24} color={tokens.color.accent} strokeWidth={2} />
          <I.wrench size={24} color={tokens.color.textPrimary} />
          <I.zap size={24} color={tokens.color.warning} />
          <I.sparkles size={24} color={tokens.color.accent} />
          <I.shieldCheck size={24} color={tokens.color.expert} />
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>StarRating</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
          <StarRating value={4.9} count={127} />
          <StarRating value={4.8} count={89} size={16} />
          <StarRating value={5} />
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>
          TopRatedRibbon (mobile pill)
        </Text>
        <View
          style={[
            {
              width: 240,
              height: 140,
              backgroundColor: tokens.color.surface,
              borderRadius: tokens.radius.xl,
              padding: 12,
              marginBottom: 20,
              justifyContent: 'flex-end',
            },
            theme.shadow.e3,
          ]}
        >
          <TopRatedRibbon />
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>Shimmer</Text>
        <View style={{ gap: 10, marginBottom: 8 }}>
          <Shimmer height={18} />
          <Shimmer height={14} width="70%" />
          <Shimmer height={120} radius={tokens.radius.lg} />
        </View>
      </Section>

      <Section title="D03 · Photo-forward cards">
        <Text style={[theme.text.heading, styles.groupTitle]}>PhotoTile · 4:5 / 16:11 / 1:1</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
          <View style={{ width: 120, borderRadius: tokens.radius.xl, overflow: 'hidden', ...theme.shadow.e3 }}>
            <PhotoTile category="plomberie" aspect="4/5" accessibilityLabel="Plomberie" />
          </View>
          <View style={{ width: 168, borderRadius: tokens.radius.xl, overflow: 'hidden', ...theme.shadow.e3 }}>
            <PhotoTile category="electricite" aspect="16/11" accessibilityLabel="Électricité" />
          </View>
          <View style={{ width: 84, borderRadius: 14, overflow: 'hidden', ...theme.shadow.e1 }}>
            <PhotoTile category="coiffure" aspect="1/1" accessibilityLabel="Coiffure" showAmbient={false} />
          </View>
        </View>

        <Text style={[theme.text.heading, styles.groupTitle]}>FeaturedProviderCard (carousel)</Text>
        <FavoritesPlayground>
          {(favorites, toggle) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 16 }}
              style={{ marginBottom: 24, marginHorizontal: -8, paddingHorizontal: 8 }}
            >
              {SAMPLE_PROVIDERS.map((p) => (
                <FeaturedProviderCard
                  key={p.id}
                  provider={p}
                  width={240}
                  favorited={favorites.has(p.id)}
                  onFavorite={toggle}
                  onPress={(id) => console.log('open', id)}
                />
              ))}
            </ScrollView>
          )}
        </FavoritesPlayground>

        <Text style={[theme.text.heading, styles.groupTitle]}>WideProviderCard (search list)</Text>
        <FavoritesPlayground>
          {(favorites, toggle) => (
            <View style={{ gap: 16, marginBottom: 24 }}>
              {SAMPLE_PROVIDERS.slice(0, 2).map((p) => (
                <WideProviderCard
                  key={p.id}
                  provider={p}
                  favorited={favorites.has(p.id)}
                  onFavorite={toggle}
                  onPress={(id) => console.log('open', id)}
                />
              ))}
            </View>
          )}
        </FavoritesPlayground>

        <Text style={[theme.text.heading, styles.groupTitle]}>NearbyCard (grouped list)</Text>
        <NearbyCard
          providers={SAMPLE_PROVIDERS}
          onSelect={(id) => console.log('open', id)}
          style={{ marginBottom: 24 }}
        />

        <Text style={[theme.text.heading, styles.groupTitle]}>CategoryStrip (horizontal scroll)</Text>
        <CategoryStrip
          items={STRIP_ITEMS}
          active="menage"
          onSelect={(slug) => console.log('cat', slug)}
          style={{ marginHorizontal: -24, marginBottom: 24 }}
        />

        <Text style={[theme.text.heading, styles.groupTitle]}>Skeletons</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 16 }}
          style={{ marginBottom: 16, marginHorizontal: -8, paddingHorizontal: 8 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <FeaturedProviderCardSkeleton key={i} width={240} />
          ))}
        </ScrollView>
        <View style={{ marginBottom: 16 }}>
          <WideProviderCardSkeleton />
        </View>
        <NearbyCardSkeleton />
      </Section>

      <Section title="Three fonts @ 20px">
        {(
          [
            ['Plus Jakarta Sans', theme.fonts.display],
            ['Inter', theme.fonts.body],
            ['JetBrains Mono', theme.fonts.mono],
          ] as const
        ).map(([label, fam]) => (
          <View
            key={label}
            style={[
              styles.fontCard,
              theme.shadow.e1,
            ]}
          >
            <Text style={styles.mono}>{label}</Text>
            <Text
              style={{
                fontFamily: fam,
                fontSize: 20,
                lineHeight: 28,
                color: tokens.color.textPrimary,
              }}
            >
              Mbote Kinshasa 1234567890
            </Text>
          </View>
        ))}
      </Section>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

function FavoritesPlayground({
  children,
}: {
  children: (
    favorites: Set<string>,
    toggle: (id: string) => void,
  ) => React.ReactNode;
}) {
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const toggle = React.useCallback(
    (id: string) =>
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );
  return <>{children(favorites, toggle)}</>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[theme.text.displayM, styles.sectionTitle]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  content: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    marginTop: 6,
  },
  subtitle: {
    color: tokens.color.textMuted,
    marginTop: 8,
    marginBottom: 32,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    marginBottom: 10,
    color: tokens.color.textBody,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 150,
    height: 84,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 12,
    justifyContent: 'space-between',
  },
  swatchLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
  },
  swatchHex: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  radiusCell: {
    alignItems: 'center',
    width: 96,
  },
  shadowCell: {
    alignItems: 'center',
    width: 140,
  },
  mono: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: tokens.color.textMuted,
    marginTop: 8,
  },
  typeRow: {
    paddingVertical: 10,
  },
  typeLabel: {
    marginBottom: 4,
  },
  fontCard: {
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: 14,
    marginBottom: 10,
  },
});

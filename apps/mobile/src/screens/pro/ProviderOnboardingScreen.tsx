import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { I, StepIndicator, type StepIndicatorStep } from '@kayu/ui/mobile';
import { tokens } from '@kayu/ui';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type { ProviderStackParamList } from '@/navigation/AppNavigator';
import {
  CATEGORY_LIST,
  CITIES,
  HOURLY_PRESETS,
  INITIAL_DATA,
  LANGUAGES,
  PAYMENT_OPTIONS,
  SKILL_SUGGESTIONS,
  YEARS_OPTIONS,
  validateStep,
  type OnboardingData,
} from './onboardingData';

type Nav = NativeStackNavigationProp<ProviderStackParamList, 'ProviderOnboarding'>;

const STEPS: StepIndicatorStep[] = [
  { key: 'identity', n: 1, icon: 'shieldCheck' },
  { key: 'craft', n: 2, icon: 'wrench' },
  { key: 'zones', n: 3, icon: 'mapPin' },
  { key: 'pricing', n: 4, icon: 'coins' },
  { key: 'profile', n: 5, icon: 'user' },
  { key: 'publish', n: 6, icon: 'sparkles' },
];

const TITLES: Record<number, string> = {
  1: "Vérifions ton identité",
  2: 'Quel est ton métier ?',
  3: 'Où tu interviens ?',
  4: 'Définis tes tarifs',
  5: 'Complète ton profil',
  6: 'Prêt à publier',
};

const SUBS: Record<number, string> = {
  1: 'Ces infos restent privées. Elles servent uniquement à te vérifier.',
  2: 'Précise ton savoir-faire pour être trouvé par les bons clients.',
  3: 'Les clients te voient si tu couvres leur quartier.',
  4: 'Tu peux modifier à tout moment depuis ton dashboard.',
  5: 'Une photo et un bon texte font toute la différence.',
  6: 'Un dernier coup d\'œil avant de te lancer.',
};

export function ProviderOnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(() => ({
    ...INITIAL_DATA,
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const canContinue = useMemo(() => validateStep(step, data), [step, data]);

  const next = () => {
    if (!canContinue) return;
    if (step < 6) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    // Backend wiring for publish is deferred — see PROGRESS.
    setTimeout(() => {
      navigation.getParent()?.navigate('ProviderDashboard' as never);
      try {
        navigation.popToTop?.();
      } catch {
        /* noop */
      }
    }, 400);
  };

  const back = () => {
    if (step > 1) {
      setStep(step - 1);
      return;
    }
    Alert.alert(
      "Quitter l'onboarding ?",
      'On sauvegarde ta progression comme brouillon.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Sauvegarder et quitter',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={back} style={styles.iconBtn} hitSlop={8}>
              <I.arrowLeft size={20} color={theme.colors.textBody} />
            </Pressable>
            <Text style={styles.stepCaption}>Étape {step} / 6</Text>
          </View>
          <StepIndicator steps={STEPS} step={step} compact />
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 120 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{TITLES[step]}</Text>
          <Text style={styles.subtitle}>{SUBS[step]}</Text>

          {step === 1 && <StepIdentity data={data} setData={updateData} />}
          {step === 2 && <StepCraft data={data} setData={updateData} />}
          {step === 3 && <StepZones data={data} setData={updateData} />}
          {step === 4 && <StepPricing data={data} setData={updateData} />}
          {step === 5 && <StepProfile data={data} setData={updateData} />}
          {step === 6 && <StepPublish data={data} setData={updateData} />}
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!canContinue || submitting) && styles.primaryBtnDisabled,
            ]}
            onPress={next}
            disabled={!canContinue || submitting}
          >
            <Text style={styles.primaryBtnText}>
              {step === 6 ? 'Publier mon profil' : 'Continuer'}
            </Text>
            <I.arrowRight size={16} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Step components ──────────────────────────────────────────────────────

type StepProps = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};

function FieldLabel({
  label,
  hint,
  optional,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.fieldLabel}>
        {label}
        {optional && <Text style={styles.fieldOptional}> (optionnel)</Text>}
      </Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function StepIdentity({ data, setData }: StepProps) {
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.infoCardSky}>
        <I.shieldCheck size={20} color={tokens.color.primaryHover} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoCardTitleSky}>Pourquoi on vérifie</Text>
          <Text style={styles.infoCardBody}>
            Les clients KAYOU choisissent en confiance. Ton identité vérifiée
            débloque le badge « Vérifié » sur ton profil.
          </Text>
        </View>
      </View>

      <View>
        <FieldLabel label="Prénom" />
        <TextInput
          style={styles.input}
          value={data.firstName}
          onChangeText={(v) => setData({ firstName: v })}
          placeholder="Jean"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View>
        <FieldLabel label="Nom" />
        <TextInput
          style={styles.input}
          value={data.lastName}
          onChangeText={(v) => setData({ lastName: v })}
          placeholder="Mubake"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View>
        <FieldLabel
          label="Numéro de téléphone"
          hint="Utilisé pour les missions et la vérification par SMS."
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.input, styles.phonePrefix]}>
            <Text style={styles.phonePrefixText}>+243</Text>
          </View>
          <TextInput
            style={[styles.input, { flex: 1, fontFamily: theme.fonts.mono }]}
            value={data.phone}
            onChangeText={(v) =>
              setData({ phone: v.replace(/\D/g, '').slice(0, 9) })
            }
            keyboardType="phone-pad"
            placeholder="81 234 5678"
            placeholderTextColor={theme.colors.textSubtle}
          />
        </View>
      </View>

      <View>
        <FieldLabel
          label="Pièce d'identité"
          hint="Carte d'électeur, passeport ou permis. Stockée de façon sécurisée."
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(
            [
              { k: 'front', label: 'Recto' },
              { k: 'back', label: 'Verso' },
            ] as const
          ).map((s) => {
            const done = Boolean(data.id[s.k]);
            return (
              <Pressable
                key={s.k}
                onPress={() => setData({ id: { ...data.id, [s.k]: !done } })}
                style={[styles.idTile, done && styles.idTileDone]}
              >
                {done ? (
                  <I.check size={24} color={tokens.color.success} />
                ) : (
                  <I.plus size={24} color={theme.colors.textMuted} />
                )}
                <Text
                  style={[
                    styles.idTileLabel,
                    done && { color: tokens.color.success },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function StepCraft({ data, setData }: StepProps) {
  const primary = data.categories[0];
  const suggestions = primary ? SKILL_SUGGESTIONS[primary] ?? [] : [];
  return (
    <View style={{ gap: 18 }}>
      <View>
        <FieldLabel label="Catégorie principale" hint="Tu pourras en ajouter plus tard." />
        <View style={styles.categoryGrid}>
          {CATEGORY_LIST.map((slug) => {
            const p = theme.portfolio[slug];
            const IconC = (I as Record<string, React.FC<{ size?: number; color?: string }>>)[
              p.iconName
            ] ?? I.wrench;
            const isSel = data.categories.includes(slug);
            return (
              <Pressable
                key={slug}
                onPress={() => setData({ categories: isSel ? [] : [slug] })}
                style={[
                  styles.categoryTile,
                  isSel && { borderColor: p.accent, backgroundColor: p.bg },
                ]}
              >
                <View
                  style={[
                    styles.categoryIconBox,
                    { backgroundColor: p.bg },
                  ]}
                >
                  <IconC size={18} color={p.accent} />
                </View>
                <Text style={styles.categoryLabel}>{p.label}</Text>
                {isSel ? <I.check size={15} color={p.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <FieldLabel
          label="Intitulé de métier"
          hint="Ex : Plombier certifié, Électricienne agréée SNEL…"
        />
        <TextInput
          style={styles.input}
          value={data.title}
          onChangeText={(v) => setData({ title: v })}
          placeholder="Plombier certifié"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View>
        <FieldLabel label="Années d'expérience" />
        <View style={styles.chipRow}>
          {YEARS_OPTIONS.map((r) => {
            const isSel = data.years === r;
            return (
              <Pressable
                key={r}
                onPress={() => setData({ years: r })}
                style={[styles.chip, isSel && styles.chipPrimary]}
              >
                <Text
                  style={[styles.chipText, isSel && styles.chipTextPrimary]}
                >
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {suggestions.length > 0 && (
        <View>
          <FieldLabel
            label="Compétences"
            optional
            hint="Ajoute 3 à 8 spécialités."
          />
          <View style={styles.chipRow}>
            {suggestions.map((s) => {
              const isSel = data.skills.includes(s);
              return (
                <Pressable
                  key={s}
                  onPress={() =>
                    setData({
                      skills: isSel
                        ? data.skills.filter((x) => x !== s)
                        : [...data.skills, s],
                    })
                  }
                  style={[styles.chip, isSel && styles.chipDark]}
                >
                  <Text
                    style={[styles.chipText, isSel && styles.chipTextDark]}
                  >
                    {isSel ? '✓ ' : ''}
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View>
        <FieldLabel
          label="Décrivez brièvement votre savoir-faire"
          optional
          hint="Un court paragraphe visible sur ton profil public."
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.bio}
          onChangeText={(v) => setData({ bio: v.slice(0, 500) })}
          placeholder="Plombier indépendant depuis 2018…"
          placeholderTextColor={theme.colors.textSubtle}
          multiline
        />
        <Text style={styles.counter}>{data.bio.length} / 500</Text>
      </View>
    </View>
  );
}

function StepZones({ data, setData }: StepProps) {
  const toggleCommune = (city: string, commune: string) => {
    const key = `${city}|${commune}`;
    setData({
      zones: data.zones.includes(key)
        ? data.zones.filter((x) => x !== key)
        : [...data.zones, key],
    });
  };
  const selectedCities = new Set(data.zones.map((z) => z.split('|')[0]));
  const clamped = Math.min(20, Math.max(1, data.radius));
  return (
    <View style={{ gap: 18 }}>
      <View>
        <FieldLabel
          label="Rayon d'intervention"
          hint={`Actuel : ${clamped} km autour de tes communes.`}
        />
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setData({ radius: Math.max(1, clamped - 1) })}
            style={styles.stepperBtn}
            hitSlop={8}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </Pressable>
          <View style={styles.stepperTrack}>
            <View
              style={[
                styles.stepperFill,
                { width: `${((clamped - 1) / 19) * 100}%` },
              ]}
            />
            <Text style={styles.stepperValue}>{clamped} km</Text>
          </View>
          <Pressable
            onPress={() => setData({ radius: Math.min(20, clamped + 1) })}
            style={styles.stepperBtn}
            hitSlop={8}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>1 km</Text>
          <Text style={styles.rangeLabel}>20 km</Text>
        </View>
      </View>

      <View>
        <FieldLabel
          label="Communes desservies"
          hint="Choisis au moins une commune."
        />
        {CITIES.map((city) => {
          const isActive = selectedCities.has(city.name);
          return (
            <View
              key={city.name}
              style={[styles.cityCard, isActive && styles.cityCardActive]}
            >
              <View style={styles.cityHead}>
                <I.mapPin size={15} color={tokens.color.primaryHover} />
                <Text style={styles.cityName}>{city.name}</Text>
              </View>
              <View style={styles.chipRow}>
                {city.communes.map((c) => {
                  const key = `${city.name}|${c}`;
                  const isSel = data.zones.includes(key);
                  return (
                    <Pressable
                      key={c}
                      onPress={() => toggleCommune(city.name, c)}
                      style={[
                        styles.chip,
                        { paddingVertical: 7, paddingHorizontal: 11 },
                        isSel && styles.chipPrimaryFilled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSel && styles.chipTextInverse,
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StepPricing({ data, setData }: StepProps) {
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.infoCardAmber}>
        <I.coins size={20} color="#B45309" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoCardTitleAmber}>Tarif moyen à Kinshasa</Text>
          <Text style={[styles.infoCardBody, { color: '#78350F' }]}>
            <Text style={{ fontFamily: theme.fonts.mono, fontWeight: '700' }}>
              12 000 – 18 000 FC
            </Text>
            {' / heure. Tu peux ajuster à tout moment.'}
          </Text>
        </View>
      </View>

      <View>
        <FieldLabel label="Tarif horaire" hint="Prix que tu affiches." />
        <View style={[styles.chipRow, { marginBottom: 10 }]}>
          {HOURLY_PRESETS.map((p) => {
            const isSel = data.hourly === p;
            return (
              <Pressable
                key={p}
                onPress={() => setData({ hourly: p })}
                style={[styles.chip, isSel && styles.chipPrimary]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { fontFamily: theme.fonts.mono, fontWeight: '600' },
                    isSel && styles.chipTextPrimary,
                  ]}
                >
                  {p.toLocaleString('fr-FR')} FC
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View>
          <TextInput
            style={[
              styles.input,
              {
                fontFamily: theme.fonts.mono,
                fontSize: 18,
                fontWeight: '600',
                paddingRight: 80,
              },
            ]}
            value={data.hourly ? String(data.hourly) : ''}
            onChangeText={(v) =>
              setData({ hourly: Math.max(0, parseInt(v.replace(/\D/g, '') || '0', 10)) })
            }
            keyboardType="numeric"
            placeholder="15000"
            placeholderTextColor={theme.colors.textSubtle}
          />
          <View style={styles.priceSuffix}>
            <Text style={styles.priceSuffixText}>FC / h</Text>
          </View>
        </View>
      </View>

      <View>
        <FieldLabel label="Déplacement" hint="Frais fixes pour te rendre chez le client." />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(
            [
              { k: 'free', label: 'Gratuit', sub: 'Dans ma zone' },
              { k: 'fixed', label: 'Forfait', sub: '5 000 FC' },
            ] as const
          ).map((o) => {
            const isSel = data.travelMode === o.k;
            return (
              <Pressable
                key={o.k}
                onPress={() => setData({ travelMode: o.k })}
                style={[
                  styles.radioCard,
                  isSel && styles.radioCardSelected,
                ]}
              >
                <Text style={styles.radioCardTitle}>{o.label}</Text>
                <Text style={styles.radioCardSub}>{o.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <FieldLabel label="Paiement Mobile Money" hint="Comment tu reçois tes paiements." />
        {PAYMENT_OPTIONS.map((o) => {
          const isSel = data.payment === o.k;
          return (
            <Pressable
              key={o.k}
              onPress={() => setData({ payment: o.k })}
              style={[
                styles.paymentRow,
                isSel && { borderColor: o.color, backgroundColor: '#FAFAF9' },
              ]}
            >
              <View
                style={[styles.paymentBadge, { backgroundColor: o.color }]}
              >
                <Text style={styles.paymentBadgeText}>{o.label[0]}</Text>
              </View>
              <Text style={styles.paymentLabel}>{o.label}</Text>
              <View
                style={[
                  styles.radioDot,
                  {
                    borderColor: isSel ? o.color : tokens.color.borderStrong,
                  },
                ]}
              >
                {isSel ? (
                  <View
                    style={[styles.radioDotInner, { backgroundColor: o.color }]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepProfile({ data, setData }: StepProps) {
  return (
    <View style={{ gap: 18 }}>
      <View>
        <FieldLabel
          label="Photo de profil"
          hint="Une photo claire, visage visible."
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={[styles.avatarBig, data.photo && styles.avatarBigFilled]}>
            {data.photo ? (
              <Text style={styles.avatarBigInitials}>
                {(data.firstName?.[0] ?? 'J') + (data.lastName?.[0] ?? 'M')}
              </Text>
            ) : (
              <I.user size={32} color={theme.colors.textSubtle} />
            )}
          </View>
          <TouchableOpacity
            onPress={() => setData({ photo: !data.photo })}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>
              {data.photo ? 'Remplacer' : 'Ajouter une photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <FieldLabel
          label="À propos de moi"
          hint="2–3 phrases. Qu'est-ce qui fait ta différence ?"
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.bio}
          onChangeText={(v) => setData({ bio: v.slice(0, 500) })}
          multiline
          placeholder="Plombier depuis 2018, formé à l'INPP Kinshasa…"
          placeholderTextColor={theme.colors.textSubtle}
        />
        <Text style={styles.counter}>{data.bio.length} / 500</Text>
      </View>

      <View>
        <FieldLabel label="Langues parlées" optional />
        <View style={styles.chipRow}>
          {LANGUAGES.map((l) => {
            const isSel = data.languages.includes(l);
            return (
              <Pressable
                key={l}
                onPress={() =>
                  setData({
                    languages: isSel
                      ? data.languages.filter((x) => x !== l)
                      : [...data.languages, l],
                  })
                }
                style={[styles.chip, isSel && styles.chipDark]}
              >
                <Text
                  style={[styles.chipText, isSel && styles.chipTextDark]}
                >
                  {isSel ? '✓ ' : ''}
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <FieldLabel
          label="Portfolio"
          optional
          hint="Photos de tes chantiers terminés."
        />
        <View style={styles.portfolioGrid}>
          {[0, 1, 2, 3].map((i) => {
            const filled = i < data.portfolio;
            return (
              <Pressable
                key={i}
                onPress={() =>
                  setData({
                    portfolio: Math.min(4, (data.portfolio || 0) + 1),
                  })
                }
                style={[
                  styles.portfolioTile,
                  filled && {
                    backgroundColor:
                      ['#BAE6FD', '#A7F3D0', '#FDE68A', '#FECDD3'][i],
                    borderWidth: 0,
                  },
                ]}
              >
                {!filled && <I.plus size={20} color={theme.colors.textMuted} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function StepPublish({ data, setData }: StepProps) {
  const primary = data.categories[0];
  const cat = primary ? theme.portfolio[primary] : theme.portfolio.plomberie;
  const hourly = data.hourly || 15000;
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.previewCard}>
        <Text style={styles.previewOverline}>Aperçu de ton profil</Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
          <View style={[styles.avatarBig, { backgroundColor: cat.accent }]}>
            <Text style={styles.avatarBigInitials}>
              {(data.firstName?.[0] ?? 'J').toUpperCase()}
              {(data.lastName?.[0] ?? 'M').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={theme.text.heading}>
              {data.firstName || 'Jean'} {data.lastName || 'Mubake'}
            </Text>
            <Text style={[theme.text.bodyM, { color: theme.colors.textMuted }]}>
              {data.title || cat.label}
            </Text>
            <Text
              style={[
                theme.text.price,
                { marginTop: 8, color: theme.colors.textPrimary },
              ]}
            >
              {hourly.toLocaleString('fr-FR')} FC
              <Text style={{ color: theme.colors.textMuted, fontWeight: '400' }}>
                {'  '}/heure
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => setData({ acceptedTerms: !data.acceptedTerms })}
        style={styles.termsRow}
      >
        <View
          style={[
            styles.checkbox,
            data.acceptedTerms && {
              backgroundColor: tokens.color.primary,
              borderColor: tokens.color.primary,
            },
          ]}
        >
          {data.acceptedTerms ? (
            <I.check size={14} color={theme.colors.textInverse} />
          ) : null}
        </View>
        <Text style={styles.termsText}>
          J'accepte les conditions d'utilisation pro et le code de conduite
          KAYOU.
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  iconBtn: { padding: 6 },
  stepCaption: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    marginLeft: 4,
  },
  title: {
    ...theme.text.displayM,
    fontSize: 22,
    marginTop: 14,
    marginBottom: 6,
  },
  subtitle: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
    marginBottom: 22,
  },
  fieldLabel: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  fieldOptional: { fontWeight: '400', fontSize: 12, color: theme.colors.textMuted },
  fieldHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  input: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontFamily: theme.fonts.body,
  },
  phonePrefix: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  idTile: {
    flex: 1,
    paddingVertical: 22,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  idTileDone: {
    borderColor: tokens.color.success,
    borderStyle: 'solid',
    backgroundColor: tokens.color.successSubtle,
  },
  idTileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  infoCardSky: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.md,
    backgroundColor: theme.colors.surfacePrimary,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoCardTitleSky: {
    fontWeight: '600',
    color: theme.colors.primaryHover,
    fontSize: 14,
  },
  infoCardAmber: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.md,
    backgroundColor: theme.colors.surfaceAmber,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoCardTitleAmber: {
    fontWeight: '600',
    color: '#92400E',
    fontSize: 14,
  },
  infoCardBody: {
    fontSize: 13,
    color: theme.colors.textBody,
    marginTop: 2,
    lineHeight: 19,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  categoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textBody,
  },
  chipPrimary: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primarySubtle,
  },
  chipTextPrimary: { color: tokens.color.primaryHover, fontWeight: '600' },
  chipPrimaryFilled: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
  },
  chipTextInverse: { color: theme.colors.textInverse },
  chipDark: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.textPrimary,
  },
  chipTextDark: { color: theme.colors.textInverse },
  textarea: {
    height: 110,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  counter: {
    marginTop: 4,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'right',
    fontFamily: theme.fonts.mono,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  stepperTrack: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stepperFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: theme.colors.primarySubtle,
  },
  stepperValue: {
    alignSelf: 'center',
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rangeLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  cityCard: {
    padding: 12,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
  },
  cityCardActive: {
    backgroundColor: theme.colors.surfacePrimary,
  },
  cityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cityName: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  priceSuffix: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none' as any,
  },
  priceSuffixText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 14,
  },
  radioCard: {
    flex: 1,
    padding: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  radioCardSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primarySubtle,
  },
  radioCardTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  radioCardSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  paymentBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadgeText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
  paymentLabel: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotInner: { width: 10, height: 10, borderRadius: 5 },
  avatarBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBigFilled: {
    backgroundColor: theme.colors.primary,
    borderStyle: 'solid',
    borderColor: theme.colors.primary,
  },
  avatarBigInitials: {
    color: theme.colors.textInverse,
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 24,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  portfolioGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  portfolioTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    padding: 16,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: theme.colors.surfacePrimary,
  },
  previewOverline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: theme.colors.primaryHover,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 13.5,
    color: theme.colors.textBody,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { I, StepIndicator, type StepIndicatorStep } from '@kayu/ui/mobile';
import { tokens, type CategorySlug } from '@kayu/ui';
import { queryKeys } from '@kayu/api';
import type { ProviderDraftDto } from '@kayu/schemas';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type { ProviderStackParamList } from '@/navigation/AppNavigator';
import {
  CITIES,
  HOURLY_PRESETS,
  LANGUAGES,
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
  5: 'Un texte précis aide les clients à comprendre ton expérience.',
  6: 'Un dernier coup d\'œil avant de te lancer.',
};

const EMPTY_DATA: OnboardingData = {
  firstName: '',
  lastName: '',
  phone: '',
  id: {},
  categories: [],
  subcategoryIds: [],
  title: '',
  years: '',
  skills: [],
  zones: [],
  radius: 10,
  hourly: 0,
  travelMode: 'free',
  payment: 'airtel',
  photo: false,
  bio: '',
  portfolio: 0,
  languages: [],
  acceptedTerms: false,
};

const YEARS_TO_NUMBER: Record<string, number> = {
  '< 1 an': 0,
  '1–3 ans': 2,
  '4–7 ans': 5,
  '8+ ans': 10,
};

const NUMBER_TO_YEARS: { max: number; label: string }[] = [
  { max: 0, label: '< 1 an' },
  { max: 3, label: '1–3 ans' },
  { max: 7, label: '4–7 ans' },
  { max: Infinity, label: '8+ ans' },
];

function numberToYearsLabel(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  for (const b of NUMBER_TO_YEARS) {
    if (value <= b.max) return b.label;
  }
  return '';
}

type CategoryIndex = {
  id: string;
  slug: string;
  name: string;
  subcategories?: Array<{ id: string; name: string; slug?: string; categoryId?: string }>;
}[];

const CATEGORY_SLUGS: CategorySlug[] = [
  'plomberie',
  'electricite',
  'menage',
  'coiffure',
  'informatique',
  'jardinage',
  'peinture',
  'transport',
  'menuiserie',
];

const CATEGORY_KEYWORDS: Array<[CategorySlug, string[]]> = [
  ['plomberie', ['plomb', 'sanitaire', 'chauffe', 'canalisation', 'eau']],
  ['electricite', ['elect', 'energie', 'snel', 'tableau']],
  ['menage', ['menage', 'nettoyage', 'entretien']],
  ['coiffure', ['coiff', 'beaute', 'barbier']],
  ['informatique', ['inform', 'ordinateur', 'reseau', 'tech', 'it']],
  ['jardinage', ['jardin', 'vert']],
  ['peinture', ['peint']],
  ['transport', ['transport', 'livraison', 'demenagement', 'course']],
  ['menuiserie', ['menuis', 'bois', 'charp']],
];

function normalizeCategoryText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug);
}

function categoryToTokenSlug(category: CategoryIndex[number]): CategorySlug {
  if (isCategorySlug(category.slug)) return category.slug;
  const normalized = normalizeCategoryText(
    `${category.slug} ${category.name} ${(category.subcategories ?? [])
      .map((subcategory) => `${subcategory.id} ${subcategory.name}`)
      .join(' ')}`,
  );
  return (
    CATEGORY_KEYWORDS.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? 'informatique'
  );
}

function categoryVisual(category: CategoryIndex[number]) {
  return theme.portfolio[categoryToTokenSlug(category)];
}

function resolveCategoryIds(values: Array<string | undefined>, categories: CategoryIndex) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const match =
      categories.find((category) => category.id === value) ??
      categories.find((category) => category.slug === value) ??
      categories.find((category) =>
        (category.subcategories ?? []).some(
          (subcategory) =>
            subcategory.id === value ||
            subcategory.slug === value ||
            subcategory.name.toLowerCase() === value.toLowerCase(),
        ),
      ) ??
      categories.find((category) => categoryToTokenSlug(category) === value);
    if (match && !seen.has(match.id)) {
      ids.push(match.id);
      seen.add(match.id);
    }
  }
  return ids.slice(0, 3);
}

function backendToData(
  draft: ProviderDraftDto,
  categories: CategoryIndex,
): Partial<OnboardingData> {
  const draftCategoryIds =
    draft.categoryIds && draft.categoryIds.length > 0
      ? draft.categoryIds
      : [draft.primaryCategoryId];
  const selectedCategoryIds = resolveCategoryIds(draftCategoryIds, categories);
  return {
    firstName: draft.firstName ?? '',
    lastName: draft.lastName ?? '',
    phone: draft.phone ? draft.phone.replace(/^\+?243/, '').replace(/\D/g, '').slice(0, 9) : '',
    id: {
      front: draft.idFrontUploaded ?? undefined,
      back: draft.idBackUploaded ?? undefined,
    },
    categories: selectedCategoryIds,
    subcategoryIds: draft.subcategoryIds ?? [],
    title: draft.profession ?? '',
    years: numberToYearsLabel(draft.yearsOfExperience),
    skills: (draft.skills ?? []).map((skill) => skill.name),
    zones: (draft.serviceZones ?? []).map(
      (zone) => `${zone.city}|${zone.commune ?? ''}`,
    ),
    radius: draft.zoneRadiusKm ?? 10,
    hourly: draft.hourlyRate ?? 0,
    bio: draft.description ?? draft.bio ?? '',
    photo: Boolean(draft.avatar && !draft.avatar.startsWith('placeholder://')),
    languages: draft.languages ?? [],
  };
}

function dataToBackend(data: OnboardingData, categories: CategoryIndex): ProviderDraftDto {
  const categoryIds = resolveCategoryIds(data.categories, categories);
  const primaryId = categoryIds[0];
  const zones = data.zones
    .map((key) => {
      const [city, commune] = key.split('|');
      if (!city) return null;
      return { city, commune: commune || null };
    })
    .filter((z): z is { city: string; commune: string | null } => Boolean(z));

  return {
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    phone: data.phone ? `+243${data.phone}` : undefined,
    idFrontUploaded: Boolean(data.id.front),
    idBackUploaded: Boolean(data.id.back),
    primaryCategoryId: primaryId ?? undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    subcategoryIds:
      data.subcategoryIds.length > 0 ? data.subcategoryIds : undefined,
    profession: data.title || undefined,
    skills: data.skills.map((name) => ({ name, level: 3 })),
    yearsOfExperience: data.years ? YEARS_TO_NUMBER[data.years] : undefined,
    description: data.bio || undefined,
    serviceZones: zones,
    zoneRadiusKm: data.radius,
    hourlyRate: data.hourly > 0 ? data.hourly : undefined,
    bio: data.bio || undefined,
    languages: data.languages,
  };
}

const DEBOUNCE_MS = 600;

export function ProviderOnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.categories.getAll({ withSubcategories: true }),
  });

  const draftQuery = useQuery({
    queryKey: queryKeys.onboarding.draft,
    queryFn: () => api.onboarding.getDraft(),
  });

  const patchMut = useMutation({
    mutationFn: (patch: ProviderDraftDto) => api.onboarding.patchDraft(patch),
  });

  const publishMut = useMutation({
    mutationFn: () => api.onboarding.publish(),
    onSuccess: () => {
      navigation.getParent()?.navigate('ProviderDashboard' as never);
      try {
        navigation.popToTop?.();
      } catch {
        /* noop */
      }
    },
    onError: () => {
      Alert.alert('Publication impossible', "Vérifie les étapes puis réessaie.");
    },
  });

  // Hydrate from backend draft
  useEffect(() => {
    if (!draftQuery.data || !categoriesQuery.data || hydrated) return;
    const mapped = backendToData(draftQuery.data.draft, categoriesQuery.data.categories);
    setData((prev) => ({
      ...prev,
      ...mapped,
      firstName: mapped.firstName || prev.firstName || user?.firstName || '',
      lastName: mapped.lastName || prev.lastName || user?.lastName || '',
    }));
    const serverStep = draftQuery.data.step;
    if (serverStep !== null && serverStep !== undefined) {
      setStep(Math.min(6, Math.max(1, serverStep + 1)));
    }
    setHydrated(true);
  }, [draftQuery.data, categoriesQuery.data, hydrated, user]);

  // Debounced PATCH
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef<string>('');
  useEffect(() => {
    if (!hydrated || !categoriesQuery.data) return;
    const payload = dataToBackend(data, categoriesQuery.data.categories);
    const serialized = JSON.stringify(payload);
    if (serialized === lastPayloadRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastPayloadRef.current = serialized;
      patchMut.mutate(payload);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, hydrated, categoriesQuery.data, patchMut]);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const canContinue = useMemo(() => validateStep(step, data), [step, data]);

  const flushStep = useCallback(
    (nextStep: number) => {
      if (!categoriesQuery.data) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const payload = {
        ...dataToBackend(data, categoriesQuery.data.categories),
        onboardingStep: Math.max(0, Math.min(5, nextStep - 1)),
      };
      lastPayloadRef.current = JSON.stringify(payload);
      patchMut.mutate(payload);
    },
    [categoriesQuery.data, data, patchMut],
  );

  const submitting = publishMut.isPending;

  const next = () => {
    if (!canContinue) return;
    if (step < 6) {
      const n = step + 1;
      flushStep(n);
      setStep(n);
      return;
    }
    publishMut.mutate();
  };

  const back = () => {
    if (step > 1) {
      const n = step - 1;
      flushStep(n);
      setStep(n);
      return;
    }
    Alert.alert(
      "Quitter l'onboarding ?",
      'Ta progression est sauvegardée côté serveur. Tu peux reprendre plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  if (draftQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textMuted }}>Chargement…</Text>
      </View>
    );
  }

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
          {step === 2 && (
            <StepCraft
              data={data}
              setData={updateData}
              categoryOptions={categoriesQuery.data?.categories ?? []}
            />
          )}
          {step === 3 && <StepZones data={data} setData={updateData} />}
          {step === 4 && <StepPricing data={data} setData={updateData} />}
          {step === 5 && <StepProfile data={data} setData={updateData} />}
          {step === 6 && (
            <StepPublish
              data={data}
              setData={updateData}
              categoryOptions={categoriesQuery.data?.categories ?? []}
            />
          )}
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
  categoryOptions?: CategoryIndex;
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
          optional
          hint="Carte d'électeur, passeport ou permis. La vérification se fait après publication, depuis « Vérification »."
        />
        <View style={styles.deferredCard}>
          <I.shieldCheck size={18} color={theme.colors.textMuted} />
          <Text style={styles.deferredText}>
            Le téléversement et la revue se passent dans l'écran Vérification après
            publication. L'équipe KAYOU revoit ton dossier sous 24h pour activer le
            badge « Vérifié ».
          </Text>
        </View>
      </View>
    </View>
  );
}

function StepCraft({ data, setData, categoryOptions = [] }: StepProps) {
  const selectedCategoryIds = resolveCategoryIds(data.categories, categoryOptions);
  const selectedCategorySet = new Set(selectedCategoryIds);
  const suggestions = Array.from(
    new Set(
      selectedCategoryIds.flatMap((categoryId) => {
        const category = categoryOptions.find((option) => option.id === categoryId);
        if (!category) return [];
        return SKILL_SUGGESTIONS[categoryToTokenSlug(category)] ?? [];
      }),
    ),
  );
  const categoryLimitReached = selectedCategoryIds.length >= 3;
  const selectedSubcategories = categoryOptions
    .filter((category) => selectedCategorySet.has(category.id))
    .flatMap((category) => category.subcategories ?? []);
  const toggleSubcategory = (id: string) => {
    setData({
      subcategoryIds: data.subcategoryIds.includes(id)
        ? data.subcategoryIds.filter((x) => x !== id)
        : [...data.subcategoryIds, id],
    });
  };
  return (
    <View style={{ gap: 18 }}>
      <View>
        <FieldLabel
          label="Catégories de service"
          hint={`${selectedCategoryIds.length}/3 sélectionnée${selectedCategoryIds.length > 1 ? 's' : ''}. Choisis jusqu'à trois catégories.`}
        />
        <View style={styles.categoryGrid}>
          {categoryOptions.map((category) => {
            const p = categoryVisual(category);
            const IconC = (I as Record<string, React.FC<{ size?: number; color?: string }>>)[
              p.iconName
            ] ?? I.wrench;
            const isSel = selectedCategorySet.has(category.id);
            return (
              <Pressable
                key={category.id}
                onPress={() => {
                  if (isSel) {
                    const removedSubcategoryIds = new Set(
                      category.subcategories?.map((subcategory) => subcategory.id) ??
                        [],
                    );
                    setData({
                      categories: selectedCategoryIds.filter((id) => id !== category.id),
                      subcategoryIds: data.subcategoryIds.filter(
                        (id) => !removedSubcategoryIds.has(id),
                      ),
                    });
                    return;
                  }
                  if (categoryLimitReached) return;
                  setData({ categories: [...selectedCategoryIds, category.id] });
                }}
                style={[
                  styles.categoryTile,
                  isSel && { borderColor: p.accent, backgroundColor: p.bg },
                  !isSel && categoryLimitReached && { opacity: 0.55 },
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
                <Text style={styles.categoryLabel}>{category.name}</Text>
                {isSel ? <I.check size={15} color={p.accent} /> : null}
                {!isSel && categoryLimitReached ? (
                  <I.lock size={14} color={theme.colors.textSubtle} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedSubcategories.length > 0 && (
        <View>
          <FieldLabel
            label="Sous-catégories"
            optional
            hint="Sélectionne toutes les spécialités pertinentes. Pas de limite."
          />
          <View style={styles.chipRow}>
            {selectedSubcategories.map((subcategory) => {
              const isSel = data.subcategoryIds.includes(subcategory.id);
              return (
                <Pressable
                  key={subcategory.id}
                  onPress={() => toggleSubcategory(subcategory.id)}
                  style={[styles.chip, isSel && styles.chipPrimary]}
                >
                  <Text
                    style={[styles.chipText, isSel && styles.chipTextPrimary]}
                  >
                    {isSel ? '✓ ' : ''}
                    {subcategory.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

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
            hint="Ajoute autant de spécialités que nécessaire."
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
        <FieldLabel
          label="Tarif horaire"
          hint="Prix indicatif affiché sur ton profil sous la forme « À partir de … FC/h ». Le prix final est convenu avec le client avant l'intervention."
        />
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
    </View>
  );
}

function StepProfile({ data, setData }: StepProps) {
  return (
    <View style={{ gap: 18 }}>
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
          hint="La galerie photo arrive prochainement. Tu pourras ajouter tes chantiers terminés depuis ton profil après publication."
        />
        <View style={styles.deferredCard}>
          <I.camera size={18} color={theme.colors.textMuted} />
          <Text style={styles.deferredText}>
            Pour le lancement, ton profil est publié sans portfolio. La galerie
            photos sera activée dans une prochaine version.
          </Text>
        </View>
      </View>
    </View>
  );
}

function StepPublish({ data, setData, categoryOptions = [] }: StepProps) {
  const primaryId = resolveCategoryIds(data.categories, categoryOptions)[0];
  const primaryCategory = categoryOptions.find((category) => category.id === primaryId);
  const cat = primaryCategory ? categoryVisual(primaryCategory) : theme.portfolio.plomberie;
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
              <Text style={{ color: theme.colors.textMuted, fontWeight: '400', fontSize: 13 }}>
                À partir de{' '}
              </Text>
              {hourly.toLocaleString('fr-FR')} FC
              <Text style={{ color: theme.colors.textMuted, fontWeight: '400' }}>
                {'  '}/heure
              </Text>
            </Text>
            <Text style={{ marginTop: 4, fontSize: 11, color: theme.colors.textMuted }}>
              Le prix final est convenu avec le client avant l'intervention.
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
  deferredCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'flex-start',
  },
  deferredText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 19,
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

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Avatar, I } from '@kayu/ui/mobile';
import { tokens, formatHourly, type CategorySlug } from '@kayu/ui';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { toCategorySlug } from '@/lib/providerAdapter';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type {
  SearchStackParamList,
  ProfileStackParamList,
} from '@/navigation/AppNavigator';
import { KayouMomentPlaceholder } from './KayouMomentPlaceholder';

type ParamList = SearchStackParamList & ProfileStackParamList;
type Nav = NativeStackNavigationProp<ParamList, 'CreateBooking'>;
type Route = RouteProp<ParamList, 'CreateBooking'>;

type ServiceOption = {
  key: string;
  icon: keyof typeof I;
  desc: string;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { key: 'Dépannage urgent', icon: 'zap', desc: 'Problème immédiat' },
  { key: 'Installation nouvelle', icon: 'wrench', desc: 'Nouveau matériel' },
  { key: 'Devis / diagnostic', icon: 'sparkles', desc: 'Évaluation gratuite' },
  { key: 'Rénovation complète', icon: 'hammer', desc: 'Projet de fond' },
];

const DURATIONS = [1, 2, 4, 8] as const;
const TIME_SLOTS = ['08:00', '10:00', '14:00', '16:00', '18:00'] as const;
const AVAILABLE_DAYS = new Set([18, 19, 20, 22, 24, 25, 27]);

export function BookingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);

  const [step, setStep] = React.useState(0);
  const [service, setService] = React.useState<string>(SERVICE_OPTIONS[0].key);
  const [duration, setDuration] = React.useState<number>(2);
  const [date, setDate] = React.useState<number>(18);
  const [time, setTime] = React.useState<string>('10:00');
  const [address, setAddress] = React.useState<string>('');
  const [note, setNote] = React.useState<string>('');

  const { data: provider, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.providers.detail(params.providerId),
    queryFn: () => api.providers.getById(params.providerId),
  });

  const createBooking = useMutation({
    mutationFn: () => {
      const scheduled = new Date();
      scheduled.setDate(date);
      const [h, m] = time.split(':').map(Number);
      scheduled.setHours(h, m, 0, 0);
      return api.bookings.create({
        providerId: params.providerId,
        title: service,
        description: note || undefined,
        address: address || undefined,
        city: provider?.user.city ?? undefined,
        scheduledDate: scheduled,
        duration: duration * 60,
        price: (provider?.hourlyRate ?? 0) * duration,
        clientNotes: note || undefined,
      });
    },
    onSuccess: () => setStep(3),
  });

  const handleBack = () => {
    if (step === 0) {
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const handleNext = () => {
    if (step < 2) {
      setStep((s) => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    if (step === 2) {
      createBooking.mutate();
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (error || !provider) return <ErrorState onRetry={() => refetch()} />;

  if (step === 3) {
    return (
      <KayouMomentPlaceholder
        providerName={provider.user.firstName ?? 'Jean'}
        onDone={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
    );
  }

  const firstName = provider.user.firstName ?? '';
  const lastName = provider.user.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || params.providerName;
  const categorySlug: CategorySlug = toCategorySlug(provider.categories?.[0]?.slug);
  const portfolio = tokens.portfolio[categorySlug];
  const hourly = provider.hourlyRate ?? 0;
  const total = hourly * duration;
  const fee = Math.round(total * 0.07);
  const grand = total + fee;
  const rating = provider.rating ?? 0;

  const stepTitle = ['Quel service ?', 'Quand ça t\u2019arrange ?', 'Récapitulatif'][step];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sheet header */}
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? 'Fermer' : 'Retour'}
            onPress={handleBack}
            style={styles.iconBtn}
          >
            {step === 0 ? (
              <I.x size={18} color={theme.colors.textPrimary} />
            ) : (
              <I.arrowLeft size={18} color={theme.colors.textPrimary} />
            )}
          </Pressable>
          <Text style={styles.stepLabel}>Étape {step + 1} sur 3</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                {
                  backgroundColor:
                    i <= step ? theme.colors.textPrimary : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 140 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Provider mini card */}
        <View style={styles.providerCard}>
          <Avatar name={fullName} src={provider.user.avatar ?? undefined} size={42} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName} numberOfLines={1}>
                {fullName}
              </Text>
              {provider.user.isVerified || provider.verificationStatus === 'VERIFIED' ? (
                <I.badgeCheck size={13} color={theme.colors.success} />
              ) : null}
            </View>
            <Text style={styles.providerProfession} numberOfLines={1}>
              {provider.profession}
            </Text>
          </View>
          <View style={styles.providerRating}>
            <I.star size={12} color={theme.colors.warning} fill={theme.colors.warning} />
            <Text style={styles.providerRatingText}>
              {rating > 0 ? rating.toFixed(1) : '—'}
            </Text>
          </View>
        </View>

        {/* Big step title */}
        <Text style={styles.stepTitle}>{stepTitle}</Text>

        {step === 0 && (
          <Step0
            service={service}
            onSelectService={setService}
            duration={duration}
            onSelectDuration={setDuration}
            note={note}
            onChangeNote={setNote}
            accent={portfolio.accent}
          />
        )}

        {step === 1 && (
          <Step1
            date={date}
            onSelectDate={setDate}
            time={time}
            onSelectTime={setTime}
            address={address}
            onChangeAddress={setAddress}
          />
        )}

        {step === 2 && (
          <Step2
            service={service}
            duration={duration}
            date={date}
            time={time}
            address={address}
            note={note}
            hourly={hourly}
            total={total}
            fee={fee}
            grand={grand}
          />
        )}
      </ScrollView>

      {/* Sticky footer CTA */}
      <View style={[styles.footer, { paddingBottom: 18 + insets.bottom }]}>
        <View style={styles.footerPriceBlock}>
          <Text style={styles.footerCaption}>
            {step === 2 ? 'Total estimé' : `à ${formatHourly(hourly)} FC/h`}
          </Text>
          <Text
            style={[
              styles.footerAmount,
              step !== 2 && styles.footerAmountUnderline,
            ]}
          >
            {step === 2
              ? `${formatHourly(grand)} FC`
              : `${formatHourly(total)} FC`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 2 ? 'Confirmer' : 'Continuer'}
          onPress={handleNext}
          disabled={createBooking.isPending}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.9 },
            createBooking.isPending && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {step === 2 ? 'Confirmer' : 'Continuer'}
          </Text>
          <I.arrowRight size={16} color={theme.colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 0: Service ─────────────────────────────────────────────────────────

function Step0({
  service,
  onSelectService,
  duration,
  onSelectDuration,
  note,
  onChangeNote,
  accent,
}: {
  service: string;
  onSelectService: (s: string) => void;
  duration: number;
  onSelectDuration: (d: number) => void;
  note: string;
  onChangeNote: (n: string) => void;
  accent: string;
}) {
  return (
    <>
      <View style={{ gap: 10 }}>
        {SERVICE_OPTIONS.map((opt) => {
          const active = service === opt.key;
          const Icon = I[opt.icon];
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onSelectService(opt.key)}
              style={[
                styles.optionCard,
                theme.shadow.e1,
                active && {
                  ...theme.shadow.e2,
                  borderWidth: 2,
                  borderColor: accent,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIconWrap,
                  {
                    backgroundColor: active
                      ? `${accent}22`
                      : theme.colors.surfaceMuted,
                  },
                ]}
              >
                <Icon
                  size={20}
                  color={active ? accent : theme.colors.textBody}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{opt.key}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              {active ? <I.check size={20} color={accent} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.blockLabel}>Durée estimée</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((h) => {
          const active = duration === h;
          return (
            <Pressable
              key={h}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelectDuration(h)}
              style={[
                styles.durationBtn,
                active
                  ? styles.durationBtnActive
                  : [styles.durationBtnInactive, theme.shadow.e1],
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  active && { color: theme.colors.textInverse },
                ]}
              >
                {h}h
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.blockLabel}>Décris ton besoin</Text>
      <View style={[styles.noteCard, theme.shadow.e1]}>
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          multiline
          numberOfLines={4}
          placeholder="Précise le problème, l'urgence, les détails…"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.noteInput}
          textAlignVertical="top"
        />
      </View>
    </>
  );
}

// ─── Step 1: Date & heure ────────────────────────────────────────────────────

function Step1({
  date,
  onSelectDate,
  time,
  onSelectTime,
  address,
  onChangeAddress,
}: {
  date: number;
  onSelectDate: (d: number) => void;
  time: string;
  onSelectTime: (t: string) => void;
  address: string;
  onChangeAddress: (a: string) => void;
}) {
  return (
    <>
      <View style={[styles.calendarCard, theme.shadow.e2]}>
        <View style={styles.calendarHead}>
          <Pressable style={styles.roundBtn}>
            <I.arrowLeft size={15} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.calendarTitle}>Avril 2026</Text>
          <Pressable style={styles.roundBtn}>
            <I.arrowRight size={15} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.dayLetterRow}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <Text key={i} style={styles.dayLetter}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {Array.from({ length: 35 }, (_, i) => i - 1).map((d, idx) => {
            const valid = d >= 1 && d <= 30;
            const isPast = d < 18;
            const isAvail = valid && !isPast && AVAILABLE_DAYS.has(d);
            const isSel = d === date;
            return (
              <Pressable
                key={idx}
                disabled={!isAvail}
                onPress={() => isAvail && onSelectDate(d)}
                style={[
                  styles.dayCell,
                  !valid && { opacity: 0 },
                  isSel && {
                    backgroundColor: theme.colors.textPrimary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSel && { color: theme.colors.textInverse, fontWeight: '700' },
                    !isAvail && !isSel && valid && { color: theme.colors.textSubtle },
                  ]}
                >
                  {valid ? String(d) : ''}
                </Text>
                {isAvail && !isSel ? <View style={styles.availDot} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.blockLabel}>Créneaux disponibles</Text>
      <View style={styles.slotGrid}>
        {TIME_SLOTS.map((t) => {
          const active = time === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelectTime(t)}
              style={[
                styles.slotBtn,
                active
                  ? styles.slotBtnActive
                  : [styles.slotBtnInactive, theme.shadow.e1],
              ]}
            >
              <Text
                style={[
                  styles.slotText,
                  active && { color: theme.colors.textInverse },
                ]}
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.blockLabel}>Adresse d&apos;intervention</Text>
      <View style={[styles.addressCard, theme.shadow.e1]}>
        <I.mapPin size={18} color={theme.colors.textMuted} />
        <TextInput
          value={address}
          onChangeText={onChangeAddress}
          placeholder="Av. Colonel Lukusa 47, Gombe"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.addressInput}
        />
      </View>
    </>
  );
}

// ─── Step 2: Récapitulatif ───────────────────────────────────────────────────

function Step2({
  service,
  duration,
  date,
  time,
  address,
  note,
  hourly,
  total,
  fee,
  grand,
}: {
  service: string;
  duration: number;
  date: number;
  time: string;
  address: string;
  note: string;
  hourly: number;
  total: number;
  fee: number;
  grand: number;
}) {
  return (
    <>
      <View style={[styles.summaryCard, theme.shadow.e2]}>
        <MbSumRow icon="wrench" label="Service" value={service} />
        <MbSumRow
          icon="clock"
          label="Durée"
          value={`${duration} heure${duration > 1 ? 's' : ''}`}
        />
        <MbSumRow
          icon="calendar"
          label="Date"
          value={`Mer. ${date} avril · ${time}`}
        />
        <MbSumRow icon="mapPin" label="Adresse" value={address || '—'} />
        <MbSumRow icon="messageCircle" label="Note" value={note || '—'} last />
      </View>

      <Text style={styles.blockLabel}>Détails du paiement</Text>
      <View style={[styles.priceCard, theme.shadow.e2]}>
        <MbPriceRow
          label={`${formatHourly(hourly)} FC × ${duration}h`}
          value={`${formatHourly(total)} FC`}
        />
        <MbPriceRow
          label="Frais de service (7%)"
          value={`${formatHourly(fee)} FC`}
          muted
        />
        <View style={styles.priceDivider} />
        <MbPriceRow
          label="Total estimé"
          value={`${formatHourly(grand)} FC`}
          bold
        />
      </View>

      <View style={styles.protectedPanel}>
        <I.shieldCheck size={18} color={theme.colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={styles.protectedTitle}>Paiement protégé</Text>
          <Text style={styles.protectedBody}>
            Tu paies à la fin du travail. Remboursement garanti si le travail
            n&apos;est pas fait.
          </Text>
        </View>
      </View>
    </>
  );
}

function MbSumRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof I;
  label: string;
  value: string;
  last?: boolean;
}) {
  const Icon = I[icon];
  return (
    <View style={[styles.sumRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.sumRowIcon}>
        <Icon size={16} color={theme.colors.textBody} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sumRowLabel}>{label}</Text>
        <Text style={styles.sumRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function MbPriceRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text
        style={[
          styles.priceRowLabel,
          muted && { color: theme.colors.textMuted },
          bold && styles.priceRowLabelBold,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.priceRowValue,
          muted && { color: theme.colors.textMuted },
          bold && styles.priceRowValueBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  stepLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
  },
  spacer: {
    width: 36,
    height: 36,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 22,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  providerName: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
    maxWidth: '90%',
  },
  providerProfession: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  providerRatingText: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  stepTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.56,
    color: theme.colors.textPrimary,
    marginBottom: 22,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  optionDesc: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  blockLabel: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.17,
    color: theme.colors.textPrimary,
    marginTop: 28,
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBtnActive: {
    backgroundColor: theme.colors.textPrimary,
  },
  durationBtnInactive: {
    backgroundColor: theme.colors.surface,
  },
  durationText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  noteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
  },
  noteInput: {
    minHeight: 96,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  calendarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
  },
  calendarHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  roundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  dayLetterRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayLetter: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  availDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.success,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: `${(100 - 16) / 3}%`,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnActive: {
    backgroundColor: theme.colors.textPrimary,
  },
  slotBtnInactive: {
    backgroundColor: theme.colors.surface,
  },
  slotText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
  },
  addressInput: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  sumRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumRowLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  sumRowValue: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginTop: 2,
    lineHeight: 20,
  },
  priceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  priceRowLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  priceRowLabelBold: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 16,
  },
  priceRowValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  priceRowValueBold: {
    fontFamily: theme.fonts.display,
    fontSize: 16,
    fontWeight: '700',
  },
  priceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 12,
  },
  protectedPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.successSubtle,
    borderRadius: 14,
  },
  protectedTitle: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  protectedBody: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  footerPriceBlock: {
    flex: 1,
    minWidth: 0,
  },
  footerCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  footerAmount: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  footerAmountUnderline: {
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  primaryBtnText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textInverse,
  },
});


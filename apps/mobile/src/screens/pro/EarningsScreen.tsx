import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import type {
  CreatePayoutDto,
  CreatePayoutResponse,
  EarningsWeekDay,
  PayoutOperator,
  Transaction,
  TransactionType,
} from '@kayu/schemas';
import { I } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';

// DS08 — pro Earnings screen. Real data from the EarningsModule backend;
// payout action records a Payout in PENDING status (PSP integration stub).

type PayMethod = 'cash' | 'mpesa' | 'airtel' | 'orange' | 'mtn';

type MMOperator = {
  id: PayoutOperator;
  slug: PayMethod;
  name: string;
  init: string;
  color: string;
};

const MM_OPERATORS: MMOperator[] = [
  { id: 'MPESA', slug: 'mpesa', name: 'M-Pesa', init: 'M', color: '#10B981' },
  { id: 'AIRTEL', slug: 'airtel', name: 'Airtel Money', init: 'A', color: '#E11D48' },
  { id: 'ORANGE', slug: 'orange', name: 'Orange Money', init: 'O', color: '#F97316' },
  { id: 'MTN', slug: 'mtn', name: 'MTN MoMo', init: 'MTN', color: '#F59E0B' },
];

type Filter = 'ALL' | TransactionType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'Tout' },
  { id: 'EARNING', label: 'Gains' },
  { id: 'PAYOUT', label: 'Paiements' },
  { id: 'BONUS', label: 'Bonus' },
];

const FEE_RATE = 0.01;

export function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [sheetOpen, setSheetOpen] = useState(false);

  const enabled = !!user && user.role === 'PROVIDER';

  const summaryQuery = useQuery({
    queryKey: queryKeys.earnings.summary,
    queryFn: () => api.earnings.summary(),
    enabled,
  });

  const txParams = useMemo(
    () => (filter === 'ALL' ? {} : { type: filter }),
    [filter],
  );
  const txQuery = useQuery({
    queryKey: queryKeys.earnings.transactions(txParams),
    queryFn: () => api.earnings.transactions(txParams),
    enabled,
  });

  const summary = summaryQuery.data?.summary;
  const balance = summary?.balance ?? 0;
  const pending = summary?.pending ?? 0;
  const lifetime = summary?.lifetime ?? 0;
  const weeklyDays = summary?.weekly.days ?? [];
  const weeklyTotal = summary?.weekly.total ?? 0;
  const lastWeekTotal = summary?.weekly.lastWeekTotal ?? 0;
  const deltaPct = summary?.weekly.deltaPct ?? 0;
  const hasBaseline = weeklyTotal > 0 || lastWeekTotal > 0;
  const transactions = txQuery.data?.transactions ?? [];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.overlineAccent}>Espace pro</Text>
          <Text style={styles.h1}>Mes gains</Text>
          <Text style={styles.subtitle}>
            Virement Mobile Money en 2 à 5 minutes.
          </Text>
        </View>

        {summaryQuery.isError ? (
          <View style={[styles.section, { paddingTop: 24 }]}>
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Impossible de charger vos gains</Text>
              <Text style={styles.errorBody}>
                Vérifiez votre connexion puis réessayez.
              </Text>
              <TouchableOpacity
                onPress={() => summaryQuery.refetch()}
                style={[styles.primaryCta, { marginTop: 12 }]}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryCtaText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Balance card */}
            <View style={styles.section}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceOverline}>Solde disponible</Text>
                <View style={styles.balanceAmountRow}>
                  <Text style={styles.balanceAmount}>
                    {summaryQuery.isLoading
                      ? '—'
                      : balance.toLocaleString('fr-FR')}
                  </Text>
                  <Text style={styles.balanceFc}>FC</Text>
                </View>
                {hasBaseline && (
                  <View
                    style={[
                      styles.deltaPill,
                      {
                        backgroundColor:
                          deltaPct >= 0
                            ? theme.colors.successSubtle
                            : theme.colors.dangerSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaPillText,
                        {
                          color: deltaPct >= 0 ? '#047857' : '#BE123C',
                        },
                      ]}
                    >
                      {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% cette semaine
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSheetOpen(true)}
                  disabled={balance <= 0 || summaryQuery.isLoading}
                  style={[
                    styles.primaryCta,
                    (balance <= 0 || summaryQuery.isLoading) && styles.primaryCtaDisabled,
                  ]}
                >
                  <I.arrowRight size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaText}>Demander un paiement</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weekly chart */}
            <View style={styles.section}>
              <View style={styles.chartCard}>
                <MoneyChart
                  days={weeklyDays}
                  weekTotal={weeklyTotal}
                  deltaPct={deltaPct}
                  hasBaseline={hasBaseline}
                />
              </View>
            </View>

            {/* Stats tiles */}
            <View style={styles.section}>
              <View style={styles.statGrid}>
                <StatTile
                  label="En attente"
                  value={`${pending.toLocaleString('fr-FR')} FC`}
                  caption="Sur missions non réglées"
                />
                <StatTile
                  label="Gains totaux"
                  value={`${(lifetime / 1000).toFixed(0)}k FC`}
                  caption="Depuis l'inscription"
                  muted
                />
              </View>
            </View>

            {/* Transactions */}
            <View style={styles.section}>
              <View style={styles.txCard}>
                <View style={styles.txHeader}>
                  <Text style={styles.sectionTitle}>Transactions</Text>
                  <TouchableOpacity activeOpacity={0.6}>
                    <View style={styles.ghostLinkRow}>
                      <I.fileText size={13} color={theme.colors.primaryHover} />
                      <Text style={styles.linkLabel}>Export CSV</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4, gap: 8 }}
                  style={{ marginBottom: 4 }}
                >
                  {FILTERS.map((f) => {
                    const active = filter === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => setFilter(f.id)}
                        activeOpacity={0.75}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text
                          style={[styles.chipText, active && styles.chipTextActive]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {txQuery.isLoading ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator color={theme.colors.primary} />
                  </View>
                ) : txQuery.isError ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Transactions indisponibles. Réessayez dans un instant.
                    </Text>
                    <TouchableOpacity
                      onPress={() => txQuery.refetch()}
                      style={[styles.primaryCta, { marginTop: 10 }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryCtaText}>Réessayer</Text>
                    </TouchableOpacity>
                  </View>
                ) : transactions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Pas encore de transactions. Tes gains apparaîtront ici dès ta
                      première mission.
                    </Text>
                  </View>
                ) : (
                  transactions.map((tx, i) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      last={i === transactions.length - 1}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <PayoutSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        balance={balance}
        defaultPhone={user?.phone ?? ''}
      />
    </View>
  );
}

// ── MoneyChart ───────────────────────────────────────────────────────────

function MoneyChart({
  days,
  weekTotal,
  deltaPct,
  hasBaseline,
}: {
  days: EarningsWeekDay[];
  weekTotal: number;
  deltaPct: number;
  hasBaseline: boolean;
}) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  const up = deltaPct >= 0;

  return (
    <View>
      <View style={styles.chartTopRow}>
        <View>
          <Text style={styles.chartCaption}>Cette semaine</Text>
          <View style={styles.chartAmountRow}>
            <Text style={styles.chartAmount}>
              {weekTotal.toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.chartFc}>FC</Text>
          </View>
          <Text
            style={[styles.chartCaption, { marginTop: 2, color: theme.colors.textSubtle }]}
          >
            vs semaine dernière
          </Text>
        </View>
        {hasBaseline && (
          <View
            style={[
              styles.deltaPill,
              {
                backgroundColor: up
                  ? theme.colors.successSubtle
                  : theme.colors.dangerSubtle,
              },
            ]}
          >
            <Text
              style={[styles.deltaPillText, { color: up ? '#047857' : '#BE123C' }]}
            >
              {up ? '↑' : '↓'} {Math.abs(deltaPct)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.barsRow}>
        {days.length === 0
          ? Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack} />
              </View>
            ))
          : days.map((d, i) => <MoneyBar key={`${d.day}-${i}`} day={d} max={max} />)}
      </View>
    </View>
  );
}

function MoneyBar({ day, max }: { day: EarningsWeekDay; max: number }) {
  const hPct = day.amount === 0 ? 2 : Math.max(6, (day.amount / max) * 100);
  const isToday = day.isToday;
  const isFuture = day.isFuture;
  const fill = isFuture
    ? theme.colors.surfaceMuted
    : isToday
      ? theme.colors.primary
      : 'rgba(14,165,233,0.55)';

  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              height: `${hPct}%`,
              backgroundColor: fill,
              ...(isToday
                ? {
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 0,
                    borderWidth: 2,
                    borderColor: theme.colors.bg,
                  }
                : null),
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.barLabel,
          {
            color: isToday
              ? theme.colors.primaryHover
              : isFuture
                ? theme.colors.textSubtle
                : theme.colors.textMuted,
          },
        ]}
      >
        {day.day}
      </Text>
    </View>
  );
}

// ── Transaction Row ──────────────────────────────────────────────────────

const METHOD_CHIPS: Record<string, { label: string; bg: string; color: string }> = {
  cash: { label: 'Cash', bg: theme.colors.warningSubtle, color: '#B45309' },
  mpesa: { label: 'M-Pesa', bg: '#ECFDF5', color: '#10B981' },
  airtel: { label: 'Airtel', bg: '#FEF2F2', color: '#E11D48' },
  orange: { label: 'Orange', bg: '#FFF7ED', color: '#F97316' },
  mtn: { label: 'MTN', bg: '#FFFBEB', color: '#B45309' },
};

function formatRelative(input: string | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 12 && sameDay(d, now)) return `Il y a ${diffH}h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday))
    return `Hier · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (sameDay(d, now))
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const short = d
    .toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })
    .replace('.', '');
  return `${short} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function TransactionRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const isEarning = tx.type === 'EARNING';
  const isPayout = tx.type === 'PAYOUT';
  const isBonus = tx.type === 'BONUS';

  const iconColor = isPayout
    ? theme.colors.primary
    : isBonus
      ? theme.colors.warning
      : theme.colors.success;
  const iconBg = isPayout
    ? theme.colors.primarySubtle
    : isBonus
      ? theme.colors.warningSubtle
      : theme.colors.successSubtle;
  const IconCmp = isPayout ? I.arrowRight : isBonus ? I.sparkles : I.trendingUp;

  const amountColor = isPayout
    ? theme.colors.textPrimary
    : isEarning
      ? theme.colors.success
      : theme.colors.warning;
  const sign = tx.amount > 0 ? '+' : '';
  const method = tx.paymentMethod?.toLowerCase() ?? null;
  const methodChip = method && METHOD_CHIPS[method] ? METHOD_CHIPS[method] : null;

  return (
    <View style={[styles.txRow, !last && styles.txRowDivider]}>
      <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
        <IconCmp size={18} color={iconColor} />
      </View>

      <View style={styles.txBody}>
        <Text style={styles.txLabel} numberOfLines={1}>
          {tx.label}
        </Text>
        <View style={styles.txMetaRow}>
          <Text style={styles.txMeta}>{formatRelative(tx.occurredAt)}</Text>
          {methodChip && (
            <View style={[styles.methodPill, { backgroundColor: methodChip.bg }]}>
              <Text style={[styles.methodPillText, { color: methodChip.color }]}>
                {methodChip.label}
              </Text>
            </View>
          )}
          {tx.status === 'PENDING' && (
            <View
              style={[styles.statusPill, { backgroundColor: theme.colors.warningSubtle }]}
            >
              <Text style={[styles.statusPillText, { color: theme.colors.warning }]}>
                En attente
              </Text>
            </View>
          )}
          {tx.status === 'FAILED' && (
            <View
              style={[styles.statusPill, { backgroundColor: theme.colors.dangerSubtle }]}
            >
              <Text style={[styles.statusPillText, { color: theme.colors.danger }]}>
                Échec
              </Text>
            </View>
          )}
          {tx.reference && <Text style={styles.txRef}>{tx.reference}</Text>}
        </View>
      </View>

      <View style={styles.txAmountCol}>
        <Text style={[styles.txAmount, { color: amountColor }]}>
          {sign}
          {tx.amount.toLocaleString('fr-FR')}
          <Text style={styles.txAmountFc}> FC</Text>
        </Text>
        {isEarning && tx.netAmt > 0 && (
          <Text style={styles.txNet}>
            Net : {tx.netAmt.toLocaleString('fr-FR')} FC
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Stat tile ────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  caption,
  muted,
}: {
  label: string;
  value: string;
  caption: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statOverline}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          { color: muted ? theme.colors.textMuted : theme.colors.textPrimary },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

// ── Payout bottom sheet ──────────────────────────────────────────────────

function PayoutSheet({
  open,
  onClose,
  balance,
  defaultPhone,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  defaultPhone: string;
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(balance);
  const [selected, setSelected] = useState<MMOperator>(MM_OPERATORS[0]);
  const [phone, setPhone] = useState(defaultPhone);
  const [result, setResult] = useState<CreatePayoutResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (data: CreatePayoutDto) => api.earnings.createPayout(data),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.earnings.summary });
      void queryClient.invalidateQueries({ queryKey: ['earnings', 'transactions'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.earnings.payouts });
    },
  });

  useEffect(() => {
    if (open) {
      setAmount(balance);
      setSelected(MM_OPERATORS[0]);
      setPhone(defaultPhone);
      setResult(null);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, balance, defaultPhone]);

  const fee = Math.round(amount * FEE_RATE);
  const receiving = amount - fee;
  const invalid =
    amount <= 0 ||
    amount > balance ||
    phone.trim().length < 8 ||
    mutation.isPending;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetCard, { paddingBottom: Math.max(24, insets.bottom + 14) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sheetTitle}>Demander un paiement</Text>
              <Text style={styles.sheetCaption}>
                Votre solde : {balance.toLocaleString('fr-FR')} FC
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Fermer"
              hitSlop={8}
              style={styles.sheetClose}
            >
              <I.x size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {result ? (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <I.check size={32} color={theme.colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.successTitle}>Demande enregistrée</Text>
              <Text style={styles.successBody}>
                {amount.toLocaleString('fr-FR')} FC en route vers {selected.name}.
              </Text>
              <Text style={styles.successRef}>
                Réf : {result.payout.reference ?? 'PSP en attente'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onClose}
                style={[styles.primaryCta, { marginTop: 18 }]}
              >
                <Text style={styles.primaryCtaText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: '80%' }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Amount */}
              <Text style={styles.fieldOverline}>Montant</Text>
              <View style={styles.amountField}>
                <TextInput
                  keyboardType="number-pad"
                  value={amount === 0 ? '' : amount.toLocaleString('fr-FR')}
                  onChangeText={(txt) =>
                    setAmount(parseInt(txt.replace(/\D/g, '') || '0', 10))
                  }
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSubtle}
                  style={styles.amountInput}
                />
                <Text style={styles.amountFc}>FC</Text>
                <TouchableOpacity
                  onPress={() => setAmount(balance)}
                  style={styles.maxButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.maxButtonText}>Max</Text>
                </TouchableOpacity>
              </View>

              {/* Operators — 2x2 grid */}
              <Text style={[styles.fieldOverline, { marginTop: 18 }]}>
                Envoyer vers
              </Text>
              <View style={styles.opGrid}>
                {MM_OPERATORS.map((op) => (
                  <OperatorTile
                    key={op.id}
                    op={op}
                    selected={selected.id === op.id}
                    onPress={() => setSelected(op)}
                  />
                ))}
              </View>

              {/* Phone */}
              <Text style={styles.fieldOverline}>Numéro</Text>
              <View style={styles.phoneField}>
                <TextInput
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+243 810 123 742"
                  placeholderTextColor={theme.colors.textSubtle}
                  style={styles.phoneInput}
                />
              </View>

              {/* Récapitulatif */}
              <View style={styles.recap}>
                <Text style={[styles.fieldOverline, { color: theme.colors.primaryHover }]}>
                  Récapitulatif
                </Text>
                <RecapRow
                  label="Montant"
                  value={`${amount.toLocaleString('fr-FR')} FC`}
                />
                <RecapRow
                  label={`Frais (${(FEE_RATE * 100).toFixed(0)} %)`}
                  value={`− ${fee.toLocaleString('fr-FR')} FC`}
                />
                <View style={styles.recapDivider} />
                <View style={styles.recapTotalRow}>
                  <Text style={styles.recapTotalLabel}>Total à recevoir</Text>
                  <Text style={styles.recapTotalValue}>
                    {receiving.toLocaleString('fr-FR')} FC
                  </Text>
                </View>
              </View>

              {mutation.isError && (
                <Text style={styles.errorInline}>
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Impossible d'enregistrer le paiement. Réessayez."}
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={invalid ? 1 : 0.85}
                disabled={invalid}
                onPress={() =>
                  mutation.mutate({
                    operator: selected.id,
                    amount,
                    phone: phone.trim(),
                  })
                }
                style={[styles.primaryCta, invalid && styles.primaryCtaDisabled]}
              >
                <Text style={styles.primaryCtaText}>
                  {mutation.isPending ? 'Enregistrement…' : 'Valider le paiement'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.sheetFootnote}>
                Délai : 2–5 minutes · sécurisé par KAYOU
              </Text>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OperatorTile({
  op,
  selected,
  onPress,
}: {
  op: MMOperator;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.opTile,
        {
          borderColor: selected ? op.color : theme.colors.borderSubtle,
          backgroundColor: selected ? `${op.color}0D` : theme.colors.surface,
        },
      ]}
    >
      <View style={[styles.opInit, { backgroundColor: op.color }]}>
        <Text
          style={[
            styles.opInitText,
            op.init.length > 1 && { fontSize: 11, letterSpacing: 0.4 },
          ]}
        >
          {op.init}
        </Text>
      </View>
      <Text style={styles.opName} numberOfLines={1}>
        {op.name}
      </Text>
      {selected && (
        <View style={[styles.opCheck, { backgroundColor: op.color }]}>
          <I.check size={12} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const card: StyleProp<ViewStyle> = {
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.borderSubtle,
  borderRadius: theme.radius.lg,
  ...theme.shadow.e1,
};

const overlineBase: StyleProp<TextStyle> = {
  fontFamily: theme.fonts.bodySemi,
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 0.88,
  textTransform: 'uppercase',
  color: theme.colors.textMuted,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  overlineAccent: {
    ...(overlineBase as object),
    color: theme.colors.accent,
    marginBottom: 6,
  },
  h1: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: -0.5,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  errorCard: {
    ...(card as object),
    padding: 18,
    alignItems: 'center',
  },
  errorTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  errorBody: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  // Balance card
  balanceCard: {
    ...(card as object),
    padding: 22,
  },
  balanceOverline: {
    ...(overlineBase as object),
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  balanceAmount: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 40,
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  balanceFc: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 18,
    color: theme.colors.textMuted,
    marginLeft: 6,
  },
  deltaPill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginTop: 10,
  },
  deltaPillText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 12,
  },
  primaryCta: {
    marginTop: 16,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaDisabled: {
    opacity: 0.5,
  },
  primaryCtaText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '700',
    fontSize: 15,
    color: '#FFFFFF',
  },

  chartCard: {
    ...(card as object),
    padding: 18,
  },
  chartTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  chartCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  chartAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  chartAmount: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 28,
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
  },
  chartFc: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 130,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    height: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  barLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    ...(card as object),
    flex: 1,
    padding: 14,
  },
  statOverline: {
    ...(overlineBase as object),
  },
  statValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  statCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  txCard: {
    ...(card as object),
    padding: 16,
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  ghostLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primaryHover,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  chipText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  chipTextActive: {
    color: theme.colors.primaryHover,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  txRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: {
    flex: 1,
    minWidth: 0,
  },
  txLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  txMeta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11.5,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  methodPill: {
    paddingVertical: 1,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  methodPillText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusPill: {
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10.5,
    fontWeight: '600',
  },
  txRef: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSubtle,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 14,
  },
  txAmountFc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  txNet: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.4,
    color: theme.colors.textPrimary,
  },
  sheetCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  sheetClose: {
    padding: 4,
  },
  fieldOverline: {
    ...(overlineBase as object),
    marginBottom: 8,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: -0.4,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  amountFc: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  maxButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
  },
  maxButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textBody,
  },
  opGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  opTile: {
    flexBasis: '47.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  opInit: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opInitText: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
  },
  opName: {
    flex: 1,
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 13.5,
    color: theme.colors.textPrimary,
  },
  opCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneField: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: 18,
  },
  phoneInput: {
    fontFamily: theme.fonts.mono,
    fontSize: 15,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  recap: {
    padding: 14,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  recapLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  recapValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  recapDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginTop: 10,
  },
  recapTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
  },
  recapTotalLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  recapTotalValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.success,
  },
  sheetFootnote: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  errorInline: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 10,
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 19,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  successBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  successRef: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.textSubtle,
    marginTop: 8,
  },
});

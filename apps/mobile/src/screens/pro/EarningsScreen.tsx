import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';

// DS08 — pro Earnings screen. Weekly bar chart, balance + stats, transaction
// list with filter chips, Mobile Money payout bottom sheet. Data is fixture
// only; backend wiring (real payouts) is deferred (see PROGRESS Blockers).

type WeekDay = {
  day: string;
  amount: number;
  isToday?: boolean;
  isFuture?: boolean;
};

type TxType = 'earning' | 'payout' | 'bonus';
type TxStatus = 'completed' | 'pending' | 'failed';
type PayMethod = 'cash' | 'mpesa' | 'airtel' | 'orange' | 'mtn';

type Transaction = {
  id: string;
  type: TxType;
  at: string;
  label: string;
  amount: number;
  fee?: number;
  net?: number;
  status: TxStatus;
  ref?: string;
  paymentMethod?: PayMethod;
};

type MMOperator = {
  id: 'mpesa' | 'airtel' | 'orange' | 'mtn';
  name: string;
  init: string;
  color: string;
  number: string;
};

const EARNINGS_WEEKLY: WeekDay[] = [
  { day: 'Lun', amount: 12000 },
  { day: 'Mar', amount: 28000 },
  { day: 'Mer', amount: 18000 },
  { day: 'Jeu', amount: 22000 },
  { day: 'Ven', amount: 34000 },
  { day: 'Sam', amount: 10000, isToday: true },
  { day: 'Dim', amount: 0, isFuture: true },
];
const LAST_WEEK_TOTAL = 108000;

const BALANCES = {
  balance: 342000,
  pending: 64000,
  lifetime: 2480000,
};

const TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'earning',
    at: 'Il y a 2h',
    label: 'Réparation fuite · Famille Mutombo',
    amount: 22000,
    fee: 1540,
    net: 20460,
    status: 'pending',
    paymentMethod: 'cash',
  },
  {
    id: 't2',
    type: 'payout',
    at: 'Hier · 16:42',
    label: 'Virement vers M-Pesa',
    amount: -85000,
    status: 'completed',
    ref: 'MP-7X42ZC',
    paymentMethod: 'mpesa',
  },
  {
    id: 't3',
    type: 'earning',
    at: 'Hier · 11:15',
    label: 'Installation robinet · Joseph Mbuyi',
    amount: 28000,
    fee: 1960,
    net: 26040,
    status: 'completed',
    paymentMethod: 'mpesa',
  },
  {
    id: 't4',
    type: 'earning',
    at: 'Mar 15 · 14:30',
    label: 'Débouchage · Marie K.',
    amount: 15000,
    fee: 1050,
    net: 13950,
    status: 'completed',
    paymentMethod: 'airtel',
  },
  {
    id: 't5',
    type: 'bonus',
    at: 'Lun 14 · 00:01',
    label: 'Bonus « 10 missions ★ 4.9+ »',
    amount: 5000,
    status: 'completed',
  },
  {
    id: 't6',
    type: 'earning',
    at: 'Lun 14 · 09:00',
    label: 'Fuite chauffe-eau · Papa Léon',
    amount: 34000,
    fee: 2380,
    net: 31620,
    status: 'completed',
    paymentMethod: 'cash',
  },
  {
    id: 't7',
    type: 'payout',
    at: 'Dim 13 · 12:10',
    label: 'Virement vers Airtel Money',
    amount: -45000,
    status: 'completed',
    ref: 'AM-2K81PL',
    paymentMethod: 'airtel',
  },
];

const MM_OPERATORS: MMOperator[] = [
  { id: 'mpesa', name: 'M-Pesa', init: 'M', color: '#10B981', number: '+243 897 ••• 456' },
  { id: 'airtel', name: 'Airtel Money', init: 'A', color: '#E11D48', number: '+243 991 ••• 102' },
  { id: 'orange', name: 'Orange Money', init: 'O', color: '#F97316', number: '+243 810 ••• 742' },
  { id: 'mtn', name: 'MTN MoMo', init: 'MTN', color: '#F59E0B', number: '+243 822 ••• 918' },
];

type Filter = 'all' | TxType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'earning', label: 'Gains' },
  { id: 'payout', label: 'Paiements' },
  { id: 'bonus', label: 'Bonus' },
];

// Fee preview is placeholder (DS08 specifies flat 1%). Real fees vary per
// operator and are confirmed server-side when backend lands.
const FEE_RATE = 0.01;

export function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const weekTotal = useMemo(
    () => EARNINGS_WEEKLY.reduce((s, d) => s + d.amount, 0),
    [],
  );
  const weekChange = Math.round(
    ((weekTotal - LAST_WEEK_TOTAL) / LAST_WEEK_TOTAL) * 100,
  );

  const filtered = useMemo(
    () => (filter === 'all' ? TRANSACTIONS : TRANSACTIONS.filter((t) => t.type === filter)),
    [filter],
  );

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

        {/* Balance card */}
        <View style={styles.section}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceOverline}>Solde disponible</Text>
            <View style={styles.balanceAmountRow}>
              <Text style={styles.balanceAmount}>
                {BALANCES.balance.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.balanceFc}>FC</Text>
            </View>
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor:
                    weekChange >= 0 ? theme.colors.successSubtle : theme.colors.dangerSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.deltaPillText,
                  { color: weekChange >= 0 ? '#047857' : '#BE123C' },
                ]}
              >
                {weekChange >= 0 ? '↑' : '↓'} {Math.abs(weekChange)}% cette semaine
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSheetOpen(true)}
              style={styles.primaryCta}
            >
              <I.arrowRight size={16} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>Demander un paiement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={styles.section}>
          <View style={styles.chartCard}>
            <MoneyChart weekTotal={weekTotal} weekChange={weekChange} />
          </View>
        </View>

        {/* Stats tiles (pending + lifetime) */}
        <View style={styles.section}>
          <View style={styles.statGrid}>
            <StatTile
              label="En attente"
              value={`${BALANCES.pending.toLocaleString('fr-FR')} FC`}
              caption="Sur missions non réglées"
            />
            <StatTile
              label="Gains totaux"
              value={`${(BALANCES.lifetime / 1000).toFixed(0)}k FC`}
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

            {/* Filter chips */}
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
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Pas encore de transactions. Tes gains apparaîtront ici dès ta
                  première mission.
                </Text>
              </View>
            ) : (
              filtered.map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} last={i === filtered.length - 1} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <PayoutSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        balance={BALANCES.balance}
      />
    </View>
  );
}

// ── MoneyChart ───────────────────────────────────────────────────────────

function MoneyChart({
  weekTotal,
  weekChange,
}: {
  weekTotal: number;
  weekChange: number;
}) {
  const max = Math.max(...EARNINGS_WEEKLY.map((d) => d.amount), 1);
  const up = weekChange >= 0;

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
          <Text style={[styles.chartCaption, { marginTop: 2, color: theme.colors.textSubtle }]}>
            vs semaine dernière
          </Text>
        </View>
        <View
          style={[
            styles.deltaPill,
            {
              backgroundColor: up ? theme.colors.successSubtle : theme.colors.dangerSubtle,
            },
          ]}
        >
          <Text style={[styles.deltaPillText, { color: up ? '#047857' : '#BE123C' }]}>
            {up ? '↑' : '↓'} {Math.abs(weekChange)}%
          </Text>
        </View>
      </View>

      <View style={styles.barsRow}>
        {EARNINGS_WEEKLY.map((d) => (
          <MoneyBar key={d.day} day={d} max={max} />
        ))}
      </View>
    </View>
  );
}

function MoneyBar({ day, max }: { day: WeekDay; max: number }) {
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
              // Today gets a ring shadow: emulated on RN with a wrapping view.
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

const METHOD_CHIPS: Record<PayMethod, { label: string; bg: string; color: string }> = {
  cash: { label: 'Cash', bg: theme.colors.warningSubtle, color: '#B45309' },
  mpesa: { label: 'M-Pesa', bg: '#ECFDF5', color: '#10B981' },
  airtel: { label: 'Airtel', bg: '#FEF2F2', color: '#E11D48' },
  orange: { label: 'Orange', bg: '#FFF7ED', color: '#F97316' },
  mtn: { label: 'MTN', bg: '#FFFBEB', color: '#B45309' },
};

function TransactionRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const isEarning = tx.type === 'earning';
  const isPayout = tx.type === 'payout';
  const isBonus = tx.type === 'bonus';

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

  const amountColor =
    isPayout
      ? theme.colors.textPrimary
      : isEarning
        ? theme.colors.success
        : theme.colors.warning;
  const sign = tx.amount > 0 ? '+' : '';
  const methodChip = tx.paymentMethod ? METHOD_CHIPS[tx.paymentMethod] : null;

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
          <Text style={styles.txMeta}>{tx.at}</Text>
          {methodChip && (
            <View style={[styles.methodPill, { backgroundColor: methodChip.bg }]}>
              <Text style={[styles.methodPillText, { color: methodChip.color }]}>
                {methodChip.label}
              </Text>
            </View>
          )}
          {tx.status === 'pending' && (
            <View
              style={[styles.statusPill, { backgroundColor: theme.colors.warningSubtle }]}
            >
              <Text style={[styles.statusPillText, { color: theme.colors.warning }]}>
                En attente
              </Text>
            </View>
          )}
          {tx.status === 'failed' && (
            <View
              style={[styles.statusPill, { backgroundColor: theme.colors.dangerSubtle }]}
            >
              <Text style={[styles.statusPillText, { color: theme.colors.danger }]}>
                Échec
              </Text>
            </View>
          )}
          {tx.ref && <Text style={styles.txRef}>{tx.ref}</Text>}
        </View>
      </View>

      <View style={styles.txAmountCol}>
        <Text style={[styles.txAmount, { color: amountColor }]}>
          {sign}
          {tx.amount.toLocaleString('fr-FR')}
          <Text style={styles.txAmountFc}> FC</Text>
        </Text>
        {tx.net != null && (
          <Text style={styles.txNet}>
            Net : {tx.net.toLocaleString('fr-FR')} FC
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
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
}) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState<number>(balance);
  const [selectedId, setSelectedId] = useState<MMOperator['id']>('mpesa');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(balance);
      setSelectedId('mpesa');
      setSubmitted(false);
    }
  }, [open, balance]);

  const selected = MM_OPERATORS.find((op) => op.id === selectedId) ?? MM_OPERATORS[0];
  const fee = Math.round(amount * FEE_RATE);
  const receiving = amount - fee;
  const invalid = amount <= 0 || amount > balance;

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

          {submitted ? (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <I.check size={32} color={theme.colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.successTitle}>Demande enregistrée</Text>
              <Text style={styles.successBody}>
                {amount.toLocaleString('fr-FR')} FC en route vers {selected.name}.
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
                    selected={selectedId === op.id}
                    onPress={() => setSelectedId(op.id)}
                  />
                ))}
              </View>

              {/* Masked number */}
              <View style={styles.numberCard}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fieldOverline}>Numéro</Text>
                  <Text style={styles.numberText}>{selected.number}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} style={styles.linkBtn}>
                  <I.pencil size={13} color={theme.colors.primaryHover} />
                  <Text style={styles.linkLabel}>Modifier</Text>
                </TouchableOpacity>
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

              <TouchableOpacity
                activeOpacity={invalid ? 1 : 0.85}
                disabled={invalid}
                onPress={() => setSubmitted(true)}
                style={[styles.primaryCta, invalid && styles.primaryCtaDisabled]}
              >
                <Text style={styles.primaryCtaText}>Valider le paiement</Text>
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

  // Chart card
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

  // Stats
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

  // Transactions
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

  // Payout sheet
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
  numberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: 18,
  },
  numberText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 14.5,
    color: theme.colors.textPrimary,
    marginTop: 3,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
});

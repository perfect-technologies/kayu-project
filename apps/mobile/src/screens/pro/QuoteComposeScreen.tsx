import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { I } from '@kayu/ui/mobile';
import { tokens, type CategorySlug } from '@kayu/ui';
import { queryKeys } from '@kayu/api';
import type {
  CreateQuoteDtoType,
  JobRequestForPro,
  Quote,
} from '@kayu/schemas';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type {
  ProviderStackParamList,
  RequestsStackParamList,
} from '@/navigation/AppNavigator';
import {
  getPresets,
  PRESET_LINE_ITEMS,
  type LineItemPreset,
} from './fixtures';

type QuoteComposeParamList = RequestsStackParamList & ProviderStackParamList;
type Nav = NativeStackNavigationProp<QuoteComposeParamList, 'QuoteCompose'>;
type Route = RouteProp<QuoteComposeParamList, 'QuoteCompose'>;

type Line = {
  id: number;
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

type StartDateKey = 'today' | 'tomorrow' | 'week' | 'custom';

const START_DATE_LABEL: Record<StartDateKey, string> = {
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  week: 'Cette semaine',
  custom: 'Choisir…',
};

const VALIDITY_OPTIONS = [3, 7, 14, 30] as const;

const START_DATE_TO_BACKEND: Record<StartDateKey, string> = {
  today: 'today',
  tomorrow: 'tomorrow',
  week: 'this_week',
  custom: 'custom',
};

function initialLines(req: JobRequestForPro | undefined): Line[] {
  if (!req) {
    return [{ id: 1, label: '', qty: 1, unit: 'Forfait', unitPrice: 0 }];
  }
  const presetKey =
    req.category?.slug && PRESET_LINE_ITEMS[req.category.slug]
      ? req.category.slug
      : 'default';
  const presets = PRESET_LINE_ITEMS[presetKey] ?? PRESET_LINE_ITEMS.default;
  const diag = presets.find((p) => /diagnostic|déplacement/i.test(p.label));
  const hourly = presets.find((p) => p.unit === 'Heure');
  const lines: Line[] = [];
  let id = 1;
  if (diag) {
    lines.push({ id: id++, label: diag.label, qty: 1, unit: diag.unit, unitPrice: diag.unitPrice });
  }
  if (hourly) {
    lines.push({
      id: id++,
      label: hourly.label,
      qty: req.estimatedHours && req.estimatedHours > 0 ? req.estimatedHours : 1,
      unit: hourly.unit,
      unitPrice: hourly.unitPrice,
    });
  }
  if (lines.length === 0) {
    lines.push({ id: id++, label: '', qty: 1, unit: 'Forfait', unitPrice: 0 });
  }
  return lines;
}

function defaultMessage(req: JobRequestForPro | undefined, pro: string): string {
  if (!req) {
    return `Bonjour, merci pour votre demande. Voici mon devis. — ${pro}`;
  }
  const clientFirst = req.client.firstName?.trim() || '';
  const salutation = clientFirst ? `Bonjour ${clientFirst}` : 'Bonjour';
  return `${salutation}, merci pour votre demande. Voici mon devis pour « ${req.service} ». Je peux intervenir dès que ça vous arrange. — ${pro}`;
}

function clientFirstName(req: JobRequestForPro | undefined): string {
  return req?.client.firstName?.trim() || 'votre client';
}

function categorySlug(req: JobRequestForPro | undefined): CategorySlug {
  const slug = req?.category?.slug as CategorySlug | undefined;
  if (slug && slug in tokens.portfolio) return slug;
  return 'plomberie';
}

export function QuoteComposeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const requestId = route.params?.requestId ?? null;
  const firstName = user?.firstName ?? 'Pro';

  const requestQuery = useQuery({
    queryKey: requestId ? queryKeys.jobRequests.detail(requestId) : ['noop'],
    queryFn: () => api.jobRequests.getById(requestId!),
    enabled: !!requestId,
  });

  const req = requestQuery.data?.request;
  const presets = getPresets(req?.category?.slug);

  const [lines, setLines] = useState<Line[]>([
    { id: 1, label: '', qty: 1, unit: 'Forfait', unitPrice: 0 },
  ]);
  const [nextId, setNextId] = useState(2);
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState<StartDateKey>('tomorrow');
  const [customDate, setCustomDate] = useState('');
  const [validityDays, setValidityDays] = useState<number>(7);
  const [discountPct, setDiscountPct] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const [sent, setSent] = useState<Quote | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised) return;
    if (requestId && !req) return;
    const seeded = initialLines(req);
    setLines(seeded);
    setNextId(seeded.length + 1);
    setMessage(defaultMessage(req, firstName));
    if (req?.whenPref?.toLowerCase().includes('aujourd') || req?.whenPref?.toLowerCase().includes('today')) {
      setStartDate('today');
    }
    setInitialised(true);
  }, [req, firstName, initialised, requestId]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateQuoteDtoType) => api.quotes.create(dto),
  });
  const sendMutation = useMutation({
    mutationFn: (id: string) => api.quotes.send(id),
  });

  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  const discountAmt = Math.round(subtotal * (discountPct / 100));
  const total = subtotal - discountAmt;
  const kayouFee = Math.round(total * 0.1);
  const payout = total - kayouFee;
  const vsBudget = req && req.budget ? total - req.budget : 0;
  const hasEmptyLabel = lines.some((l) => l.label.trim() === '');
  const submitting = createMutation.isPending || sendMutation.isPending;
  const disabled =
    lines.length === 0 ||
    total === 0 ||
    hasEmptyLabel ||
    (startDate === 'custom' && customDate.trim().length === 0) ||
    !requestId ||
    submitting;

  const submit = async () => {
    if (!requestId) {
      Alert.alert('Demande requise', 'Cette page exige une demande associée.');
      return;
    }
    const startDateKind =
      startDate === 'custom' && customDate.trim()
        ? customDate.trim()
        : START_DATE_TO_BACKEND[startDate];
    const dto: CreateQuoteDtoType = {
      jobRequestId: requestId,
      lines: lines.map((l) => ({
        label: l.label.trim(),
        qty: l.qty,
        unit: l.unit,
        unitPrice: l.unitPrice,
      })),
      message: message.trim() || 'Voici mon devis.',
      validityDays,
      startDateKind,
      discountPct,
    };
    try {
      const createRes = await createMutation.mutateAsync(dto);
      const sendRes = await sendMutation.mutateAsync(createRes.quote.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobRequests.inboxForPro,
      });
      setSent(sendRes.quote);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      Alert.alert('Erreur', msg);
    }
  };

  const addPreset = (p: LineItemPreset) => {
    setLines((prev) => [
      ...prev,
      {
        id: nextId,
        label: p.label,
        qty: 1,
        unit: p.unit,
        unitPrice: p.unitPrice,
      },
    ]);
    setNextId((n) => n + 1);
    setShowPresets(false);
  };

  const addBlank = () => {
    setLines((prev) => [
      ...prev,
      { id: nextId, label: '', qty: 1, unit: 'Forfait', unitPrice: 0 },
    ]);
    setNextId((n) => n + 1);
    setShowPresets(false);
  };

  const updateLine = (id: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  if (requestId && requestQuery.isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (requestId && requestQuery.isError) {
    return (
      <View
        style={[
          styles.root,
          { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
        ]}
      >
        <Text style={{ color: theme.colors.textBody, textAlign: 'center' }}>
          Impossible de charger la demande.
        </Text>
        <TouchableOpacity
          onPress={() => requestQuery.refetch()}
          style={[styles.btn, styles.btnSecondary, { paddingHorizontal: 20 }]}
        >
          <Text style={styles.btnSecondaryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sent) {
    return (
      <QuoteSent
        req={req}
        total={sent.total}
        validityDays={sent.validityDays}
        onBack={() => navigation.getParent()?.navigate('Requests' as never)}
        onDashboard={() => navigation.getParent()?.navigate('ProviderDashboard')}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <I.arrowLeft size={18} color={theme.colors.textBody} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Nouveau devis
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {req ? `Pour ${clientFirstName(req)}` : 'Brouillon'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {req && (
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <RequestContextCard req={req} />
          </View>
        )}

        {/* Line items */}
        <Section title="Prestations" count={lines.length}>
          <View style={{ gap: 10 }}>
            {lines.map((l) => (
              <MobileLineItem
                key={l.id}
                line={l}
                canDelete={lines.length > 1}
                onChange={updateLine}
                onRemove={removeLine}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowPresets((v) => !v)}
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
            >
              <I.plus size={14} color={theme.colors.textBody} />
              <Text style={styles.btnSecondaryText}>Depuis un modèle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={addBlank}
              style={[styles.btn, styles.btnSecondary, { width: 50 }]}
            >
              <I.pencil size={14} color={theme.colors.textBody} />
            </TouchableOpacity>
          </View>
          {showPresets && (
            <View style={{ marginTop: 10, gap: 6 }}>
              {presets.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => addPreset(p)}
                  style={styles.presetRow}
                >
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetPrice}>
                    {p.unitPrice > 0
                      ? `${p.unitPrice.toLocaleString('fr-FR')} FC / ${p.unit}`
                      : `au ${p.unit}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Discount */}
        <Section title="Réduction">
          <View style={styles.pillRow}>
            {[0, 5, 10, 15].map((p) => (
              <PillButton
                key={p}
                active={discountPct === p}
                onPress={() => setDiscountPct(p)}
                label={p === 0 ? 'Aucune' : `-${p}%`}
              />
            ))}
          </View>
        </Section>

        {/* Start date */}
        <Section title="Début d'intervention">
          <View style={styles.pillRow}>
            {(Object.keys(START_DATE_LABEL) as StartDateKey[]).map((k) => (
              <PillButton
                key={k}
                active={startDate === k}
                onPress={() => setStartDate(k)}
                label={START_DATE_LABEL[k]}
              />
            ))}
          </View>
          {startDate === 'custom' && (
            <TextInput
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="jj/mm/aaaa ou aaaa-mm-jj"
              placeholderTextColor={theme.colors.textSubtle}
              style={[styles.input, { marginTop: 10 }]}
            />
          )}
        </Section>

        {/* Validity */}
        <Section title="Validité du devis">
          <View style={styles.pillRow}>
            {VALIDITY_OPTIONS.map((d) => (
              <PillButton
                key={d}
                active={validityDays === d}
                onPress={() => setValidityDays(d)}
                label={`${d}j`}
              />
            ))}
          </View>
          <Text style={styles.helperText}>
            Le client a {validityDays} jour{validityDays > 1 ? 's' : ''} pour répondre.
          </Text>
        </Section>

        {/* Message */}
        <Section title="Message au client">
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            placeholder="Un petit mot personnel…"
            placeholderTextColor={theme.colors.textSubtle}
            style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]}
          />
        </Section>

        {/* Totals */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={styles.totalsCard}>
            <TotalRow label="Sous-total" value={subtotal} />
            {discountPct > 0 && (
              <TotalRow
                label={`Remise (${discountPct}%)`}
                value={-discountAmt}
                muted
              />
            )}
            <View style={styles.totalsDivider} />
            <TotalRow label="Total client" value={total} big bold />
            {req && vsBudget !== 0 && (
              <View
                style={[
                  styles.vsBudget,
                  {
                    backgroundColor:
                      vsBudget > 0
                        ? theme.colors.warningSubtle
                        : theme.colors.successSubtle,
                  },
                ]}
              >
                <I.info
                  size={14}
                  color={vsBudget > 0 ? theme.colors.warning : theme.colors.success}
                />
                <Text
                  style={[
                    styles.vsBudgetText,
                    { color: vsBudget > 0 ? '#92400E' : '#065F46' },
                  ]}
                >
                  {vsBudget > 0
                    ? `+${vsBudget.toLocaleString('fr-FR')} FC au-dessus du budget`
                    : `Dans le budget · ${Math.abs(vsBudget).toLocaleString('fr-FR')} FC sous`}
                </Text>
              </View>
            )}
            <View style={{ height: 10 }} />
            <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, paddingTop: 10 }}>
              <TotalRow
                label="Commission KAYOU (10%)"
                value={-kayouFee}
                muted
                small
              />
              <TotalRow label="Gain net estimé" value={payout} big accent />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky submit bar */}
      <View style={[styles.submitBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.submitCaption}>Total devis</Text>
          <Text style={styles.submitTotal}>
            {total.toLocaleString('fr-FR')} FC
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => !disabled && submit()}
          disabled={disabled}
          style={[
            styles.btn,
            styles.btnPrimary,
            { paddingHorizontal: 20, opacity: disabled ? 0.55 : 1 },
          ]}
        >
          <Text style={styles.btnPrimaryText}>
            {submitting ? 'Envoi…' : 'Envoyer le devis'}
          </Text>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <I.send size={14} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function RequestContextCard({ req }: { req: JobRequestForPro }) {
  const slug = categorySlug(req);
  const cat = tokens.portfolio[slug] ?? tokens.portfolio.plomberie;
  return (
    <View
      style={[
        styles.contextCard,
        { backgroundColor: cat.bg, borderColor: `${cat.accent}30` },
      ]}
    >
      <View style={[styles.contextIcon, { backgroundColor: '#FFFFFF' }]}>
        <I.wrench size={20} color={cat.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.contextTitle}>{req.service}</Text>
        <Text style={styles.contextMeta}>
          {req.whenPref}
          {'\n'}
          {req.address}
        </Text>
        {req.budget ? (
          <Text style={styles.contextBudget}>
            Budget indicatif :{' '}
            <Text style={styles.contextBudgetStrong}>
              {req.budget.toLocaleString('fr-FR')} FC
            </Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <Text style={styles.sectionCount}>
            {count} ligne{count > 1 ? 's' : ''}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function MobileLineItem({
  line,
  canDelete,
  onChange,
  onRemove,
}: {
  line: Line;
  canDelete: boolean;
  onChange: (id: number, patch: Partial<Line>) => void;
  onRemove: (id: number) => void;
}) {
  const total = line.qty * line.unitPrice;
  return (
    <View style={styles.lineItemCard}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <TextInput
          value={line.label}
          onChangeText={(t) => onChange(line.id, { label: t })}
          placeholder="Description"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.input, { flex: 1, fontWeight: '500' }]}
        />
        <TouchableOpacity
          onPress={() => onRemove(line.id)}
          disabled={!canDelete}
          style={[
            styles.iconBtn,
            { opacity: canDelete ? 1 : 0.3 },
          ]}
          activeOpacity={0.7}
        >
          <I.trash size={13} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={styles.lineItemGrid}>
        <TextInput
          value={String(line.qty)}
          onChangeText={(t) => {
            const n = parseFloat(t.replace(',', '.'));
            onChange(line.id, { qty: Number.isFinite(n) ? n : 0 });
          }}
          keyboardType="numeric"
          style={[styles.input, { width: 56, textAlign: 'center', fontFamily: theme.fonts.mono }]}
        />
        <View style={[styles.input, { flex: 1, paddingVertical: 0, justifyContent: 'center' }]}>
          <Text style={{ fontSize: 13, color: theme.colors.textBody, fontFamily: theme.fonts.body }}>
            {line.unit}
          </Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TextInput
            value={String(line.unitPrice)}
            onChangeText={(t) => {
              const n = parseInt(t.replace(/\D/g, ''), 10);
              onChange(line.id, { unitPrice: Number.isFinite(n) ? n : 0 });
            }}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, textAlign: 'right', fontFamily: theme.fonts.mono }]}
          />
          <Text style={{ fontSize: 11, color: theme.colors.textMuted }}>FC</Text>
        </View>
      </View>
      <View style={styles.lineItemFooter}>
        <Text style={styles.lineItemFooterLabel}>Total ligne</Text>
        <Text style={styles.lineItemFooterValue}>
          {total.toLocaleString('fr-FR')} FC
        </Text>
      </View>
    </View>
  );
}

function PillButton({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.pill,
        active && {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primarySubtle,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          active && {
            color: theme.colors.primaryHover,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TotalRow({
  label,
  value,
  big,
  bold,
  muted,
  small,
  accent,
}: {
  label: string;
  value: number;
  big?: boolean;
  bold?: boolean;
  muted?: boolean;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingVertical: big ? 4 : 3,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.body,
          fontSize: small ? 12 : big ? 14 : 13,
          color: muted
            ? theme.colors.textMuted
            : accent
              ? theme.colors.primaryHover
              : theme.colors.textBody,
          fontWeight: bold ? '600' : '500',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: big ? theme.fonts.display : theme.fonts.mono,
          fontSize: big ? 22 : small ? 13 : 14,
          fontWeight: bold || big ? '700' : '600',
          color: accent
            ? theme.colors.primary
            : muted
              ? theme.colors.textMuted
              : theme.colors.textPrimary,
          letterSpacing: big ? -0.5 : 0,
        }}
      >
        {value < 0 ? '−' : ''}
        {Math.abs(value).toLocaleString('fr-FR')} FC
      </Text>
    </View>
  );
}

function QuoteSent({
  req,
  total,
  validityDays,
  onBack,
  onDashboard,
}: {
  req: JobRequestForPro | undefined;
  total: number;
  validityDays: number;
  onBack: () => void;
  onDashboard: () => void;
}) {
  const insets = useSafeAreaInsets();
  const firstName = clientFirstName(req);
  return (
    <View
      style={[
        styles.sentRoot,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.sentCircle}>
        <I.check size={36} color={theme.colors.success} strokeWidth={2.5} />
      </View>
      <Text style={styles.sentTitle}>Devis envoyé !</Text>
      <Text style={styles.sentCopy}>
        {firstName} va recevoir votre devis et a {validityDays} jour
        {validityDays > 1 ? 's' : ''} pour répondre.
      </Text>
      {req && (
        <View style={styles.sentSummaryCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={styles.sentSummaryLabel} numberOfLines={1}>
              {req.service}
            </Text>
            <Text style={styles.sentSummaryValue}>
              {total.toLocaleString('fr-FR')} FC
            </Text>
          </View>
          <Text style={styles.sentSummarySub}>
            Envoyé à l'instant · en attente de réponse
          </Text>
        </View>
      )}
      <View style={{ width: '100%', gap: 10 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onBack}
          style={[styles.btn, styles.btnPrimary]}
        >
          <Text style={styles.btnPrimaryText}>Voir mes demandes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDashboard}
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>Retour au dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },

  // Context card
  contextCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  contextIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 14.5,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  contextMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  contextBudget: {
    marginTop: 6,
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },
  contextBudgetStrong: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
    letterSpacing: -0.1,
  },
  sectionCount: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },

  // Line item
  lineItemCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  lineItemGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  lineItemFooterLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
  lineItemFooterValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },

  // Presets
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  presetLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textBody,
    fontWeight: '500',
    flex: 1,
  },
  presetPrice: {
    fontFamily: theme.fonts.mono,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textBody,
    fontWeight: '500',
  },

  helperText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },

  // Totals card
  totalsCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    ...theme.shadow.e1,
  },
  totalsDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  vsBudget: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vsBudgetText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  // Submit bar
  submitBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  submitTotal: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 19,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 1,
  },

  btn: {
    height: 44,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: {
    color: theme.colors.textBody,
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },

  // Sent
  sentRoot: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  sentCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  sentTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: -0.5,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  sentCopy: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 420,
  },
  sentSummaryCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    ...theme.shadow.e1,
    marginVertical: 10,
  },
  sentSummaryLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    flex: 1,
  },
  sentSummaryValue: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  sentSummarySub: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11.5,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
});

// Re-export param list consumer helper so the navigator stays typed.
export type QuoteComposeProps = NativeStackScreenProps<
  RequestsStackParamList,
  'QuoteCompose'
>;

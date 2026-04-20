import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { I } from '@kayu/ui/mobile';
import type {
  CategorySummary,
  CreateJobRequestDtoType,
  JobRequest,
  Quote,
} from '@kayu/schemas';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import type { ClientRequestsStackParamList } from '@/navigation/AppNavigator';

type RequestsNav = NativeStackNavigationProp<
  ClientRequestsStackParamList,
  'RequestsMain'
>;
type DetailNav = NativeStackNavigationProp<
  ClientRequestsStackParamList,
  'RequestDetail'
>;
type DetailRoute = RouteProp<ClientRequestsStackParamList, 'RequestDetail'>;

const STATUS_COPY: Record<string, { label: string; bg: string; color: string }> = {
  OPEN: {
    label: 'Ouverte',
    bg: theme.colors.primarySubtle,
    color: theme.colors.primaryHover,
  },
  MATCHED: {
    label: 'Devis accepte',
    bg: theme.colors.successSubtle,
    color: theme.colors.success,
  },
  CANCELLED: {
    label: 'Annulee',
    bg: theme.colors.dangerSubtle,
    color: theme.colors.danger,
  },
  EXPIRED: {
    label: 'Expiree',
    bg: theme.colors.warningSubtle,
    color: theme.colors.warning,
  },
};

const QUOTE_STATUS_COPY: Record<string, { label: string; bg: string; color: string }> = {
  SENT: {
    label: 'A choisir',
    bg: theme.colors.primarySubtle,
    color: theme.colors.primaryHover,
  },
  ACCEPTED: {
    label: 'Accepte',
    bg: theme.colors.successSubtle,
    color: theme.colors.success,
  },
  DECLINED: {
    label: 'Refuse',
    bg: theme.colors.dangerSubtle,
    color: theme.colors.danger,
  },
  EXPIRED: {
    label: 'Expire',
    bg: theme.colors.warningSubtle,
    color: theme.colors.warning,
  },
};

const WHEN_OPTIONS = [
  "Aujourd'hui",
  'Demain',
  'Cette semaine',
  'Date flexible',
];

const emptyForm = {
  service: '',
  description: '',
  address: '',
  city: 'Kinshasa',
  commune: '',
  whenPref: 'Demain',
  estimatedHours: '',
  budget: '',
  categoryId: '',
  urgent: false,
};

export function ClientRequestsScreen() {
  const navigation = useNavigation<RequestsNav>();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'mine' | 'new'>('mine');
  const [form, setForm] = useState(emptyForm);
  const [refreshing, setRefreshing] = useState(false);

  const requestsQuery = useQuery({
    queryKey: queryKeys.jobRequests.mine,
    queryFn: () => api.jobRequests.mine(),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.categories.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateJobRequestDtoType) =>
      api.jobRequests.create(payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.jobRequests.mine,
      });
      setForm(emptyForm);
      setMode('mine');
      navigation.navigate('RequestDetail', { requestId: result.request.id });
    },
  });

  const categories = (categoriesQuery.data?.categories ?? []) as CategorySummary[];
  const requests = (requestsQuery.data?.requests ?? []) as JobRequest[];

  const canSubmit =
    form.service.trim().length >= 3 &&
    form.description.trim().length >= 10 &&
    form.address.trim().length >= 3 &&
    form.city.trim().length >= 1 &&
    !createMutation.isPending;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([requestsQuery.refetch(), categoriesQuery.refetch()]);
    setRefreshing(false);
  };

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert(
        'Demande incomplete',
        'Ajoutez un service, une description, une adresse et une ville.',
      );
      return;
    }

    const estimatedHours = parsePositiveNumber(form.estimatedHours);
    const budget = parsePositiveInteger(form.budget);
    const payload: CreateJobRequestDtoType = {
      service: form.service.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      whenPref: form.whenPref,
      urgent: form.urgent,
      photoCount: 0,
      ...(form.categoryId ? { categoryId: form.categoryId } : {}),
      ...(form.commune.trim() ? { commune: form.commune.trim() } : {}),
      ...(estimatedHours ? { estimatedHours } : {}),
      ...(budget ? { budget } : {}),
    };

    try {
      await createMutation.mutateAsync(payload);
    } catch (err) {
      Alert.alert('Erreur', errorMessage(err, "La demande n'a pas ete creee."));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes demandes</Text>
        <Text style={styles.subtitle}>
          Decris ton besoin une fois, puis compare les devis recus.
        </Text>
      </View>

      <View style={styles.segment}>
        <SegmentButton active={mode === 'mine'} label="Demandes" onPress={() => setMode('mine')} />
        <SegmentButton active={mode === 'new'} label="Nouvelle" onPress={() => setMode('new')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {mode === 'new' ? (
          <View style={styles.form}>
            <Field
              label="Service"
              value={form.service}
              onChangeText={(value) => update('service', value)}
              placeholder="Ex: Reparer une fuite"
            />
            <Field
              label="Description"
              value={form.description}
              onChangeText={(value) => update('description', value)}
              placeholder="Explique ce qu'il faut faire"
              multiline
              inputStyle={styles.multiline}
            />

            <Text style={styles.fieldLabel}>Categorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <ChoiceChip
                label="Toutes"
                active={!form.categoryId}
                onPress={() => update('categoryId', '')}
              />
              {categories.map((category) => (
                <ChoiceChip
                  key={category.id}
                  label={category.name}
                  active={form.categoryId === category.id}
                  onPress={() => update('categoryId', category.id)}
                />
              ))}
            </ScrollView>

            <Field
              label="Adresse"
              value={form.address}
              onChangeText={(value) => update('address', value)}
              placeholder="Adresse ou repere"
            />
            <View style={styles.row}>
              <Field
                label="Ville"
                value={form.city}
                onChangeText={(value) => update('city', value)}
                placeholder="Kinshasa"
                containerStyle={styles.rowField}
              />
              <Field
                label="Commune"
                value={form.commune}
                onChangeText={(value) => update('commune', value)}
                placeholder="Gombe"
                containerStyle={styles.rowField}
              />
            </View>

            <Text style={styles.fieldLabel}>Quand ?</Text>
            <View style={styles.wrapRow}>
              {WHEN_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option}
                  label={option}
                  active={form.whenPref === option}
                  onPress={() => update('whenPref', option)}
                />
              ))}
            </View>

            <View style={styles.row}>
              <Field
                label="Duree estimee"
                value={form.estimatedHours}
                onChangeText={(value) => update('estimatedHours', value)}
                placeholder="2"
                keyboardType="decimal-pad"
                containerStyle={styles.rowField}
              />
              <Field
                label="Budget CDF"
                value={form.budget}
                onChangeText={(value) => update('budget', value)}
                placeholder="75000"
                keyboardType="number-pad"
                containerStyle={styles.rowField}
              />
            </View>

            <Pressable
              style={[styles.urgentRow, form.urgent && styles.urgentRowActive]}
              onPress={() => update('urgent', !form.urgent)}
            >
              <View style={styles.urgentTextBlock}>
                <Text style={styles.urgentTitle}>Intervention urgente</Text>
                <Text style={styles.urgentText}>
                  Les pros verront cette demande en priorite.
                </Text>
              </View>
              <View style={[styles.checkBox, form.urgent && styles.checkBoxActive]}>
                {form.urgent ? <I.check size={14} color="#FFFFFF" /> : null}
              </View>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
              disabled={!canSubmit}
              onPress={submit}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Envoyer la demande</Text>
                  <I.arrowRight size={16} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        ) : requestsQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <I.inbox size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              Cree une demande pour recevoir plusieurs devis.
            </Text>
            <Pressable style={styles.secondaryButton} onPress={() => setMode('new')}>
              <Text style={styles.secondaryButtonText}>Creer une demande</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onPress={() =>
                  navigation.navigate('RequestDetail', { requestId: request.id })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function ClientRequestDetailScreen() {
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const queryClient = useQueryClient();
  const requestId = route.params.requestId;

  const requestsQuery = useQuery({
    queryKey: queryKeys.jobRequests.mine,
    queryFn: () => api.jobRequests.mine(),
  });

  const quotesQuery = useQuery({
    queryKey: queryKeys.quotes.forJobRequest(requestId),
    queryFn: () => api.quotes.listForJobRequest(requestId),
  });

  const acceptMutation = useMutation({
    mutationFn: (quoteId: string) => api.quotes.accept(quoteId),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.mine }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.quotes.forJobRequest(requestId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() }),
      ]);
      navigation.navigate('BookingDetail', { bookingId: result.booking.id });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (quoteId: string) => api.quotes.decline(quoteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.forJobRequest(requestId),
      });
    },
  });

  const request = (requestsQuery.data?.requests ?? []).find(
    (item) => item.id === requestId,
  ) as JobRequest | undefined;
  const quotes = (quotesQuery.data?.quotes ?? []) as Quote[];
  const sentQuotes = quotes.filter((quote) => quote.status === 'SENT').length;

  const acceptQuote = async (quote: Quote) => {
    if (isExpired(quote)) {
      Alert.alert('Devis expire', 'Demandez au pro de renvoyer un devis.');
      return;
    }
    try {
      await acceptMutation.mutateAsync(quote.id);
    } catch (err) {
      Alert.alert('Erreur', errorMessage(err, "Le devis n'a pas ete accepte."));
    }
  };

  const declineQuote = async (quote: Quote) => {
    try {
      await declineMutation.mutateAsync(quote.id);
    } catch (err) {
      Alert.alert('Erreur', errorMessage(err, "Le devis n'a pas ete refuse."));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.detailHeader}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <I.arrowLeft size={18} color={theme.colors.textBody} />
        </Pressable>
        <View style={styles.detailTitleBlock}>
          <Text style={styles.title}>Demande</Text>
          <Text style={styles.subtitle}>
            {sentQuotes > 0
              ? `${sentQuotes} devis a comparer`
              : 'Les devis recus apparaitront ici.'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={requestsQuery.isRefetching || quotesQuery.isRefetching}
            onRefresh={() => {
              requestsQuery.refetch();
              quotesQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {requestsQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : !request ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Demande introuvable</Text>
            <Text style={styles.emptyText}>
              Elle a peut-etre ete supprimee ou annulee.
            </Text>
          </View>
        ) : (
          <>
            <RequestSummary request={request} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Devis recus</Text>
              {quotesQuery.isFetching ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : null}
            </View>

            {quotes.length === 0 ? (
              <View style={styles.emptyQuotes}>
                <Text style={styles.emptyTitle}>Aucun devis pour le moment</Text>
                <Text style={styles.emptyText}>
                  Les pros selectionnes peuvent encore repondre.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {quotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    accepting={acceptMutation.isPending}
                    declining={declineMutation.isPending}
                    onAccept={() => acceptQuote(quote)}
                    onDecline={() => declineQuote(quote)}
                    onOpenBooking={() =>
                      quote.bookingId
                        ? navigation.navigate('BookingDetail', {
                            bookingId: quote.bookingId,
                          })
                        : undefined
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function RequestCard({
  request,
  onPress,
}: {
  request: JobRequest;
  onPress: () => void;
}) {
  const status = STATUS_COPY[request.status] ?? STATUS_COPY.OPEN;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{request.service}</Text>
          <Text style={styles.meta}>{formatDate(request.createdAt)}</Text>
        </View>
        <Badge label={status.label} bg={status.bg} color={status.color} />
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {request.description}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{request.city}</Text>
        <Text style={styles.dot}>.</Text>
        <Text style={styles.meta}>{request.whenPref}</Text>
        {request.budget ? (
          <>
            <Text style={styles.dot}>.</Text>
            <Text style={styles.meta}>{formatMoney(request.budget)}</Text>
          </>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          {request.competingCount > 0
            ? `${request.competingCount} pros contactes`
            : 'Recherche de pros en cours'}
        </Text>
        <I.chevronRight size={16} color={theme.colors.textSubtle} />
      </View>
    </Pressable>
  );
}

function RequestSummary({ request }: { request: JobRequest }) {
  const status = STATUS_COPY[request.status] ?? STATUS_COPY.OPEN;
  return (
    <View style={styles.summary}>
      <View style={styles.cardTop}>
        <Text style={styles.summaryTitle}>{request.service}</Text>
        <Badge label={status.label} bg={status.bg} color={status.color} />
      </View>
      <Text style={styles.description}>{request.description}</Text>
      <View style={styles.summaryGrid}>
        <Info label="Lieu" value={`${request.address}, ${request.city}`} />
        <Info label="Quand" value={request.whenPref} />
        <Info
          label="Budget"
          value={request.budget ? formatMoney(request.budget) : 'A definir'}
        />
        <Info
          label="Pros"
          value={`${request.competingCount} contactes`}
        />
      </View>
    </View>
  );
}

function QuoteCard({
  quote,
  accepting,
  declining,
  onAccept,
  onDecline,
  onOpenBooking,
}: {
  quote: Quote;
  accepting: boolean;
  declining: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onOpenBooking: () => void;
}) {
  const expired = isExpired(quote);
  const statusKey = expired && quote.status === 'SENT' ? 'EXPIRED' : quote.status;
  const status = QUOTE_STATUS_COPY[statusKey] ?? QUOTE_STATUS_COPY.SENT;
  const proName =
    `${quote.provider?.user.firstName ?? ''} ${quote.provider?.user.lastName ?? ''}`.trim() ||
    'Prestataire';
  const canAct = quote.status === 'SENT' && !expired;

  return (
    <View style={styles.quoteCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{proName}</Text>
          <Text style={styles.meta}>{quote.provider?.profession ?? 'Pro verifie'}</Text>
        </View>
        <Badge label={status.label} bg={status.bg} color={status.color} />
      </View>
      <Text style={styles.quoteMessage}>{quote.message}</Text>

      <View style={styles.lines}>
        {quote.lines.map((line) => (
          <View key={line.id} style={styles.lineItem}>
            <Text style={styles.lineLabel}>
              {line.label} x {line.qty}
            </Text>
            <Text style={styles.linePrice}>
              {formatMoney(line.qty * line.unitPrice)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatMoney(quote.total)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          Expire {quote.expiresAt ? formatDate(quote.expiresAt) : 'sans date'}
        </Text>
        <Text style={styles.dot}>.</Text>
        <Text style={styles.meta}>{startDateLabel(quote.startDateKind)}</Text>
      </View>

      {quote.bookingId ? (
        <Pressable style={styles.primaryButton} onPress={onOpenBooking}>
          <Text style={styles.primaryButtonText}>Voir la reservation</Text>
          <I.arrowRight size={16} color="#FFFFFF" />
        </Pressable>
      ) : canAct ? (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.declineButton, declining && styles.buttonDisabled]}
            disabled={declining || accepting}
            onPress={onDecline}
          >
            <Text style={styles.declineButtonText}>Refuser</Text>
          </Pressable>
          <Pressable
            style={[styles.acceptButton, accepting && styles.buttonDisabled]}
            disabled={accepting || declining}
            onPress={onAccept}
          >
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.choiceChip, active && styles.choiceChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  containerStyle,
  inputStyle,
  ...props
}: {
  label: string;
  containerStyle?: object;
  inputStyle?: object;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textSubtle}
        style={[styles.input, inputStyle]}
        {...props}
      />
    </View>
  );
}

function Badge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value.replace(/\s/g, ''));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} CDF`;
}

function formatDate(value: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function isExpired(quote: Quote) {
  if (quote.status === 'EXPIRED') return true;
  if (!quote.expiresAt || quote.status !== 'SENT') return false;
  const date = quote.expiresAt instanceof Date ? quote.expiresAt : new Date(quote.expiresAt);
  return date.getTime() <= Date.now();
}

function startDateLabel(value: string) {
  if (value === 'today') return "Aujourd'hui";
  if (value === 'tomorrow') return 'Demain';
  if (value === 'this_week' || value === 'week') return 'Cette semaine';
  return value;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailTitleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentButton: {
    flex: 1,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.textPrimary,
  },
  segmentText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  multiline: {
    minHeight: 106,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  choiceText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  choiceTextActive: {
    color: theme.colors.primaryHover,
  },
  urgentRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
  },
  urgentRowActive: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warningSubtle,
  },
  urgentTextBlock: {
    flex: 1,
  },
  urgentTitle: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  urgentText: {
    marginTop: 3,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkBoxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: theme.colors.primaryHover,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  loading: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyQuotes: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 20,
    gap: 8,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySubtle,
  },
  emptyTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textBody,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  meta: {
    fontFamily: theme.fonts.body,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },
  dot: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  footerText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 12,
  },
  summary: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    gap: 12,
  },
  summaryTitle: {
    flex: 1,
    fontFamily: theme.fonts.displayMed,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoBox: {
    width: '47%',
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: theme.colors.bg,
    padding: 10,
    gap: 5,
  },
  infoLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    color: theme.colors.textSubtle,
  },
  infoValue: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textPrimary,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  quoteCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    gap: 12,
  },
  quoteMessage: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textBody,
  },
  lines: {
    gap: 8,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineLabel: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  linePrice: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: theme.colors.textBody,
  },
  totalValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  declineButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: theme.colors.textBody,
  },
  acceptButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

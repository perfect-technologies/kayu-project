import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import type { FinalOffer, Message } from '@kayu/schemas';
import { Avatar, ErrorState, I } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'Chat'>;
type Route = RouteProp<MessagesStackParamList, 'Chat'>;

const SUGGESTED_REPLIES = [
  'Merci beaucoup !',
  "Pouvez-vous m'envoyer une offre finale ?",
  'À quelle heure serez-vous disponible ?',
  'Ça marche pour moi.',
];

type MessagesQueryData = { success?: boolean; messages: Message[] };

function formatBubbleTime(iso?: string | Date | null) {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatOfferDate(iso?: string | Date | null) {
  if (!iso) return 'Date à confirmer';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date à confirmer';
  return d
    .toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' ·');
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return 'Durée à confirmer';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

function defaultOfferDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { conversationId, recipientId, recipientName } = route.params;

  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [draft, setDraft] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDuration, setOfferDuration] = useState('2');
  const [offerAddress, setOfferAddress] = useState('');
  const [offerDate, setOfferDate] = useState(defaultOfferDate);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  const {
    data: msgData,
    isLoading,
    error,
    refetch,
  } = useQuery<MessagesQueryData>({
    queryKey: queryKeys.messages.conversation(currentConversationId ?? ''),
    queryFn: () => api.messages.getMessages(currentConversationId!) as Promise<MessagesQueryData>,
    enabled: !!currentConversationId,
    refetchInterval: 5_000,
  });

  const messages = useMemo<Message[]>(() => msgData?.messages ?? [], [msgData]);

  const providerDashboard = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => api.dashboard.getProviderDashboard(),
    enabled: user?.role === 'PROVIDER',
  });

  const finalOffersQuery = useQuery({
    queryKey: currentConversationId
      ? queryKeys.finalOffers.all({ conversationId: currentConversationId })
      : ['finalOffers', 'disabled', recipientId],
    queryFn: () =>
      api.finalOffers.getAll({
        conversationId: currentConversationId!,
        limit: 10,
      }),
    enabled: !!currentConversationId,
    refetchInterval: 5_000,
  });

  const finalOffers = useMemo<FinalOffer[]>(
    () => finalOffersQuery.data?.finalOffers ?? [],
    [finalOffersQuery.data],
  );
  const pendingOffer = finalOffers.find((offer) => offer.status === 'PENDING') ?? null;

  useEffect(() => {
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: false }),
      30,
    );
    return () => clearTimeout(id);
  }, [messages.length]);

  const sendMut = useMutation({
    mutationFn: (text: string) =>
      api.messages.send({ recipientId, content: text, type: 'TEXT' }),
    onMutate: async (text) => {
      if (!currentConversationId || !user) return {};
      const key = queryKeys.messages.conversation(currentConversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<MessagesQueryData>(key);
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: currentConversationId,
        senderId: user.id,
        type: 'TEXT',
        content: text,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<MessagesQueryData>(key, (old) => {
        if (!old) return { success: true, messages: [optimistic] };
        return { ...old, messages: [...old.messages, optimistic] };
      });
      return { prev, key, conversationId: currentConversationId };
    },
    onSuccess: (result) => {
      const nextConversationId = result.conversationId ?? result.message?.conversationId;
      if (!nextConversationId) return;

      if (nextConversationId !== currentConversationId) {
        setCurrentConversationId(nextConversationId);
        navigation.setParams({ conversationId: nextConversationId });
      }

      if (result.message) {
        const key = queryKeys.messages.conversation(nextConversationId);
        queryClient.setQueryData<MessagesQueryData>(key, (old) => {
          const messages = old?.messages ?? [];
          if (messages.some((message) => message.id === result.message.id)) {
            return old ?? { success: true, messages };
          }

          const withoutMatchingOptimistic = messages.filter(
            (message) =>
              !(
                message.id.startsWith('optimistic-') &&
                message.content === result.message.content &&
                message.senderId === result.message.senderId
              ),
          );

          return {
            success: true,
            messages: [...withoutMatchingOptimistic, result.message],
          };
        });
      }
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.key && ctx.prev) {
        queryClient.setQueryData(ctx.key, ctx.prev);
      }
    },
    onSettled: (result, _error, _text, ctx) => {
      const settledConversationId =
        result?.conversationId ?? result?.message?.conversationId ?? ctx?.conversationId;
      if (settledConversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversation(settledConversationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: async () => {
      const providerId = providerDashboard.data?.provider.id;
      const price = Number(offerPrice.replace(/\s/g, '').replace(',', '.'));
      const durationHours = Number(offerDuration.replace(',', '.'));

      if (!providerId) {
        throw new Error('Profil prestataire introuvable.');
      }
      if (!currentConversationId) {
        throw new Error('Envoyez un message avant de créer une offre finale.');
      }
      if (!offerTitle.trim()) {
        throw new Error('Ajoutez un titre de service.');
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Ajoutez un prix valide.');
      }
      if (!Number.isFinite(durationHours) || durationHours <= 0) {
        throw new Error('Ajoutez une durée valide.');
      }

      return api.finalOffers.create({
        providerId,
        clientId: recipientId,
        conversationId: currentConversationId,
        title: offerTitle.trim(),
        description: offerDescription.trim() || undefined,
        price,
        duration: Math.round(durationHours * 60),
        scheduledDate: offerDate,
        address: offerAddress.trim() || undefined,
        paymentMethod: 'cash',
      });
    },
    onSuccess: async (result) => {
      setOfferOpen(false);
      setOfferTitle('');
      setOfferDescription('');
      setOfferPrice('');
      setOfferDuration('2');
      setOfferAddress('');
      setOfferDate(defaultOfferDate());
      await sendMut.mutateAsync(
        `Offre finale envoyée : ${result.finalOffer.title} · ${result.finalOffer.price.toLocaleString('fr-FR')} FC · paiement en espèces à la fin de la mission.`,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.finalOffers.all({ conversationId: currentConversationId }),
      });
    },
    onError: (err: Error) => {
      Alert.alert('Offre finale impossible', err.message);
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: (offerId: string) => api.finalOffers.accept(offerId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.finalOffers.all({ conversationId: currentConversationId }),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.setQueryData(queryKeys.bookings.detail(result.booking.id), {
        success: true,
        booking: result.booking,
      });
      const parent = navigation.getParent();
      (parent as unknown as { navigate: (tab: string, params: object) => void } | undefined)?.navigate(
        'Bookings',
        {
          screen: 'BookingDetail',
          params: { bookingId: result.booking.id },
        },
      );
    },
    onError: (err: Error) => {
      Alert.alert('Action impossible', err.message);
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: (offerId: string) => api.finalOffers.decline(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.finalOffers.all({ conversationId: currentConversationId }),
      });
      send('Je préfère continuer la discussion avant de valider.');
    },
    onError: (err: Error) => {
      Alert.alert('Action impossible', err.message);
    },
  });

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !sendMut.isPending;

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    sendMut.mutate(t);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <I.arrowLeft size={22} color={theme.colors.textBody} />
        </Pressable>
        <View style={styles.headerIdentity}>
          <Avatar name={recipientName} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.headerName}>
              {recipientName}
            </Text>
          </View>
        </View>
        <Pressable style={styles.callButton} accessibilityLabel="Appeler">
          <I.phone size={18} color={theme.colors.primaryHover} />
        </Pressable>
      </View>

      {/* Messages */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : error && messages.length === 0 ? (
        <View style={{ flex: 1 }}>
          <ErrorState
            title="Erreur de chargement"
            subtitle="Impossible de récupérer les messages."
            cta={{ label: 'Réessayer', onPress: () => refetch() }}
          />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <Text style={styles.emptyChat}>
              Envoyez le premier message pour démarrer la conversation.
            </Text>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} m={m} myId={user?.id ?? null} />
            ))
          )}
          {pendingOffer ? (
            <FinalOfferCard
              offer={pendingOffer}
              isClient={user?.role !== 'PROVIDER'}
              busy={acceptOfferMutation.isPending || declineOfferMutation.isPending}
              onAccept={() => acceptOfferMutation.mutate(pendingOffer.id)}
              onDecline={() => declineOfferMutation.mutate(pendingOffer.id)}
              onDiscuss={() => setDraft('Discutons encore de cette offre finale.')}
            />
          ) : null}
          {user?.role === 'PROVIDER' && offerOpen ? (
            <FinalOfferForm
              title={offerTitle}
              description={offerDescription}
              price={offerPrice}
              duration={offerDuration}
              address={offerAddress}
              date={offerDate}
              busy={createOfferMutation.isPending || sendMut.isPending}
              onChangeTitle={setOfferTitle}
              onChangeDescription={setOfferDescription}
              onChangePrice={setOfferPrice}
              onChangeDuration={setOfferDuration}
              onChangeAddress={setOfferAddress}
              onShiftDate={(days) => {
                const next = new Date(offerDate);
                next.setDate(next.getDate() + days);
                setOfferDate(next);
              }}
              onSubmit={() => createOfferMutation.mutate()}
              onCancel={() => setOfferOpen(false)}
            />
          ) : null}
        </ScrollView>
      )}

      {/* Suggested replies */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestedRow}
        style={styles.suggestedScroll}
      >
        {SUGGESTED_REPLIES.map((s) => (
          <Pressable
            key={s}
            onPress={() => send(s)}
            disabled={sendMut.isPending}
            style={[styles.suggestedPill, sendMut.isPending && { opacity: 0.6 }]}
          >
            <Text style={styles.suggestedText}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer */}
      <View
        style={[
          styles.composer,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <Pressable
          style={styles.attachButton}
          accessibilityLabel={user?.role === 'PROVIDER' ? 'Créer une offre finale' : 'Joindre'}
          onPress={() => {
            if (user?.role === 'PROVIDER') setOfferOpen((open) => !open);
          }}
        >
          <I.plus
            size={18}
            color={user?.role === 'PROVIDER' ? theme.colors.primaryHover : theme.colors.textMuted}
          />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Écrire un message…"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => send(draft)}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={() => send(draft)}
          disabled={!canSend}
          accessibilityLabel="Envoyer"
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        >
          <I.send size={17} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function FinalOfferCard({
  offer,
  isClient,
  busy,
  onAccept,
  onDecline,
  onDiscuss,
}: {
  offer: FinalOffer;
  isClient: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onDiscuss: () => void;
}) {
  return (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.offerIcon}>
          <I.fileText size={16} color={theme.colors.primaryHover} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.offerOverline}>Offre finale</Text>
          <Text style={styles.offerTitle}>{offer.title}</Text>
        </View>
        <Text style={styles.offerPrice}>
          {offer.price.toLocaleString('fr-FR')} FC
        </Text>
      </View>
      {offer.description ? (
        <Text style={styles.offerBody}>{offer.description}</Text>
      ) : null}
      <View style={styles.offerMetaGrid}>
        <Text style={styles.offerMeta}>{formatOfferDate(offer.scheduledDate)}</Text>
        <Text style={styles.offerMeta}>{formatDuration(offer.duration)}</Text>
        <Text style={styles.offerMeta}>{offer.address || 'Adresse à confirmer'}</Text>
        <Text style={styles.offerMeta}>Paiement en espèces à la fin de la mission</Text>
      </View>
      {isClient ? (
        <View style={styles.offerActions}>
          <Pressable
            style={[styles.offerSecondaryButton, { flex: 1 }]}
            disabled={busy}
            onPress={onDecline}
          >
            <Text style={styles.offerSecondaryText}>Décliner</Text>
          </Pressable>
          <Pressable
            style={[styles.offerSecondaryButton, { flex: 1.3 }]}
            disabled={busy}
            onPress={onDiscuss}
          >
            <Text style={styles.offerSecondaryText}>Discuter</Text>
          </Pressable>
          <Pressable
            style={[styles.offerPrimaryButton, { flex: 1 }]}
            disabled={busy}
            onPress={onAccept}
          >
            <Text style={styles.offerPrimaryText}>Accepter</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.offerWaiting}>En attente de réponse client.</Text>
      )}
    </View>
  );
}

function FinalOfferForm({
  title,
  description,
  price,
  duration,
  address,
  date,
  busy,
  onChangeTitle,
  onChangeDescription,
  onChangePrice,
  onChangeDuration,
  onChangeAddress,
  onShiftDate,
  onSubmit,
  onCancel,
}: {
  title: string;
  description: string;
  price: string;
  duration: string;
  address: string;
  date: Date;
  busy: boolean;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangePrice: (value: string) => void;
  onChangeDuration: (value: string) => void;
  onChangeAddress: (value: string) => void;
  onShiftDate: (days: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.offerForm}>
      <View style={styles.offerHeader}>
        <View style={styles.offerIcon}>
          <I.fileText size={16} color={theme.colors.primaryHover} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.offerOverline}>Offre finale</Text>
          <Text style={styles.offerTitle}>Confirmer l'accord discuté</Text>
        </View>
      </View>
      <TextInput
        value={title}
        onChangeText={onChangeTitle}
        placeholder="Service"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.offerInput}
      />
      <TextInput
        value={description}
        onChangeText={onChangeDescription}
        placeholder="Description"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.offerInput, styles.offerMultiline]}
        multiline
      />
      <View style={styles.offerInputRow}>
        <TextInput
          value={price}
          onChangeText={onChangePrice}
          placeholder="Prix FC"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={[styles.offerInput, { flex: 1 }]}
        />
        <TextInput
          value={duration}
          onChangeText={onChangeDuration}
          placeholder="Durée h"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={[styles.offerInput, { flex: 1 }]}
        />
      </View>
      <TextInput
        value={address}
        onChangeText={onChangeAddress}
        placeholder="Adresse"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.offerInput}
      />
      <View style={styles.offerDateRow}>
        <Pressable style={styles.offerDateButton} onPress={() => onShiftDate(-1)}>
          <I.arrowLeft size={14} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.offerDateText}>{formatOfferDate(date)}</Text>
        <Pressable style={styles.offerDateButton} onPress={() => onShiftDate(1)}>
          <I.arrowRight size={14} color={theme.colors.textPrimary} />
        </Pressable>
      </View>
      <Text style={styles.offerCashCopy}>
        Paiement en espèces à la fin de la mission.
      </Text>
      <View style={styles.offerActions}>
        <Pressable
          style={[styles.offerSecondaryButton, { flex: 1 }]}
          disabled={busy}
          onPress={onCancel}
        >
          <Text style={styles.offerSecondaryText}>Annuler</Text>
        </Pressable>
        <Pressable
          style={[styles.offerPrimaryButton, { flex: 1.4 }]}
          disabled={busy}
          onPress={onSubmit}
        >
          <Text style={styles.offerPrimaryText}>
            {busy ? 'Envoi...' : 'Envoyer'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MessageBubble({ m, myId }: { m: Message; myId: string | null }) {
  const isMe = !!myId && m.senderId === myId;
  const at = formatBubbleTime(m.createdAt);

  return (
    <View style={[styles.bubbleRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePro]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{m.content}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{at}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerName: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyChat: {
    marginTop: 40,
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    paddingHorizontal: 24,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  bubblePro: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  bubbleText: {
    fontFamily: theme.fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: theme.colors.textPrimary,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTime: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
    color: theme.colors.textSubtle,
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  offerCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  offerForm: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primarySubtle,
    gap: 10,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySubtle,
  },
  offerOverline: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  offerTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  offerPrice: {
    fontFamily: theme.fonts.mono,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  offerBody: {
    fontFamily: theme.fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.textBody,
  },
  offerMetaGrid: {
    gap: 4,
  },
  offerMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },
  offerWaiting: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    color: theme.colors.primaryHover,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  offerPrimaryButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  offerPrimaryText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  offerSecondaryButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  offerSecondaryText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  offerInput: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  offerMultiline: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  offerInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  offerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerDateButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerDateText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  offerCashCopy: {
    fontFamily: theme.fonts.body,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },
  suggestedScroll: {
    flexGrow: 0,
    backgroundColor: theme.colors.bg,
  },
  suggestedRow: {
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  suggestedPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  suggestedText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: theme.colors.bg,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.fonts.body,
    fontSize: 14.5,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});

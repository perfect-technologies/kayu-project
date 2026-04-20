import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import type { Message } from '@kayu/schemas';
import { Avatar, ErrorState, I } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'Chat'>;
type Route = RouteProp<MessagesStackParamList, 'Chat'>;

const SUGGESTED_REPLIES = [
  'Merci beaucoup !',
  "Pouvez-vous m'envoyer un devis ?",
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

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { conversationId, recipientId, recipientName } = route.params;

  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [draft, setDraft] = useState('');
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
        <Pressable style={styles.attachButton} accessibilityLabel="Joindre">
          <I.plus size={18} color={theme.colors.textMuted} />
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';
import {
  DEMO_THREADS,
  SUGGESTED_REPLIES,
  type DemoMsg,
  type DemoThread,
} from './fixtures';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'Chat'>;
type Route = RouteProp<MessagesStackParamList, 'Chat'>;

function buildFallbackThread(
  providerId: string,
  providerName: string,
): DemoThread {
  const initials = providerName
    .split(/\s+/)
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return {
    id: `fallback-${providerId}`,
    providerId,
    providerName,
    profession: 'Professionnel',
    avatarBg: theme.colors.primary,
    initials,
    online: false,
    unread: 0,
    lastAt: '',
    status: 'quote',
    preview: '',
    messages: [],
  };
}

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const initialThread = useMemo<DemoThread>(() => {
    const found = DEMO_THREADS.find(
      (t) =>
        t.id === route.params.conversationId ||
        t.providerId === route.params.recipientId,
    );
    return found ?? buildFallbackThread(route.params.recipientId, route.params.recipientName);
  }, [route.params]);

  const [messages, setMessages] = useState<DemoMsg[]>(initialThread.messages);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: false }),
      10,
    );
    return () => clearTimeout(id);
  }, [messages.length]);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0;

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((prev) => [
      ...prev,
      { id: `x${prev.length + 1}`, from: 'me', text: t, at: 'maintenant' },
    ]);
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
          <Avatar
            name={initialThread.providerName}
            bg={initialThread.avatarBg}
            size={40}
            initials={initialThread.initials}
            online={initialThread.online}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.headerName}>
              {initialThread.providerName}
            </Text>
            <Text
              style={[
                styles.headerPresence,
                { color: initialThread.online ? theme.colors.success : theme.colors.textMuted },
              ]}
            >
              {initialThread.online ? 'En ligne' : 'Vu il y a 20 min'}
            </Text>
          </View>
        </View>
        <Pressable style={styles.callButton} accessibilityLabel="Appeler">
          <I.phone size={18} color={theme.colors.primaryHover} />
        </Pressable>
      </View>

      {/* Mission banner */}
      {initialThread.status === 'active' && (
        <View style={styles.missionBanner}>
          <I.calendar size={14} color={theme.colors.primaryHover} />
          <Text style={styles.missionText} numberOfLines={1}>
            {initialThread.missionSummary ?? 'Mission en cours'}
          </Text>
          {initialThread.missionBookingId && (
            <Pressable hitSlop={8}>
              <Text style={styles.missionLink}>Voir</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </ScrollView>

      {/* Suggested replies */}
      {initialThread.status === 'active' && (
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
              style={styles.suggestedPill}
            >
              <Text style={styles.suggestedText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

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
          style={[
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
          ]}
        >
          <I.send size={17} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ m }: { m: DemoMsg }) {
  if (m.from === 'system') {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemPill}>
          <I.check size={13} color="#047857" />
          <Text style={styles.systemText}>{m.text}</Text>
        </View>
      </View>
    );
  }

  const isMe = m.from === 'me';
  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isMe ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubblePro,
        ]}
      >
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
          {m.text}
        </Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {m.at}
        </Text>
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
  headerPresence: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 1,
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
  missionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  missionText: {
    flex: 1,
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primaryHover,
  },
  missionLink: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primaryHover,
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
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
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.successSubtle,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  systemText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#047857',
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

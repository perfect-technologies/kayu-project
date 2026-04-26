import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import type { Conversation, UserSummary } from '@kayu/schemas';
import { Avatar, EmptyState, ErrorState } from '@kayu/ui/mobile';
import { Inbox as InboxIcon } from 'lucide-react-native';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'ConversationsMain'>;

type FilterKey = 'all' | 'unread' | 'active';

const FILTERS: { k: FilterKey; label: string }[] = [
  { k: 'all', label: 'Tous' },
  { k: 'unread', label: 'Non lus' },
  { k: 'active', label: 'Actives' },
];

function getOtherName(u?: UserSummary | null) {
  if (!u) return 'Utilisateur';
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return full || 'Utilisateur';
}

function formatListTime(iso?: string | Date | null) {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'hier';
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function ConversationsScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.messages.conversations(),
    queryFn: () => api.messages.getConversations(),
    refetchInterval: 15_000,
  });

  const conversations = useMemo<Conversation[]>(
    () => ((data?.conversations ?? []) as Conversation[]),
    [data],
  );

  const filtered = useMemo(
    () =>
      conversations.filter((c) => {
        const unread = c.unreadCount ?? 0;
        if (filter === 'unread' && unread === 0) return false;
        // "En cours" without backend status: fall back to threads with unread
        if (filter === 'active' && unread === 0) return false;
        return true;
      }),
    [conversations, filter],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const is = filter === f.k;
            return (
              <Pressable
                key={f.k}
                onPress={() => setFilter(f.k)}
                style={[styles.filterPill, is && styles.filterPillActive]}
              >
                <Text style={[styles.filterLabel, is && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : error ? (
        <ErrorState
          title="Erreur de chargement"
          subtitle="Impossible de récupérer vos conversations."
          cta={{ label: 'Réessayer', onPress: () => refetch() }}
        />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Aucun message"
          subtitle="Tes échanges avec les pros apparaîtront ici."
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>Aucune conversation ne correspond.</Text>
          ) : (
            filtered.map((c) => (
              <ThreadListItem
                key={c.id}
                conversation={c}
                onPress={() =>
                  c.otherUser?.id
                    ? navigation.navigate('Chat', {
                        conversationId: c.id,
                        recipientId: c.otherUser.id,
                        recipientName: getOtherName(c.otherUser),
                      })
                    : undefined
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ThreadListItem({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const name = getOtherName(conversation.otherUser);
  const unread = conversation.unreadCount ?? 0;
  const preview = conversation.lastMessage?.content ?? '';
  const lastAt = formatListTime(conversation.lastMessageAt);

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Avatar name={name} size={44} src={conversation.otherUser?.avatar ?? undefined} />
      <View style={styles.itemBody}>
        <View style={styles.itemRow}>
          <Text numberOfLines={1} style={styles.itemName}>
            {name}
          </Text>
          <Text style={styles.itemTime}>{lastAt}</Text>
        </View>
        <Text
          numberOfLines={2}
          style={[styles.itemPreview, unread > 0 && styles.itemPreviewUnread]}
        >
          {preview || '—'}
        </Text>
        {unread > 0 && (
          <View style={styles.itemChipRow}>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unread}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
    backgroundColor: theme.colors.bg,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: theme.colors.textPrimary,
  },
  filters: {
    gap: 8,
    paddingVertical: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  } as ViewStyle,
  filterPillActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  filterLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textBody,
  } as TextStyle,
  filterLabelActive: {
    color: '#fff',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyText: {
    paddingVertical: 40,
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontFamily: theme.fonts.displayMed,
    fontSize: 14.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemTime: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  itemPreview: {
    marginTop: 4,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },
  itemPreviewUnread: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bodyMed,
    fontWeight: '500',
  },
  itemChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  unreadBadge: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '700',
  },
});

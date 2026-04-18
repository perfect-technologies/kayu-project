import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';
import { DEMO_THREADS, type DemoThread, type ThreadStatus } from './fixtures';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'ConversationsMain'>;

type FilterKey = 'all' | 'unread' | 'active';

const FILTERS: { k: FilterKey; label: string }[] = [
  { k: 'all', label: 'Tous' },
  { k: 'unread', label: 'Non lus' },
  { k: 'active', label: 'En cours' },
];

const STATUS_STYLE: Record<
  ThreadStatus,
  { label: string; bg: string; color: string; border?: string }
> = {
  active: {
    label: 'Mission en cours',
    bg: theme.colors.successSubtle,
    color: '#047857',
  },
  quote: {
    label: 'Devis en attente',
    bg: theme.colors.warningSubtle,
    color: '#B45309',
  },
  completed: {
    label: 'Terminé',
    bg: theme.colors.surfaceMuted,
    color: theme.colors.textBody,
  },
};

export function ConversationsScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<FilterKey>('all');

  const threads = useMemo(
    () =>
      DEMO_THREADS.filter((t) => {
        if (filter === 'unread') return t.unread > 0;
        if (filter === 'active') return t.status === 'active';
        return true;
      }),
    [filter],
  );

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
                <Text
                  style={[
                    styles.filterLabel,
                    is && styles.filterLabelActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {threads.length === 0 ? (
          <Text style={styles.emptyText}>Aucune conversation ne correspond.</Text>
        ) : (
          threads.map((t) => (
            <ThreadListItem
              key={t.id}
              thread={t}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: t.id,
                  recipientId: t.providerId,
                  recipientName: t.providerName,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ThreadListItem({
  thread,
  onPress,
}: {
  thread: DemoThread;
  onPress: () => void;
}) {
  const status = STATUS_STYLE[thread.status];
  const hasUnread = thread.unread > 0;

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Avatar
        name={thread.providerName}
        bg={thread.avatarBg}
        size={44}
        initials={thread.initials}
        online={thread.online}
      />
      <View style={styles.itemBody}>
        <View style={styles.itemRow}>
          <Text numberOfLines={1} style={styles.itemName}>
            {thread.providerName}
          </Text>
          <Text style={styles.itemTime}>{thread.lastAt}</Text>
        </View>
        <Text style={styles.itemProfession}>{thread.profession}</Text>
        <Text
          numberOfLines={2}
          style={[
            styles.itemPreview,
            hasUnread && styles.itemPreviewUnread,
          ]}
        >
          {thread.preview}
        </Text>
        <View style={styles.itemChipRow}>
          <View
            style={[styles.statusChip, { backgroundColor: status.bg }]}
          >
            <Text style={[styles.statusChipText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{thread.unread}</Text>
            </View>
          )}
        </View>
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
  itemProfession: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
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
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusChipText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
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

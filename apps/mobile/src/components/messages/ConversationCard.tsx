import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';
import { formatRelativeTime } from '@kayu/utils';

interface ConversationCardProps {
  conversation: {
    id: string;
    otherUser?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
    } | null;
    lastMessage?: {
      content: string;
      createdAt: string;
    } | null;
    unreadCount: number;
  };
  onPress: () => void;
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const otherUser = conversation.otherUser;
  const name =
    [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(' ') || 'Utilisateur';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color={colors.primary.DEFAULT} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
            {name}
          </Text>
          {conversation.lastMessage && (
            <Text style={styles.time}>
              {formatRelativeTime(String(conversation.lastMessage.createdAt))}
            </Text>
          )}
        </View>
        {conversation.lastMessage && (
          <Text
            style={[styles.preview, hasUnread && styles.previewBold]}
            numberOfLines={1}
          >
            {conversation.lastMessage.content}
          </Text>
        )}
      </View>

      {hasUnread && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSizes.md,
    color: colors.text.primary,
    flex: 1,
  },
  nameBold: {
    fontWeight: fontWeights.semibold,
  },
  time: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  preview: {
    fontSize: fontSizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  previewBold: {
    color: colors.text.primary,
    fontWeight: fontWeights.medium,
  },
  unreadBadge: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.text.inverse,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';
interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMine: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function MessageBubble({ content, createdAt, isMine }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.text, isMine ? styles.textMine : styles.textOther]}>
          {content}
        </Text>
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
          {formatTime(createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    backgroundColor: colors.primary.DEFAULT,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  textMine: {
    color: colors.text.inverse,
  },
  textOther: {
    color: colors.text.primary,
  },
  time: {
    fontSize: fontSizes.xs,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMine: {
    color: colors.primary[200],
  },
  timeOther: {
    color: colors.text.tertiary,
  },
});

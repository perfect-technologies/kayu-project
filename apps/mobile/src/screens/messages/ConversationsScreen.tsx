import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import { ConversationCard } from '@/components/messages/ConversationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'ConversationsMain'>;

export function ConversationsScreen() {
  const navigation = useNavigation<Nav>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.messages.conversations(),
    queryFn: () => api.messages.getConversations(),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const conversations = data?.conversations ?? [];

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <FlatList
      style={styles.container}
      data={conversations}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.DEFAULT}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="chatbubbles-outline"
          title="Aucune conversation"
          message="Vos messages apparaîtront ici"
        />
      }
      renderItem={({ item }) => {
        const otherUser = item.otherUser ?? item.user2 ?? item.user1;
        const recipientName =
          [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(' ') || 'Utilisateur';

        return (
          <ConversationCard
            conversation={{
              id: item.id,
              otherUser: otherUser ?? undefined,
              lastMessage: item.lastMessage
                ? { content: item.lastMessage.content, createdAt: String(item.lastMessage.createdAt) }
                : undefined,
              unreadCount: item.unreadCount,
            }}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: item.id,
                recipientId: otherUser?.id ?? '',
                recipientName,
              })
            }
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

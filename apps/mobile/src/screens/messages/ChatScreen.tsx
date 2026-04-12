import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { ChatInput } from '@/components/messages/ChatInput';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import type { MessagesStackParamList } from '@/navigation/AppNavigator';

type Route = RouteProp<MessagesStackParamList, 'Chat'>;

export function ChatScreen() {
  const { params } = useRoute<Route>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Track conversation ID locally — starts from params, but can be discovered
  // after the first message is sent when opening chat from a provider profile.
  const [activeConversationId, setActiveConversationId] = useState(
    params.conversationId,
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.messages.conversation(
      activeConversationId ?? `pending-${params.recipientId}`,
    ),
    queryFn: () => api.messages.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
    refetchInterval: activeConversationId ? 10000 : false,
  });

  // After sending a message when there was no conversation yet, we discover the
  // conversation by fetching the conversation list and finding the one with
  // the recipient.
  const discoverConversation = useCallback(async () => {
    if (activeConversationId) return;
    try {
      const result = await api.messages.getConversations();
      const match = result.conversations.find(
        (c) =>
          c.otherUser?.id === params.recipientId ||
          c.user1?.id === params.recipientId ||
          c.user2?.id === params.recipientId,
      );
      if (match) {
        setActiveConversationId(match.id);
      }
    } catch {
      // ignore — next send will retry discovery
    }
  }, [activeConversationId, params.recipientId]);

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.messages.send({
        recipientId: params.recipientId,
        content,
        type: 'TEXT',
      }),
    onSuccess: async () => {
      if (activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversation(activeConversationId),
        });
      } else {
        // First message sent — discover the new conversation so we can load messages
        await discoverConversation();
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversations(),
      });
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const messages = data?.messages ?? [];

  if (isLoading && activeConversationId) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Pas encore de messages"
              message="Envoyez le premier message !"
            />
          </View>
        }
        renderItem={({ item }) => (
          <MessageBubble
            content={item.content}
            createdAt={String(item.createdAt)}
            isMine={item.senderId === user?.id || item.sender?.id === user?.id}
          />
        )}
      />
      <ChatInput
        onSend={(text) => sendMessage.mutate(text)}
        disabled={sendMessage.isPending}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesList: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    transform: [{ scaleY: -1 }],
  },
});

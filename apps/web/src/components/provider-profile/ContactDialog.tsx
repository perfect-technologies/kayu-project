"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, MessageCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { messagesApi, queryKeys } from "@kayu/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: {
    id: string;
    userId: string;
    profession: string;
    isAvailable: boolean;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  };
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export function ContactDialog({
  open,
  onOpenChange,
  provider,
  isAuthenticated,
  onLoginRequired,
}: ContactDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const fullName = `${provider.user.firstName} ${provider.user.lastName}`;
  const initials = `${provider.user.firstName[0]}${provider.user.lastName[0]}`;

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      messagesApi(apiClient).send({
        recipientId: provider.userId,
        content,
        type: 'TEXT',
      }),
    onSuccess: (result) => {
      const nextConversationId = result.conversationId ?? null;
      setConversationId(nextConversationId);
      setSuccess(true);
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversations(),
      });
      if (nextConversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversation(nextConversationId),
        });
      }
    },
    onError: (error: Error) => {
      alert(error.message || "Erreur lors de l'envoi du message");
    },
  });

  const handleSend = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    if (!message.trim()) {
      return;
    }

    sendMessage.mutate(message.trim());
  };

  const resetForm = () => {
    setMessage("");
    setSuccess(false);
    setConversationId(null);
  };

  const goToConversation = () => {
    const href = conversationId
      ? `/messages?conversationId=${conversationId}`
      : "/messages";
    onOpenChange(false);
    resetForm();
    router.push(href);
  };

  const quickMessages = [
    "Bonjour, êtes-vous disponible cette semaine?",
    "Pouvez-vous me donner un devis pour...",
    "Quels sont vos tarifs?",
    "Pouvez-vous intervenir en urgence?",
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contacter {fullName}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={provider.user.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1">{provider.profession}</span>
            {provider.isAvailable && (
              <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                Disponible
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Message envoyé!</h3>
            <p className="text-muted-foreground text-center text-sm mb-4">
              Votre message a été envoyé. Ouvrez la conversation pour suivre la
              réponse du prestataire.
            </p>
            <Button onClick={goToConversation} className="bg-primary hover:bg-primary/90">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ouvrir la conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Messages */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Messages rapides:</p>
              <div className="flex flex-wrap gap-2">
                {quickMessages.map((msg, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-2"
                    onClick={() => setMessage(msg)}
                  >
                    {msg.length > 30 ? msg.slice(0, 30) + "..." : msg}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="min-h-[120px] resize-none"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/500 caractères
              </p>
            </div>

            {/* Send Button */}
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer le message
            </Button>

            {/* Info */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Votre message sera envoyé directement au prestataire. Vous serez notifié
                dès qu&apos;il répondra.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

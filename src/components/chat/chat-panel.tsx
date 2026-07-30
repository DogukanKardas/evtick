"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/lib/tickets/actions";
import type { TicketMessage, TicketStatus } from "@/types/database";

interface ChatPanelProps {
  ticketId: string;
  profileId: string;
  initialMessages: TicketMessage[];
  ticketStatus: TicketStatus;
}

export function ChatPanel({
  ticketId,
  profileId,
  initialMessages,
  ticketStatus,
}: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isReadOnly = ticketStatus === "closed";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          const newMsg = payload.new as TicketMessage;
          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .single();

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, sender: sender ?? undefined }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isReadOnly) return;

    const text = content.trim();
    setContent("");

    startTransition(async () => {
      const result = await sendMessageAction(ticketId, text);
      if (result?.error) {
        setContent(text);
      }
    });
  }

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="font-medium">Canlı Destek</h3>
        {isReadOnly && (
          <p className="text-xs text-muted-foreground">
            Talep kapalı — mesaj gönderilemez
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-3" style={{ maxHeight: "400px" }}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Henüz mesaj yok. Destek ekibiyle iletişime geçin.
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === profileId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {!isReadOnly && (
        <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="min-h-11"
            disabled={pending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={pending || !content.trim()}
            className="min-h-11 min-w-11 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

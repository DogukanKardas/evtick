"use client";

import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "@/components/chat/message-bubble";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/lib/tickets/actions";
import type { TicketMessage, TicketStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  ticketId: string;
  profileId: string;
  initialMessages: TicketMessage[];
  ticketStatus: TicketStatus;
  className?: string;
}

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Bugün";
  if (isYesterday(date)) return "Dün";
  return format(date, "d MMMM yyyy", { locale: tr });
}

type MessageGroup = { label: string; messages: TicketMessage[] };

function groupMessagesByDay(messages: TicketMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const msg of messages) {
    const label = formatDayLabel(new Date(msg.created_at));
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.messages.push(msg);
    } else {
      groups.push({ label, messages: [msg] });
    }
  }

  return groups;
}

export function ChatPanel({
  ticketId,
  profileId,
  initialMessages,
  ticketStatus,
  className,
}: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isReadOnly = ticketStatus === "closed";

  const grouped = useMemo(() => groupMessagesByDay(messages), [messages]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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
            const withoutOptimistic = prev.filter(
              (m) => !m.id.startsWith("optimistic-") || m.content !== newMsg.content
            );
            return [
              ...withoutOptimistic,
              { ...newMsg, sender: sender ?? undefined },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  function handleSend() {
    if (!content.trim() || isReadOnly || pending) return;

    const text = content.trim();
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        ticket_id: ticketId,
        sender_id: profileId,
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    startTransition(async () => {
      const result = await sendMessageAction(ticketId, text);
      if (result?.error) {
        toast.error(result.error);
        setContent(text);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  return (
    <div
      className={cn(
        "flex min-h-[min(520px,calc(100dvh-16rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div>
          <h3 className="font-medium">Canlı Destek</h3>
          <p className="text-xs text-muted-foreground">
            {isReadOnly
              ? "Talep kapalı — mesaj gönderilemez"
              : "Enter ile gönder · Shift+Enter yeni satır"}
          </p>
        </div>
        <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {messages.length} mesaj
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Henüz mesaj yok</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Sorunuz veya ek bilginiz varsa aşağıdan mesaj yazın. Destek
                ekibi buradan yanıt verecek.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label} className="space-y-4">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === profileId}
                    pending={msg.id.startsWith("optimistic-")}
                  />
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className="sticky bottom-0 shrink-0 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın..."
              rows={1}
              disabled={pending}
              className="min-h-11 max-h-[120px] resize-none py-2.5"
            />
            <Button
              type="button"
              size="icon"
              disabled={pending || !content.trim()}
              onClick={handleSend}
              className="min-h-11 min-w-11 shrink-0"
              aria-label="Mesaj gönder"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TicketMessage } from "@/types/database";

interface MessageBubbleProps {
  message: TicketMessage;
  isOwn: boolean;
  pending?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  pending = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isOwn ? "items-end" : "items-start",
        pending && "opacity-60"
      )}
    >
      {!isOwn && (
        <span className="px-1 text-xs font-medium text-muted-foreground">
          {message.sender?.full_name ?? "Destek"}
        </span>
      )}
      <div
        className={cn(
          "max-w-[min(85%,420px)] whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-sm leading-relaxed",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {message.content}
      </div>
      <span className="px-1 text-[10px] text-muted-foreground">
        {pending
          ? "Gönderiliyor..."
          : format(new Date(message.created_at), "HH:mm", { locale: tr })}
      </span>
    </div>
  );
}

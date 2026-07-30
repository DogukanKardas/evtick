import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TicketMessage } from "@/types/database";

interface MessageBubbleProps {
  message: TicketMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <span className="px-1 text-xs text-muted-foreground">
          {message.sender?.full_name ?? "Destek"}
        </span>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
          isOwn
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted"
        )}
      >
        {message.content}
      </div>
      <span className="px-1 text-[10px] text-muted-foreground">
        {format(new Date(message.created_at), "HH:mm", { locale: tr })}
      </span>
    </div>
  );
}

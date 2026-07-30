import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import type { Ticket } from "@/types/database";

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="transition-colors hover:bg-muted/50 active:bg-muted">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{ticket.title}</CardTitle>
            <StatusBadge status={ticket.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {ticket.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <PriorityBadge priority={ticket.priority} />
            <span>
              {formatDistanceToNow(new Date(ticket.created_at), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

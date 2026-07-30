import { notFound } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireAuth } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import { TicketStatusActions } from "@/components/tickets/ticket-status-actions";
import { ChatPanel } from "@/components/chat/chat-panel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Ticket, TicketMessage, TicketStatusLog } from "@/types/database";
import { isSupportOrAdmin } from "@/lib/auth/roles";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const profile = await requireAuth();
  const supabase = await createClient();
  const isStaff = isSupportOrAdmin(profile);

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket) notFound();

  const typedTicket = ticket as Ticket;

  if (
    !isStaff &&
    typedTicket.created_by !== profile.id
  ) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*, sender:profiles(*)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const { data: statusLogs } = await supabase
    .from("ticket_status_logs")
    .select("*, changer:profiles(*)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={typedTicket.status} />
          <PriorityBadge priority={typedTicket.priority} />
          <span className="text-xs text-muted-foreground">
            {typedTicket.category}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{typedTicket.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(typedTicket.created_at), "d MMMM yyyy HH:mm", {
            locale: tr,
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Açıklama</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{typedTicket.description}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium">Durum İşlemleri</h2>
        <TicketStatusActions ticket={typedTicket} profile={profile} />
      </div>

      <Separator />

      <ChatPanel
        ticketId={id}
        profileId={profile.id}
        initialMessages={(messages ?? []) as TicketMessage[]}
        ticketStatus={typedTicket.status}
      />

      {statusLogs && statusLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Durum Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(statusLogs as TicketStatusLog[]).map((log) => (
                <li key={log.id} className="flex justify-between text-muted-foreground">
                  <span>
                    {log.old_status ?? "—"} → {log.new_status}
                    {log.changer && ` (${log.changer.full_name})`}
                  </span>
                  <span>
                    {format(new Date(log.created_at), "d MMM HH:mm", {
                      locale: tr,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

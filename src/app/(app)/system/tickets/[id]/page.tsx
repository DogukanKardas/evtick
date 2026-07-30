import { notFound } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { getPlatformTicketById } from "@/lib/system/ticket-actions";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import { SystemTicketStatusActions } from "@/components/system/system-ticket-status-actions";
import { ChatPanel } from "@/components/chat/chat-panel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TicketMessage, TicketStatusLog } from "@/types/database";

interface SystemTicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SystemTicketDetailPage({
  params,
}: SystemTicketDetailPageProps) {
  const { id } = await params;
  const profile = await requireSuperAdmin();
  const ticket = await getPlatformTicketById(id);

  if (!ticket) notFound();

  const supabase = await createClient();

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
          {ticket.company && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
              {ticket.company.name}
            </span>
          )}
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs text-muted-foreground">
            {ticket.category}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(ticket.created_at), "d MMMM yyyy HH:mm", {
            locale: tr,
          })}
          {ticket.creator && ` · ${ticket.creator.full_name}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Açıklama</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium">Müdahale</h2>
        <SystemTicketStatusActions ticket={ticket} profile={profile} />
      </div>

      <Separator />

      <ChatPanel
        ticketId={id}
        profileId={profile.id}
        initialMessages={(messages ?? []) as TicketMessage[]}
        ticketStatus={ticket.status}
      />

      {statusLogs && statusLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Durum Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(statusLogs as TicketStatusLog[]).map((log) => (
                <li
                  key={log.id}
                  className="flex justify-between text-muted-foreground"
                >
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

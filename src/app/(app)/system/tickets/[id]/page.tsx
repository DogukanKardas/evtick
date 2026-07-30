import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import {
  getAssignableProfiles,
  getPlatformTicketById,
  getTicketAuditActivity,
} from "@/lib/system/ticket-actions";
import { TicketDetailShell } from "@/components/system/ticket-detail-shell";
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

  const [messagesRes, statusLogsRes, assignableProfiles, auditLogs] =
    await Promise.all([
      supabase
        .from("ticket_messages")
        .select("*, sender:profiles(*)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_status_logs")
        .select("*, changer:profiles(*)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: false }),
      getAssignableProfiles(ticket.company_id),
      getTicketAuditActivity(id),
    ]);

  return (
    <TicketDetailShell
      ticket={ticket}
      profile={profile}
      assignableProfiles={assignableProfiles}
      messages={(messagesRes.data ?? []) as TicketMessage[]}
      statusLogs={(statusLogsRes.data ?? []) as TicketStatusLog[]}
      auditLogs={auditLogs}
    />
  );
}

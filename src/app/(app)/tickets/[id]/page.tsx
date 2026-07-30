import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeTicketById } from "@/lib/tickets/actions";
import { EmployeeTicketShell } from "@/components/employee/employee-ticket-shell";
import type { TicketMessage, TicketStatusLog } from "@/types/database";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id } = await params;
  const profile = await requireAuth();
  const ticket = await getEmployeeTicketById(id);

  if (!ticket) notFound();

  const supabase = await createClient();

  const [messagesRes, statusLogsRes] = await Promise.all([
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
  ]);

  return (
    <EmployeeTicketShell
      ticket={ticket}
      profile={profile}
      messages={(messagesRes.data ?? []) as TicketMessage[]}
      statusLogs={(statusLogsRes.data ?? []) as TicketStatusLog[]}
    />
  );
}

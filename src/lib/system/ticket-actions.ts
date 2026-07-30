"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import { getActionLabel, getAuditEntityHref } from "@/lib/system/audit-labels";
import type {
  Profile,
  SystemAuditLog,
  Ticket,
  TicketPriority,
  TicketsPageSummary,
  TicketStatus,
} from "@/types/database";

const TICKET_SELECT =
  "*, creator:profiles!tickets_created_by_fkey(*), assignee:profiles!tickets_assigned_to_fkey(*), company:companies(*)";

export async function getTicketsPageSummary(): Promise<TicketsPageSummary> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalRes,
    openRes,
    inProgressRes,
    urgentRes,
    todayRes,
    unassignedRes,
  ] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .in("priority", ["urgent", "high"])
      .in("status", ["open", "in_progress"]),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .is("assigned_to", null),
  ]);

  return {
    total_tickets: totalRes.count ?? 0,
    open_tickets: openRes.count ?? 0,
    in_progress_tickets: inProgressRes.count ?? 0,
    urgent_open: urgentRes.count ?? 0,
    tickets_today: todayRes.count ?? 0,
    unassigned_open: unassignedRes.count ?? 0,
  };
}

export async function getPlatformTickets(filters?: {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  companyId?: string;
}): Promise<Ticket[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.companyId) query = query.eq("company_id", filters.companyId);

  const { data } = await query;
  let tickets = (data ?? []) as Ticket[];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    tickets = tickets.filter((t) => t.title.toLowerCase().includes(q));
  }

  return tickets;
}

export async function getPlatformTicketById(id: string): Promise<Ticket | null> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", id)
    .single();

  return (data as Ticket) ?? null;
}

export async function getCompanyTickets(companyId: string): Promise<Ticket[]> {
  return getPlatformTickets({ companyId });
}

export async function getAssignableProfiles(
  companyId: string
): Promise<Profile[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [staffRes, adminRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("company_id", companyId)
      .in("role", ["support", "admin"]),
    supabase.from("profiles").select("*").eq("role", "super_admin"),
  ]);

  const seen = new Set<string>();
  const merged = [...(staffRes.data ?? []), ...(adminRes.data ?? [])];
  return merged.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }) as Profile[];
}

export async function getTicketAuditActivity(
  ticketId: string,
  limit = 20
): Promise<(SystemAuditLog & { action_label: string; href?: string })[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("system_audit_logs")
    .select("*, actor:profiles!system_audit_logs_actor_id_fkey(*)")
    .eq("entity_type", "ticket")
    .eq("entity_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((log) => ({
    ...(log as SystemAuditLog),
    action_label: getActionLabel(log.action),
    href: getAuditEntityHref(log.entity_type, log.entity_id),
  }));
}

export async function updatePlatformTicketAction(
  ticketId: string,
  updates: {
    status?: TicketStatus;
    assignedTo?: string | null;
    priority?: TicketPriority;
  }
) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Talep bulunamadı." };
  }

  const update: Record<string, unknown> = {};
  if (updates.status) update.status = updates.status;
  if (updates.assignedTo !== undefined) update.assigned_to = updates.assignedTo;
  if (updates.priority) update.priority = updates.priority;
  if (updates.status === "closed") {
    update.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tickets")
    .update(update)
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  await logSystemAction("update_ticket", "ticket", ticketId, {
    previous_status: ticket.status,
    ...updates,
  });

  revalidatePath("/system/tickets");
  revalidatePath(`/system/tickets/${ticketId}`);
  revalidatePath(`/system/companies/${ticket.company_id}`);
  return { success: true };
}

export async function bulkUpdateTicketsAction(
  ids: string[],
  status: TicketStatus
) {
  await requireSuperAdmin();
  if (!ids.length) return { error: "Talep seçilmedi." };

  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (status === "closed") {
    update.closed_at = new Date().toISOString();
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, status, company_id")
    .in("id", ids);

  if (!tickets?.length) {
    return { error: "Talep bulunamadı." };
  }

  const { error } = await supabase
    .from("tickets")
    .update(update)
    .in("id", ids);

  if (error) {
    return { error: error.message };
  }

  for (const ticket of tickets) {
    await logSystemAction("update_ticket", "ticket", ticket.id, {
      previous_status: ticket.status,
      status,
      bulk: true,
    });
  }

  revalidatePath("/system/tickets");
  return { success: true, count: tickets.length };
}

export async function assignPlatformTicketAction(ticketId: string) {
  const profile = await requireSuperAdmin();
  return updatePlatformTicketAction(ticketId, {
    status: "in_progress",
    assignedTo: profile.id,
  });
}

export async function getCompanyTicketStats(companyId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("status, created_at")
    .eq("company_id", companyId);

  const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let last30Days = 0;

  tickets?.forEach((t) => {
    if (t.status in statusCounts) {
      statusCounts[t.status as keyof typeof statusCounts]++;
    }
    if (new Date(t.created_at) >= thirtyDaysAgo) last30Days++;
  });

  return { statusCounts, last30Days, total: tickets?.length ?? 0 };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/database";

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
    .select("*, creator:profiles!tickets_created_by_fkey(*), company:companies(*)")
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
    .select(
      "*, creator:profiles!tickets_created_by_fkey(*), assignee:profiles!tickets_assigned_to_fkey(*), company:companies(*)"
    )
    .eq("id", id)
    .single();

  return (data as Ticket) ?? null;
}

export async function getCompanyTickets(companyId: string): Promise<Ticket[]> {
  return getPlatformTickets({ companyId });
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

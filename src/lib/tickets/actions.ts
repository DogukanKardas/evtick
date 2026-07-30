"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, requireAuth, requireRole } from "@/lib/auth/get-profile";
import { isSupportOrAdmin } from "@/lib/auth/roles";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  isValidTicketCategory,
  resolveTicketCategory,
  TITLE_MAX,
  TITLE_MIN,
  VALID_PRIORITIES,
} from "@/lib/tickets/constants";
import type {
  EmployeeDashboardSummary,
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketStatusCount,
  UserRole,
} from "@/types/database";
import { ASSIGNABLE_ROLES } from "@/types/database";

const TICKET_SELECT =
  "*, creator:profiles!tickets_created_by_fkey(*), assignee:profiles!tickets_assigned_to_fkey(*)";

async function getScopedProfile() {
  const profile = await requireAuth();
  return { profile, isStaff: isSupportOrAdmin(profile) };
}

export async function getEmployeeDashboardSummary(): Promise<EmployeeDashboardSummary> {
  const { profile, isStaff } = await getScopedProfile();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let baseQuery = supabase.from("tickets").select("*").eq("company_id", profile.company_id);
  if (!isStaff) {
    baseQuery = baseQuery.eq("created_by", profile.id);
  }

  const { data: tickets } = await baseQuery;

  const summary: EmployeeDashboardSummary = {
    total: tickets?.length ?? 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    urgent_open: 0,
    tickets_today: 0,
    awaiting_response: 0,
  };

  const openTicketIds: string[] = [];

  tickets?.forEach((t) => {
    if (t.status === "open") summary.open++;
    if (t.status === "in_progress") summary.in_progress++;
    if (t.status === "resolved") summary.resolved++;
    if (t.status === "closed") summary.closed++;
    if (
      (t.priority === "urgent" || t.priority === "high") &&
      (t.status === "open" || t.status === "in_progress")
    ) {
      summary.urgent_open++;
    }
    if (new Date(t.created_at) >= todayStart) summary.tickets_today++;
    if (t.status === "open" || t.status === "in_progress") {
      openTicketIds.push(t.id);
    }
  });

  if (openTicketIds.length > 0) {
    const { data: messages } = await supabase
      .from("ticket_messages")
      .select("ticket_id, sender_id, created_at")
      .in("ticket_id", openTicketIds)
      .order("created_at", { ascending: false });

    const lastByTicket = new Map<string, string>();
    messages?.forEach((m) => {
      if (!lastByTicket.has(m.ticket_id)) {
        lastByTicket.set(m.ticket_id, m.sender_id);
      }
    });

    for (const ticketId of openTicketIds) {
      const lastSender = lastByTicket.get(ticketId);
      if (lastSender && lastSender !== profile.id) {
        summary.awaiting_response++;
      }
    }
  }

  return summary;
}

export async function getEmployeeTicketStats(): Promise<TicketStatusCount[]> {
  const summary = await getEmployeeDashboardSummary();
  return [
    { status: "open", count: summary.open },
    { status: "in_progress", count: summary.in_progress },
    { status: "resolved", count: summary.resolved },
    { status: "closed", count: summary.closed },
  ];
}

export async function getEmployeeTickets(): Promise<Ticket[]> {
  const { profile, isStaff } = await getScopedProfile();
  const supabase = await createClient();

  let query = supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (!isStaff) {
    query = query.eq("created_by", profile.id);
  }

  const { data } = await query;
  return (data ?? []) as Ticket[];
}

export async function getEmployeeRecentTickets(limit = 5): Promise<Ticket[]> {
  const { profile, isStaff } = await getScopedProfile();
  const supabase = await createClient();

  let query = supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!isStaff) {
    query = query.eq("created_by", profile.id);
  }

  const { data } = await query;
  return (data ?? []) as Ticket[];
}

export async function getEmployeeTicketById(id: string): Promise<Ticket | null> {
  const { profile, isStaff } = await getScopedProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", id)
    .single();

  if (!data) return null;

  const ticket = data as Ticket;
  if (!isStaff && ticket.created_by !== profile.id) {
    return null;
  }
  if (ticket.company_id !== profile.company_id) {
    return null;
  }

  return ticket;
}

/** @deprecated Use getEmployeeDashboardSummary */
export async function getDashboardStats() {
  const summary = await getEmployeeDashboardSummary();
  return {
    open: summary.open,
    in_progress: summary.in_progress,
    resolved: summary.resolved,
    closed: summary.closed,
    total: summary.total,
  };
}

export async function createTicketAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const profile = await requireAuth();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priority = (formData.get("priority") as TicketPriority) || "medium";
  const categoryRaw = (formData.get("category") as string)?.trim() || "Genel";
  const categoryCustom = (formData.get("category_custom") as string)?.trim();
  const category = resolveTicketCategory(categoryRaw, categoryCustom);

  if (!title || !description) {
    return { error: "Başlık ve açıklama zorunludur." };
  }

  if (title.length < TITLE_MIN) {
    return { error: `Başlık en az ${TITLE_MIN} karakter olmalıdır.` };
  }

  if (title.length > TITLE_MAX) {
    return { error: `Başlık en fazla ${TITLE_MAX} karakter olabilir.` };
  }

  if (description.length < DESCRIPTION_MIN) {
    return { error: `Açıklama en az ${DESCRIPTION_MIN} karakter olmalıdır.` };
  }

  if (description.length > DESCRIPTION_MAX) {
    return { error: `Açıklama en fazla ${DESCRIPTION_MAX} karakter olabilir.` };
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return { error: "Geçersiz öncelik seçimi." };
  }

  if (categoryRaw === "other" && !categoryCustom) {
    return { error: "Özel kategori adı zorunludur." };
  }

  if (!isValidTicketCategory(category)) {
    return { error: "Geçersiz kategori seçimi." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      company_id: profile.company_id,
      created_by: profile.id,
      title,
      description,
      priority,
      category,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/tickets/${data.id}`);
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
  assignedTo?: string | null
) {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Talep bulunamadı." };
  }

  const isOwner = ticket.created_by === profile.id;
  const isStaff = isSupportOrAdmin(profile);

  if (!isStaff && !(isOwner && (status === "closed" || status === "resolved"))) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const update: Record<string, unknown> = { status };
  if (isStaff && assignedTo !== undefined) {
    update.assigned_to = assignedTo;
  }
  if (status === "closed") {
    update.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tickets")
    .update(update)
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/support");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function assignTicketAction(ticketId: string) {
  const profile = await requireRole(["support", "admin"]);
  return updateTicketStatusAction(ticketId, "in_progress", profile.id);
}

export async function sendMessageAction(ticketId: string, content: string) {
  const profile = await requireAuth();

  if (!content.trim()) {
    return { error: "Mesaj boş olamaz." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: profile.id,
    content: content.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateUserRoleAction(userId: string, role: UserRole) {
  await requireRole(["admin"]);

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return { error: "Geçersiz rol." };
  }

  const supabase = await createClient();
  const currentProfile = await getProfile();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (!targetProfile || targetProfile.company_id !== currentProfile?.company_id) {
    return { error: "Kullanıcı bulunamadı." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

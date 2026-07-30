"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, requireAuth, requireRole } from "@/lib/auth/get-profile";
import type { TicketPriority, TicketStatus, UserRole } from "@/types/database";

export async function createTicketAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const profile = await requireAuth();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priority = (formData.get("priority") as TicketPriority) || "medium";
  const category = (formData.get("category") as string)?.trim() || "genel";

  if (!title || !description) {
    return { error: "Başlık ve açıklama zorunludur." };
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
  const isStaff = profile.role === "support" || profile.role === "admin";

  if (!isStaff && !(isOwner && (status === "closed" || status === "resolved"))) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const update: Record<string, unknown> = { status };
  if (isStaff && assignedTo !== undefined) {
    update.assigned_to = assignedTo;
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

export async function getDashboardStats() {
  const profile = await requireAuth();
  const supabase = await createClient();
  const isStaff = profile.role === "support" || profile.role === "admin";

  let query = supabase
    .from("tickets")
    .select("status", { count: "exact" })
    .eq("company_id", profile.company_id);

  if (!isStaff) {
    query = query.eq("created_by", profile.id);
  }

  const { data: tickets } = await query;

  const stats = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    total: tickets?.length ?? 0,
  };

  tickets?.forEach((t) => {
    if (t.status in stats) {
      stats[t.status as keyof typeof stats]++;
    }
  });

  return stats;
}

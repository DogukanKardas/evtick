"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import type {
  CompanyWithStats,
  PlatformActivity,
  PlatformAlert,
  PlatformStats,
  TicketStatusCount,
  TicketTrendDay,
} from "@/types/database";

const CODE_REGEX = /^[A-Z0-9]{4,12}$/;

export async function getPlatformStats(): Promise<PlatformStats> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [companiesRes, profilesRes, ticketsRes, openTicketsRes, todayRes, weekResolvedRes] =
    await Promise.all([
      supabase.from("companies").select("id, is_active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("updated_at", weekStart.toISOString()),
    ]);

  const companies = companiesRes.data ?? [];

  return {
    total_companies: companies.length,
    active_companies: companies.filter((c) => c.is_active).length,
    inactive_companies: companies.filter((c) => !c.is_active).length,
    total_users: profilesRes.count ?? 0,
    total_tickets: ticketsRes.count ?? 0,
    open_tickets: openTicketsRes.count ?? 0,
    tickets_today: todayRes.count ?? 0,
    resolved_this_week: weekResolvedRes.count ?? 0,
  };
}

export async function getTicketStatusDistribution(): Promise<TicketStatusCount[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase.from("tickets").select("status");
  const counts: Record<string, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  data?.forEach((t) => {
    if (t.status in counts) counts[t.status]++;
  });

  return Object.entries(counts).map(([status, count]) => ({
    status: status as TicketStatusCount["status"],
    count,
  }));
}

export async function getTicketTrend(days = 7): Promise<TicketTrendDay[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("tickets")
    .select("created_at")
    .gte("created_at", start.toISOString());

  const result: TicketTrendDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count =
      data?.filter((t) => t.created_at.slice(0, 10) === key).length ?? 0;
    result.push({ date: key, count });
  }

  return result;
}

export async function getRecentActivity(limit = 10): Promise<PlatformActivity[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [companies, users, tickets] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("tickets")
      .select("id, title, priority, status, created_at, company:companies(name)")
      .in("priority", ["urgent", "high"])
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const activities: PlatformActivity[] = [];

  companies.data?.forEach((c) => {
    activities.push({
      id: `company-${c.id}`,
      type: "company",
      title: `Yeni şirket: ${c.name}`,
      subtitle: "Şirket oluşturuldu",
      created_at: c.created_at,
      href: `/system/companies/${c.id}`,
    });
  });

  users.data?.forEach((u) => {
    activities.push({
      id: `user-${u.id}`,
      type: "user",
      title: u.full_name,
      subtitle: u.email ?? "Yeni kullanıcı",
      created_at: u.created_at,
      href: `/system/users/${u.id}`,
    });
  });

  tickets.data?.forEach((t) => {
    const company = t.company as unknown as { name: string } | null;
    activities.push({
      id: `ticket-${t.id}`,
      type: "ticket",
      title: t.title,
      subtitle: `${company?.name ?? "Şirket"} · ${t.priority}`,
      created_at: t.created_at,
      href: `/system/tickets/${t.id}`,
    });
  });

  return activities
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

export async function getPlatformAlerts(): Promise<PlatformAlert[]> {
  await requireSuperAdmin();
  const companies = await getCompaniesWithStats();
  const alerts: PlatformAlert[] = [];

  companies
    .filter((c) => c.open_tickets >= 5)
    .forEach((c) => {
      alerts.push({
        id: `open-${c.id}`,
        type: "high_open_tickets",
        message: `${c.name}: ${c.open_tickets} açık talep`,
        href: `/system/companies/${c.id}`,
      });
    });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  companies
    .filter((c) => c.is_active && c.ticket_count === 0)
    .slice(0, 5)
    .forEach((c) => {
      alerts.push({
        id: `inactive-${c.id}`,
        type: "inactive_company",
        message: `${c.name}: 30+ gündür talep yok`,
        href: `/system/companies/${c.id}`,
      });
    });

  return alerts;
}

export async function getCompaniesWithStats(): Promise<CompanyWithStats[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (!companies?.length) return [];

  const { data: profiles } = await supabase.from("profiles").select("company_id");
  const { data: tickets } = await supabase
    .from("tickets")
    .select("company_id, status");

  return companies.map((company) => {
    const user_count =
      profiles?.filter((p) => p.company_id === company.id).length ?? 0;
    const companyTickets =
      tickets?.filter((t) => t.company_id === company.id) ?? [];
    return {
      ...company,
      user_count,
      ticket_count: companyTickets.length,
      open_tickets: companyTickets.filter((t) =>
        ["open", "in_progress"].includes(t.status)
      ).length,
    };
  });
}

export async function getCompanyById(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) return null;

  const stats = (await getCompaniesWithStats()).find((c) => c.id === id);
  return stats ?? { ...company, user_count: 0, ticket_count: 0, open_tickets: 0 };
}

export async function createCompanyAction(
  _prev: { error?: string; success?: boolean; code?: string } | null,
  formData: FormData
) {
  const profile = await requireSuperAdmin();
  const name = (formData.get("name") as string)?.trim();
  const mode = (formData.get("mode") as string) ?? "manual";
  const manualCode = (formData.get("code") as string)?.trim().toUpperCase();
  const contactEmail = (formData.get("contact_email") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { error: "Şirket adı zorunludur." };
  }

  const supabase = await createClient();
  let code = manualCode;

  if (mode === "auto") {
    const { data: generated, error: genError } = await supabase.rpc(
      "generate_company_code",
      { p_name: name }
    );
    if (genError || !generated) {
      return { error: genError?.message ?? "Kod üretilemedi." };
    }
    code = generated as string;
  } else {
    if (!code || !CODE_REGEX.test(code)) {
      return {
        error: "Geçerli bir kod girin (4-12 karakter, büyük harf ve rakam).",
      };
    }
  }

  const { data: inserted, error } = await supabase
    .from("companies")
    .insert({
      code,
      name,
      is_active: true,
      created_by: profile.id,
      contact_email: contactEmail,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Bu şirket kodu zaten kullanılıyor." };
    }
    return { error: error.message };
  }

  await logSystemAction("create_company", "company", inserted?.id ?? null, {
    code,
    name,
  });

  revalidatePath("/system");
  revalidatePath("/system/companies");

  return { success: true, code };
}

export async function updateCompanyAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireSuperAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const isActive = formData.get("is_active") === "true";
  const contactEmail = (formData.get("contact_email") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!id || !name) {
    return { error: "Geçersiz veri." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      is_active: isActive,
      contact_email: contactEmail,
      notes,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logSystemAction("update_company", "company", id, { name, is_active: isActive });

  revalidatePath("/system");
  revalidatePath("/system/companies");
  revalidatePath(`/system/companies/${id}`);

  return { success: true };
}

export async function toggleCompanyActiveAction(
  id: string,
  isActive: boolean
) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logSystemAction(
    isActive ? "activate_company" : "deactivate_company",
    "company",
    id,
    { is_active: isActive }
  );

  revalidatePath("/system/companies");
  revalidatePath(`/system/companies/${id}`);

  return { success: true };
}

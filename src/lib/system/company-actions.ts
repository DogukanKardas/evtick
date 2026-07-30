"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import { getActionLabel, getAuditEntityHref } from "@/lib/system/audit-labels";
import { isPlatformCompany } from "@/lib/system/company-constants";
import type { CompaniesPageSummary, SystemAuditLog } from "@/types/database";

export async function getCompaniesPageSummary(): Promise<CompaniesPageSummary> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [companiesRes, usersRes, openTicketsRes] = await Promise.all([
    supabase.from("companies").select("id, is_active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
  ]);

  const companies = companiesRes.data ?? [];

  return {
    total_companies: companies.length,
    active_companies: companies.filter((c) => c.is_active).length,
    inactive_companies: companies.filter((c) => !c.is_active).length,
    total_users: usersRes.count ?? 0,
    total_open_tickets: openTicketsRes.count ?? 0,
  };
}

export async function getCompanyAuditActivity(
  companyId: string,
  limit = 20
): Promise<(SystemAuditLog & { action_label: string; href?: string })[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("system_audit_logs")
    .select("*, actor:profiles!system_audit_logs_actor_id_fkey(*)")
    .eq("entity_type", "company")
    .eq("entity_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((log) => ({
    ...(log as SystemAuditLog),
    action_label: getActionLabel(log.action),
    href: getAuditEntityHref(log.entity_type, log.entity_id),
  }));
}

export async function bulkToggleCompaniesAction(
  ids: string[],
  isActive: boolean
) {
  await requireSuperAdmin();
  if (!ids.length) return { error: "Şirket seçilmedi." };

  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, code, name")
    .in("id", ids);

  if (!companies?.length) {
    return { error: "Şirket bulunamadı." };
  }

  const blocked = companies.filter((c) => isPlatformCompany(c.code));
  if (blocked.length > 0 && !isActive) {
    return { error: "Platform şirketi (EVTK) pasife alınamaz." };
  }

  const allowedIds = companies
    .filter((c) => !(isPlatformCompany(c.code) && !isActive))
    .map((c) => c.id);

  if (!allowedIds.length) {
    return { error: "İşlem yapılabilecek şirket yok." };
  }

  const { error } = await supabase
    .from("companies")
    .update({ is_active: isActive })
    .in("id", allowedIds);

  if (error) {
    return { error: error.message };
  }

  for (const company of companies.filter((c) => allowedIds.includes(c.id))) {
    await logSystemAction(
      isActive ? "activate_company" : "deactivate_company",
      "company",
      company.id,
      { is_active: isActive, bulk: true, name: company.name }
    );
  }

  revalidatePath("/system/companies");
  revalidatePath("/system");

  return { success: true, count: allowedIds.length };
}

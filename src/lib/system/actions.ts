"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import type { CompanyWithStats, PlatformStats } from "@/types/database";

const CODE_REGEX = /^[A-Z0-9]{4,12}$/;

export async function getPlatformStats(): Promise<PlatformStats> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [companiesRes, profilesRes, ticketsRes, openTicketsRes] =
    await Promise.all([
      supabase.from("companies").select("id, is_active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
    ]);

  const companies = companiesRes.data ?? [];

  return {
    total_companies: companies.length,
    active_companies: companies.filter((c) => c.is_active).length,
    total_users: profilesRes.count ?? 0,
    total_tickets: ticketsRes.count ?? 0,
    open_tickets: openTicketsRes.count ?? 0,
  };
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

  const { error } = await supabase.from("companies").insert({
    code,
    name,
    is_active: true,
    created_by: profile.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Bu şirket kodu zaten kullanılıyor." };
    }
    return { error: error.message };
  }

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

  if (!id || !name) {
    return { error: "Geçersiz veri." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ name, is_active: isActive })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

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

  revalidatePath("/system/companies");
  revalidatePath(`/system/companies/${id}`);

  return { success: true };
}

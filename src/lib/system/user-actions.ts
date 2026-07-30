"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import type { Profile, UserRole } from "@/types/database";
import { ASSIGNABLE_ROLES } from "@/types/database";

export async function getPlatformUsers(filters?: {
  search?: string;
  role?: UserRole;
  companyId?: string;
}): Promise<(Profile & { ticket_count?: number })[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*, company:companies(*)")
    .order("created_at", { ascending: false });

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }
  if (filters?.companyId) {
    query = query.eq("company_id", filters.companyId);
  }

  const { data: profiles } = await query;
  if (!profiles?.length) return [];

  const { data: tickets } = await supabase
    .from("tickets")
    .select("created_by");

  let result = profiles as (Profile & { ticket_count?: number })[];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false)
    );
  }

  return result.map((p) => ({
    ...p,
    ticket_count: tickets?.filter((t) => t.created_by === p.id).length ?? 0,
  }));
}

export async function getPlatformUserById(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*, company:companies(*)")
    .eq("id", id)
    .single();

  if (!data) return null;

  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("created_by", id);

  return { ...data, ticket_count: count ?? 0 };
}

export async function updatePlatformUserRoleAction(
  profileId: string,
  role: UserRole
) {
  await requireSuperAdmin();

  if (role === "super_admin") {
    return { error: "Super admin rolü yalnızca Yöneticiler sayfasından atanabilir." };
  }

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return { error: "Geçersiz rol." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (!target) {
    return { error: "Kullanıcı bulunamadı." };
  }

  if (target.role === "super_admin") {
    return { error: "Sistem yöneticisi rolü buradan değiştirilemez." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) {
    return { error: error.message };
  }

  await logSystemAction("update_user_role", "profile", profileId, {
    previous_role: target.role,
    new_role: role,
    email: target.email,
  });

  revalidatePath("/system/users");
  revalidatePath(`/system/users/${profileId}`);
  revalidatePath(`/system/companies/${target.company_id}`);
  return { success: true };
}

export async function getCompanyUsers(companyId: string): Promise<Profile[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Profile[];
}

export async function updateCompanyUserRoleAction(
  profileId: string,
  role: UserRole
) {
  return updatePlatformUserRoleAction(profileId, role);
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import type { Profile, UserRole } from "@/types/database";
import { ASSIGNABLE_ROLES } from "@/types/database";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreatePlatformUserState = {
  error?: string;
  success?: boolean;
  profileId?: string;
  email?: string;
};

export async function createPlatformUserAction(
  _prev: CreatePlatformUserState | null,
  formData: FormData
): Promise<CreatePlatformUserState> {
  const actor = await requireSuperAdmin();

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const companyId = (formData.get("company_id") as string)?.trim();
  const role = formData.get("role") as UserRole;

  if (!fullName) {
    return { error: "Ad soyad zorunludur." };
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`,
    };
  }
  if (!companyId) {
    return { error: "Şirket seçimi zorunludur." };
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return { error: "Geçersiz rol seçimi." };
  }

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, code, is_active")
    .eq("id", companyId)
    .single();

  if (!company) {
    return { error: "Şirket bulunamadı." };
  }
  if (!company.is_active) {
    return { error: "Pasif şirkete kullanıcı eklenemez." };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return { error: "Bu e-posta adresi zaten kayıtlı." };
  }

  try {
    const admin = createAdminClient();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          company_id: companyId,
          full_name: fullName,
        },
      });

    if (authError || !authData.user) {
      return { error: authError?.message ?? "Kullanıcı oluşturulamadı." };
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: authData.user.id,
          company_id: companyId,
          role,
          full_name: fullName,
          email,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (profileError || !profile) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return {
        error: profileError?.message ?? "Profil oluşturulamadı.",
      };
    }

    await logSystemAction("create_user", "profile", profile.id, {
      email,
      full_name: fullName,
      role,
      company_id: companyId,
      company_name: company.name,
      created_by: actor.id,
    });

    revalidatePath("/system/users");
    revalidatePath(`/system/companies/${companyId}`);

    return { success: true, profileId: profile.id, email };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Kullanıcı oluşturulamadı.";
    return { error: message };
  }
}

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

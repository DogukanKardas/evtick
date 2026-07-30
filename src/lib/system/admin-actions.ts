"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { logSystemAction } from "@/lib/system/audit";
import type { Profile } from "@/types/database";

export async function getSuperAdmins(): Promise<Profile[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "super_admin")
    .order("created_at", { ascending: true });

  return (data ?? []) as Profile[];
}

export async function countSuperAdmins(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  return count ?? 0;
}

export async function inviteSuperAdminAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const actor = await requireSuperAdmin();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const fullName = (formData.get("full_name") as string)?.trim();

  if (!email || !fullName) {
    return { error: "E-posta ve ad soyad zorunludur." };
  }

  const supabase = await createClient();
  const { data: evtCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("code", "EVTK")
    .single();

  if (!evtCompany) {
    return { error: "EVTK platform şirketi bulunamadı." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existing?.role === "super_admin") {
    return { error: "Bu kullanıcı zaten sistem yöneticisi." };
  }

  try {
    const admin = createAdminClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          company_id: evtCompany.id,
          role: "super_admin",
        },
        redirectTo: `${siteUrl}/auth/callback`,
      });

    if (inviteError) {
      return { error: inviteError.message };
    }

    if (inviteData.user && !existing) {
      await admin.from("profiles").upsert({
        user_id: inviteData.user.id,
        company_id: evtCompany.id,
        role: "super_admin",
        full_name: fullName,
        email,
      });
    }

    await logSystemAction("invite_super_admin", "profile", existing?.id ?? null, {
      email,
      full_name: fullName,
      invited_by: actor.id,
    });

    revalidatePath("/system/admins");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Davet gönderilemedi.";
    return { error: message };
  }
}

export async function promoteToSuperAdminAction(profileId: string) {
  const actor = await requireSuperAdmin();
  if (actor.id === profileId) {
    return { error: "Kendi rolünüzü değiştiremezsiniz." };
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
    return { error: "Kullanıcı zaten sistem yöneticisi." };
  }

  const { data: evtCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("code", "EVTK")
    .single();

  if (!evtCompany) {
    return { error: "EVTK platform şirketi bulunamadı." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "super_admin", company_id: evtCompany.id })
    .eq("id", profileId);

  if (error) {
    return { error: error.message };
  }

  await logSystemAction("promote_super_admin", "profile", profileId, {
    previous_role: target.role,
    email: target.email,
  });

  revalidatePath("/system/admins");
  revalidatePath("/system/users");
  return { success: true };
}

export async function demoteSuperAdminAction(profileId: string) {
  const actor = await requireSuperAdmin();
  if (actor.id === profileId) {
    return { error: "Kendi rolünüzü değiştiremezsiniz." };
  }

  const count = await countSuperAdmins();
  if (count <= 1) {
    return { error: "Son sistem yöneticisi düşürülemez." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (!target || target.role !== "super_admin") {
    return { error: "Kullanıcı sistem yöneticisi değil." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profileId);

  if (error) {
    return { error: error.message };
  }

  await logSystemAction("demote_super_admin", "profile", profileId, {
    email: target.email,
  });

  revalidatePath("/system/admins");
  return { success: true };
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";
import { isSuperAdmin } from "@/lib/auth/roles";

export { hasRole, isSuperAdmin, isSupportOrAdmin, isCompanyAdmin } from "@/lib/auth/roles";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", error.message);
    return null;
  }

  return data as Profile | null;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    redirect(isSuperAdmin(profile) ? "/system" : "/dashboard");
  }
  return profile;
}

export async function requireSuperAdmin(): Promise<Profile> {
  return requireRole(["super_admin"]);
}

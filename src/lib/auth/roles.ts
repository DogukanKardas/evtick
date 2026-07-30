import type { Profile, UserRole } from "@/types/database";

export function hasRole(profile: Profile, roles: UserRole[]): boolean {
  return roles.includes(profile.role);
}

export function isSupportOrAdmin(profile: Profile): boolean {
  return profile.role === "support" || profile.role === "admin";
}

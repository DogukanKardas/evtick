"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import type { SystemAuditLog } from "@/types/database";

export async function logSystemAction(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    const actor = await requireSuperAdmin();
    const supabase = await createClient();

    await supabase.from("system_audit_logs").insert({
      actor_id: actor.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch {
    // Audit failure should not block main action
  }
}

export async function getAuditLogs(limit = 50): Promise<SystemAuditLog[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("system_audit_logs")
    .select("*, actor:profiles!system_audit_logs_actor_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as SystemAuditLog[];
}

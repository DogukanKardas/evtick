"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import {
  COMPANY_ACTIONS,
  formatAuditMetadata,
  getActionLabel,
  getAuditEntityHref,
  getEntityTypeLabel,
  TICKET_ACTIONS,
  USER_ACTIONS,
} from "@/lib/system/audit-labels";
import type { AuditPageSummary, SystemAuditLog } from "@/types/database";

export type EnrichedAuditLog = SystemAuditLog & {
  action_label: string;
  entity_type_label: string;
  href?: string;
  metadata_summary: string;
};

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

function enrichLog(log: SystemAuditLog): EnrichedAuditLog {
  return {
    ...log,
    action_label: getActionLabel(log.action),
    entity_type_label: getEntityTypeLabel(log.entity_type),
    href: getAuditEntityHref(log.entity_type, log.entity_id),
    metadata_summary: formatAuditMetadata(log.metadata ?? {}),
  };
}

export async function getAuditPageSummary(): Promise<AuditPageSummary> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const [
    totalRes,
    todayRes,
    weekRes,
    companyRes,
    userRes,
    ticketRes,
  ] = await Promise.all([
    supabase
      .from("system_audit_logs")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("system_audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("system_audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("system_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", COMPANY_ACTIONS),
    supabase
      .from("system_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", USER_ACTIONS),
    supabase
      .from("system_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", TICKET_ACTIONS),
  ]);

  return {
    total_logs: totalRes.count ?? 0,
    logs_today: todayRes.count ?? 0,
    logs_this_week: weekRes.count ?? 0,
    company_actions: companyRes.count ?? 0,
    user_actions: userRes.count ?? 0,
    ticket_actions: ticketRes.count ?? 0,
  };
}

export async function getAuditLogs(limit = 500): Promise<EnrichedAuditLog[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("system_audit_logs")
    .select("*, actor:profiles!system_audit_logs_actor_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((log) => enrichLog(log as SystemAuditLog));
}

export async function getAuditActors(): Promise<
  { id: string; full_name: string }[]
> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("system_audit_logs")
    .select("actor_id, actor:profiles!system_audit_logs_actor_id_fkey(id, full_name)")
    .not("actor_id", "is", null);

  const seen = new Set<string>();
  const actors: { id: string; full_name: string }[] = [];

  for (const row of data ?? []) {
    const raw = row.actor;
    const actor = (Array.isArray(raw) ? raw[0] : raw) as
      | { id: string; full_name: string }
      | null
      | undefined;
    if (actor?.id && !seen.has(actor.id)) {
      seen.add(actor.id);
      actors.push({ id: actor.id, full_name: actor.full_name });
    }
  }

  return actors.sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
}

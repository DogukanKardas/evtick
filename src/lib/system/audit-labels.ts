export const ACTION_LABELS: Record<string, string> = {
  create_company: "Şirket oluşturma",
  update_company: "Şirket güncelleme",
  activate_company: "Şirket aktifleştirme",
  deactivate_company: "Şirket pasife alma",
  create_user: "Kullanıcı oluşturma",
  update_user_role: "Rol değişikliği",
  update_ticket: "Talep müdahalesi",
  invite_super_admin: "Super admin davet",
  promote_super_admin: "Super admin yükseltme",
  demote_super_admin: "Super admin düşürme",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  company: "Şirket",
  profile: "Kullanıcı",
  ticket: "Talep",
};

export const COMPANY_ACTIONS = [
  "create_company",
  "update_company",
  "activate_company",
  "deactivate_company",
];

export const USER_ACTIONS = [
  "create_user",
  "update_user_role",
  "invite_super_admin",
  "promote_super_admin",
  "demote_super_admin",
];

export const TICKET_ACTIONS = ["update_ticket"];

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function getEntityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

export function formatAuditMetadata(metadata: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof metadata.email === "string") parts.push(metadata.email);
  if (typeof metadata.full_name === "string") parts.push(metadata.full_name);
  if (typeof metadata.previous_role === "string") {
    parts.push(`rol: ${metadata.previous_role}`);
  }
  if (typeof metadata.previous_status === "string") {
    parts.push(`${metadata.previous_status} → ${metadata.status ?? "?"}`);
  } else if (typeof metadata.status === "string") {
    parts.push(`durum: ${metadata.status}`);
  }
  if (metadata.bulk === true) parts.push("toplu");

  if (parts.length > 0) return parts.join(" · ");

  const keys = Object.keys(metadata);
  if (keys.length === 0) return "—";
  return keys
    .slice(0, 3)
    .map((k) => `${k}: ${String(metadata[k])}`)
    .join(" · ");
}

export function getAuditEntityHref(
  entityType: string,
  entityId: string | null
): string | undefined {
  if (!entityId) return undefined;
  switch (entityType) {
    case "company":
      return `/system/companies/${entityId}`;
    case "profile":
      return `/system/users/${entityId}`;
    case "ticket":
      return `/system/tickets/${entityId}`;
    default:
      return undefined;
  }
}

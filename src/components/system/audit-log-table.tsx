"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { SystemAuditLog } from "@/types/database";

const ACTION_LABELS: Record<string, string> = {
  create_company: "Şirket oluşturma",
  update_company: "Şirket güncelleme",
  activate_company: "Şirket aktifleştirme",
  deactivate_company: "Şirket pasife alma",
  update_user_role: "Rol değişikliği",
  update_ticket: "Talep müdahalesi",
  invite_super_admin: "Super admin davet",
  promote_super_admin: "Super admin yükseltme",
  demote_super_admin: "Super admin düşürme",
};

export function AuditLogTable({ logs }: { logs: SystemAuditLog[] }) {
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...logs];
    if (actionFilter) list = list.filter((l) => l.action === actionFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.actor?.full_name?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, actionFilter, search]);

  const actions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          placeholder="Ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm sm:max-w-xs"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm işlemler</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Denetim kaydı bulunamadı.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-left">Aktör</th>
                <th className="px-4 py-3 text-left">İşlem</th>
                <th className="px-4 py-3 text-left">Varlık</th>
                <th className="px-4 py-3 text-left">Detay</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "d MMM yyyy HH:mm", {
                      locale: tr,
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {log.actor?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-4 py-3">
                    {log.entity_type}
                    {log.entity_id && (
                      <span className="block text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                        {log.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTION_LABELS,
} from "@/lib/system/audit-labels";
import type { EnrichedAuditLog } from "@/lib/system/audit";

type TimeFilter = "all" | "today" | "week";
type EntityFilter = "all" | "company" | "profile" | "ticket";

const PAGE_SIZES = [10, 25, 50, 100];

interface AuditLogTableProProps {
  logs: EnrichedAuditLog[];
  actors: { id: string; full_name: string }[];
}

export function AuditLogTablePro({ logs, actors }: AuditLogTableProProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const action = searchParams.get("action") ?? "";
  const entity = (searchParams.get("entity") as EntityFilter) || "all";
  const timeFilter = (searchParams.get("filter") as TimeFilter) || "all";
  const actorId = searchParams.get("actor") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = PAGE_SIZES.includes(
    parseInt(searchParams.get("size") ?? "25", 10)
  )
    ? parseInt(searchParams.get("size") ?? "25", 10)
    : 25;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      router.push(`/system/audit?${params.toString()}`);
    },
    [router, searchParams]
  );

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        updateParams({ q: localSearch || null, page: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, updateParams]);

  const filtered = useMemo(() => {
    let list = [...logs];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.actor?.full_name?.toLowerCase().includes(q) ||
          l.action_label.toLowerCase().includes(q) ||
          l.entity_type_label.toLowerCase().includes(q) ||
          l.metadata_summary.toLowerCase().includes(q)
      );
    }

    if (action) list = list.filter((l) => l.action === action);
    if (entity !== "all") list = list.filter((l) => l.entity_type === entity);
    if (actorId) list = list.filter((l) => l.actor_id === actorId);

    if (timeFilter === "today") {
      list = list.filter((l) => new Date(l.created_at) >= todayStart);
    }
    if (timeFilter === "week") {
      list = list.filter((l) => new Date(l.created_at) >= weekStart);
    }

    return list;
  }, [logs, search, action, entity, actorId, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const actionOptions = useMemo(() => {
    const fromLogs = [...new Set(logs.map((l) => l.action))];
    return fromLogs.sort((a, b) =>
      (ACTION_LABELS[a] ?? a).localeCompare(ACTION_LABELS[b] ?? b, "tr")
    );
  }, [logs]);

  function clearFilters() {
    router.push("/system/audit");
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center">
        <p className="text-muted-foreground">
          Henüz denetim kaydı bulunmuyor. Sistem panelinde işlem yaptıkça
          kayıtlar burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Aktör, işlem veya detay ara..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="min-h-10 lg:max-w-xs"
        />
        <select
          value={action}
          onChange={(e) =>
            updateParams({ action: e.target.value || null, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm işlemler</option>
          {actionOptions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>
        <select
          value={entity}
          onChange={(e) =>
            updateParams({
              entity: e.target.value === "all" ? null : e.target.value,
              page: null,
            })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Tüm varlıklar</option>
          <option value="company">Şirket</option>
          <option value="profile">Kullanıcı</option>
          <option value="ticket">Talep</option>
        </select>
        <select
          value={timeFilter}
          onChange={(e) =>
            updateParams({
              filter: e.target.value === "all" ? null : e.target.value,
              page: null,
            })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Tüm zamanlar</option>
          <option value="today">Bugün</option>
          <option value="week">Bu hafta</option>
        </select>
        {actors.length > 0 && (
          <select
            value={actorId}
            onChange={(e) =>
              updateParams({ actor: e.target.value || null, page: null })
            }
            className="min-h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Tüm aktörler</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        )}
        <select
          value={String(pageSize)}
          onChange={(e) =>
            updateParams({ size: e.target.value, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / sayfa
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border py-12 text-center">
          <p className="mb-3 text-muted-foreground">
            Eşleşen denetim kaydı bulunamadı.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Filtreleri temizle
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tarih</th>
                  <th className="px-4 py-3 text-left font-medium">Aktör</th>
                  <th className="px-4 py-3 text-left font-medium">İşlem</th>
                  <th className="px-4 py-3 text-left font-medium">Varlık</th>
                  <th className="px-4 py-3 text-left font-medium">Detay</th>
                  <th className="px-4 py-3 text-right font-medium">Bağlantı</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "d MMM yyyy HH:mm", {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {log.actor?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{log.action_label}</td>
                    <td className="px-4 py-3">
                      {log.entity_type_label}
                      {log.entity_id && (
                        <span className="block text-xs text-muted-foreground font-mono">
                          {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                      {log.metadata_summary}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.href ? (
                        <Link
                          href={log.href}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Varlığa git"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginated.map((log) => (
              <div key={log.id} className="rounded-lg border p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-medium">{log.action_label}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "d MMM HH:mm", {
                      locale: tr,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {log.actor?.full_name ?? "—"} · {log.entity_type_label}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {log.metadata_summary}
                </p>
                {log.href && (
                  <LinkButtonMobile href={log.href} />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} kayıt · Sayfa {currentPage}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() =>
                  updateParams({ page: String(currentPage - 1) })
                }
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  updateParams({ page: String(currentPage + 1) })
                }
              >
                Sonraki
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LinkButtonMobile({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
    >
      Varlığa git →
    </Link>
  );
}

export { AuditLogTablePro as AuditLogTable };

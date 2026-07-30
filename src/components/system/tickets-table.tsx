"use client";

import {
  useMemo,
  useState,
  useTransition,
  useCallback,
  useEffect,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Eye, UserPlus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import {
  assignPlatformTicketAction,
  bulkUpdateTicketsAction,
  updatePlatformTicketAction,
} from "@/lib/system/ticket-actions";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/database";

type Sort = "date" | "priority";
type AdvancedFilter = "all" | "urgent" | "unassigned" | "today";

const PAGE_SIZES = [10, 25, 50];

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

interface TicketsTableProProps {
  tickets: Ticket[];
  companies: { id: string; name: string }[];
}

export function TicketsTablePro({ tickets, companies }: TicketsTableProProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const search = searchParams.get("q") ?? "";
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as TicketPriority | null;
  const companyId = searchParams.get("company") ?? "";
  const advancedFilter =
    (searchParams.get("filter") as AdvancedFilter) || "all";
  const sort = (searchParams.get("sort") as Sort) || "date";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = PAGE_SIZES.includes(
    parseInt(searchParams.get("size") ?? "10", 10)
  )
    ? parseInt(searchParams.get("size") ?? "10", 10)
    : 10;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      router.push(`/system/tickets?${params.toString()}`);
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
    let list = [...tickets];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (status) list = list.filter((t) => t.status === status);
    if (priority) list = list.filter((t) => t.priority === priority);
    if (companyId) list = list.filter((t) => t.company_id === companyId);

    if (advancedFilter === "urgent") {
      list = list.filter(
        (t) =>
          (t.priority === "urgent" || t.priority === "high") &&
          (t.status === "open" || t.status === "in_progress")
      );
    }
    if (advancedFilter === "unassigned") {
      list = list.filter((t) => t.status === "open" && !t.assigned_to);
    }
    if (advancedFilter === "today") {
      list = list.filter(
        (t) => new Date(t.created_at) >= todayStart
      );
    }

    list.sort((a, b) => {
      if (sort === "priority") {
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [tickets, search, status, priority, companyId, advancedFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((t) => t.id)));
    }
  }

  function handleBulkStatus(statusValue: TicketStatus) {
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await bulkUpdateTicketsAction(ids, statusValue);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`${result.count} talep güncellendi`);
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  function handleQuickAssign(id: string) {
    startTransition(async () => {
      const result = await assignPlatformTicketAction(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Talep üstlenildi");
        router.refresh();
      }
    });
  }

  function handleQuickClose(id: string) {
    startTransition(async () => {
      const result = await updatePlatformTicketAction(id, { status: "closed" });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Talep kapatıldı");
        router.refresh();
      }
    });
  }

  function clearFilters() {
    router.push("/system/tickets");
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center">
        <p className="text-muted-foreground">Henüz talep bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Başlık ara..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="min-h-10 lg:max-w-xs"
        />
        <select
          value={companyId}
          onChange={(e) =>
            updateParams({ company: e.target.value || null, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm şirketler</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status ?? ""}
          onChange={(e) =>
            updateParams({ status: e.target.value || null, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="open">Açık</option>
          <option value="in_progress">İşlemde</option>
          <option value="resolved">Çözüldü</option>
          <option value="closed">Kapalı</option>
        </select>
        <select
          value={priority ?? ""}
          onChange={(e) =>
            updateParams({ priority: e.target.value || null, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm öncelikler</option>
          <option value="low">Düşük</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksek</option>
          <option value="urgent">Acil</option>
        </select>
        <select
          value={advancedFilter}
          onChange={(e) =>
            updateParams({
              filter: e.target.value === "all" ? null : e.target.value,
              page: null,
            })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Tüm talepler</option>
          <option value="urgent">Acil/yüksek açık</option>
          <option value="unassigned">Atanmamış açık</option>
          <option value="today">Bugün açılan</option>
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value, page: null })}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="date">Tarih</option>
          <option value="priority">Öncelik</option>
        </select>
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
          <p className="mb-3 text-muted-foreground">Talep bulunamadı.</p>
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
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={
                        paginated.length > 0 &&
                        selected.size === paginated.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Başlık</th>
                  <th className="px-4 py-3 text-left font-medium">Şirket</th>
                  <th className="px-4 py-3 text-left font-medium">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-left font-medium">Öncelik</th>
                  <th className="px-4 py-3 text-left font-medium">Atanan</th>
                  <th className="px-4 py-3 text-left font-medium">Oluşturan</th>
                  <th className="px-4 py-3 text-left font-medium">Güncellenme</th>
                  <th className="px-4 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="rounded border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/system/tickets/${t.id}`}
                        className="font-medium hover:underline"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{t.company?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.category}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {t.assignee?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {t.creator?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(t.updated_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/system/tickets/${t.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Detay"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {t.status === "open" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pending}
                            onClick={() => handleQuickAssign(t.id)}
                            title="Üstlen"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {t.status !== "closed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pending}
                            onClick={() => handleQuickClose(t.id)}
                            title="Kapat"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginated.map((t) => (
              <div key={t.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link
                    href={`/system/tickets/${t.id}`}
                    className="font-medium hover:underline"
                  >
                    {t.title}
                  </Link>
                  <StatusBadge status={t.status} />
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t.company?.name ?? "—"}</p>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <span>
                      {format(new Date(t.created_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} talep · Sayfa {currentPage}/{totalPages}
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

      {selected.size > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-lg border bg-background p-3 shadow-lg md:bottom-6 md:left-auto md:right-6 md:max-w-lg">
          <span className="text-sm font-medium">{selected.size} seçili</span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => handleBulkStatus("in_progress")}
            >
              İşleme Al
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => handleBulkStatus("resolved")}
            >
              Çözüldü
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => handleBulkStatus("closed")}
            >
              Kapat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { TicketsTablePro as TicketsTable };

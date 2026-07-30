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
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import { TicketCard } from "@/components/tickets/ticket-card";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/database";

type Sort = "date" | "priority";
type AdvancedFilter = "all" | "urgent" | "today";

const PAGE_SIZES = [10, 25, 50];

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

import { TICKET_CATEGORY_FILTER_VALUES } from "@/lib/tickets/constants";

interface EmployeeTicketsTableProps {
  tickets: Ticket[];
}

export function EmployeeTicketsTable({ tickets }: EmployeeTicketsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as TicketPriority | null;
  const category = searchParams.get("category") ?? "";
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
      router.push(`/tickets?${params.toString()}`);
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

  const categories = useMemo(() => {
    const fromTickets = [...new Set(tickets.map((t) => t.category))];
    return [...new Set([...TICKET_CATEGORY_FILTER_VALUES, ...fromTickets])].sort();
  }, [tickets]);

  const filtered = useMemo(() => {
    let list = [...tickets];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (status) list = list.filter((t) => t.status === status);
    if (priority) list = list.filter((t) => t.priority === priority);
    if (category) list = list.filter((t) => t.category === category);

    if (advancedFilter === "urgent") {
      list = list.filter(
        (t) =>
          (t.priority === "urgent" || t.priority === "high") &&
          (t.status === "open" || t.status === "in_progress")
      );
    }
    if (advancedFilter === "today") {
      list = list.filter((t) => new Date(t.created_at) >= todayStart);
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
  }, [tickets, search, status, priority, category, advancedFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function clearFilters() {
    router.push("/tickets");
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center">
        <p className="mb-4 text-muted-foreground">Henüz talep bulunmuyor.</p>
        <LinkButton href="/tickets/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          İlk talebini oluştur
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Başlık, açıklama veya kategori ara..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="min-h-10 lg:max-w-xs"
        />
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
          value={category}
          onChange={(e) =>
            updateParams({ category: e.target.value || null, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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
          <p className="mb-3 text-muted-foreground">
            Bu filtreye uygun talep bulunamadı.
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
                  <th className="px-4 py-3 text-left font-medium">Başlık</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-left font-medium">Öncelik</th>
                  <th className="px-4 py-3 text-left font-medium">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium">Oluşturulma</th>
                  <th className="px-4 py-3 text-left font-medium">Güncellenme</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="font-medium hover:underline"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(t.created_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(t.updated_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginated.map((t) => (
              <TicketCard key={t.id} ticket={t} />
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
    </div>
  );
}

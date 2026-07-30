"use client";

import { useMemo, useState, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Copy,
  Check,
  Eye,
  Power,
  PowerOff,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import {
  bulkToggleCompaniesAction,
} from "@/lib/system/company-actions";
import { toggleCompanyActiveAction } from "@/lib/system/actions";
import { isPlatformCompany } from "@/lib/system/company-constants";
import type { CompanyWithStats } from "@/types/database";

type StatusFilter = "all" | "active" | "inactive";
type Sort = "date" | "users" | "open_tickets" | "ticket_count";
type AdvancedFilter = "all" | "has_open" | "no_users" | "inactive_30";

const PAGE_SIZES = [10, 25, 50];

function formatActivity(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

interface CompaniesTableProProps {
  companies: CompanyWithStats[];
}

export function CompaniesTablePro({ companies }: CompaniesTableProProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const search = searchParams.get("q") ?? "";
  const status = (searchParams.get("status") as StatusFilter) || "all";
  const sort = (searchParams.get("sort") as Sort) || "date";
  const advancedFilter =
    (searchParams.get("filter") as AdvancedFilter) || "all";
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
      router.push(`/system/companies?${params.toString()}`);
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
    let list = [...companies];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }

    if (status === "active") list = list.filter((c) => c.is_active);
    if (status === "inactive") list = list.filter((c) => !c.is_active);

    if (advancedFilter === "has_open")
      list = list.filter((c) => c.open_tickets > 0);
    if (advancedFilter === "no_users")
      list = list.filter((c) => c.user_count === 0);
    if (advancedFilter === "inactive_30")
      list = list.filter((c) => (c.days_since_activity ?? 0) >= 30);

    list.sort((a, b) => {
      if (sort === "users") return b.user_count - a.user_count;
      if (sort === "open_tickets") return b.open_tickets - a.open_tickets;
      if (sort === "ticket_count") return b.ticket_count - a.ticket_count;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [companies, search, status, sort, advancedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectableOnPage = paginated.filter((c) => !isPlatformCompany(c.code));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === selectableOnPage.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableOnPage.map((c) => c.id)));
    }
  }

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Kod kopyalandı");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleToggle(id: string, code: string, currentlyActive: boolean) {
    if (isPlatformCompany(code) && currentlyActive) {
      toast.error("Platform şirketi (EVTK) pasife alınamaz.");
      return;
    }
    startTransition(async () => {
      const result = await toggleCompanyActiveAction(id, !currentlyActive);
      if (result.error) toast.error(result.error);
      else {
        toast.success(currentlyActive ? "Şirket pasife alındı" : "Şirket aktifleştirildi");
        router.refresh();
      }
    });
  }

  function handleBulkToggle(isActive: boolean) {
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await bulkToggleCompaniesAction(ids, isActive);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`${result.count} şirket güncellendi`);
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  function clearFilters() {
    router.push("/system/companies");
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center">
        <p className="mb-4 text-muted-foreground">Henüz şirket bulunmuyor.</p>
        <LinkButton href="/system/companies/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          İlk şirketi oluştur
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Ad veya kod ara..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="min-h-10 lg:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) =>
            updateParams({ status: e.target.value === "all" ? null : e.target.value, page: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
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
          <option value="all">Tüm şirketler</option>
          <option value="has_open">Açık talebi olan</option>
          <option value="no_users">Kullanıcısız</option>
          <option value="inactive_30">30+ gün pasif</option>
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value, page: null })}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="date">Tarih</option>
          <option value="users">Kullanıcı sayısı</option>
          <option value="open_tickets">Açık talep</option>
          <option value="ticket_count">Toplam talep</option>
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
          <p className="mb-3 text-muted-foreground">Eşleşen şirket bulunamadı.</p>
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
                        selectableOnPage.length > 0 &&
                        selected.size === selectableOnPage.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Şirket</th>
                  <th className="px-4 py-3 text-left font-medium">Kod</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-right font-medium">Kullanıcı</th>
                  <th className="px-4 py-3 text-right font-medium">Talep</th>
                  <th className="px-4 py-3 text-right font-medium">Açık</th>
                  <th className="px-4 py-3 text-left font-medium">Son aktivite</th>
                  <th className="px-4 py-3 text-left font-medium">Oluşturulma</th>
                  <th className="px-4 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-3 py-3">
                      {!isPlatformCompany(c.code) && (
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/system/companies/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs">{c.code}</code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyCode(c.id, c.code)}
                        >
                          {copiedId === c.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CompanyStatusBadge isActive={c.is_active} />
                    </td>
                    <td className="px-4 py-3 text-right">{c.user_count}</td>
                    <td className="px-4 py-3 text-right">{c.ticket_count}</td>
                    <td className="px-4 py-3 text-right">{c.open_tickets}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatActivity(c.days_since_activity)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.created_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/system/companies/${c.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Detay"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {!isPlatformCompany(c.code) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pending}
                            onClick={() =>
                              handleToggle(c.id, c.code, c.is_active)
                            }
                            title={c.is_active ? "Pasife al" : "Aktifleştir"}
                          >
                            {c.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
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
            {paginated.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link
                    href={`/system/companies/${c.id}`}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  <CompanyStatusBadge isActive={c.is_active} />
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <code>{c.code}</code>
                  <p>
                    {c.user_count} kullanıcı · {c.ticket_count} talep ·{" "}
                    {c.open_tickets} açık
                  </p>
                  <p>{formatActivity(c.days_since_activity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} şirket · Sayfa {currentPage}/{totalPages}
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
        <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-lg border bg-background p-3 shadow-lg md:bottom-6 md:left-auto md:right-6 md:max-w-md">
          <span className="text-sm font-medium">{selected.size} seçili</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => handleBulkToggle(true)}
            >
              Aktifleştir
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => handleBulkToggle(false)}
            >
              Pasife Al
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep backward export name
export { CompaniesTablePro as CompaniesTable };

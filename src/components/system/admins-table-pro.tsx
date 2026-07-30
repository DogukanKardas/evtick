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
import { Eye, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { demoteSuperAdminAction } from "@/lib/system/admin-actions";
import type { Profile } from "@/types/database";

type Sort = "date" | "name";
type Filter = "all" | "recent";

const PAGE_SIZES = [10, 25, 50];

interface AdminsTableProProps {
  admins: Profile[];
  currentProfileId: string;
}

export function AdminsTablePro({
  admins,
  currentProfileId,
}: AdminsTableProProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = searchParams.get("q") ?? "";
  const filter = (searchParams.get("filter") as Filter) || "all";
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
      if (!params.get("tab")) params.set("tab", "admins");
      router.push(`/system/admins?${params.toString()}`);
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
    let list = [...admins];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          (a.email?.toLowerCase().includes(q) ?? false)
      );
    }

    if (filter === "recent") {
      list = list.filter((a) => new Date(a.created_at) >= monthStart);
    }

    list.sort((a, b) => {
      if (sort === "name") {
        return a.full_name.localeCompare(b.full_name, "tr");
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [admins, search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function handleDemote(admin: Profile) {
    if (admin.id === currentProfileId) {
      toast.error("Kendi rolünüzü değiştiremezsiniz.");
      return;
    }
    if (admins.length <= 1) {
      toast.error("Son sistem yöneticisi düşürülemez.");
      return;
    }
    if (
      !window.confirm(
        `${admin.full_name} kullanıcısının sistem yöneticisi rolünü düşürmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await demoteSuperAdminAction(admin.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Rol düşürüldü");
        router.refresh();
      }
    });
  }

  function clearFilters() {
    router.push("/system/admins?tab=admins");
  }

  if (admins.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center">
        <p className="mb-4 text-muted-foreground">
          Henüz sistem yöneticisi bulunmuyor.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/system/admins?tab=invite")}
        >
          İlk yöneticiyi davet et
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Ad veya e-posta ara..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="min-h-10 lg:max-w-xs"
        />
        <select
          value={filter}
          onChange={(e) =>
            updateParams({
              filter: e.target.value === "all" ? null : e.target.value,
              page: null,
            })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Tüm yöneticiler</option>
          <option value="recent">Bu ay eklenen</option>
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value, page: null })}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="date">Katılım tarihi</option>
          <option value="name">Ad</option>
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
            Eşleşen yönetici bulunamadı.
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
                  <th className="px-4 py-3 text-left font-medium">Ad</th>
                  <th className="px-4 py-3 text-left font-medium">E-posta</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Katılım tarihi
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Şirket</th>
                  <th className="px-4 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{a.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(a.created_at), "d MMMM yyyy", {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {a.company?.name ?? "EVTK"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/system/users/${a.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Detay"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {admins.length > 1 && a.id !== currentProfileId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pending}
                            onClick={() => handleDemote(a)}
                            title="Rolü düşür"
                          >
                            <UserMinus className="h-4 w-4" />
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
            {paginated.map((a) => (
              <div key={a.id} className="rounded-lg border p-4">
                <p className="font-medium">{a.full_name}</p>
                <p className="text-sm text-muted-foreground">{a.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(a.created_at), "d MMM yyyy", { locale: tr })}
                  {" · "}
                  {a.company?.name ?? "EVTK"}
                </p>
                <div className="mt-3 flex gap-2">
                  <LinkButton
                    href={`/system/users/${a.id}`}
                    variant="outline"
                    size="sm"
                  >
                    Detay
                  </LinkButton>
                  {admins.length > 1 && a.id !== currentProfileId && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleDemote(a)}
                    >
                      Rolü Düşür
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} yönetici · Sayfa {currentPage}/{totalPages}
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

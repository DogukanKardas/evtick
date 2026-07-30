"use client";

import {
  useMemo,
  useState,
  useTransition,
  useCallback,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { promoteToSuperAdminAction } from "@/lib/system/admin-actions";
import { ROLE_LABELS, type Profile, type UserRole } from "@/types/database";

type Sort = "date" | "name";

const PAGE_SIZES = [10, 25, 50];

interface PromotableUsersTableProps {
  users: Profile[];
  companies: { id: string; name: string }[];
}

export function PromotableUsersTable({
  users,
  companies,
}: PromotableUsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = searchParams.get("pq") ?? "";
  const role = searchParams.get("prole") ?? "";
  const companyId = searchParams.get("pcompany") ?? "";
  const sort = (searchParams.get("psort") as Sort) || "date";
  const page = Math.max(1, parseInt(searchParams.get("ppage") ?? "1", 10));
  const pageSize = PAGE_SIZES.includes(
    parseInt(searchParams.get("psize") ?? "10", 10)
  )
    ? parseInt(searchParams.get("psize") ?? "10", 10)
    : 10;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      if (!params.get("tab")) params.set("tab", "promote");
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
        updateParams({ pq: localSearch || null, ppage: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, updateParams]);

  const filtered = useMemo(() => {
    let list = [...users];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          (u.email?.toLowerCase().includes(q) ?? false)
      );
    }

    if (role) list = list.filter((u) => u.role === role);
    if (companyId) list = list.filter((u) => u.company_id === companyId);

    list.sort((a, b) => {
      if (sort === "name") {
        return a.full_name.localeCompare(b.full_name, "tr");
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [users, search, role, companyId, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function handlePromote(user: Profile) {
    if (
      !window.confirm(
        `${user.full_name} kullanıcısını sistem yöneticisi yapmak istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await promoteToSuperAdminAction(user.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Kullanıcı yükseltildi");
        router.refresh();
      }
    });
  }

  function clearFilters() {
    router.push("/system/admins?tab=promote");
  }

  if (users.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Yükseltilebilir kullanıcı bulunmuyor.
      </p>
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
          value={role}
          onChange={(e) =>
            updateParams({ prole: e.target.value || null, ppage: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm roller</option>
          {(["employee", "support", "admin"] as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={companyId}
          onChange={(e) =>
            updateParams({ pcompany: e.target.value || null, ppage: null })
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
          value={sort}
          onChange={(e) =>
            updateParams({ psort: e.target.value, ppage: null })
          }
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="date">Kayıt tarihi</option>
          <option value="name">Ad</option>
        </select>
        <select
          value={String(pageSize)}
          onChange={(e) =>
            updateParams({ psize: e.target.value, ppage: null })
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
            Eşleşen kullanıcı bulunamadı.
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
                  <th className="px-4 py-3 text-left font-medium">Rol</th>
                  <th className="px-4 py-3 text-left font-medium">Şirket</th>
                  <th className="px-4 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-3">
                      {u.company?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => handlePromote(u)}
                      >
                        Yükselt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginated.map((u) => (
              <div key={u.id} className="rounded-lg border p-4">
                <p className="font-medium">{u.full_name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ROLE_LABELS[u.role]} · {u.company?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(u.created_at), "d MMM yyyy", { locale: tr })}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={pending}
                  onClick={() => handlePromote(u)}
                >
                  Yükselt
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} kullanıcı · Sayfa {currentPage}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() =>
                  updateParams({ ppage: String(currentPage - 1) })
                }
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  updateParams({ ppage: String(currentPage + 1) })
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

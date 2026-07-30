"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, ASSIGNABLE_ROLES } from "@/types/database";
import type { Profile, UserRole } from "@/types/database";
import { updatePlatformUserRoleAction } from "@/lib/system/user-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UsersTableProps {
  users: (Profile & { ticket_count?: number; company?: { name: string } | null })[];
  companies: { id: string; name: string }[];
}

export function UsersTable({ users, companies }: UsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [pending, startTransition] = useTransition();

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
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    if (companyFilter) list = list.filter((u) => u.company_id === companyFilter);
    return list;
  }, [users, search, roleFilter, companyFilter]);

  function handleRoleChange(id: string, role: UserRole) {
    startTransition(async () => {
      await updatePlatformUserRoleAction(id, role);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Ad veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 sm:max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm roller</option>
          {[...ASSIGNABLE_ROLES, "super_admin" as UserRole].map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm şirketler</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Kullanıcı bulunamadı.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Kullanıcı</th>
                <th className="px-4 py-3 text-left">Şirket</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-right">Talep</th>
                <th className="px-4 py-3 text-right">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/system/users/${u.id}`}
                      className="font-medium hover:underline"
                    >
                      {u.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.company?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "super_admin" ? (
                      ROLE_LABELS.super_admin
                    ) : (
                      <select
                        value={u.role}
                        disabled={pending}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as UserRole)
                        }
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{u.ticket_count ?? 0}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {format(new Date(u.created_at), "d MMM yyyy", { locale: tr })}
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

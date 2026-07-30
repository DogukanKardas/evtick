"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import type { CompanyWithStats } from "@/types/database";

type Filter = "all" | "active" | "inactive";
type Sort = "date" | "users" | "open_tickets";

interface CompaniesTableProps {
  companies: CompanyWithStats[];
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("date");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

    if (filter === "active") list = list.filter((c) => c.is_active);
    if (filter === "inactive") list = list.filter((c) => !c.is_active);

    list.sort((a, b) => {
      if (sort === "users") return b.user_count - a.user_count;
      if (sort === "open_tickets") return b.open_tickets - a.open_tickets;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [companies, search, filter, sort]);

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Ad veya kod ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 sm:max-w-xs"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="date">Tarih</option>
          <option value="users">Kullanıcı sayısı</option>
          <option value="open_tickets">Açık talep</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Eşleşen şirket bulunamadı.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Şirket</th>
                  <th className="px-4 py-3 text-left font-medium">Kod</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-right font-medium">Kullanıcı</th>
                  <th className="px-4 py-3 text-right font-medium">Açık</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
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
                    <td className="px-4 py-3 text-right">{c.open_tickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/system/companies/${c.id}`}
                className="rounded-lg border p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <CompanyStatusBadge isActive={c.is_active} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <code>{c.code}</code>
                  <span>
                    {c.user_count} kullanıcı · {c.open_tickets} açık
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/database";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TicketsTableProps {
  tickets: Ticket[];
  companies: { id: string; name: string }[];
}

export function TicketsTable({ tickets, companies }: TicketsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [companyId, setCompanyId] = useState("");

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (status) list = list.filter((t) => t.status === status);
    if (priority) list = list.filter((t) => t.priority === priority);
    if (companyId) list = list.filter((t) => t.company_id === companyId);
    return list;
  }, [tickets, search, status, priority, companyId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Başlık ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 sm:max-w-xs"
        />
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
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
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus | "")}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="open">Açık</option>
          <option value="in_progress">İşlemde</option>
          <option value="resolved">Çözüldü</option>
          <option value="closed">Kapalı</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority | "")}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm öncelikler</option>
          <option value="low">Düşük</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksek</option>
          <option value="urgent">Acil</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Talep bulunamadı.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Başlık</th>
                <th className="px-4 py-3 text-left">Şirket</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Öncelik</th>
                <th className="px-4 py-3 text-left">Oluşturan</th>
                <th className="px-4 py-3 text-right">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/system/tickets/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{t.company?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {t.creator?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {format(new Date(t.created_at), "d MMM yyyy", {
                      locale: tr,
                    })}
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

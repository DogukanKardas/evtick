"use client";

import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageSquare, History, Tag, Building2 } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import type { Ticket } from "@/types/database";

interface TicketDetailHeaderProps {
  ticket: Ticket;
  messageCount: number;
  statusLogCount: number;
  onTabChange?: (tab: string) => void;
}

export function TicketDetailHeader({
  ticket,
  messageCount,
  statusLogCount,
  onTabChange,
}: TicketDetailHeaderProps) {
  const warnings: string[] = [];

  if (
    (ticket.priority === "urgent" || ticket.priority === "high") &&
    (ticket.status === "open" || ticket.status === "in_progress")
  ) {
    warnings.push(`${ticket.priority === "urgent" ? "Acil" : "Yüksek"} öncelik`);
  }

  const daysOpen = differenceInDays(new Date(), new Date(ticket.created_at));
  if (
    daysOpen >= 7 &&
    (ticket.status === "open" || ticket.status === "in_progress")
  ) {
    warnings.push(`${daysOpen} gündür açık`);
  }

  const kpis = [
    { label: "Mesaj", value: messageCount, icon: MessageSquare, tab: "chat" },
    {
      label: "Durum geçmişi",
      value: statusLogCount,
      icon: History,
      tab: "history",
    },
    { label: "Kategori", value: ticket.category, icon: Tag },
    {
      label: "Şirket kodu",
      value: ticket.company?.code ?? "—",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {ticket.company && (
            <Link
              href={`/system/companies/${ticket.company_id}`}
              className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium hover:underline"
            >
              {ticket.company.name}
            </Link>
          )}
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {warnings.map((w) => (
            <span
              key={w}
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100"
            >
              {w}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oluşturan: {ticket.creator?.full_name ?? "—"}
          {ticket.assignee && ` · Atanan: ${ticket.assignee.full_name}`}
          {" · "}
          {format(new Date(ticket.created_at), "d MMMM yyyy HH:mm", {
            locale: tr,
          })}
          {" · Son güncelleme: "}
          {format(new Date(ticket.updated_at), "d MMM yyyy HH:mm", {
            locale: tr,
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const content = (
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {kpi.label}
              </div>
              <p className="truncate text-lg font-semibold">{kpi.value}</p>
            </div>
          );

          if (kpi.tab && onTabChange) {
            return (
              <button
                key={kpi.label}
                type="button"
                onClick={() => onTabChange(kpi.tab!)}
                className="text-left transition-opacity hover:opacity-80"
              >
                {content}
              </button>
            );
          }

          return <div key={kpi.label}>{content}</div>;
        })}
      </div>
    </div>
  );
}

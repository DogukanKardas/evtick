"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketsPageSummary } from "@/types/database";
import { cn } from "@/lib/utils";

export function TicketsKpiSummary({ summary }: { summary: TicketsPageSummary }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    router.push(`/system/tickets?${params.toString()}`);
  }

  const cards = [
    {
      label: "Toplam Talep",
      value: summary.total_tickets,
      onClick: () => router.push("/system/tickets"),
    },
    {
      label: "Açık",
      value: summary.open_tickets,
      onClick: () => setParams({ status: "open", filter: null, priority: null }),
    },
    {
      label: "İşlemde",
      value: summary.in_progress_tickets,
      onClick: () =>
        setParams({ status: "in_progress", filter: null, priority: null }),
    },
    {
      label: "Acil/Yüksek Açık",
      value: summary.urgent_open,
      onClick: () =>
        setParams({ filter: "urgent", status: null, priority: null }),
    },
    {
      label: "Bugün Açılan",
      value: summary.tickets_today,
      onClick: () => setParams({ filter: "today", status: null }),
    },
    {
      label: "Atanmamış Açık",
      value: summary.unassigned_open,
      onClick: () =>
        setParams({ filter: "unassigned", status: "open", priority: null }),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={card.onClick}
          className={cn("text-left")}
        >
          <Card className="transition-opacity hover:opacity-90">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

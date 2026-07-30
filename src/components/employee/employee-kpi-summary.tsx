"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeDashboardSummary } from "@/types/database";
import { cn } from "@/lib/utils";

export function EmployeeKpiSummary({
  summary,
}: {
  summary: EmployeeDashboardSummary;
}) {
  const router = useRouter();

  const cards = [
    {
      label: "Toplam",
      value: summary.total,
      color: "text-foreground",
      href: "/tickets",
    },
    {
      label: "Açık",
      value: summary.open,
      color: "text-blue-600",
      href: "/tickets?status=open",
    },
    {
      label: "İşlemde",
      value: summary.in_progress,
      color: "text-amber-600",
      href: "/tickets?status=in_progress",
    },
    {
      label: "Çözüldü",
      value: summary.resolved,
      color: "text-emerald-600",
      href: "/tickets?status=resolved",
    },
    {
      label: "Kapalı",
      value: summary.closed,
      color: "text-zinc-500",
      href: "/tickets?status=closed",
    },
    {
      label: "Acil Açık",
      value: summary.urgent_open,
      color: "text-red-600",
      href: "/tickets?filter=urgent",
    },
    {
      label: "Bugün",
      value: summary.tickets_today,
      color: "text-foreground",
      href: "/tickets?filter=today",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => router.push(card.href)}
          className={cn("text-left")}
        >
          <Card className="transition-opacity hover:opacity-90">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

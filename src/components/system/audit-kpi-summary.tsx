"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditPageSummary } from "@/types/database";
import { cn } from "@/lib/utils";

export function AuditKpiSummary({ summary }: { summary: AuditPageSummary }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    router.push(`/system/audit?${params.toString()}`);
  }

  const cards = [
    {
      label: "Toplam Kayıt",
      value: summary.total_logs,
      onClick: () => router.push("/system/audit"),
    },
    {
      label: "Bugün",
      value: summary.logs_today,
      onClick: () => navigate({ filter: "today", action: null, entity: null }),
    },
    {
      label: "Bu Hafta",
      value: summary.logs_this_week,
      onClick: () => navigate({ filter: "week", action: null, entity: null }),
    },
    {
      label: "Şirket İşlemleri",
      value: summary.company_actions,
      onClick: () => navigate({ entity: "company", filter: null, action: null }),
    },
    {
      label: "Kullanıcı İşlemleri",
      value: summary.user_actions,
      onClick: () => navigate({ entity: "profile", filter: null, action: null }),
    },
    {
      label: "Talep İşlemleri",
      value: summary.ticket_actions,
      onClick: () => navigate({ entity: "ticket", filter: null, action: null }),
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

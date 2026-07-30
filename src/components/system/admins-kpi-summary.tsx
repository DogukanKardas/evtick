"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminsPageSummary } from "@/types/database";
import { cn } from "@/lib/utils";

export function AdminsKpiSummary({ summary }: { summary: AdminsPageSummary }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`/system/admins?${params.toString()}`);
  }

  const cards = [
    {
      label: "Toplam Yönetici",
      value: summary.total_admins,
      onClick: () => navigate({ tab: "admins", filter: null, page: null }),
    },
    {
      label: "Bu Ay Eklenen",
      value: summary.admins_added_this_month,
      onClick: () =>
        navigate({ tab: "admins", filter: "recent", page: null }),
    },
    {
      label: "Yükseltilebilir",
      value: summary.promotable_users,
      onClick: () => navigate({ tab: "promote", ppage: null }),
    },
    {
      label: "Bu Hafta İşlem",
      value: summary.admin_actions_this_week,
      onClick: () => navigate({ tab: "activity" }),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

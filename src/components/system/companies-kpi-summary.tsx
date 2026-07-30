"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompaniesPageSummary } from "@/types/database";
import { cn } from "@/lib/utils";

interface CompaniesKpiSummaryProps {
  summary: CompaniesPageSummary;
}

export function CompaniesKpiSummary({ summary }: CompaniesKpiSummaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/system/companies?${params.toString()}`);
  }

  const cards = [
    {
      label: "Toplam Şirket",
      value: summary.total_companies,
      onClick: () => {
        const params = new URLSearchParams();
        router.push("/system/companies");
      },
    },
    {
      label: "Aktif",
      value: summary.active_companies,
      onClick: () => setFilter("status", "active"),
    },
    {
      label: "Pasif",
      value: summary.inactive_companies,
      onClick: () => setFilter("status", "inactive"),
    },
    {
      label: "Toplam Kullanıcı",
      value: summary.total_users,
      href: "/system/users",
    },
    {
      label: "Açık Talep",
      value: summary.total_open_tickets,
      onClick: () => setFilter("filter", "has_open"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const content = (
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
        );

        if ("href" in card && card.href) {
          return (
            <Link key={card.label} href={card.href}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className={cn("text-left")}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

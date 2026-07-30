import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformStats } from "@/types/database";

export function PlatformStatsCards({ stats }: { stats: PlatformStats }) {
  const cards = [
    { label: "Toplam Şirket", value: stats.total_companies },
    { label: "Aktif Şirket", value: stats.active_companies },
    { label: "Toplam Kullanıcı", value: stats.total_users },
    { label: "Toplam Talep", value: stats.total_tickets },
    { label: "Açık Talep", value: stats.open_tickets },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

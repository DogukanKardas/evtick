import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformStats } from "@/types/database";

export function PlatformStatsCards({ stats }: { stats: PlatformStats }) {
  const cards = [
    { label: "Toplam Şirket", value: stats.total_companies },
    { label: "Aktif Şirket", value: stats.active_companies },
    { label: "Pasif Şirket", value: stats.inactive_companies },
    { label: "Toplam Kullanıcı", value: stats.total_users },
    { label: "Toplam Talep", value: stats.total_tickets },
    { label: "Açık Talep", value: stats.open_tickets },
    { label: "Bugün Açılan", value: stats.tickets_today },
    { label: "Bu Hafta Çözülen", value: stats.resolved_this_week },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

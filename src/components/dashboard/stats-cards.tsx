import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    total: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: "Toplam", value: stats.total, color: "text-foreground" },
    { label: "Açık", value: stats.open, color: "text-blue-600" },
    { label: "İşlemde", value: stats.in_progress, color: "text-amber-600" },
    { label: "Çözüldü", value: stats.resolved, color: "text-emerald-600" },
    { label: "Kapalı", value: stats.closed, color: "text-zinc-500" },
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
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

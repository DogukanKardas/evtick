import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketPriorityCount } from "@/types/database";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function TicketPriorityChart({ data }: { data: TicketPriorityCount[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Öncelik Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Henüz talep bulunmuyor.
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.priority} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{PRIORITY_LABELS[item.priority] ?? item.priority}</span>
                  <span className="text-muted-foreground">
                    {item.count} ({Math.round((item.count / total) * 100)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${PRIORITY_COLORS[item.priority] ?? "bg-primary"}`}
                    style={{ width: `${(item.count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

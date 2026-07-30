import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketStatusCount, TicketTrendDay } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
  closed: "Kapalı",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-emerald-500",
  closed: "bg-gray-400",
};

export function TicketStatusChart({ data }: { data: TicketStatusCount[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Talep Durum Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div key={item.status} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{STATUS_LABELS[item.status] ?? item.status}</span>
              <span className="text-muted-foreground">
                {item.count} ({Math.round((item.count / total) * 100)}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${STATUS_COLORS[item.status] ?? "bg-primary"}`}
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TicketTrendChart({ data }: { data: TicketTrendDay[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Son 7 Gün Talep Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end gap-1">
          {data.map((day) => (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground">{day.count}</span>
              <div
                className="w-full rounded-t bg-primary/80 transition-all"
                style={{
                  height: `${Math.max((day.count / max) * 100, day.count > 0 ? 8 : 2)}%`,
                  minHeight: day.count > 0 ? "0.5rem" : "2px",
                }}
              />
              <span className="text-[10px] text-muted-foreground">
                {day.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

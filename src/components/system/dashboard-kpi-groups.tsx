import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformStats } from "@/types/database";

function formatResolutionTime(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 24) return `${hours} saat`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} gün`;
}

function KpiCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: string | number;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <Card className={highlight ? "border-primary/30" : undefined}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}

export function DashboardKpiGroups({ stats }: { stats: PlatformStats }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Platform Özeti
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Toplam Şirket"
            value={stats.total_companies}
            href="/system/companies"
          />
          <KpiCard
            label="Aktif Şirket"
            value={stats.active_companies}
            href="/system/companies"
          />
          <KpiCard
            label="Pasif Şirket"
            value={stats.inactive_companies}
            href="/system/companies"
          />
          <KpiCard
            label="Toplam Kullanıcı"
            value={stats.total_users}
            href="/system/users"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Talep Metrikleri
          </h2>
          {stats.urgent_open_tickets > 0 && (
            <Link
              href="/system/tickets"
              className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
            >
              {stats.urgent_open_tickets} acil/yüksek açık
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Açık Talep"
            value={stats.open_tickets}
            href="/system/tickets"
            highlight
          />
          <KpiCard label="Bugün Açılan" value={stats.tickets_today} highlight />
          <KpiCard
            label="Bu Hafta Çözülen"
            value={stats.resolved_this_week}
            highlight
          />
          <KpiCard
            label="Ort. Çözüm Süresi"
            value={formatResolutionTime(stats.avg_resolution_hours)}
            highlight
          />
        </div>
      </div>
    </div>
  );
}

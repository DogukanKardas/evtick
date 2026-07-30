import Link from "next/link";
import { PlusCircle } from "lucide-react";
import {
  getPlatformStats,
  getCompaniesWithStats,
  getTicketStatusDistribution,
  getTicketTrend,
  getRecentActivity,
  getPlatformAlerts,
} from "@/lib/system/actions";
import { PlatformStatsCards } from "@/components/system/platform-stats-cards";
import {
  TicketStatusChart,
  TicketTrendChart,
} from "@/components/system/ticket-status-chart";
import {
  ActivityFeed,
  PlatformAlertsPanel,
} from "@/components/system/activity-feed";
import { CompanyCard } from "@/components/system/company-card";
import { LinkButton } from "@/components/ui/link-button";

export default async function SystemDashboardPage() {
  const [stats, companies, statusData, trendData, activity, alerts] =
    await Promise.all([
      getPlatformStats(),
      getCompaniesWithStats(),
      getTicketStatusDistribution(),
      getTicketTrend(7),
      getRecentActivity(10),
      getPlatformAlerts(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sistem Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Platform geneli yönetim ve istatistikler
          </p>
        </div>
        <LinkButton href="/system/companies/new" className="min-h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni Şirket
        </LinkButton>
      </div>

      <PlatformStatsCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TicketStatusChart data={statusData} />
        <TicketTrendChart data={trendData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed items={activity} />
        <PlatformAlertsPanel alerts={alerts} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Son Şirketler</h2>
          <Link
            href="/system/companies"
            className="text-sm text-primary hover:underline"
          >
            Tümünü gör
          </Link>
        </div>
        <div className="grid gap-3">
          {companies.slice(0, 5).map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>
    </div>
  );
}

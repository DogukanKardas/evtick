import {
  getPlatformStats,
  getTicketStatusDistribution,
  getTicketPriorityDistribution,
  getTicketTrend,
  getDashboardAuditActivity,
  getPlatformAlerts,
  getUrgentTickets,
  getRecentAuditLogs,
  getCompaniesWithStats,
} from "@/lib/system/actions";
import { DashboardKpiGroups } from "@/components/system/dashboard-kpi-groups";
import {
  TicketStatusChart,
  TicketTrendChart,
} from "@/components/system/ticket-status-chart";
import { TicketPriorityChart } from "@/components/system/ticket-priority-chart";
import { AuditActivityFeed } from "@/components/system/audit-activity-feed";
import { PlatformAlertsPanel } from "@/components/system/activity-feed";
import { UrgentTicketsWidget } from "@/components/system/urgent-tickets-widget";
import { RecentAuditPanel } from "@/components/system/recent-audit-panel";
import { CompanyCard } from "@/components/system/company-card";
import Link from "next/link";

export async function DashboardKpiSection() {
  const stats = await getPlatformStats();
  return <DashboardKpiGroups stats={stats} />;
}

export async function DashboardChartsSection() {
  const [statusData, priorityData, trendData] = await Promise.all([
    getTicketStatusDistribution(),
    getTicketPriorityDistribution(),
    getTicketTrend(7),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TicketStatusChart data={statusData} />
      <TicketPriorityChart data={priorityData} />
      <TicketTrendChart data={trendData} />
    </div>
  );
}

export async function DashboardFeedsSection() {
  const [activity, alerts] = await Promise.all([
    getDashboardAuditActivity(10),
    getPlatformAlerts(),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AuditActivityFeed items={activity} />
      <PlatformAlertsPanel alerts={alerts} />
    </div>
  );
}

export async function DashboardUrgentSection() {
  const [urgentTickets, auditLogs] = await Promise.all([
    getUrgentTickets(5),
    getRecentAuditLogs(5),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UrgentTicketsWidget tickets={urgentTickets} />
      <RecentAuditPanel logs={auditLogs} />
    </div>
  );
}

export async function DashboardCompaniesSection() {
  const companies = await getCompaniesWithStats();

  return (
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
      {companies.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Henüz şirket bulunmuyor.
        </p>
      ) : (
        <div className="grid gap-3">
          {companies.slice(0, 5).map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </section>
  );
}

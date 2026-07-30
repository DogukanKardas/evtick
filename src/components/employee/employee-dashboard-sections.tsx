import { Suspense } from "react";
import {
  getEmployeeDashboardSummary,
  getEmployeeRecentTickets,
} from "@/lib/tickets/actions";
import { ticketStatsFromSummary } from "@/lib/tickets/dashboard-stats";
import { EmployeeKpiSummary } from "@/components/employee/employee-kpi-summary";
import { EmployeeQuickActions } from "@/components/employee/employee-quick-actions";
import { EmployeeStatusChart } from "@/components/employee/employee-status-chart";
import { EmployeeRecentTickets } from "@/components/employee/employee-recent-tickets";
import { EmployeeSkeleton } from "@/components/employee/employee-skeleton";

export async function EmployeeDashboardContent() {
  const [summary, recentTickets] = await Promise.all([
    getEmployeeDashboardSummary(),
    getEmployeeRecentTickets(5),
  ]);
  const stats = ticketStatsFromSummary(summary);

  return (
    <div className="space-y-6">
      <EmployeeKpiSummary summary={summary} />
      <EmployeeQuickActions summary={summary} />
      <EmployeeStatusChart data={stats} />
      <EmployeeRecentTickets tickets={recentTickets} />
    </div>
  );
}

export function EmployeeDashboardContentWithSuspense() {
  return (
    <Suspense fallback={<EmployeeSkeleton section="dashboard" />}>
      <EmployeeDashboardContent />
    </Suspense>
  );
}

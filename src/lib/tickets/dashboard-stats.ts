import type { EmployeeDashboardSummary, TicketStatusCount } from "@/types/database";

export function ticketStatsFromSummary(
  summary: EmployeeDashboardSummary
): TicketStatusCount[] {
  return [
    { status: "open", count: summary.open },
    { status: "in_progress", count: summary.in_progress },
    { status: "resolved", count: summary.resolved },
    { status: "closed", count: summary.closed },
  ];
}

import { Suspense } from "react";
import { getPlatformTickets } from "@/lib/system/ticket-actions";
import { getTicketsPageSummary } from "@/lib/system/ticket-actions";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { TicketsKpiSummary } from "@/components/system/tickets-kpi-summary";
import { TicketsTablePro } from "@/components/system/tickets-table";
import { TicketsSkeleton } from "@/components/system/tickets-skeleton";

export async function TicketsKpiSection() {
  const summary = await getTicketsPageSummary();
  return <TicketsKpiSummary summary={summary} />;
}

export async function TicketsTableSection() {
  const [tickets, companies] = await Promise.all([
    getPlatformTickets(),
    getCompaniesWithStats(),
  ]);

  return (
    <TicketsTablePro
      tickets={tickets}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}

export function TicketsKpiSectionWithSuspense() {
  return (
    <Suspense fallback={<TicketsSkeleton section="kpi" />}>
      <TicketsKpiSection />
    </Suspense>
  );
}

export function TicketsTableSectionWithSuspense() {
  return (
    <Suspense fallback={<TicketsSkeleton section="table" />}>
      <TicketsTableSection />
    </Suspense>
  );
}

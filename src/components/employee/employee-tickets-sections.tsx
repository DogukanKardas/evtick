import { Suspense } from "react";
import { getEmployeeTickets } from "@/lib/tickets/actions";
import { EmployeeTicketsTable } from "@/components/employee/employee-tickets-table";
import { EmployeeSkeleton } from "@/components/employee/employee-skeleton";

export async function EmployeeTicketsTableSection() {
  const tickets = await getEmployeeTickets();
  return <EmployeeTicketsTable tickets={tickets} />;
}

export function EmployeeTicketsTableSectionWithSuspense() {
  return (
    <Suspense fallback={<EmployeeSkeleton section="list" />}>
      <EmployeeTicketsTableSection />
    </Suspense>
  );
}

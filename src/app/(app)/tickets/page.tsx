import { PlusCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { EmployeeTicketsTableSectionWithSuspense } from "@/components/employee/employee-tickets-sections";

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Taleplerim</h1>
        <LinkButton href="/tickets/new" size="sm" className="min-h-10">
          <PlusCircle className="mr-1 h-4 w-4" />
          Yeni
        </LinkButton>
      </div>

      <EmployeeTicketsTableSectionWithSuspense />
    </div>
  );
}

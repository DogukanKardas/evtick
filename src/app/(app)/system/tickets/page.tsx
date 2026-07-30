import { getPlatformTickets } from "@/lib/system/ticket-actions";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { TicketsTable } from "@/components/system/tickets-table";

export default async function SystemTicketsPage() {
  const [tickets, companies] = await Promise.all([
    getPlatformTickets(),
    getCompaniesWithStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Talepler</h1>
        <p className="text-sm text-muted-foreground">
          Platform geneli talep kuyruğu
        </p>
      </div>

      <TicketsTable
        tickets={tickets}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}

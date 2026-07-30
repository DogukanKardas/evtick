import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { TicketCard } from "@/components/tickets/ticket-card";
import { LinkButton } from "@/components/ui/link-button";
import type { Ticket } from "@/types/database";

export function EmployeeRecentTickets({ tickets }: { tickets: Ticket[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Son Talepler</h2>
        {tickets.length > 0 && (
          <Link
            href="/tickets"
            className="text-sm text-muted-foreground hover:underline"
          >
            Tümünü gör
          </Link>
        )}
      </div>

      {tickets.length > 0 ? (
        <div className="grid gap-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border py-12 text-center">
          <p className="mb-4 text-muted-foreground">Henüz talep bulunmuyor.</p>
          <LinkButton href="/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            İlk talebini oluştur
          </LinkButton>
        </div>
      )}
    </section>
  );
}

import { requireRole } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { TicketCard } from "@/components/tickets/ticket-card";
import type { Ticket } from "@/types/database";

export default async function SupportPage() {
  const profile = await requireRole(["support", "admin"]);
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("company_id", profile.company_id)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Destek Kuyruğu</h1>
        <p className="text-sm text-muted-foreground">
          Açık ve işlemdeki talepler
        </p>
      </div>

      {tickets && tickets.length > 0 ? (
        <div className="grid gap-3">
          {(tickets as Ticket[]).map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          Bekleyen talep bulunmuyor.
        </p>
      )}
    </div>
  );
}

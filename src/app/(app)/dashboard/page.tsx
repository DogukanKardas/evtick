import { PlusCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth/get-profile";
import { getDashboardStats } from "@/lib/tickets/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { LinkButton } from "@/components/ui/link-button";
import { TicketCard } from "@/components/tickets/ticket-card";
import { createClient } from "@/lib/supabase/server";
import { isSupportOrAdmin } from "@/lib/auth/roles";
import type { Ticket } from "@/types/database";

export default async function DashboardPage() {
  const profile = await requireAuth();
  const stats = await getDashboardStats();
  const supabase = await createClient();
  const isStaff = isSupportOrAdmin(profile);

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!isStaff) {
    query = query.eq("created_by", profile.id);
  }

  const { data: recentTickets } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel</h1>
          <p className="text-sm text-muted-foreground">
            Hoş geldiniz, {profile.full_name}
          </p>
        </div>
        <LinkButton href="/tickets/new" className="min-h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni Talep
        </LinkButton>
      </div>

      <StatsCards stats={stats} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Son Talepler</h2>
        {recentTickets && recentTickets.length > 0 ? (
          <div className="grid gap-3">
            {(recentTickets as Ticket[]).map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Henüz talep bulunmuyor.
          </p>
        )}
      </section>
    </div>
  );
}

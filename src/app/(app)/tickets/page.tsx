import { PlusCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { TicketCard } from "@/components/tickets/ticket-card";
import { isSupportOrAdmin } from "@/lib/auth/roles";
import type { Ticket, TicketStatus } from "@/types/database";

interface TicketsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const profile = await requireAuth();
  const { status } = await searchParams;
  const supabase = await createClient();
  const isStaff = isSupportOrAdmin(profile);

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (!isStaff) {
    query = query.eq("created_by", profile.id);
  }

  if (status && status !== "all") {
    query = query.eq("status", status as TicketStatus);
  }

  const { data: tickets } = await query;

  const filters = [
    { value: "all", label: "Tümü" },
    { value: "open", label: "Açık" },
    { value: "in_progress", label: "İşlemde" },
    { value: "resolved", label: "Çözüldü" },
    { value: "closed", label: "Kapalı" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Taleplerim</h1>
        <LinkButton href="/tickets/new" size="sm" className="min-h-10">
          <PlusCircle className="mr-1 h-4 w-4" />
          Yeni
        </LinkButton>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <LinkButton
            key={f.value}
            href={f.value === "all" ? "/tickets" : `/tickets?status=${f.value}`}
            variant={(status ?? "all") === f.value ? "default" : "outline"}
            size="sm"
            className="shrink-0 min-h-9"
          >
            {f.label}
          </LinkButton>
        ))}
      </div>

      {tickets && tickets.length > 0 ? (
        <div className="grid gap-3">
          {(tickets as Ticket[]).map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          Bu filtreye uygun talep bulunamadı.
        </p>
      )}
    </div>
  );
}

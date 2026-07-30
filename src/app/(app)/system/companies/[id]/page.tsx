import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/system/actions";
import { getCompanyUsers } from "@/lib/system/user-actions";
import {
  getCompanyTickets,
  getCompanyTicketStats,
} from "@/lib/system/ticket-actions";
import { CompanyTabs } from "@/components/system/company-tabs";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { id } = await params;
  const [company, users, tickets, stats] = await Promise.all([
    getCompanyById(id),
    getCompanyUsers(id),
    getCompanyTickets(id),
    getCompanyTicketStats(id),
  ]);

  if (!company) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <p className="font-mono text-muted-foreground">{company.code}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Kullanıcı</p>
          <p className="text-xl font-bold">{company.user_count}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Talep</p>
          <p className="text-xl font-bold">{company.ticket_count}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Açık</p>
          <p className="text-xl font-bold">{company.open_tickets}</p>
        </div>
      </div>

      <CompanyTabs
        company={company}
        users={users}
        tickets={tickets}
        stats={stats}
      />
    </div>
  );
}
